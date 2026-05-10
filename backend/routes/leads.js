// routes/leads.js
const express = require('express');
const router  = express.Router();
const Lead    = require('../models/Lead');
const XLSX    = require('xlsx');

router.get('/nouveautes', async (req, res) => {
  try {
    const latest = await Lead.findOne({ versionREQ: { $ne: '' }, isBaseline: { $ne: true } }).sort({ versionREQ: -1 }).lean();
    if (!latest) return res.json({ leads: [], version: null, total: 0 });
    const filter = { versionREQ: latest.versionREQ, isBaseline: { $ne: true } };
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ score: -1 }).limit(500),
      Lead.countDocuments(filter),
    ]);
    res.json({ leads, version: latest.versionREQ, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { ville, secteur, score, date, signal, groupe, nom, page=1, limit=50, includeBaseline } = req.query;
    const query = {};

    if (!includeBaseline) query.isBaseline = { $ne: true };
    if (signal)  query.signal = signal;
    if (score)   query.score  = { $gte: parseInt(score) };
    if (nom)     query.nom    = new RegExp(nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (secteur) query.secteurMatch = new RegExp(secteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (date) {
      // Detect true UTC offset for America/Toronto on the given date (EDT=4, EST=5)
      const noon = new Date(date + 'T12:00:00Z');
      const torontoHour = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hour12: false }).format(noon), 10);
      const offsetHours = 12 - torontoHour;
      const startUTC = new Date(date + 'T00:00:00.000Z');
      startUTC.setUTCHours(offsetHours);
      const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
      query.dateTrouve = { $gte: startUTC, $lte: endUTC };
    }
    if (groupe) {
      const { CITIES } = require('../data/cities');
      const groupCities = CITIES.filter(c => c.group === groupe && c.active)
        .flatMap(c => c.variants);
      query.ville = { $in: groupCities.map(v => new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
    } else if (ville) {
      query.ville = new RegExp(ville.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const skip  = (parseInt(page)-1) * parseInt(limit);
    const leads = await Lead.find(query).sort({ score: -1, dateTrouve: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Lead.countDocuments(query);
    res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/calendar', async (req, res) => {
  try {
    const { month, year, signal, ville, score } = req.query;
    // Dates UTC alignées sur America/Toronto (EST=UTC-5, EDT=UTC-4) — détection DST dynamique
    const torontoOffset = (isoDay) => {
      const noon = new Date(isoDay + 'T12:00:00Z');
      const h = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hour12: false }).format(noon), 10);
      return 12 - h;
    };
    const y = parseInt(year), m = parseInt(month);
    const dayStart = `${y}-${String(m).padStart(2,'0')}-01`;
    const dayEnd   = `${m === 12 ? y+1 : y}-${String(m === 12 ? 1 : m+1).padStart(2,'0')}-01`;
    const startDate = new Date(dayStart + 'T00:00:00Z');
    startDate.setUTCHours(torontoOffset(dayStart));
    const endDate = new Date(dayEnd + 'T00:00:00Z');
    endDate.setUTCHours(torontoOffset(dayEnd));
    endDate.setTime(endDate.getTime() - 1);
    const match = { dateTrouve: { $gte: startDate, $lte: endDate }, isBaseline: { $ne: true }, signal: { $ne: 'fermeture' } };
    if (signal) match.signal = signal;
    if (ville)  match.ville  = new RegExp(ville.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (score)  match.score  = { $gte: parseInt(score) };
    const data = await Lead.aggregate([
      { $match: match },
      { $group: { _id: { year:{$year:{date:'$dateTrouve',timezone:'America/Toronto'}}, month:{$month:{date:'$dateTrouve',timezone:'America/Toronto'}}, day:{$dayOfMonth:{date:'$dateTrouve',timezone:'America/Toronto'}} }, count:{$sum:1}, maxScore:{$max:'$score'}, topSignal:{$first:'$signal'} } },
      { $sort: { '_id.day': 1 } },
    ]);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/groups', (req, res) => {
  const { CITIES } = require('../data/cities');
  const groups = {};
  for (const city of CITIES.filter(c => c.active)) {
    if (!groups[city.group]) groups[city.group] = { id: city.group, cities: [] };
    groups[city.group].cities.push(city.name);
  }
  res.json(Object.values(groups));
});

router.get('/export-csv', async (req, res) => {
  try {
    const leads = await Lead.find({ isBaseline: { $ne: true }, signal: { $ne: 'fermeture' } }).sort({ score: -1, dateTrouve: -1 }).lean();
    const headers = 'NEQ,Nom,Adresse,Ville,Code Postal,Secteur,Score,Signal,Date Création\n';
    const rows = leads.map(l => [
      l.neq,
      `"${(l.nom || '').replace(/"/g, '""')}"`,
      `"${(l.adresse || '').replace(/"/g, '""')}"`,
      l.ville,
      l.codePostal,
      l.secteurMatch,
      l.score,
      l.signal,
      l.dateCreation ? new Date(l.dateCreation).toISOString().split('T')[0] : '',
    ].join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(headers + rows.join('\n'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/export-excel', async (req, res) => {
  try {
    const { signal } = req.query;
    const filter = { isBaseline: { $ne: true } };
    if (signal) filter.signal = signal;
    else filter.signal = { $ne: 'fermeture' };
    const leads = await Lead.find(filter).sort({ score: -1, dateTrouve: -1 }).lean();

    const rows = leads.map(l => ({
      NEQ:           l.neq || '',
      Nom:           l.nom || '',
      Adresse:       l.adresse || '',
      Ville:         l.ville || '',
      'Code Postal': l.codePostal || '',
      Secteur:       l.secteurMatch || '',
      Statut:        l.statutREQ || '',
      Score:         l.score || 1,
      Signal:        l.signal || '',
      'Date Création': l.dateCreation ? new Date(l.dateCreation).toISOString().split('T')[0] : '',
      'Date Trouvé':   l.dateTrouve  ? new Date(l.dateTrouve).toISOString().split('T')[0]  : '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [10,35,40,20,12,30,12,7,15,14,14].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/purge/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const allowed = ['fermeture', 'nouvelle', 'demenagement', 'reouverture'];
    if (!allowed.includes(type)) return res.status(400).json({ error: 'Type invalide' });
    const result = await Lead.deleteMany({ signal: type, isBaseline: { $ne: true } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/reset-db', async (req, res) => {
  try {
    const result = await Lead.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await Lead.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
