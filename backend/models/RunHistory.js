// models/RunHistory.js
const mongoose = require('mongoose');

const RunHistorySchema = new mongoose.Schema({
  startedAt:  { type: Date, required: true },
  finishedAt: { type: Date, required: true },
  durationMs: { type: Number, required: true },
  version:    { type: String, default: '' },
  isBaseline: { type: Boolean, default: false },
  isTest:     { type: Boolean, default: false },
  counts: {
    nouvelle:     { type: Number, default: 0 },
    reouverture:  { type: Number, default: 0 },
    demenagement: { type: Number, default: 0 },
    fermeture:    { type: Number, default: 0 },
    total:        { type: Number, default: 0 },
  },
});

RunHistorySchema.index({ startedAt: -1 });

module.exports = mongoose.model('RunHistory', RunHistorySchema);
