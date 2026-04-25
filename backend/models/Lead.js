// models/Lead.js
const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  neq:              { type: String, required: true, unique: true, index: true },
  nom:              { type: String, default: 'Non déclaré', trim: true },
  adresse:          { type: String, default: '' },
  ville:            { type: String, default: '', index: true },
  groupe:           { type: String, default: '', index: true },
  codePostal:       { type: String, default: '' },
  province:         { type: String, default: 'QC' },
  secteurActivite:  { type: String, default: '' },
  secteurMatch:     { type: String, default: '' },
  categorieSecteur: { type: String, default: '' },
  dateCreation:     { type: Date, index: true },
  dateTrouve:       { type: Date, default: Date.now, index: true },
  statutREQ:        { type: String, enum: ['Actif','Inactif','Radié','Fusionné','Fermé'], default: 'Actif' },
  signal:           { type: String, enum: ['nouvelle','reouverture','demenagement','nouvelle_activite','fermeture','baseline'], default: 'nouvelle' },
  score:            { type: Number, min: 1, max: 6, default: 1, index: true },
  scoreDetails:     { fraicheur: { type: Number, default: 0 }, secteur: { type: Number, default: 0 } },
  isBaseline:       { type: Boolean, default: false, index: true },
  lastRunId:        { type: String, default: '', index: true },
  versionREQ:       { type: String, default: '' },
  previousData:     { adresse: { type: String, default: '' }, statutREQ: { type: String, default: '' } },
}, { timestamps: true, collection: 'leads' });

LeadSchema.index({ ville: 1, score: -1 });
LeadSchema.index({ dateTrouve: -1 });
LeadSchema.index({ isBaseline: 1, dateTrouve: -1 });

module.exports = mongoose.model('Lead', LeadSchema);
