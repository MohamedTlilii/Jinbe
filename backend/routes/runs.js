// routes/runs.js
const express    = require('express');
const router     = express.Router();
const RunHistory = require('../models/RunHistory');

router.get('/', async (req, res) => {
  try {
    const runs = await RunHistory.find().sort({ startedAt: -1 }).limit(20).lean();
    res.json(runs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/latest', async (req, res) => {
  try {
    const runs = await RunHistory.find({ isBaseline: false, isTest: false })
      .sort({ startedAt: -1 }).limit(2).lean();
    res.json(runs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/all', async (req, res) => {
  try {
    const result = await RunHistory.deleteMany({});
    res.json({ deleted: result.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await RunHistory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
