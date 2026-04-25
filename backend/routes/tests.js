// routes/tests.js — Endpoints pour la page de tests
const express   = require('express');
const router    = express.Router();
const Lead      = require('../models/Lead');
const mongoose  = require('mongoose');
const { exec }  = require('child_process');
const axios     = require('axios');
const fs        = require('fs');
const path      = require('path');

const ZIP_PATH     = path.resolve('./temp/req_latest.zip');
const VERSION_FILE = path.resolve('./temp/last_version.txt');
const CKAN_ID      = process.env.CKAN_RESOURCE_ID || 'eac1b5f1-d8c0-4690-9c51-316d44ed9d94';
const CKAN_API     = 'https://www.donneesquebec.ca/recherche/api/3/action/resource_show?id=';

const getDisk = () => new Promise(resolve => {
  exec('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /format:value', (err, stdout) => {
    if (err) return resolve(null);
    const free = parseInt(stdout.match(/FreeSpace=(\d+)/)?.[1] || 0);
    const size = parseInt(stdout.match(/Size=(\d+)/)?.[1] || 0);
    resolve({ free, size, used: size - free });
  });
});

const SIGNALS = ['nouvelle', 'reouverture', 'demenagement', 'fermeture'];

// Créer un lead de test avec le signal donné
router.post('/seed/:signal', async (req, res) => {
  try {
    const { signal } = req.params;
    if (!SIGNALS.includes(signal)) return res.status(400).json({ error: 'Signal invalide' });

    // Trouver un baseline actif pas encore converti en test
    const existingTestNeqs = (await Lead.find({ isBaseline: false }, { neq: 1 }).lean()).map(l => l.neq);
    const lead = await Lead.findOne({
      isBaseline: true,
      statutREQ: 'Actif',
      neq: { $nin: existingTestNeqs },
    }).lean();

    if (!lead) return res.status(404).json({ error: 'Aucun lead baseline disponible' });

    const update = { signal, isBaseline: false, dateTrouve: new Date() };
    if (signal === 'demenagement') update.previousData = { adresse: '123 Ancienne Adresse, Montréal' };
    if (signal === 'fermeture')    update.statutREQ = 'Fermé';

    await Lead.updateOne({ neq: lead.neq }, { $set: update });
    res.json({ success: true, neq: lead.neq, nom: lead.nom, ville: lead.ville, signal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lister les leads de test actifs
router.get('/active', async (req, res) => {
  try {
    const leads = await Lead.find(
      { isBaseline: false },
      { neq: 1, signal: 1, nom: 1, ville: 1, adresse: 1, dateTrouve: 1, statutREQ: 1 }
    ).sort({ dateTrouve: -1 }).lean();
    res.json(leads);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reset tous les leads de test → baseline
router.delete('/reset', async (req, res) => {
  try {
    const result = await Lead.updateMany(
      { isBaseline: false, signal: { $in: SIGNALS } },
      { $set: { signal: 'baseline', isBaseline: true, statutREQ: 'Actif' }, $unset: { previousData: '' } }
    );
    res.json({ success: true, reset: result.modifiedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reset un seul lead de test par NEQ
router.delete('/reset/:neq', async (req, res) => {
  try {
    await Lead.updateOne(
      { neq: req.params.neq },
      { $set: { signal: 'baseline', isBaseline: true, statutREQ: 'Actif' }, $unset: { previousData: '' } }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Diagnostic complet — MongoDB, RAM, disque, ZIP
router.get('/health-full', async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const [disk, docsCount] = await Promise.all([
      getDisk(),
      Lead.countDocuments().catch(() => null),
    ]);
    const zipExists = fs.existsSync(ZIP_PATH);
    const zipSize   = zipExists ? Math.round(fs.statSync(ZIP_PATH).size / 1024 / 1024) : 0;
    let version = null;
    try { version = fs.readFileSync(VERSION_FILE, 'utf8').trim(); } catch {}

    res.json({
      mongodb: { ok: mongoose.connection.readyState === 1, docs: docsCount },
      ram:     { heapUsed: Math.round(mem.heapUsed / 1024 / 1024), heapTotal: Math.round(mem.heapTotal / 1024 / 1024), rss: Math.round(mem.rss / 1024 / 1024) },
      disk:    disk ? { free: disk.free, size: disk.size, pct: Math.round((disk.used / disk.size) * 100) } : null,
      zip:     { exists: zipExists, sizeMb: zipSize, version },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RAM en temps réel
router.get('/ram', (req, res) => {
  const m = process.memoryUsage();
  res.json({
    heapUsed:  Math.round(m.heapUsed  / 1024 / 1024),
    heapTotal: Math.round(m.heapTotal / 1024 / 1024),
    rss:       Math.round(m.rss       / 1024 / 1024),
  });
});

// Vérification téléchargement ZIP
router.get('/check-download', async (req, res) => {
  const steps = [];
  try {
    const t0 = Date.now();
    let ckanOk = false, ckanMs = 0;
    try {
      const r = await axios.get(CKAN_API + CKAN_ID, { timeout: 10000 });
      ckanMs = Date.now() - t0;
      ckanOk = !!r.data?.result?.url;
    } catch { ckanMs = Date.now() - t0; }
    steps.push({ label: 'Serveur Données Québec', ok: ckanOk, detail: ckanOk ? `${ckanMs}ms` : 'Inaccessible' });

    let version = null;
    try { version = fs.readFileSync(VERSION_FILE, 'utf8').trim(); } catch {}
    steps.push({ label: 'Version locale', ok: !!version, detail: version || 'Aucune version enregistrée' });

    const zipExists = fs.existsSync(ZIP_PATH);
    const zipSize   = zipExists ? Math.round(fs.statSync(ZIP_PATH).size / 1024 / 1024) : 0;
    steps.push({ label: 'ZIP local (temp/)', ok: zipExists, detail: zipExists ? `${zipSize} MB` : 'Absent — sera téléchargé au run' });

    let zipValid = false;
    if (zipExists) {
      try {
        const buf = Buffer.alloc(4);
        const fd  = fs.openSync(ZIP_PATH, 'r');
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);
        zipValid = buf[0] === 0x50 && buf[1] === 0x4B;
      } catch {}
    }
    steps.push({ label: 'Intégrité ZIP', ok: zipValid || !zipExists, detail: zipExists ? (zipValid ? 'Valide' : 'Corrompu') : 'N/A' });

    res.json({ steps, allOk: steps.every(s => s.ok) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
