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

const clean = (str) => (str || '').replace(/[^\x20-\xFF]/g, '?')

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
  doc.text('Jinbe', M, 15)

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
    const val = (!value || value === '-' || value === '') ? '—' : clean(String(value))
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 32, 55)
    doc.text(label, M, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(val === '—' ? 160 : 60, val === '—' ? 165 : 65, val === '—' ? 185 : 90)
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
  row('Secteur REQ', lead.secteurActivite || '-')
  row('Secteur match', lead.secteurMatch || '-')
  row('Categorie', lead.categorieSecteur ? 'Priorite ' + lead.categorieSecteur : '-')
  row('Groupe geo', lead.groupe || '-')
  row('Date creation', fmt(lead.dateCreation))
  row('Date detection', fmt(lead.dateTrouve))
  row('Version REQ', lead.versionREQ ? fmt(lead.versionREQ) : '-')
  if (lead.scoreDetails) {
    row('Score fraicheur', (lead.scoreDetails.fraicheur || 0) + '/3')
    row('Score secteur', (lead.scoreDetails.secteur || 0) + '/3')
  }

  y += 2
  doc.line(M, y, W - M, y)
  y += 8

  // Données système
  section('DONNEES SYSTEME')
  row('ID', lead._id || lead.id || '-')
  row('Version schema', lead.__v !== undefined ? String(lead.__v) : '-')
  row('isBaseline', lead.isBaseline !== undefined ? (lead.isBaseline ? 'Oui' : 'Non') : '-')
  row('Cree le', lead.createdAt ? fmt(lead.createdAt) : '-')
  row('Mis a jour', lead.updatedAt ? fmt(lead.updatedAt) : '-')

  y += 2
  doc.line(M, y, W - M, y)
  y += 8

  // Liens
  section('RECHERCHE EN LIGNE')
  const addr    = [lead.adresse, lead.ville, 'QC', lead.codePostal].filter(Boolean).join(', ')
  const nomRaw  = lead.nom && lead.nom !== 'Non déclaré' ? lead.nom : (lead.secteurMatch || '')
  const nom     = encodeURIComponent(nomRaw)

  const links = [
    { label: 'Google Maps', url: 'https://www.google.com/maps/search/?q=' + encodeURIComponent(addr) },
    { label: 'Facebook',    url: 'https://www.facebook.com/search/top?q=' + nom },
    { label: 'Instagram',   url: 'https://www.instagram.com/explore/search/keyword/?q=' + nom },
    { label: 'Site web',    url: 'https://www.google.com/search?q=' + nom },
    { label: 'Registre REQ', url: 'https://www.registreentreprises.gouv.qc.ca/RQAnonymeGR/GR/GR03/GR03A2_19A_PIU_RechEnt_PC/PageErreur.aspx?T004=1&T010=' + (lead.neq || '') },
    { label: 'Canada411',   url: 'https://www.canada411.ca/search/?stype=bs&what=' + nom },
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
  doc.text('Genere par Jinbe le ' + new Date().toLocaleString('fr-CA') + '  |  REQ Quebec', M, y)

  doc.save('lead_' + (lead.neq || 'export') + '.pdf')
}

export const generateTestPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 14
  let y = 20

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(108, 99, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Jinbe', M, 15)
  doc.setTextColor(180, 185, 210)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Gabarit PDF - Guide des champs', M, 23)
  doc.setFontSize(8)
  doc.setTextColor(108, 99, 255)
  doc.text('DOCUMENT DE TEST - TOUTES LES SECTIONS ET CHAMPS', M, 32)

  y = 48

  const section = (title) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(108, 99, 255)
    doc.text(title, M, y)
    y += 6
  }

  const field = (label, example, desc) => {
    const colLabel   = M
    const colExample = M + 36
    const colDesc    = M + 80
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 32, 55)
    doc.text(label, colLabel, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 115, 100)
    doc.text(clean(example), colExample, y)
    doc.setTextColor(120, 125, 150)
    doc.setFontSize(8)
    const descClean = clean(desc)
    const maxW = W - colDesc - M
    const lines = doc.splitTextToSize(descClean, maxW)
    doc.text(lines[0], colDesc, y)
    y += 6.5
  }

  const divider = () => {
    doc.setDrawColor(200, 202, 220)
    doc.setLineWidth(0.3)
    doc.line(M, y, W - M, y)
    y += 7
  }

  // En-tête colonnes
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(160, 165, 185)
  doc.text('CHAMP', M, y)
  doc.text('EXEMPLE', M + 36, y)
  doc.text('DESCRIPTION', M + 80, y)
  y += 4
  divider()

  section('IDENTIFICATION')
  field('nom',           'LIGN\'ELLE PLUS INC.',    'Nom commercial du commerce — source : Nom.csv (NOM_ASSUJ, priorite STAT_NOM=A)')
  field('signal',        'nouvelle',                 'Type detecte : nouvelle | reouverture | demenagement | fermeture | baseline')
  field('score',         '5/6',                      'Score total = score fraicheur (0-3) + score secteur (0-3). Minimum 1, maximum 6')
  field('statutREQ',     'Actif',                    'Statut REQ : Actif (cod IM) | Radie (cod RO/RF) | Fusionne (cod FU) | Inactif (autres) | Ferme (moteur)')
  divider()

  section('COORDONNEES')
  field('adresse',       '2707, CAZENEUVE',          'Adresse physique du commerce — source : Etablissements.csv (LIGN1_ADR), sinon Entreprise.csv')
  field('ville',         'SAINT-LAURENT',             'Ville nettoyee depuis format REQ "Montreal (Quebec)" via parseCity()')
  field('codePostal',    'H4R1Z7',                   'Code postal — source : Etablissements.csv (LIGN4_ADR)')
  field('province',      'QC',                       'Province — toujours QC (Registre des Entreprises du Quebec)')
  field('anc. adresse',  '456 ancienne rue, Laval',  'Ancienne adresse avant le demenagement — affiche seulement si signal = demenagement')
  divider()

  section('INFORMATIONS REQ')
  field('neq',           '1140030355',               'Numero d\'Entreprise du Quebec — identifiant unique, 10 chiffres, source : Entreprise.csv (NEQ)')
  field('secteurActivite','NON DECLARE',              'Secteur brut du registre REQ — source : Etablissements.csv (DESC_ACT_ECON_ETAB)')
  field('secteurMatch',  'Alimentation',              'Secteur reconnu par Jinbe apres matching avec les secteurs cibles des settings')
  field('categorieSecteur','general',                 'Categorie du secteur : general (valeur actuelle unique dans le moteur)')
  field('groupe',        'montreal',                  'Region geographique : montreal | mauricie | quebec | outaouais | vide si hors zone')
  field('dateCreation',  '1994-01-18',               'Date d\'immatriculation au registre REQ — source : Entreprise.csv (DAT_IMMAT)')
  field('dateTrouve',    '2026-04-23',               'Date et heure de detection par le moteur Jinbe lors du run')
  field('versionREQ',    '2026-04-22',               'Version du fichier REQ utilise lors du run (date du ZIP telecharge)')
  field('score fraicheur','3/3',                      '3 pts si creation <= 30 jours | 2 pts si <= 90 jours | 1 pt si <= 365 jours | 0 pt si plus vieux')
  field('score secteur', '2/3',                      'Points attribues selon le secteur d\'activite (defini dans les settings du moteur, 0 a 3)')
  divider()

  section('DONNEES SYSTEME (MongoDB)')
  field('_id',           '69e92fbb97b0276a075ec0c6', 'Identifiant unique genere automatiquement par MongoDB pour chaque document')
  field('__v',           '0',                        'Numero de version interne du schema MongoDB — incremente a chaque modification de structure')
  field('isBaseline',    'true | false',              'true = entreprise deja connue avant le run (reference) | false = nouvellement detectee')
  field('createdAt',     '2026-04-22 20:29:45',      'Date et heure exactes de creation du document dans MongoDB')
  field('updatedAt',     '2026-04-23 01:10:42',      'Date et heure de la derniere mise a jour du document dans MongoDB')
  divider()

  section('RECHERCHE EN LIGNE (liens generes automatiquement)')
  field('Google Maps',   'maps/search/?q=adresse+ville+QC+CP',    'Ouvre Google Maps directement sur l\'adresse physique du commerce')
  field('Google',        'search?q=adresse+ville+QC+CP',          'Recherche Google avec l\'adresse complete du commerce')
  field('Facebook',      'search/top?q=nom du commerce',           'Recherche Facebook avec le nom commercial du commerce')
  field('Instagram',     'search/keyword/?q=nom du commerce',      'Recherche Instagram avec le nom commercial du commerce')
  field('Site web',      'search?q=nom du commerce',               'Recherche Google avec le nom pour trouver le site web')
  field('Registre REQ',  'registreentreprises.gouv.qc.ca?T010=NEQ','Lien direct vers la fiche officielle du commerce sur le Registre REQ')
  field('Canada411',     'canada411.ca/search?what=nom',           'Recherche Canada411 avec le nom du commerce')
  divider()

  doc.setFontSize(8)
  doc.setTextColor(140, 144, 167)
  doc.text('Gabarit genere par Jinbe le ' + new Date().toLocaleString('fr-CA') + '  |  Document de test interne', M, y)

  doc.save('seculeads_gabarit_pdf.pdf')
}
