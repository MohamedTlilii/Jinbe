// engine/extractor.js
const fs      = require('fs');
const path    = require('path');
const AdmZip  = require('adm-zip');
const { parse } = require('csv-parse');

const TEMP_DIR    = path.resolve('./temp');
const EXTRACT_DIR = path.join(TEMP_DIR, 'extracted');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const extractZIP = (zipPath, wsLog) => {
  wsLog('Extraction du ZIP...');
  ensureDir(EXTRACT_DIR);
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(EXTRACT_DIR, true);
  const files = fs.readdirSync(EXTRACT_DIR);
  wsLog('Fichiers extraits : ' + files.join(', '));
  return EXTRACT_DIR;
};

// Détection délimiteur depuis les premiers Ko seulement
const detectDelimiter = (filePath) => {
  const buf  = Buffer.alloc(4000);
  const fd   = fs.openSync(filePath, 'r');
  const read = fs.readSync(fd, buf, 0, 4000, 0);
  fs.closeSync(fd);
  const sample     = buf.slice(0, read).toString('utf8');
  const commas     = (sample.match(/,/g)  || []).length;
  const semicolons = (sample.match(/;/g)  || []).length;
  const tabs       = (sample.match(/\t/g) || []).length;
  if (semicolons > commas && semicolons > tabs) return ';';
  if (tabs > commas)                            return '\t';
  return ',';
};

// Streaming CSV — appelle onRow pour chaque ligne sans tout charger en mémoire
const streamCSV = (filePath, onRow) => new Promise((resolve, reject) => {
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
    delimiter: detectDelimiter(filePath),
  });
  parser.on('readable', function () {
    let row;
    while ((row = this.read()) !== null) onRow(row);
  });
  parser.on('error', reject);
  parser.on('end', resolve);
  fs.createReadStream(filePath).pipe(parser);
});

// Lecture insensible à la casse depuis un objet row
const getField = (row, ...candidates) => {
  if (!row) return '';
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') return String(row[c]).trim();
  }
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== '') return String(row[found]).trim();
  }
  return '';
};

// Parse la ville depuis le format REQ "Montréal (Québec)" ou "LAVAL QC"
const parseCity = (lign2) => {
  if (!lign2) return '';
  return lign2
    .replace(/\s*\([^)]+\)\s*$/, '') // Retire "(Québec)" etc.
    .replace(/\s+QC\s*$/i, '')        // Retire " QC" en suffixe
    .trim();
};

// Étape 1 : Charger Etablissements.csv en map lean (seulement les champs nécessaires)
const buildEtablissementsMap = async (etablissementPath, wsLog) => {
  wsLog('Lecture Etablissements.csv...');
  const map = {};
  let count = 0;
  await streamCSV(etablissementPath, row => {
    const neq = getField(row, 'NEQ', 'neq', 'Neq');
    if (!neq || map[neq]) return; // garder seulement le premier établissement par NEQ
    map[neq] = {
      ville:   parseCity(getField(row, 'LIGN2_ADR')),
      cp:      getField(row, 'LIGN4_ADR'),
      adresse: getField(row, 'LIGN1_ADR'),
      activite:getField(row, 'DESC_ACT_ECON_ETAB', 'DESC_ACT_ECON_ETAB2'),
    };
    count++;
  });
  wsLog('Établissements chargés : ' + count);
  if (count > 0) {
    const sample = Object.values(map)[0];
    wsLog('Exemple colonnes étab : ' + JSON.stringify(sample));
  }
  return map;
};

// Étape 1b : Charger Nom.csv en map NEQ → nom de l'entreprise
const buildNomMap = async (nomPath, wsLog) => {
  wsLog('Lecture Nom.csv...');
  const map = {};
  await streamCSV(nomPath, row => {
    const neq    = getField(row, 'NEQ', 'neq');
    const nom    = getField(row, 'NOM_ASSUJ');
    const statut = getField(row, 'STAT_NOM');
    if (!neq || !nom) return;
    // Priorité au nom actif (STAT_NOM = 'A'), sinon premier trouvé
    if (!map[neq] || statut === 'A') map[neq] = nom;
  });
  wsLog('Noms chargés : ' + Object.keys(map).length);
  return map;
};

const prepareData = async (extractDir, wsLog) => {
  const files = fs.readdirSync(extractDir);
  wsLog('Fichiers ZIP : ' + files.join(', '));

  const findFile = (...keywords) => {
    const f = files.find(name => keywords.some(kw => name.toLowerCase().includes(kw)));
    return f ? path.join(extractDir, f) : null;
  };

  const entreprisePath    = findFile('entreprise');
  const etablissementPath = findFile('etablissement');
  const nomPath           = findFile('nom');

  if (!entreprisePath) {
    throw new Error('Entreprise.csv introuvable dans le ZIP. Fichiers : ' + files.join(', '));
  }
  if (!etablissementPath) {
    wsLog('AVERTISSEMENT : Etablissements.csv introuvable — ville/secteur ignorés');
  }

  const etablissementsMap = etablissementPath
    ? await buildEtablissementsMap(etablissementPath, wsLog)
    : {};

  const nomMap = nomPath
    ? await buildNomMap(nomPath, wsLog)
    : {};

  return { entreprisePath, etablissementsMap, nomMap };
};

module.exports = { extractZIP, prepareData };
