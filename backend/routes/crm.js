// routes/crm.js
const express = require('express');
const router  = express.Router();
const CRM     = require('../models/CRM');
const Lead    = require('../models/Lead');

router.get('/export', async (req, res) => {
  try {
    const entries = await CRM.find({ statutCRM: { $ne: 'perdu' } });
    const headers = 'NEQ,Nom,Adresse,Ville,Code Postal,Secteur,Date Création,Score,Statut,Téléphone,Contact,Notes\n';
    const rows    = entries.map(e => [e.neq,`"${e.nom}"`,`"${e.adresse}"`,e.ville,e.codePostal,e.secteurMatch,e.dateCreation?e.dateCreation.toISOString().split('T')[0]:'',e.score,e.statutCRM,e.telephone,e.contact,`"${e.notes}"`].join(','));
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename=crm-leads.csv');
    res.send(headers + rows.join('\n'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { statutCRM, ville, search, page=1, limit=50 } = req.query;
    const query = {};
    if (statutCRM) query.statutCRM = statutCRM;
    if (ville)     query.ville     = ville;
    if (search)    query.$or = [{ nom:{$regex:search,$options:'i'} },{ ville:{$regex:search,$options:'i'} },{ secteurMatch:{$regex:search,$options:'i'} }];
    const skip    = (parseInt(page)-1)*parseInt(limit);
    const entries = await CRM.find(query).sort({ dateAjouteCRM:-1 }).skip(skip).limit(parseInt(limit));
    const total   = await CRM.countDocuments(query);
    res.json({ entries, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const { statutCRM, notes, telephone, contact, email } = req.body;
    const updates = { dateModif: new Date() };
    if (statutCRM  !== undefined) updates.statutCRM  = statutCRM;
    if (notes      !== undefined) updates.notes      = notes;
    if (telephone  !== undefined) updates.telephone  = telephone;
    if (contact    !== undefined) updates.contact    = contact;
    if (email      !== undefined) updates.email      = email;
    if (statutCRM) {
      const labels = { contacte:'Contacté', rdv_planifie:'RDV planifié', vendu:'Vendu', perdu:'Perdu' };
      updates.$push = { historique: { date: new Date(), action: labels[statutCRM] || statutCRM } };
    }
    const entry = await CRM.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!entry) return res.status(404).json({ error: 'Entrée CRM introuvable' });
    res.json({ success: true, entry });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await CRM.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
