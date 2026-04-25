// engine/filter.js
const fs       = require('fs');
const readline = require('readline');
const { scoreLead } = require('./scorer');

const col = (obj, ...candidates) => {
  if (!obj) return '';
  for (const c of candidates) {
    if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return String(obj[c]).trim();
  }
  const keys = Object.keys(obj);
  for (const c of candidates) {
    const found = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (found && obj[found] !== undefined && obj[found] !== '') return String(obj[found]).trim();
  }
  return '';
};

const mapStatut = (cod) => {
  if (cod === 'IM') return 'Actif';
  if (cod === 'RO' || cod === 'RF') return 'Radié';
  if (cod === 'FU') return 'Fusionné';
  return 'Inactif';
};

const extractCity = (raw) => raw
  ? raw.replace(/\s*\([^)]+\)\s*$/, '').replace(/\s+QC\s*$/i, '').replace(/\s+ON\s*$/i, '').trim()
  : '';

const parseLine = (line) => {
  const result = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
};

// Streaming par batch — ne charge jamais tout en mémoire
const filterAndEnrich = async (entreprisePath, etablissementsMap, nomMap, settings, wsLog, onBatch = null, limit = 0) => {
  wsLog('Streaming Entreprise.csv — toutes les entreprises...');

  const BATCH_SIZE = 50000;
  let batch  = [];
  let total  = 0;
  let saved  = 0;
  let headers = null;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    if (onBatch) {
      await onBatch(batch);
      saved += batch.length;
      wsLog(`Traités : ${total.toLocaleString('fr-CA')} — Sauvegardés : ${saved.toLocaleString('fr-CA')}`);
      batch = [];
    }
  };

  await new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(entreprisePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let pending = Promise.resolve();

    rl.on('line', (line) => {
      if (!headers) {
        headers = parseLine(line).map(h => h.replace(/^"|"$/g, '').trim());
        return;
      }
      total++;

      const cols = parseLine(line);
      const row  = {};
      headers.forEach((h, i) => { row[h] = (cols[i] || '').replace(/^"|"$/g, '').trim(); });

      const neq      = col(row, 'NEQ', 'neq');
      if (!neq) return;
      if (limit > 0 && total > limit) { rl.close(); return; }

      const statutCod = col(row, 'COD_STAT_IMMAT', 'ETAT_ADMIN');
      const statutREQ = mapStatut(statutCod);

      const etab      = etablissementsMap[neq] || {};
      const adresse   = etab.adresse  || col(row, 'ADR_DOMCL_LIGN1_ADR');
      const cp        = etab.cp       || col(row, 'ADR_DOMCL_LIGN4_ADR');
      const activite  = etab.activite || col(row, 'DESC_ACT_ECON_ASSUJ', 'DESC_ACT_ECON_ASSUJ2');
      const villeRaw  = etab.ville    || extractCity(col(row, 'ADR_DOMCL_LIGN2_ADR')) || col(row, 'NOM_LOCLT_CONSTI');
      const ville     = extractCity(villeRaw);
      const nom       = nomMap[neq]   || col(row, 'NOM', 'Nom', 'NOM_ASSUJ', 'NOM_ENTREPRISE') || 'Non déclaré';
      const dateStr   = col(row, 'DAT_IMMAT', 'DAT_CONSTI', 'DATE_CONSTITUTION');
      const dateCreation = dateStr ? new Date(dateStr) : null;
      const { score, scoreDetails } = scoreLead(dateCreation, 1);

      batch.push({ neq, nom, adresse, ville, groupe: '', codePostal: cp, province: 'QC', secteurActivite: activite, secteurMatch: activite, categorieSecteur: 'general', dateCreation, statutREQ, signal: 'nouvelle', score, scoreDetails });

      if (onBatch && batch.length >= BATCH_SIZE) {
        rl.pause();
        const currentBatch = batch;
        batch = [];
        pending = pending.then(async () => {
          await onBatch(currentBatch);
          saved += currentBatch.length;
          wsLog(`Traités : ${total.toLocaleString('fr-CA')} — Sauvegardés : ${saved.toLocaleString('fr-CA')}`);
          rl.resume();
        }).catch(reject);
      }
    });

    rl.on('close', () => {
      pending.then(() => flushBatch()).then(resolve).catch(reject);
    });

    rl.on('error', reject);
  });

  wsLog('Total traités : ' + total.toLocaleString('fr-CA'));

  // Mode sans callback — retourner le tableau (petits volumes seulement)
  return onBatch ? [] : batch;
};

module.exports = { filterAndEnrich };
