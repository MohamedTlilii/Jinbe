// utils/pdf.js
import jsPDF from 'jspdf'

const SIGNAL_LABELS = {
  nouvelle:     'Nouvelle entreprise',
  reouverture:  'Reouverture',
  demenagement: 'Demenagement',
  fermeture:    'Fermeture',
  baseline:     'Baseline',
}

const fmt = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-CA')
}

const clean = (str) => (str || '').replace(/[^\x00-\xFF]/g, '?')

export const generateLeadPDF = (lead) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 20
  let y = 20

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, W, 38, 'F')

  doc.setTextColor(108, 99, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SecuLeads', M, 15)

  doc.setTextColor(180, 185, 210)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Fiche Lead  -  Registre des Entreprises du Quebec', M, 23)

  doc.setFontSize(8)
  doc.setTextColor(108, 99, 255)
  doc.text((SIGNAL_LABELS[lead.signal] || lead.signal || '').toUpperCase(), M, 32)

  y = 50

  // Nom
  doc.setTextColor(20, 22, 40)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(clean(lead.nom || 'Nom non disponible'), M, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 105, 130)
  doc.text('Score : ' + (lead.score || 1) + '/6   |   Statut REQ : ' + (lead.statutREQ || '-'), M, y)
  y += 10

  // Ligne
  doc.setDrawColor(200, 202, 220)
  doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)
  y += 8

  const section = (title) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(108, 99, 255)
    doc.text(title, M, y)
    y += 6
  }

  const row = (label, value) => {
    if (!value || value === '-' || value === '') return
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 32, 55)
    doc.text(label, M, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 65, 90)
    const val = clean(String(value))
    doc.text(val, M + 38, y)
    y += 7
  }

  // Coordonnees
  section('COORDONNEES')
  row('Adresse', lead.adresse)
  const villeStr = [lead.ville, lead.codePostal, lead.province || 'QC'].filter(Boolean).join(', ')
  row('Ville', villeStr)
  if (lead.signal === 'demenagement' && lead.previousData?.adresse) {
    row('Anc. adresse', lead.previousData.adresse)
  }

  y += 2
  doc.setDrawColor(200, 202, 220)
  doc.line(M, y, W - M, y)
  y += 8

  // Infos REQ
  section('INFORMATIONS REQ')
  row('NEQ', lead.neq)
  row('Secteur', lead.secteurMatch || lead.secteurActivite || '-')
  row('Date creation', fmt(lead.dateCreation))
  row('Date detection', fmt(lead.dateTrouve))
  row('Version REQ', lead.versionREQ ? fmt(lead.versionREQ) : '-')

  y += 2
  doc.line(M, y, W - M, y)
  y += 8

  // Liens
  section('RECHERCHE EN LIGNE')
  const addr = [lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', ')
  const nom  = encodeURIComponent(lead.nom || '')

  const links = [
    { label: 'Google Maps', url: 'https://www.google.com/search?q=' + encodeURIComponent(addr) },
    { label: 'Facebook',    url: 'https://www.facebook.com/search/top?q=' + nom },
    { label: 'Instagram',   url: 'https://www.instagram.com/explore/search/keyword/?q=' + nom },
    { label: 'Site web',    url: 'https://www.google.com/search?q=' + nom },
  ]

  links.forEach(({ label, url }) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 32, 55)
    doc.text(label, M, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 115, 232)
    doc.textWithLink(url.length > 65 ? url.slice(0, 62) + '...' : url, M + 38, y, { url })
    y += 7
  })

  y += 6
  doc.setDrawColor(200, 202, 220)
  doc.line(M, y, W - M, y)
  y += 8

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(140, 144, 167)
  doc.text('Genere par SecuLeads le ' + new Date().toLocaleString('fr-CA') + '  |  REQ Quebec', M, y)

  doc.save('lead_' + (lead.neq || 'export') + '.pdf')
}
