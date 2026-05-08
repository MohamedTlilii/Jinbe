// engine/downloader.js
require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { exec } = require('child_process');

const TEMP_DIR      = path.resolve('./temp');
const ZIP_PATH      = path.join(TEMP_DIR, 'req_latest.zip');
const VERSION_FILE  = path.join(TEMP_DIR, 'last_version.txt');

const ensureDir      = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const getLastVersion = () => {
  try { if (fs.existsSync(VERSION_FILE)) return fs.readFileSync(VERSION_FILE, 'utf8').trim(); } catch (e) {}
  return null;
};
const saveVersion = (version) => fs.writeFileSync(VERSION_FILE, version, 'utf8');

const checkForNewVersion = async (wsLog) => {
  wsLog('Vérification nouvelle version REQ...');
  const currentVersion = getLastVersion();
  const today = new Date().toISOString().slice(0, 10);
  const zipExists = fs.existsSync(ZIP_PATH) && fs.statSync(ZIP_PATH).size > 1024;

  if (currentVersion && currentVersion.slice(0, 10) === today && zipExists) {
    wsLog('Données déjà téléchargées aujourd\'hui');
    return { hasNew: false, version: currentVersion };
  }
  if (!zipExists && currentVersion) wsLog('ZIP absent ou incomplet — re-téléchargement nécessaire');
  else wsLog('Nouvelle vérification nécessaire');
  return { hasNew: true, version: new Date().toISOString() };
};

const CKAN_RESOURCE_ID = process.env.CKAN_RESOURCE_ID || 'eac1b5f1-d8c0-4690-9c51-316d44ed9d94';
const CKAN_API         = 'https://www.donneesquebec.ca/recherche/api/3/action/resource_show?id=';

const getPageUrl = async (wsLog) => {
  wsLog('Récupération URL via API CKAN...');
  const resp = await axios.get(CKAN_API + CKAN_RESOURCE_ID, { timeout: 15000 });
  if (!resp.data?.result?.url) throw new Error('URL introuvable dans la réponse CKAN');
  const url = resp.data.result.url;
  wsLog('URL trouvée : ' + url);
  return url;
};

// Dossier Téléchargements Windows de l'utilisateur courant
const getDownloadsDir = () =>
  process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, 'Downloads')
    : path.join(require('os').homedir(), 'Downloads');

// Attend qu'un fichier ZIP apparaisse dans le dossier Downloads et le déplace vers ZIP_PATH
const waitForDownloadedZip = (wsLog, timeoutMs = 300000) => {
  const downloadsDir = getDownloadsDir();
  const snapshot = new Set(fs.existsSync(downloadsDir)
    ? fs.readdirSync(downloadsDir).filter(f => f.endsWith('.zip') || f.endsWith('.ZIP'))
    : []);

  wsLog('Surveillance du dossier Téléchargements : ' + downloadsDir);

  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => {
      clearInterval(poll);
      reject(new Error('Timeout 5min — aucun ZIP détecté dans Téléchargements'));
    }, timeoutMs);

    const poll = setInterval(() => {
      try {
        const files = fs.readdirSync(downloadsDir).filter(f =>
          (f.endsWith('.zip') || f.endsWith('.ZIP')) && !snapshot.has(f)
        );
        for (const f of files) {
          const src = path.join(downloadsDir, f);
          const stat = fs.statSync(src);
          // Ignorer les fichiers encore en cours (.crdownload, .part, trop petits)
          if (stat.size < 1024) continue;
          clearTimeout(deadline);
          clearInterval(poll);
          wsLog('ZIP détecté : ' + f + ' (' + Math.round(stat.size / 1024 / 1024) + ' Mo)');
          fs.copyFileSync(src, ZIP_PATH);
          fs.unlinkSync(src);
          resolve(ZIP_PATH);
          return;
        }
      } catch (e) { /* dossier temporairement inaccessible */ }
    }, 2000);
  });
};

const downloadZIP = async (wsLog) => {
  ensureDir(TEMP_DIR);

  const pageUrl = await getPageUrl(wsLog);

  wsLog('Ouverture du navigateur — veuillez cliquer sur "Télécharger" dans la page qui s\'ouvre...');
  await new Promise((resolve, reject) =>
    exec(`start "" "${pageUrl}"`, (err) => err ? reject(err) : resolve())
  );

  const zipPath = await waitForDownloadedZip(wsLog, 300000);

  // Valider magic bytes PK (ZIP)
  const buf = Buffer.alloc(4);
  const fd  = fs.openSync(zipPath, 'r');
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  if (buf[0] !== 0x50 || buf[1] !== 0x4B) {
    fs.unlinkSync(zipPath);
    throw new Error('Le fichier téléchargé n\'est pas un ZIP valide');
  }

  const sizeMo = Math.round(fs.statSync(zipPath).size / 1024 / 1024);
  wsLog('Téléchargement terminé : ' + sizeMo + ' Mo');
  return zipPath;
};

module.exports = { downloadZIP, checkForNewVersion, saveVersion, getLastVersion, ZIP_PATH };
