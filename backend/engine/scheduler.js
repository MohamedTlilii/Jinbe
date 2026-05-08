// engine/scheduler.js
const { checkForNewVersion, downloadZIP, saveVersion, ZIP_PATH } = require('./downloader');
const { extractZIP, prepareData }   = require('./extractor');
const { filterAndEnrich }           = require('./filter');
const { compareAndDetectBatch, detectFermeturesByRunId } = require('./comparator');
const { sendRunSummary }            = require('./mailer');
const Lead                          = require('../models/Lead');
const RunHistory                    = require('../models/RunHistory');

const engineState = {
  isRunning:      false,
  isProcessing:   false,
  lastRun:        null,
  nextRun:        null,
  lastLeadsFound: 0,
  lastDuration:   0,
  cronJob:        null,
  progress:       0,
  currentStep:    '',
};

let wsServer = null;

const wsLog = (message) => {
  const ts = new Date().toLocaleTimeString('fr-CA');
  console.log(ts + ' — ' + message);
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'log', message }));
    });
  }
};

const wsProgress = (step, percent) => {
  engineState.progress    = percent;
  engineState.currentStep = step;
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'progress', step, percent }));
    });
  }
};


const runFullProcess = async (force = false, resetDB = false, testLimit = 0) => {
  if (engineState.isProcessing) { wsLog('Traitement déjà en cours'); return; }
  engineState.isProcessing = true;
  const startTime = Date.now();
  let runCounts = { nouvelle: 0, reouverture: 0, demenagement: 0, fermeture: 0, total: 0 };
  let runVersion = '';
  let runIsBaseline = false;

  try {
    if (resetDB) {
      wsLog('Suppression de la base de données...');
      await Lead.deleteMany({});
      wsLog('Base supprimée — prêt pour le chargement initial');
    }

    const dbCount    = await Lead.countDocuments();
    const isFirstRun = dbCount === 0;
    runIsBaseline    = isFirstRun;
    if (isFirstRun) wsLog('Première exécution détectée — chargement baseline (2.9M entreprises)');

    wsProgress('Vérification...', 5);
    const { hasNew, version } = await checkForNewVersion(wsLog);
    runVersion = version || '';
    if (!hasNew && !force) { wsLog('Aucune mise à jour nécessaire'); engineState.isProcessing = false; return; }
    if (!hasNew && force) wsLog('Forçage du traitement...');

    wsProgress('Téléchargement ZIP...', 10);
    const zipExists = require('fs').existsSync(ZIP_PATH) && require('fs').statSync(ZIP_PATH).size > 1024 * 100;
    if (zipExists) {
      wsLog('ZIP déjà présent dans temp/ — téléchargement ignoré');
    } else {
      await downloadZIP(wsLog);
    }

    wsProgress('Extraction CSV...', 55);
    const extractDir = extractZIP(ZIP_PATH, wsLog);

    wsProgress('Lecture données...', 65);
    const { entreprisePath, etablissementsMap, nomMap } = await prepareData(extractDir, wsLog);

    let saved = 0;

    if (isFirstRun) {
      wsProgress('Chargement baseline MongoDB...', 75);
      wsLog('Chargement de tout le registre en baseline (par batches de 50 000)...');

      await filterAndEnrich(entreprisePath, etablissementsMap, nomMap, wsLog, async (batch) => {
        const baselineBatch = batch.map(l => ({ ...l, signal: 'baseline' }));
        const ops = baselineBatch.map(lead => ({
          updateOne: {
            filter: { neq: lead.neq },
            update: { $set: { ...lead, versionREQ: version, dateTrouve: new Date(), isBaseline: true } },
            upsert: true,
          }
        }));
        await Lead.bulkWrite(ops, { ordered: false });
        saved += batch.length;
        wsProgress('Chargement baseline...', 75 + Math.min(20, Math.round(saved / 150000)));
      }, testLimit);

      wsLog('Baseline chargé : ' + saved.toLocaleString('fr-CA') + ' entreprises');
      runCounts.total = saved;

    } else {
      wsProgress('Traitement en cours...', 75);

      const runId        = Date.now().toString();
      let processedCount = 0;
      const nouvelles    = [];
      const reouvertures = [];
      const demenagements = [];

      const COMPARE_CHUNK = 500;

      // Lecture CSV en streaming + comparaison par sous-batches de 500 via MongoDB $in
      await filterAndEnrich(entreprisePath, etablissementsMap, nomMap, wsLog, async (batch) => {
        processedCount += batch.length;

        for (let i = 0; i < batch.length; i += COMPARE_CHUNK) {
          const sub = batch.slice(i, i + COMPARE_CHUNK);
          const { nouvelles: bN, reouvertures: bR, demenagements: bD } = await compareAndDetectBatch(sub);
          nouvelles.push(...bN);
          reouvertures.push(...bR);
          demenagements.push(...bD);

          const toSave = [...bN, ...bR, ...bD];
          if (toSave.length > 0) {
            const ops = toSave.map(lead => ({
              updateOne: {
                filter: { neq: lead.neq },
                update: { $set: { ...lead, versionREQ: version, dateTrouve: new Date(), isBaseline: false, lastRunId: runId } },
                upsert: true,
              }
            }));
            await Lead.bulkWrite(ops, { ordered: false });
            saved += toSave.length;
            wsLog('Détectés : ' + saved.toLocaleString('fr-CA'));
          }
        }

        // Marquer tous les NEQ du batch comme "vus" par sous-chunks
        const SEEN_CHUNK = 5000;
        for (let i = 0; i < batch.length; i += SEEN_CHUNK) {
          await Lead.updateMany(
            { neq: { $in: batch.slice(i, i + SEEN_CHUNK).map(l => l.neq) } },
            { $set: { lastRunId: runId } }
          );
        }

        wsProgress('Traitement...', 75 + Math.min(15, Math.round(processedCount / 200000)));
      }, testLimit);

      // Fermetures : détectées via MongoDB, zéro RAM
      wsProgress('Détection fermetures...', 92);
      const fermetureNeqs = await detectFermeturesByRunId(runId, wsLog);

      if (fermetureNeqs.length > 0) {
        const FCHUNK = 5000;
        for (let i = 0; i < fermetureNeqs.length; i += FCHUNK) {
          await Lead.updateMany(
            { neq: { $in: fermetureNeqs.slice(i, i + FCHUNK) } },
            { $set: { signal: 'fermeture', statutREQ: 'Fermé', versionREQ: version, dateTrouve: new Date() } }
          );
        }
        saved += fermetureNeqs.length;
        wsLog('Fermetures marquées : ' + fermetureNeqs.length);
      }

      runCounts = {
        nouvelle:     nouvelles.length,
        reouverture:  reouvertures.length,
        demenagement: demenagements.length,
        fermeture:    fermetureNeqs.length,
        total:        saved,
      };

      sendRunSummary({ nouvelles, reouvertures, demenagements, fermetures: fermetureNeqs.length, duration: Date.now() - startTime })
        .catch(e => wsLog('Email erreur : ' + e.message));
    }

    saveVersion(version);
    engineState.lastRun        = new Date();
    engineState.lastLeadsFound = saved;
    engineState.lastDuration   = Date.now() - startTime;

    // Sauvegarder l'historique du run
    await RunHistory.create({
      startedAt:  new Date(startTime),
      finishedAt: new Date(),
      durationMs: engineState.lastDuration,
      version:    runVersion,
      isBaseline: runIsBaseline,
      isTest:     testLimit > 0,
      counts:     runCounts,
    }).catch(e => wsLog('RunHistory erreur : ' + e.message));

    wsProgress('Terminé', 100);
    wsLog('Terminé : ' + saved.toLocaleString('fr-CA') + ' entrées en ' + Math.round(engineState.lastDuration / 1000) + 's');

    if (wsServer) {
      wsServer.clients.forEach((c) => {
        if (c.readyState === 1) c.send(JSON.stringify({ type: 'done', leadsFound: saved, duration: engineState.lastDuration }));
      });
    }
  } catch (error) {
    wsLog('Erreur : ' + error.message);
    wsProgress('Erreur', 0);
  } finally {
    engineState.isProcessing = false;
  }
};

const startEngine = (ws) => { wsServer = ws; engineState.isRunning = true; };
const stopEngine  = () => { engineState.isRunning = false; engineState.nextRun = null; };
const runManual   = async (ws) => { wsServer = ws; wsLog('Lancement manuel'); await runFullProcess(true); };
const runReset    = async (ws) => { wsServer = ws; wsLog('Reset + rechargement complet'); await runFullProcess(true, true); };
const runTest     = async (ws, limit = 10) => { wsServer = ws; wsLog(`Mode test — ${limit} leads seulement`); await runFullProcess(true, false, limit); };

module.exports = { startEngine, stopEngine, runManual, runReset, runTest, engineState };
