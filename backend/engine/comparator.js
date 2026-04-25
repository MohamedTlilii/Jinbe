// engine/comparator.js
const Lead = require('../models/Lead');

// Compare un batch de 500 via $in MongoDB — zéro chargement global en RAM
const compareAndDetectBatch = async (batch) => {
  const results = { nouvelles: [], reouvertures: [], demenagements: [] };

  const neqs         = batch.map(l => l.neq);
  const existingDocs = await Lead.find({ neq: { $in: neqs } }, { neq: 1, statutREQ: 1, adresse: 1 }).lean();
  const existingMap  = {};
  for (const doc of existingDocs) existingMap[doc.neq] = doc;

  for (const lead of batch) {
    const existing = existingMap[lead.neq];
    if (!existing) {
      lead.signal = 'nouvelle';
      results.nouvelles.push(lead);
    } else if (existing.statutREQ !== 'Actif' && lead.statutREQ === 'Actif') {
      lead.signal = 'reouverture';
      results.reouvertures.push(lead);
    } else if (existing.adresse && existing.adresse.trim().toLowerCase() !== lead.adresse.trim().toLowerCase()) {
      lead.signal = 'demenagement';
      lead.previousData = { adresse: existing.adresse };
      results.demenagements.push(lead);
    }
  }

  return results;
};

// Détecte les fermetures via MongoDB — zéro Set en RAM
const detectFermeturesByRunId = async (runId, wsLog) => {
  wsLog('Détection fermetures...');
  const fermetureLeads = await Lead.find(
    { statutREQ: 'Actif', isBaseline: { $ne: true }, lastRunId: { $ne: runId } },
    { neq: 1 }
  ).lean();
  const fermetureNeqs = fermetureLeads.map(l => l.neq);
  wsLog('Fermetures : ' + fermetureNeqs.length);
  return fermetureNeqs;
};

module.exports = { compareAndDetectBatch, detectFermeturesByRunId };
