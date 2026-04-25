// routes/engine.js
const express = require('express');
const router  = express.Router();
const { startEngine, stopEngine, runManual, runReset, runTest, engineState } = require('../engine/scheduler');

router.get('/status', (req, res) => res.json({
  isRunning:      engineState.isRunning,
  isProcessing:   engineState.isProcessing,
  lastRun:        engineState.lastRun,
  nextRun:        engineState.nextRun,
  lastLeadsFound: engineState.lastLeadsFound,
  lastDuration:   engineState.lastDuration,
  progress:       engineState.progress,
  currentStep:    engineState.currentStep,
}));

router.post('/start', (req, res) => {
  startEngine(req.app.get('wsServer'));
  res.json({ success: true, message: 'Moteur démarré' });
});

router.post('/stop', (req, res) => {
  stopEngine();
  res.json({ success: true, message: 'Moteur arrêté' });
});

router.post('/run', async (req, res) => {
  if (engineState.isProcessing) return res.status(409).json({ error: 'Déjà en cours' });
  runManual(req.app.get('wsServer')).catch(console.error);
  res.json({ success: true, message: 'Traitement lancé' });
});

router.post('/reset', async (req, res) => {
  if (engineState.isProcessing) return res.status(409).json({ error: 'Déjà en cours' });
  runReset(req.app.get('wsServer')).catch(console.error);
  res.json({ success: true, message: 'Reset + rechargement lancé' });
});

router.post('/test', async (req, res) => {
  if (engineState.isProcessing) return res.status(409).json({ error: 'Déjà en cours' });
  const limit = Math.min(Math.max(parseInt(req.body?.limit) || 10, 1), 500);
  runTest(req.app.get('wsServer'), limit).catch(console.error);
  res.json({ success: true, message: `Test ${limit} leads lancé` });
});

module.exports = router;
