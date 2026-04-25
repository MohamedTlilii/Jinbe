// ============================================
// models/Settings.js — Paramètres de l'application
// ============================================

const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    // Un seul document de settings — identifié par ce champ
    singleton: { type: String, default: 'main', unique: true },

    // Villes actives — tableau des IDs de villes
    // Référence aux IDs dans data/cities.js
    villesActives: {
      type: [String],
      default: [],  // Vide = toutes les villes actives dans cities.js
    },

    // Secteurs actifs — tableau des IDs de secteurs
    secteursActifs: {
      type: [String],
      default: [], // Vide = tous actifs
    },

    // Période de recherche en jours
    // 30 = derniers 30 jours, 365 = dernière année
    periodJours: {
      type: Number,
      default: 365,
      min: 30,
      max: 730,
    },

    // Score minimum pour afficher un lead
    scoreMinimum: {
      type: Number,
      default: 1,
      min: 1,
      max: 6,
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

module.exports = mongoose.model('Settings', SettingsSchema);
