// models/CRM.js
const mongoose = require('mongoose');

const CRMSchema = new mongoose.Schema({
  neq:              { type: String, required: true, unique: true, index: true },
  nom:              { type: String, required: true, trim: true },
  adresse:          { type: String, default: '' },
  ville:            { type: String, required: true, index: true },
  codePostal:       { type: String, default: '' },
  secteurMatch:     { type: String, default: '' },
  categorieSecteur: { type: String, default: '' },
  dateCreation:     { type: Date },
  dateTrouve:       { type: Date },
  dateAjouteCRM:    { type: Date, default: Date.now },
  score:            { type: Number, min: 1, max: 6 },
  signal:           { type: String, default: 'nouvelle' },
  statutCRM:        { type: String, enum: ['bon_lead','contacte','rdv_planifie','vendu','perdu'], default: 'bon_lead', index: true },
  telephone:        { type: String, default: '' },
  contact:          { type: String, default: '' },
  email:            { type: String, default: '' },
  notes:            { type: String, default: '' },
  historique: [{
    date:   { type: Date, default: Date.now },
    action: { type: String },
    note:   { type: String, default: '' },
  }],
  dateModif: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'crm' });

CRMSchema.index({ statutCRM: 1, dateAjouteCRM: -1 });

module.exports = mongoose.model('CRM', CRMSchema);
