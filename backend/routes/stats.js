// routes/stats.js
const express  = require('express');
const router   = express.Router();
const Lead     = require('../models/Lead');
const mongoose = require('mongoose');
const { getDiskSpace } = require('../utils/diskSpace');

const LEADS_FILTER = { isBaseline: { $ne: true } };

router.get('/storage', async (req, res) => {
  try {
    const db      = mongoose.connection.db;
    const dbStats = await db.stats({ scale: 1 });
    const colStats = await db.command({ collStats: 'leads' }).catch(() => null);
    const disk    = await getDiskSpace();
    res.json({
      dbName:      dbStats.db,
      totalSize:   dbStats.totalSize   || 0,
      dataSize:    dbStats.dataSize    || 0,
      storageSize: dbStats.storageSize || 0,
      indexSize:   dbStats.indexSize   || 0,
      collections: dbStats.collections || 0,
      objects:     dbStats.objects     || 0,
      leadsSize:   colStats ? (colStats.storageSize || 0) : 0,
      leadsCount:  colStats ? (colStats.count       || 0) : 0,
      avgObjSize:  colStats ? (colStats.avgObjSize  || 0) : 0,
      disk,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/distribution', async (req, res) => {
  try {
    const data = await Lead.aggregate([
      { $match: LEADS_FILTER },
      { $group: { _id: { year: { $year: '$dateTrouve' }, month: { $month: '$dateTrouve' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json({ distribution: data, testCount: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/registry', async (req, res) => {
  try {
    const total    = await Lead.countDocuments();
    const baseline = await Lead.countDocuments({ isBaseline: true });
    const actifs   = await Lead.countDocuments({ isBaseline: true, statutREQ: 'Actif' });
    const inactifs = await Lead.countDocuments({ isBaseline: true, statutREQ: { $in: ['Inactif','Radié','Fusionné','Fermé'] } });
    const leads    = await Lead.countDocuments({ isBaseline: { $ne: true } });
    res.json({ total, baseline, actifs, inactifs, leads });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/signals', async (req, res) => {
  try {
    const [nouvelle, reouverture, demenagement, fermeture] = await Promise.all([
      Lead.countDocuments({ isBaseline: { $ne: true }, signal: 'nouvelle' }),
      Lead.countDocuments({ isBaseline: { $ne: true }, signal: 'reouverture' }),
      Lead.countDocuments({ isBaseline: { $ne: true }, signal: 'demenagement' }),
      Lead.countDocuments({ isBaseline: { $ne: true }, signal: 'fermeture' }),
    ]);
    res.json({ nouvelle, reouverture, demenagement, fermeture });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/scores', async (req, res) => {
  try {
    const data = await Lead.aggregate([
      { $match: { isBaseline: { $ne: true } } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const map = {};
    data.forEach(d => { map[d._id] = d.count; });
    res.json(map);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:year', async (req, res) => {
  try {
    const year  = parseInt(req.params.year);
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const end   = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const baseFilter = { ...LEADS_FILTER, dateTrouve: { $gte: start, $lte: end } };

    const [totalLeads, scoreEleve, nouvelles, fermetures, demenagements, reouvertures, scoreAgg] = await Promise.all([
      Lead.countDocuments(baseFilter),
      Lead.countDocuments({ ...baseFilter, score: { $gte: 5 } }),
      Lead.countDocuments({ ...baseFilter, signal: 'nouvelle' }),
      Lead.countDocuments({ ...baseFilter, signal: 'fermeture' }),
      Lead.countDocuments({ ...baseFilter, signal: 'demenagement' }),
      Lead.countDocuments({ ...baseFilter, signal: 'reouverture' }),
      Lead.aggregate([{ $match: baseFilter }, { $group: { _id: null, avg: { $avg: '$score' } } }]),
    ]);

    const scoreMoyen = scoreAgg[0]?.avg ? parseFloat(scoreAgg[0].avg.toFixed(1)) : 0;

    const monthly = await Lead.aggregate([
      { $match: baseFilter },
      { $group: {
        _id:           { $month: '$dateTrouve' },
        total:         { $sum: 1 },
        nouvelles:     { $sum: { $cond: [{ $eq: ['$signal', 'nouvelle'] },     1, 0] } },
        reouvertures:  { $sum: { $cond: [{ $eq: ['$signal', 'reouverture'] },  1, 0] } },
        fermetures:    { $sum: { $cond: [{ $eq: ['$signal', 'fermeture'] },    1, 0] } },
        demenagements: { $sum: { $cond: [{ $eq: ['$signal', 'demenagement'] }, 1, 0] } },
        maxScore:      { $max: '$score' },
      }},
      { $sort: { _id: 1 } },
    ]);

    const yearsData = await Lead.aggregate([
      { $match: LEADS_FILTER },
      { $group: { _id: { $year: '$dateTrouve' } } },
      { $sort: { _id: 1 } },
    ]);

    const groupes = await Lead.aggregate([
      { $match: { ...baseFilter, signal: { $ne: 'fermeture' } } },
      { $group: { _id: '$ville', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const secteurs = await Lead.aggregate([
      { $match: { ...baseFilter, signal: { $ne: 'fermeture' }, secteurMatch: { $ne: '' } } },
      { $group: { _id: '$secteurMatch', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      year, totalLeads, scoreEleve, scoreMoyen,
      nouvelles, fermetures, demenagements, reouvertures,
      monthly, groupes, secteurs,
      years: yearsData.map(y => y._id),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
