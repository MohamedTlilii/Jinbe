# RAPPORT COMPLET — JINBE
## Documentation exhaustive — tout comprendre, tout modifier

*Mis à jour le 2026-05-08 après analyse ligne par ligne complète du projet*

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture globale](#2-architecture-globale)
3. [Structure complète des fichiers](#3-structure-complète-des-fichiers)
4. [Authentification — JWT + bcrypt](#4-authentification--jwt--bcrypt)
5. [Le Moteur REQ — cœur du système](#5-le-moteur-req--cœur-du-système)
6. [Extraction et lecture CSV](#6-extraction-et-lecture-csv)
7. [Comparaison et détection des signaux](#7-comparaison-et-détection-des-signaux)
8. [Système de score](#8-système-de-score)
9. [Secteurs ciblés — sectors.js](#9-secteurs-ciblés--sectorsjs)
10. [Villes surveillées — cities.js](#10-villes-surveillées--citiesjs)
11. [Modèles MongoDB — Lead + RunHistory](#11-modèles-mongodb--lead--runhistory)
12. [Backend — chaque route API expliquée](#12-backend--chaque-route-api-expliquée)
13. [Frontend — chaque page expliquée](#13-frontend--chaque-page-expliquée)
14. [Composants UI réutilisables](#14-composants-ui-réutilisables)
15. [WebSocket — logs en temps réel](#15-websocket--logs-en-temps-réel)
16. [Stores Zustand — état global](#16-stores-zustand--état-global)
17. [Internationalisation i18n](#17-internationalisation-i18n)
18. [Export PDF — pdf.js](#18-export-pdf--pdfjs)
19. [Thème dark/light](#19-thème-darklight)
20. [Où modifier quoi — guide rapide](#20-où-modifier-quoi--guide-rapide)
21. [Variables d'environnement — .env](#21-variables-denvironnement--env)
22. [Bugs corrigés — historique](#22-bugs-corrigés--historique)

---

## 1. Vue d'ensemble

**Jinbe** est un outil d'intelligence commerciale québécois.

**But principal :** Détecter automatiquement les PME qui viennent d'ouvrir, déménager, rouvrir ou fermer dans le Registre des Entreprises du Québec (REQ) et les présenter comme des **leads commerciaux exploitables**.

### Ce que fait le système concrètement

1. Télécharge le registre officiel REQ (fichier ZIP gouvernemental gratuit, ~225 Mo, ~2.9 millions d'entreprises)
2. Compare chaque entreprise avec la base MongoDB existante
3. Détecte 4 types de changements : nouvelle entreprise, réouverture, déménagement, fermeture
4. Attribue un score 1–6 à chaque lead (fraîcheur de l'entreprise + pertinence du secteur)
5. Présente les leads dans une interface web : calendrier, carte, filtres, export PDF/Excel/CSV

### Technologies

| Côté | Technologie | Rôle |
|------|-------------|------|
| Backend | Node.js + Express | Serveur API REST |
| Backend | MongoDB + Mongoose | Base de données principale |
| Backend | WebSocket (ws) | Logs temps réel pendant le run |
| Backend | JWT + bcryptjs | Authentification sécurisée |
| Backend | express-rate-limit | Anti-brute-force login |
| Backend | AdmZip + csv-parse | Extraction ZIP et lecture CSV |
| Backend | nodemailer | Email récapitulatif post-run |
| Frontend | React 18 + Vite | Interface web |
| Frontend | React Router v6 | Navigation SPA |
| Frontend | Zustand | État global (moteur, UI) |
| Frontend | Axios | Appels API avec JWT automatique |
| Frontend | Chart.js | Graphiques dashboard |
| Frontend | react-leaflet | Carte interactive |
| Frontend | jsPDF | Export PDF client-side |

---

## 2. Architecture globale

```
┌─────────────────────────────────────────────────────┐
│   Navigateur (React + Vite, port 5173 en dev)       │
│                                                     │
│   App.jsx → Sidebar + Pages                         │
│   EngineStore (Zustand) ←→ WebSocket ws://3001      │
│   api.js (Axios) → HTTP REST → /api/*               │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP + JWT
                    │ WebSocket (même port)
┌───────────────────▼─────────────────────────────────┐
│   Backend Express (port 3001)   server.js           │
│                                                     │
│   /api/health       → public                       │
│   /api/auth/*       → public (login, verify)       │
│   /api/engine/*     → authMiddleware + routes      │
│   /api/leads/*      → authMiddleware + routes      │
│   /api/stats/*      → authMiddleware + routes      │
│   /api/runs/*       → authMiddleware + routes      │
│   /api/tests/*      → authMiddleware + routes      │
│   /api/version/*    → authMiddleware + routes      │
│                                                     │
│   WebSocket server  → envoie logs en temps réel    │
└───────────────────┬─────────────────────────────────┘
                    │ Mongoose
┌───────────────────▼─────────────────────────────────┐
│   MongoDB (jimbe_db)                                │
│   Collection: leads        (~2.9M docs baseline)   │
│   Collection: runhistories (~1 doc par run)         │
└─────────────────────────────────────────────────────┘
```

### Flux d'une session utilisateur

```
1. Navigateur → Login.jsx (si pas de jimbe_token dans localStorage)
2. POST /api/auth/login { username, password }
3. Backend : bcrypt.compare → jwt.sign → token 7 jours
4. Token stocké : localStorage["jimbe_token"]
5. App.jsx re-render → Sidebar + pages visibles
6. Toutes les requêtes : Authorization: Bearer <token>
7. Si token expiré (7 jours) → 401 → localStorage vide → Login affiché
```

### Flux d'un run moteur

```
1. Utilisateur clique "⚡ Lancer maintenant" dans Engine.jsx
2. POST /api/engine/run → réponse immédiate "Traitement lancé"
3. runFullProcess() tourne en background (async, non-bloquant)
4. Vérification : le ZIP du jour existe-t-il déjà ?
   → OUI (déjà téléchargé aujourd'hui) → passe à l'extraction
   → NON → API CKAN → URL du ZIP → exec("start URL") → navigateur Windows
5. Utilisateur clique "Télécharger" dans le navigateur
6. Backend surveille ~/Downloads toutes les 2s → détecte le ZIP
7. Copie ZIP vers backend/temp/req_latest.zip
8. extractZIP() → backend/temp/extracted/ (3 CSV)
9. buildEtablissementsMap() → Map NEQ → {ville, cp, adresse, activite}
10. buildNomMap() → Map NEQ → nom officiel
11. Lecture Entreprise.csv en streaming (readline, jamais tout en mémoire)
    → par batch de 50 000 lignes
    → chaque batch envoyé à compareAndDetectBatch() par sous-batch de 500
    → bulkWrite MongoDB (upsert par NEQ)
    → updateMany lastRunId (par sous-batch de 5000)
12. detectFermeturesByRunId() → leads actifs sans lastRunId du run courant
    → updateMany signal=fermeture, statutREQ=Fermé
13. sendRunSummary() → email HTML (si EMAIL_USER configuré)
14. saveVersion() → temp/last_version.txt
15. RunHistory.create() → sauvegarde dans MongoDB
16. wsServer.send({ type: 'done', leadsFound, duration })
17. Frontend reçoit 'done' → fetchStatus() + window.dispatchEvent('engine:done')
18. Sidebar recharge les compteurs
```

---

## 3. Structure complète des fichiers

```
Jimbe/
├── RAPPORT_COMPLET.md          ← Ce document
│
├── backend/
│   ├── server.js               ← Point d'entrée Node.js — configure tout
│   ├── .env                    ← Variables secrètes (JAMAIS dans git)
│   ├── version.json            ← Version app { version, history[] }
│   │
│   ├── db/
│   │   └── connection.js       ← Connexion Mongoose + reconnexion auto
│   │
│   ├── middleware/
│   │   └── auth.js             ← Vérifie Bearer token JWT (toutes routes protégées)
│   │
│   ├── models/
│   │   ├── Lead.js             ← Schéma MongoDB lead (22 champs + 8 index)
│   │   └── RunHistory.js       ← Schéma d'un run (dates, durée, compteurs)
│   │
│   ├── engine/                 ← Toute la logique de détection
│   │   ├── scheduler.js        ← Chef d'orchestre — coordonne tout le run
│   │   ├── downloader.js       ← Téléchargement ZIP depuis données Québec
│   │   ├── extractor.js        ← Extraction ZIP + lecture CSV établissements/noms
│   │   ├── filter.js           ← Streaming Entreprise.csv + enrichissement
│   │   ├── comparator.js       ← Détecte nouvelles/réouvertures/déménagements/fermetures
│   │   ├── scorer.js           ← Calcule score 1-6 (fraîcheur + secteur)
│   │   └── mailer.js           ← Email HTML récapitulatif post-run
│   │
│   ├── data/
│   │   ├── cities.js           ← ~200 villes en 4 groupes avec variantes d'écriture
│   │   └── sectors.js          ← ~70 secteurs ciblés avec mots-clés + exclusions
│   │
│   ├── routes/
│   │   ├── auth.js             ← POST /login, GET /verify
│   │   ├── engine.js           ← GET /status, POST /run, /start, /stop, /reset, /test
│   │   ├── leads.js            ← GET /, /calendar, /nouveautes, /groups + DELETE
│   │   ├── stats.js            ← GET /:year, /storage, /registry, /signals, /scores
│   │   ├── runs.js             ← GET /, /latest, DELETE /:id, /all
│   │   ├── tests.js            ← POST /seed/:signal, GET /active, DELETE /reset
│   │   └── version.js          ← GET /, POST /bump
│   │
│   ├── utils/
│   │   └── diskSpace.js        ← Espace disque C: (wmic Windows / df Linux)
│   │
│   └── temp/                   ← Fichiers temporaires du moteur
│       ├── req_latest.zip      ← ZIP téléchargé (écrasé à chaque run)
│       ├── last_version.txt    ← Date ISO du dernier run réussi
│       └── extracted/          ← CSV extraits (écrasés à chaque run)
│           ├── Entreprise.csv  ← ~2.9M lignes — lu en streaming
│           ├── Etablissement.csv ← Chargé entier en Map RAM
│           └── Nom.csv         ← Chargé entier en Map RAM
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             ← Router principal + gestion auth + intro
        ├── main.jsx            ← Point d'entrée React (ReactDOM.createRoot)
        ├── index.css           ← Variables CSS globales (thèmes dark/light)
        │
        ├── pages/
        │   ├── Login.jsx           ← Connexion (JWT)
        │   ├── Intro.jsx           ← Animation intro (1ère connexion)
        │   ├── Dashboard.jsx       ← Vue d'ensemble avec graphiques
        │   ├── Engine.jsx          ← Contrôle moteur + logs temps réel
        │   ├── Leads.jsx           ← Calendrier mensuel des leads
        │   ├── Nouveautes.jsx      ← Leads du dernier run
        │   ├── Nouvelles.jsx       ← Toutes les nouvelles entreprises
        │   ├── Reouvertures.jsx    ← Toutes les réouvertures
        │   ├── Demenagements.jsx   ← Tous les déménagements
        │   ├── Fermetures.jsx      ← Toutes les fermetures
        │   ├── MapPage.jsx         ← Carte Leaflet interactive
        │   ├── Database.jsx        ← Stats BDD + historique des runs
        │   └── Tests.jsx           ← Outils debug + gestion version
        │
        ├── components/
        │   ├── layout/
        │   │   └── Sidebar.jsx     ← Navigation fixe (radar, thème, nav, version)
        │   └── ui/
        │       ├── index.jsx       ← ConfirmModal, ScoreBadge, SignalBadge, ProgressBar, fmtDate
        │       ├── SignalPage.jsx  ← Composant générique partagé par 4 pages signal
        │       ├── SignalAlerts.jsx ← Toasts + sons WebAudio (en bas à droite)
        │       └── LeadDetailModal.jsx ← Popup complet d'un lead
        │
        ├── store/
        │   ├── engineStore.js  ← État moteur + WebSocket (Zustand)
        │   └── uiStore.js      ← Thème + langue (Zustand)
        │
        ├── i18n/
        │   ├── fr.js           ← Toutes les chaînes françaises (~120 clés)
        │   └── useT.js         ← Hook : t('clé') → texte
        │
        └── utils/
            ├── api.js          ← Instance Axios centralisée avec JWT auto
            └── pdf.js          ← Génération PDF via jsPDF (lead + test)
```

---

## 4. Authentification — JWT + bcrypt

### Concept

Le système utilise **JWT (JSON Web Token)** : un token signé côté serveur, stocké côté client dans `localStorage`. Le serveur ne garde aucune session — il vérifie juste la signature du token à chaque requête.

### Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `backend/routes/auth.js` | Routes login + verify |
| `backend/middleware/auth.js` | Vérification du token sur chaque route protégée |
| `frontend/src/pages/Login.jsx` | Formulaire de connexion |
| `frontend/src/utils/api.js` | Injection automatique du token dans chaque requête Axios |

### Processus de connexion (routes/auth.js)

```
1. POST /api/auth/login { username, password }
2. Vérifie username === process.env.AUTH_USER
3. Vérifie bcrypt.compare(password, process.env.AUTH_PASS_HASH)
4. Si OK → jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' })
5. Retourne { token, username }
6. Frontend → localStorage["jimbe_token"] = token
```

### Protection des routes (middleware/auth.js)

```javascript
// Chaque requête protégée passe par ce middleware
const header = req.headers['authorization']
// Doit être "Bearer <token>"
const token = header.slice(7)
req.user = jwt.verify(token, process.env.JWT_SECRET)
// Si invalide ou expiré → 401 → frontend vide localStorage + recharge
```

### Rate limiting (routes/auth.js)

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 tentatives max
  // Après → "Trop de tentatives — réessayez dans 15 minutes"
})
```

### Côté frontend (utils/api.js)

```javascript
// Avant chaque requête → injecte le token
api.interceptors.request.use(config => {
  config.headers['Authorization'] = `Bearer ${localStorage.getItem('jimbe_token')}`
})
// Si réponse 401 (token expiré/invalide)
api.interceptors.response.use(null, err => {
  if (err.response?.status === 401 && !url.includes('/auth/login')) {
    localStorage.removeItem('jimbe_token')
    window.location.reload() // → retour à Login.jsx
  }
})
```

### Pour changer le mot de passe

1. Générer un nouveau hash bcrypt dans Node.js :
   ```javascript
   const bcrypt = require('bcryptjs')
   console.log(await bcrypt.hash('monNouveauMotDePasse', 12))
   ```
2. Mettre le hash obtenu dans `.env` → `AUTH_PASS_HASH=...`
3. Redémarrer le serveur

---

## 5. Le Moteur REQ — cœur du système

### Fichier central : `backend/engine/scheduler.js`

C'est le chef d'orchestre. Il coordonne toutes les étapes dans `runFullProcess()`.

### État du moteur (engineState)

```javascript
const engineState = {
  isRunning:      false,    // mode surveillance actif
  isProcessing:   false,    // run en cours (VERROU — empêche les runs parallèles)
  lastRun:        null,     // Date du dernier run réussi
  nextRun:        null,     // Date du prochain run planifié (non utilisé)
  lastLeadsFound: 0,        // Nombre de leads détectés au dernier run
  lastDuration:   0,        // Durée en millisecondes
  cronJob:        null,     // Non utilisé (pas de scheduler automatique)
  progress:       0,        // Progression 0-100%
  currentStep:    '',       // Texte de l'étape courante
}
```

### Guard anti-doublons

```javascript
if (engineState.isProcessing) { wsLog('Traitement déjà en cours'); return; }
engineState.isProcessing = true;
// ... tout le traitement ...
engineState.isProcessing = false; // dans finally
```

Ce verrou empêche deux runs simultanés même si deux utilisateurs cliquent en même temps.

### Étape 1 — Vérification de version (downloader.js)

```javascript
const checkForNewVersion = async (wsLog) => {
  const currentVersion = getLastVersion()      // lit temp/last_version.txt
  const today = new Date().toISOString().slice(0, 10)   // "2026-05-08"
  const zipExists = fs.existsSync(ZIP_PATH) && fs.statSync(ZIP_PATH).size > 1024

  if (currentVersion && currentVersion.slice(0, 10) === today && zipExists) {
    // Déjà téléchargé aujourd'hui → skip le téléchargement
    return { hasNew: false, version: currentVersion }
  }
  return { hasNew: true, version: new Date().toISOString() }
}
```

Si `force=true` (clic manuel) → traitement forcé même si déjà fait aujourd'hui.

### Étape 2 — Téléchargement ZIP (downloader.js)

```javascript
const downloadZIP = async (wsLog) => {
  // 1. Appel API CKAN pour obtenir l'URL actuelle du fichier REQ
  const resp = await axios.get(CKAN_API + CKAN_RESOURCE_ID, { timeout: 15000 })
  const url  = resp.data.result.url          // URL directe du ZIP

  // 2. Ouvre le navigateur Windows
  exec(`start "" "${url}"`, ...)             // Ouvre le navigateur (Windows uniquement)

  // 3. Surveille ~/Downloads toutes les 2 secondes
  // Dès qu'un nouveau .zip > 1KB apparaît → copie dans temp/ → supprime l'original

  // 4. Valide magic bytes PK (0x50 0x4B = signature ZIP)
  // Si invalide → supprime + erreur
}
```

**Variables CKAN :**
- ID de la ressource : `eac1b5f1-d8c0-4690-9c51-316d44ed9d94` (modifiable via `CKAN_RESOURCE_ID` dans .env)
- API : `https://www.donneesquebec.ca/recherche/api/3/action/resource_show?id=`
- Timeout attente ZIP : 5 minutes (300 000ms)

### Étape 3 — Extraction ZIP (extractor.js)

```javascript
const extractZIP = (zipPath, wsLog) => {
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(EXTRACT_DIR, true)    // backend/temp/extracted/
  return EXTRACT_DIR
}
```

Fichiers extraits typiquement :
- `Entreprise_*.csv` → 2.9M lignes — statuts, NEQ, adresses
- `Etablissement_*.csv` → activité économique, adresse détaillée
- `Nom_*.csv` → noms officiels des entreprises

Les fichiers sont détectés par mot-clé (`findFile('entreprise')`) — résistant aux changements de nom.

### Étape 4 — Chargement Établissements et Noms (extractor.js)

```javascript
// buildEtablissementsMap : charge TOUT Etablissement.csv en RAM
const map = {}  // { neq: { ville, cp, adresse, activite } }
// Garde seulement le premier établissement par NEQ

// buildNomMap : charge TOUT Nom.csv en RAM
const map = {}  // { neq: nomOfficiel }
// Priorité au nom avec STAT_NOM = 'A' (nom actif)
```

Ces deux maps sont gardés **entièrement en RAM** car ils sont petits. C'est différent de Entreprise.csv qui est énorme et lu en streaming.

### Étape 5 — Lecture CSV en streaming (filter.js)

```javascript
const filterAndEnrich = async (entreprisePath, etablissementsMap, nomMap, wsLog, onBatch, limit) => {
  const BATCH_SIZE = 50000  // 50 000 lignes par batch

  // readline ligne par ligne → rl.pause() quand batch plein → traitement async → rl.resume()
  // Backpressure correcte : jamais 2 batchs traités simultanément

  // Pour chaque ligne :
  const neq        = col(row, 'NEQ', 'neq')
  const statutCod  = col(row, 'COD_STAT_IMMAT', 'ETAT_ADMIN')
  const statutREQ  = mapStatut(statutCod)  // IM→Actif, RO/RF→Radié, FU→Fusionné, autres→Inactif

  // Enrichissement depuis les maps
  const etab       = etablissementsMap[neq] || {}
  const adresse    = etab.adresse || col(row, 'ADR_DOMCL_LIGN1_ADR')
  const ville      = extractCity(etab.ville || col(row, 'ADR_DOMCL_LIGN2_ADR'))
  const nom        = nomMap[neq] || col(row, 'NOM', 'NOM_ASSUJ') || 'Non déclaré'

  // Matching secteur
  const matched    = matchSector(activite)  // voir sectors.js

  // Score
  const { score, scoreDetails } = scoreLead(dateCreation, matched?.score || 0)

  // Groupe géographique
  const cityEntry  = VARIANT_GROUP.get(ville.toLowerCase())
  // postalFilter pour Québec ville (évite faux positifs "province QC")
  const groupe     = cityEntry ? (postalFilter ok?) ? cityEntry.group : '' : ''
}
```

**Mapping des statuts REQ :**

| Code REQ | Signification | statutREQ dans Jinbe |
|----------|--------------|---------------------|
| `IM` | Immatriculé | `Actif` |
| `RO` | Radié d'office | `Radié` |
| `RF` | Radié avec fermeture | `Radié` |
| `FU` | Fusionné | `Fusionné` |
| Autres | Tout le reste | `Inactif` |

**parseLine() — RFC 4180 :**
La fonction gère les guillemets doublés (`""`) à l'intérieur des champs CSV. Exemple :
- `"nom avec ""guillemets"""` → `nom avec "guillemets"`

---

## 6. Extraction et lecture CSV

### Résistance aux changements de fichiers REQ

```javascript
const findFile = (...keywords) => {
  const f = files.find(name => keywords.some(kw => name.toLowerCase().includes(kw)))
  return f ? path.join(extractDir, f) : null
}

const entreprisePath    = findFile('entreprise')   // "Entreprise_2026-05-08.csv"
const etablissementPath = findFile('etablissement')
const nomPath           = findFile('nom')
```

Si le gouvernement renomme les fichiers (ex: "entreprises.csv" → "registre_entites.csv"), seul le mot-clé doit être mis à jour dans `findFile()`.

### Détection du délimiteur CSV

```javascript
const detectDelimiter = (filePath) => {
  // Lit les 4000 premiers octets seulement
  // Compte virgules, points-virgules, tabulations
  // Retourne le plus fréquent
}
```

Si Données Québec change de `,` à `;`, le système s'adapte automatiquement.

### Extraction de la ville

```javascript
const extractCity = (raw) => raw
  .replace(/\s*\([^)]+\)\s*$/, '')  // Retire "(Québec)" à la fin
  .replace(/\s+QC\s*$/i, '')        // Retire " QC" à la fin
  .replace(/\s+ON\s*$/i, '')        // Retire " ON" à la fin
  .trim()
```

Exemples :
- `"Montréal (Québec)"` → `"Montréal"`
- `"LAVAL QC"` → `"LAVAL"`
- `"GATINEAU"` → `"GATINEAU"` (inchangé)

---

## 7. Comparaison et détection des signaux

### comparator.js — `compareAndDetectBatch(batch)`

Compare un batch de 500 entreprises contre MongoDB en **une seule requête** `$in` :

```javascript
const neqs         = batch.map(l => l.neq)    // 500 NEQ
const existingDocs = await Lead.find({ neq: { $in: neqs } }, { neq:1, statutREQ:1, adresse:1 })
const existingMap  = {}  // { neq: doc }

for (const lead of batch) {
  const existing = existingMap[lead.neq]

  if (!existing) {
    // Entreprise inconnue → nouvelle
    lead.signal = 'nouvelle'
    results.nouvelles.push(lead)

  } else if (existing.statutREQ !== 'Actif' && lead.statutREQ === 'Actif') {
    // Était inactive, maintenant active → réouverture
    lead.signal = 'reouverture'
    results.reouvertures.push(lead)

  } else if (existing.adresse && lead.adresse &&
             existing.adresse.trim().toLowerCase() !== lead.adresse.trim().toLowerCase()) {
    // Adresse différente → déménagement
    lead.signal = 'demenagement'
    lead.previousData = { adresse: existing.adresse }  // sauvegarde l'ancienne
    results.demenagements.push(lead)
  }
  // Sinon → ignoré (mais lastRunId mis à jour quand même via updateMany en dehors)
}
```

### comparator.js — `detectFermeturesByRunId(runId)`

```javascript
// Cherche les leads actifs que le run courant N'A PAS vus
const fermetureLeads = await Lead.find({
  statutREQ: 'Actif',
  isBaseline: { $ne: true },
  signal: { $ne: 'fermeture' },    // ← CRITIQUE : évite de re-détecter les fermetures déjà connues
  lastRunId: { $ne: runId },       // ← non vu dans ce run → plus dans le registre
}, { neq: 1 })
```

**Important :** Sans le filtre `signal: { $ne: 'fermeture' }`, chaque run re-détecterait toutes les fermetures précédentes comme nouvelles fermetures. Ce bug était présent et a été corrigé.

### Marquage "vu" pendant le run

```javascript
// Après chaque batch — marque tous les NEQ comme vus par ce runId
// En sous-batches de 5000 pour ne pas surcharger MongoDB
for (let i = 0; i < batch.length; i += 5000) {
  await Lead.updateMany(
    { neq: { $in: batch.slice(i, i+5000).map(l => l.neq) } },
    { $set: { lastRunId: runId } }
  )
}
```

### Premier run — mode baseline

```javascript
const dbCount    = await Lead.countDocuments()
const isFirstRun = dbCount === 0

if (isFirstRun) {
  // Toutes les entreprises → signal 'baseline', isBaseline: true
  // Sert de référence pour les runs suivants
  // Ne compte PAS comme des leads dans l'interface
}
```

---

## 8. Système de score

### Fichier : `backend/engine/scorer.js`

```javascript
const scoreLead = (dateCreation, scoreSecteur) => {
  let fraicheur = 0
  if (dateCreation) {
    const ageJours = Math.floor((Date.now() - new Date(dateCreation)) / 86400000)
    if (ageJours <= 30)       fraicheur = 3  // moins d'un mois
    else if (ageJours <= 90)  fraicheur = 2  // 1-3 mois
    else if (ageJours <= 365) fraicheur = 1  // 3-12 mois
    // plus d'un an → fraicheur = 0
  }
  const total = Math.max(1, Math.min(6, fraicheur + scoreSecteur))
  // Garanti entre 1 et 6 — jamais 0, jamais 7+
  return { score: total, scoreDetails: { fraicheur, secteur: scoreSecteur } }
}
```

### Tableau des scores

| Fraîcheur | Age de l'entreprise |
|-----------|---------------------|
| 3 | ≤ 30 jours |
| 2 | 31 à 90 jours |
| 1 | 91 à 365 jours |
| 0 | Plus d'un an |

| Secteur | Exemples |
|---------|---------|
| 3 | Boucherie, Épicerie, Café, Mécanique, Carrosserie, Moto, Joaillier, Serrurier, Lave-auto, Esthétique auto |
| 2 | Coiffure, Gym, Fleuriste, Tatouage, Spa, Poissonnerie, Transport, Électricien, Dentiste, Portes-fenêtres |
| 1 | Comptabilité, Nettoyage, Courtier, Architecte, Paysagiste, Auto-école |
| 0 | Secteur non reconnu |

**Exemples concrets :**
- Pizzeria créée il y a 10 jours → 3 + 3 = **score 6** (maximum)
- Boucherie créée il y a 6 mois → 0 + 3 = **score 3**
- Coiffure créée il y a 2 mois → 2 + 2 = **score 4**
- Inconnu créé il y a 5 ans → 0 + 0 = **score 1** (minimum garanti)

### Affichage des scores dans l'interface (index.jsx)

| Score | Couleur | Icône |
|-------|---------|-------|
| 6 | Rouge `#ef4444` | 🔥🔥🔥 |
| 5 | Orange `#f97316` | 🔥🔥 |
| 4 | Jaune `#eab308` | 🔥 |
| 3 | Bleu `#3b82f6` | ● |
| 2 | Violet `#6c63ff` | ● |
| 1 | Gris `#8b90a7` | ● |

---

## 9. Secteurs ciblés — sectors.js

### Structure d'un secteur

```javascript
{
  id:       'boucherie',
  name:     'Boucherie',
  category: 'commerce',    // divers | commerce | auto | food | paramedical | construction
  score:    3,             // 1, 2 ou 3
  keywords: ['boucherie', 'boucher', 'viandes', 'charcuterie']
}
```

### Les 6 catégories et leurs secteurs

**DIVERS (30 secteurs)**
Coiffure, Esthétique, Gym, Vape, Café, Garderie, Couture, Tatouage, Auto-école, Agence de voyage, Alimentation spécialisée, Joaillier, Rembourrage, Usinage, Nettoyage, Formation, Courtier assurance/hypothèque, Inspecteur en bâtiment, Courtier immobilier, Vêtements pro, Produits minéraux, Comptabilité, Conciergerie, Extermination, Location, Publicité, Soudeur, Recyclage, Photographie, Transport, Spa, Massothérapie

**COMMERCE (22 secteurs)**
Boucherie, Épicerie/Dépanneur, Animalerie, Fleuriste, Poissonnerie, Friperie, Antiquités, Librairie, Nourriture animaux, Lunetier, Peinture/vitrerie, Commerce en gros, Fruits et légumes, Vêtements, Motos et motoneiges, Informatique, Électroménager, Montres/horlogerie, Distribution d'eau, Ameublement, Produits capillaires, Équipements

**AUTO (8 secteurs)**
Esthétique auto, Lave-auto, Mécanique et pneus, Carrosserie, Vente automobile, Pièces auto, Pare-brise, Remorquage

**FOOD (6 secteurs)**
Pizzeria, Restaurant, Brunch/déjeuners, Boulangerie, Traiteur, Desserts/confiseries

**PARAMEDICAL (5 secteurs)**
Vétérinaire, Massothérapie, Clinique santé, Clinique dentaire, Chiropraticien

**CONSTRUCTION (17 secteurs)**
Architecte, Designer intérieur, Portes et fenêtres, Paysagiste, Entrepreneur général, Sablage, Excavation, Aménagement, Climatisation/chauffage, Électricien, Maçonnerie, Plomberie, Toiture, Piscines, Ébénisterie, Location de grues, Vitrier, Serrurier

### Exclusions — jamais de leads

```javascript
const EXCLUDED_KEYWORDS = [
  // Alcool
  'bar', 'taverne', 'brasserie', 'microbrasserie', 'distillerie', 'vinerie',
  'cave à vin', 'dégustation alcool', 'pub', 'lounge',

  // Franchises nationales
  'tim hortons', 'mcdonald', 'subway', 'burger king', 'starbucks',
  'costco', 'walmart', 'canadian tire', 'dollarama', 'jean coutu',
  'pharmaprix', 'metro', 'iga', 'provigo', 'maxi', 'super c',

  // Religieux
  'église', 'temple', 'mosquée', 'synagogue',

  // OBNL / Gouvernement
  'organisme sans but lucratif', 'osbl', 'obnl',
  'municipalité', 'gouvernement', 'ministère',

  // Éducation
  'école primaire', 'école secondaire', 'université', 'cégep',

  // Santé publique
  'hôpital', 'clsc',
]
```

### Logique de matching

```javascript
const matchSector = (activityText) => {
  if (!activityText) return null
  const lower = activityText.toLowerCase()
  if (isExcluded(lower)) return null    // Exclusion prioritaire
  for (const sector of SECTORS) {
    if (sector.keywords.some(kw => lower.includes(kw))) return sector
  }
  return null   // Aucun secteur reconnu → score secteur = 0
}
```

L'ordre des secteurs dans SECTORS importe : le premier qui matche est retenu.

### Ajouter un secteur

```javascript
{ id: 'mon-secteur', name: 'Mon Secteur', category: 'commerce', score: 2,
  keywords: ['mot-cle1', 'mot-cle2', 'variante'] }
```

Ajouter dans `backend/data/sectors.js`. Disponible immédiatement au prochain run.

---

## 10. Villes surveillées — cities.js

### Structure d'une ville

```javascript
{
  id:           'montreal',
  group:        'montreal',    // Groupe géographique
  name:         'Montréal',    // Nom affiché dans l'interface
  active:       true,          // false = ville ignorée par le moteur
  variants:     ['Montréal', 'MONTRÉAL', 'Montreal', 'MONTREAL'],
  postalFilter: /^G[1-3]/,     // Optionnel — filtre par code postal
}
```

### Les 4 groupes

| Groupe | Exemple de villes clés |
|--------|----------------------|
| `montreal` | Montréal, Laval, Longueuil, Brossard, Terrebonne, Repentigny (~56 villes) |
| `mauricie` | Trois-Rivières, Shawinigan, Drummondville, Victoriaville (~41 villes) |
| `outaouais` | Gatineau, Hull, Aylmer, Ottawa, Kanata (~44 villes) |
| `quebec` | Québec, Lévis, Sainte-Foy, Charlesbourg, Beauport (~44 villes) |

### postalFilter — cas spécial Québec ville

```javascript
{ id: 'quebec-ville', name: 'Québec', group: 'quebec',
  variants: ['Québec', 'QUÉBEC', 'Quebec', 'QUEBEC'],
  postalFilter: /^G[1-3]/  }
```

Sans ce filtre, toutes les entreprises avec `ville = "Québec"` (dont beaucoup hors ville) seraient rattachées au groupe. Le code postal commençant par G1-G3 correspond à la ville de Québec spécifiquement.

### VARIANT_GROUP — Map construite au démarrage

```javascript
// filter.js — construit une seule fois au démarrage du serveur
const VARIANT_GROUP = new Map()
for (const city of CITIES.filter(c => c.active)) {
  for (const v of city.variants) {
    VARIANT_GROUP.set(v.toLowerCase(), { group: city.group, postalFilter: city.postalFilter })
  }
}
// Lookup O(1) : VARIANT_GROUP.get('montréal') → { group: 'montreal', postalFilter: null }
```

### Ajouter une ville

```javascript
// Dans backend/data/cities.js
{ id: 'ma-ville', group: 'montreal', name: 'Ma Ville', active: true,
  variants: ['Ma Ville', 'MA VILLE', 'Maville'] }
```

Redémarrer le serveur (la Map est construite au démarrage).

---

## 11. Modèles MongoDB — Lead + RunHistory

### Modèle Lead (Lead.js)

```javascript
{
  neq:              String    // NEQ — UNIQUE, index, clé primaire REQ (10 chiffres)
  nom:              String    // Nom officiel (source: Nom.csv, STAT_NOM=A prioritaire)
  adresse:          String    // Adresse physique (source: Etablissement.csv LIGN1_ADR)
  ville:            String    // Ville nettoyée (source: Etablissement.csv LIGN2_ADR)
  groupe:           String    // 'montreal' | 'mauricie' | 'outaouais' | 'quebec' | ''
  codePostal:       String    // Code postal (source: Etablissement.csv LIGN4_ADR)
  province:         String    // Toujours 'QC'
  secteurActivite:  String    // Activité brute du REQ (ex: "Commerce de détail")
  secteurMatch:     String    // Secteur Jinbe reconnu (ex: "Épicerie / Dépanneur")
  categorieSecteur: String    // Catégorie ('divers'|'commerce'|'auto'|'food'|etc.)
  dateCreation:     Date      // Date d'immatriculation au REQ (source: DAT_IMMAT)
  dateTrouve:       Date      // ← UTILISÉ PARTOUT : quand le moteur a détecté ce lead
  statutREQ:        String    // 'Actif'|'Inactif'|'Radié'|'Fusionné'|'Fermé'
  signal:           String    // 'nouvelle'|'reouverture'|'demenagement'|'fermeture'|'baseline'
  isTestSeed:       Boolean   // true si créé par la page Tests (leads fictifs)
  score:            Number    // 1-6 (jamais 0, jamais 7+)
  scoreDetails: {
    fraicheur:      Number    // 0-3
    secteur:        Number    // 0-3
  }
  isBaseline:       Boolean   // true = premier run, pas un vrai lead
  lastRunId:        String    // ID du run qui a vu cette entreprise en dernier
  versionREQ:       String    // Timestamp ISO du run (identifie le run d'origine)
  previousData: {
    adresse:        String    // Ancienne adresse (si signal=demenagement)
    statutREQ:      String    // Ancien statut (si signal=reouverture/fermeture)
  }
  createdAt:        Date      // Automatique Mongoose
  updatedAt:        Date      // Automatique Mongoose
}
```

### Index MongoDB (Lead.js)

```javascript
neq          unique index       // lookup O(log n) dans compareAndDetectBatch
ville        index              // filtres par ville
groupe       index              // filtres par groupe
dateCreation index              // filtre par fraîcheur
dateTrouve   index              // calendrier + filtres date
isBaseline   index              // séparer baseline des vrais leads
lastRunId    index              // detectFermeturesByRunId
score        index              // tri par score
isTestSeed   index              // Tests.jsx
{ ville: 1, score: -1 }        // leads triés par score dans une ville
{ dateTrouve: -1 }             // calendrier
{ isBaseline: 1, dateTrouve: -1 } // stats
{ signal: 1, isBaseline: 1 }   // compteurs par signal
{ versionREQ: 1 }              // leads d'un run précis
```

### Différence dateCreation vs dateTrouve

| Champ | Ce que c'est | Utilisé pour |
|-------|-------------|--------------|
| `dateCreation` | Quand l'entreprise s'est immatriculée au REQ (peut être 1995) | Score fraîcheur |
| `dateTrouve` | Quand Jinbe a détecté ce lead (aujourd'hui) | Calendrier, filtres par date, tri |

### Modèle RunHistory (RunHistory.js)

```javascript
{
  startedAt:  Date     // Heure de début du run
  finishedAt: Date     // Heure de fin
  durationMs: Number   // Durée en millisecondes
  version:    String   // Timestamp ISO du ZIP REQ utilisé
  isBaseline: Boolean  // true si c'était le premier run (2.9M entreprises)
  isTest:     Boolean  // true si lancé avec une limite (mode test)
  counts: {
    nouvelle:     Number
    reouverture:  Number
    demenagement: Number
    fermeture:    Number
    total:        Number
  }
}
```

Index : `{ startedAt: -1 }` — récupère les runs récents en premier.

---

## 12. Backend — chaque route API expliquée

### Conventions

- Toutes les routes commencent par `/api/`
- Les routes `/api/health` et `/api/auth/*` sont **publiques** (pas de token)
- Toutes les autres routes nécessitent `Authorization: Bearer <token>`
- Format de réponse : JSON
- En cas d'erreur serveur : `{ error: "message" }` avec status 500

### Routes publiques

#### GET /api/health
Ping simple. Répond `{ status: 'ok', timestamp: '...' }`. Utilisé pour vérifier que le serveur tourne.

#### POST /api/auth/login
```
Body: { username, password }
Réponse: { token, username }
Erreurs: 400 (champs manquants), 401 (mauvais identifiants), 429 (rate limit)
```

#### GET /api/auth/verify
Vérifie si le token est encore valide. Répond `{ ok: true, username }`.

---

### Routes moteur (`/api/engine/*`)

#### GET /api/engine/status
Retourne l'état actuel du moteur en mémoire :
```json
{
  "isRunning": false,
  "isProcessing": false,
  "lastRun": "2026-05-08T14:23:00Z",
  "nextRun": null,
  "lastLeadsFound": 142,
  "lastDuration": 87000,
  "progress": 100,
  "currentStep": "Terminé"
}
```

#### POST /api/engine/run
Lance un run complet manuellement. Réponse **immédiate** (le run tourne en background).
Si déjà en cours → 409 `{ error: 'Déjà en cours' }`.

#### POST /api/engine/start
Active `engineState.isRunning = true` (mode surveillance — cosmétique uniquement, pas de scheduler réel).

#### POST /api/engine/stop
Active `engineState.isRunning = false`.

#### POST /api/engine/reset
Vide toute la collection leads puis recharge tout en baseline (2.9M entreprises).
**Action irréversible.** Durée : 10-15 minutes.

#### POST /api/engine/test
```
Body: { limit: 50 }    // max 500 via Math.min
```
Lance un run mais s'arrête après N lignes du CSV. Utile pour tester la détection sans traiter 2.9M d'entreprises.

---

### Routes leads (`/api/leads/*`)

#### GET /api/leads
Liste paginée des leads avec filtres :

| Paramètre | Type | Ce que ça fait |
|-----------|------|----------------|
| `ville` | string | Regex insensible casse (ex: `?ville=Montreal`) |
| `signal` | string | Ex: `?signal=nouvelle` |
| `score` | number | Score >= N (ex: `?score=5`) |
| `date` | string | Jour exact format YYYY-MM-DD — converti en UTC Toronto |
| `groupe` | string | Ex: `?groupe=montreal` — toutes les villes du groupe |
| `nom` | string | Regex sur le nom de l'entreprise |
| `secteur` | string | Regex sur secteurMatch |
| `page` | number | Pagination (défaut 1) |
| `limit` | number | Résultats par page (défaut 50) |
| `includeBaseline` | any | Si présent → inclut aussi les baseline |

**Conversion heure Toronto pour le filtre `?date=` :**
```javascript
// Détecte si EDT (UTC-4) ou EST (UTC-5) ce jour-là
const noon = new Date(date + 'T12:00:00Z')
const torontoHour = parseInt(Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric' }).format(noon))
const offsetHours = 12 - torontoHour  // 4 (été) ou 5 (hiver)
// Calcule minuit Toronto → timestamp UTC
```

#### GET /api/leads/calendar
```
?month=5&year=2026&signal=...&ville=...&score=...
```
Retourne un agrégat par jour (timezone America/Toronto) :
```json
[{ "_id": { "year": 2026, "month": 5, "day": 8 }, "count": 12, "maxScore": 5, "topSignal": "nouvelle" }]
```

#### GET /api/leads/nouveautes
Retourne tous les leads de la version REQ la plus récente (= le dernier run).
```json
{ "leads": [...], "version": "2026-05-08T14:00:00Z", "total": 142 }
```

#### GET /api/leads/groups
Retourne les groupes disponibles :
```json
[{ "id": "montreal", "cities": ["Montréal", "Laval", ...] }]
```

#### GET /api/leads/export-csv
Télécharge `leads.csv` (tous les leads non-baseline, hors fermetures).
Colonnes : NEQ, Nom, Adresse, Ville, Code Postal, Secteur, Score, Signal, Date Création.

#### GET /api/leads/export-excel
```
?signal=nouvelle   (optionnel — filtre par signal)
```
Télécharge `leads.xlsx` avec colonnes : NEQ, Nom, Adresse, Ville, Code Postal, Secteur, Statut, Score, Signal, Date Création, Date Trouvé.

#### GET /api/leads/stats-registry
```json
{ "total": 2900000, "baseline": 2899858, "leads": 142, "actifs": 2800000 }
```

#### DELETE /api/leads/purge/:type
Supprime tous les leads du type `type` (nouvelle|reouverture|demenagement|fermeture).
**Irréversible.** Le baseline n'est jamais touché.

#### DELETE /api/leads/reset-db
Supprime **TOUS** les documents de la collection leads.
**Irréversible.** Nécessite de relancer le moteur en baseline.

#### DELETE /api/leads/:id
Supprime un seul lead par son ID MongoDB.

---

### Routes statistiques (`/api/stats/*`)

**Important :** La route `/:year` doit rester EN DERNIER dans stats.js sinon elle shadow-match les routes nommées comme `/storage`.

#### GET /api/stats/storage
```json
{
  "dbName": "jimbe_db",
  "totalSize": 524288000,
  "dataSize": 450000000,
  "leadsSize": 400000000,
  "leadsCount": 2900000,
  "disk": { "free": 50000000000, "size": 500000000000, "used": 450000000000 }
}
```

#### GET /api/stats/registry
```json
{ "total": 2900142, "baseline": 2900000, "actifs": 2750000, "inactifs": 150000, "leads": 142 }
```

#### GET /api/stats/signals
```json
{ "nouvelle": 85, "reouverture": 32, "demenagement": 14, "fermeture": 11 }
```
Utilisé par la Sidebar (toutes les 15s) et SignalAlerts pour détecter les nouvelles arrivées.

#### GET /api/stats/scores
```json
{ "1": 20, "2": 30, "3": 45, "4": 25, "5": 15, "6": 7 }
```
Distribution des scores (combien de leads avec score 1, 2, 3, etc.).

#### GET /api/stats/distribution
Distribution mensuelle toutes années confondues (pour le graphique Database.jsx).

#### GET /api/stats/:year
Statistiques complètes pour une année :
```json
{
  "year": 2026,
  "totalLeads": 142,
  "scoreEleve": 22,        // score >= 5
  "scoreMoyen": 3.4,
  "nouvelles": 85,
  "fermetures": 11,
  "demenagements": 14,
  "reouvertures": 32,
  "monthly": [...],        // 12 mois avec breakdown par signal
  "groupes": [...],        // top 20 villes
  "secteurs": [...],       // top 20 secteurs
  "years": [2026, 2025]    // toutes les années avec des données
}
```

---

### Routes historique runs (`/api/runs/*`)

#### GET /api/runs
Liste les 20 derniers runs (triés par date décroissante).

#### GET /api/runs/latest
Les 2 derniers vrais runs (ni baseline, ni test). Utilisé par Dashboard et Nouveautes.

#### DELETE /api/runs/:id
Supprime un run de l'historique. Les leads détectés pendant ce run ne sont PAS supprimés.

#### DELETE /api/runs/all
Supprime tout l'historique des runs.

---

### Routes tests (`/api/tests/*`)

#### POST /api/tests/seed/:signal
Crée un lead fictif avec le signal donné (nouvelle|reouverture|demenagement|fermeture).
Prend un lead baseline existant et le modifie temporairement.

```javascript
const update = { signal, isBaseline: false, isTestSeed: true, dateTrouve: new Date() }
if (signal === 'demenagement') update.previousData = { adresse: '123 Ancienne Adresse, Montréal' }
if (signal === 'fermeture')    update.statutREQ = 'Fermé'
```

#### GET /api/tests/active
Liste tous les leads marqués `isTestSeed: true`.

#### DELETE /api/tests/reset
Remet tous les leads de test en baseline (`isTestSeed: false, signal: 'baseline', isBaseline: true`).

#### DELETE /api/tests/reset/:neq
Remet un seul lead de test en baseline (par NEQ).

#### GET /api/tests/health-full
Diagnostic complet : MongoDB, RAM (heapUsed/heapTotal/rss), disque, ZIP local.

#### GET /api/tests/ram
RAM en temps réel.

#### GET /api/tests/check-download
Vérifie 4 choses :
1. Serveur Données Québec accessible (API CKAN)
2. Version locale (last_version.txt)
3. ZIP local présent
4. Intégrité ZIP (magic bytes PK)

---

### Routes version (`/api/version/*`)

#### GET /api/version
Retourne le contenu de `version.json` : `{ version: "1.2.3", history: [...] }`.

#### POST /api/version/bump
```
Body: { type: "patch"|"minor"|"major" }
  ou: { manual: "2.0.0" }
  optionnel: { note: "Description du changement" }
```

Règles de bump :
- `patch` : 1.2.3 → 1.2.4
- `minor` : 1.2.3 → 1.3.0
- `major` : 1.2.3 → 2.0.0
- `manual` : validé par `/^\d+\.\d+\.\d+$/` avant écriture

---

## 13. Frontend — chaque page expliquée

### Login.jsx — `/` (si non connecté)

**Ce qu'elle fait :**
- Affiche image Jinbe en fond (ken burns : zoom 1→1.08 sur 18s en boucle)
- 18 particules animées en CSS (positions et durées aléatoires)
- Formulaire username + password avec toggle visibilité (œil)
- Bouton connexion désactivé si password vide
- Animation shake + message rouge si erreur

**Ce qu'elle appelle :**
- `POST /api/auth/login { username, password }`
- Si succès → `onLogin()` (dans App.jsx → `setAuthed(true)`)

**Pour modifier :**
- Image fond : URL dans `<img src="...">` (ligne ~30)
- Titre "JINBE" : modifier directement dans le JSX
- Sous-titre "Chevalier de la Mer" : modifier dans le JSX
- Couleurs (cyan `#00cfff`, turquoise `#00ffcc`) : chercher ces hex et remplacer

---

### Intro.jsx — s'affiche une seule fois

**Logique :**
```javascript
// App.jsx
const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('intro_seen'))
// Après l'intro
localStorage.setItem('intro_seen', '1')
setShowIntro(false)
```

**Pour la réafficher :** Supprimer `intro_seen` du localStorage du navigateur (F12 → Application → Local Storage).

---

### App.jsx — Router principal

**Ce qu'il orchestre :**

```
Si !authed → <Login />
Sinon:
  BrowserRouter
    Si showIntro → <Intro onDone={...} />
    <Sidebar />
    <main>
      Routes:
        /             → redirect /dashboard
        /dashboard    → <Dashboard />
        /leads        → <Leads />
        /nouveautes   → <Nouveautes />
        /nouvelles    → <Nouvelles />
        /demenagements→ <Demenagements />
        /fermetures   → <Fermetures />
        /reouvertures → <Reouvertures />
        /engine       → <Engine />
        /database     → <Database />
        /carte        → <MapPage />
        /tests        → <Tests />
        /*            → redirect /dashboard
    </main>
    <SignalAlerts />  ← toasts coin bas-droit
```

**handleLogout :**
```javascript
localStorage.removeItem('jimbe_token')
setAuthed(false)  // → retour à Login.jsx
```

---

### Dashboard.jsx — `/dashboard`

**Appels API au chargement :**
```javascript
GET /api/stats/:year          → stats annuelles (total, mensuel, top villes/secteurs)
GET /api/stats/scores         → distribution 1★ à 6★
GET /api/runs/latest          → dernier run (durée, date)
GET /api/leads?score=5&limit=6 → top 6 leads prioritaires
GET /api/leads/nouveautes     → leads récents du dernier run
GET /api/leads/calendar?month=...&year=... → sparkline 7 jours
```

**Ce qu'elle affiche :**
- Raccourcis rapides : 7 boutons colorés → navigation rapide vers les sections
- Carte "Total leads" : nombre + score moyen + barre de progression
- 4 cartes signal : compteurs nouvelles/réouvertures/déménagements/fermetures + % du total
- Dernier run : durée, date, compteurs détaillés
- Sparkline 7 jours : barres colorées (couleur = signal dominant du jour)
- Distribution des scores : barres horizontales 1★→6★, moyenne marquée d'un ←
- Graphique mensuel : Bar Chart.js, 4 séries (nouvelle/réouv/dém/ferm) par mois
- Donut : répartition par signal (Chart.js)
- Top leads (score >= 5) : grille, clic → `<LeadDetailModal />`
- Feed récent : 9 derniers leads du run
- Top 5 villes / Top 5 secteurs : barres de progression

**Sélecteur d'année :** Charge les années disponibles depuis `years` dans la réponse `/stats/:year`. Rechargement complet des stats au changement d'année.

---

### Engine.jsx — `/engine`

**Appels API :**
```javascript
GET /api/engine/status         → status au chargement + refresh
POST /api/engine/run           → lancement avec confirmation modale
WebSocket ws://localhost:3001  → logs temps réel (via engineStore)
```

**Ce qu'elle affiche :**
- Radar SVG animé (3 cercles concentriques + sweep rotatif si actif)
- Statut textuel + badge coloré
- Derniers run/durée/leads trouvés
- Bouton "⚡ Lancer maintenant" → ConfirmModal avant envoi
- Barre de progression (visible pendant `isProcessing`)
- Console de logs (200 dernières lignes, auto-scroll, bouton effacer)
- Section "Comment ça marche" : 5 étapes (texte dans fr.js)
- Section "Garanties" : 5 points (texte dans fr.js)

**Couleurs du radar :**
- `#00ff88` (vert vif) = `isProcessing` (run en cours)
- `#00cc66` (vert) = `isRunning` (mode surveillance)
- `#ef4444` (rouge) = arrêté

---

### Leads.jsx — `/leads` (Calendrier mensuel)

**Appels API :**
```javascript
// Au chargement et changement de mois/filtres
GET /api/leads/calendar?month=X&year=Y&signal=...&ville=...&score=...

// Au clic sur un jour
GET /api/leads?date=YYYY-MM-DD&signal=...&ville=...&score=...&limit=100
```

**Fonctionnement :**
1. Grille calendrier avec chaque jour coloré selon le signal dominant
2. Intensité de la couleur proportionnelle à `count/max(count_du_mois)`
3. Clic sur un jour → panneau de droite avec les leads de ce jour
4. Clic sur un lead → `<LeadDetailModal />`
5. Bouton "← / →" pour naviguer entre les mois

**Filtres :** Signal, Ville (input), Score minimum — chaque changement recharge le calendrier.

**Couleurs jours :**
- Vert `#4ade80` = Nouvelle
- Cyan `#2dd4bf` = Réouverture
- Orange `#fb923c` = Déménagement
- Rouge `#f87171` = Fermeture
- Violet `#a78bfa` = jour sélectionné

---

### Nouveautes.jsx — `/nouveautes`

**Appels API :**
```javascript
GET /api/leads/nouveautes      → leads du dernier run (triés par score)
GET /api/runs/latest           → infos du run (durée, version)
```

**Ce qu'elle affiche :**
- Header : durée du dernier run + version (timestamp)
- 4 sections : Nouvelles / Déménagements / Réouvertures / Fermetures
- Cards avec badges score/signal, liens, PDF

**Particularité :** Toujours les leads du DERNIER run uniquement.

---

### Nouvelles.jsx / Reouvertures.jsx / Demenagements.jsx / Fermetures.jsx

Ces 4 pages sont des wrappers identiques :

```javascript
// Nouvelles.jsx
import SignalPage from '../components/ui/SignalPage'
export default function Nouvelles() {
  return <SignalPage signal="nouvelle" />
}
```

Elles délèguent tout à `SignalPage.jsx`.

---

### SignalPage.jsx — composant générique

**Appels API :**
```javascript
GET /api/leads?signal=X&ville=...&score=...&page=N&limit=50
```

**Fonctionnement :**
1. Charge 50 leads au démarrage
2. "Charger plus" → page suivante, append
3. Barre de progression "X sur Y chargés (Z%)"
4. Filtres ville + score minimum
5. Card de chaque lead avec tous les liens + PDF

**Spécialité déménagements :** Affiche l'ancienne adresse en rouge barré + nouvelle adresse en orange.

---

### MapPage.jsx — `/carte`

**Appels API :**
```javascript
GET /api/leads/groups          → liste des groupes disponibles
GET /api/leads?groupe=X&limit=200&signal!=fermeture  → leads du groupe
```

**Fonctionnement :**
1. Carte Leaflet (OpenStreetMap) centrée sur Montréal
2. Sélecteur de groupe (Tous / Montréal / Mauricie / Outaouais / Québec)
3. Marqueurs colorés par signal (cercles de 10px)
4. Popup au survol : nom, ville, secteur, signal, score + liens
5. Clic sur ville dans le panneau → zoom + filtre sur cette ville

**Géocodage local (aucun appel externe) :**
Table `CITY_COORDS` dans le fichier avec ~100 villes précâblées :
```javascript
const CITY_COORDS = {
  'montréal': [45.5017, -73.5673],
  'laval':    [45.6066, -73.7124],
  // ...
}
```

Les leads dont la ville n'est pas dans cette table ne s'affichent pas sur la carte.

**Normalisation diacritiques (MapPage.jsx) :**
```javascript
// Supprime les accents pour comparer les noms de villes
const normalize = v => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
```

**Pour ajouter une ville sur la carte :**
```javascript
// Dans frontend/src/pages/MapPage.jsx
const CITY_COORDS = {
  // ...
  'ma-ville': [45.1234, -73.5678],   // lat, lon
}
```

---

### Database.jsx — `/database`

**Appels API :**
```javascript
GET /api/stats/registry        → total/baseline/actifs/leads
GET /api/stats/storage         → taille MongoDB + espace disque
GET /api/runs                  → historique des runs
GET /api/stats/:year           → stats pour sélecteur d'année
```

**Rafraîchissement :** Stockage toutes les 30 secondes.

**Ce qu'elle affiche :**
- Stats Registre : total docs, baseline, leads détectés, actifs, inactifs
- Stats stockage : taille DB, taille collection leads, espace disque libre/total/%
- Jauges par signal avec compteurs + bouton purge par signal
- Graphique mensuel Bar Chart.js avec sélecteur d'année
- Tableau historique des runs : date, durée, type, compteurs par signal
- Boutons export CSV + Excel

**Actions disponibles :**
- Purge signal → `DELETE /api/leads/purge/:type` avec ConfirmModal
- Supprimer un run → `DELETE /api/runs/:id`
- Supprimer tout l'historique → `DELETE /api/runs/all`

---

### Tests.jsx — `/tests`

**Ce qu'elle contient :**

**Section Seeds :**
4 cartes (Nouvelle, Réouv, Dém, Ferm) avec compteur actuel + bouton créer :
```javascript
POST /api/tests/seed/nouvelle    // crée 1 lead de test
GET /api/tests/active            // compteurs actuels
DELETE /api/tests/reset          // remet tout en baseline
```

**Section Test moteur :**
- Curseur 10-2000 + presets 10/20/50/100
- Lance `POST /api/engine/test { limit: N }`

**Section Diagnostic :**
- `GET /api/tests/health-full` → MongoDB ok, RAM, disque, ZIP
- `GET /api/tests/check-download` → 4 étapes de vérification
- `GET /api/tests/ram` → RAM temps réel

**Section Version :**
- Sélecteur Patch/Minor/Major + input Manuel
- Preview de la prochaine version
- Champ note (optionnel)
- `POST /api/version/bump { type, note }` ou `{ manual, note }`
- Historique des versions affiché

**Section PDF test :**
- `generateTestPDF()` → PDF gabarit avec tous les champs expliqués

---

### Sidebar.jsx — navigation fixe

**Structure de haut en bas :**
1. Image Jinbe (120px) + dégradé + texte "🌊 Jinbe — Chevalier de la Mer"
2. Radar SVG animé + statut moteur + leads dernier run
3. Bouton thème Dark/Light (toggle animé)
4. Navigation : 11 liens avec icône + label + badge compteur
5. Footer : bouton "⏻ Déco" + version `vX.Y.Z`

**Badges compteurs :**
- Affichent le nombre de leads par signal
- Source : `GET /api/stats/signals`
- Rafraîchis toutes les 15 secondes + immédiatement après `engine:done`
- Coupés à 999+ si > 999

**Navigation (NAV_FR) :**

| Route | Icône | Couleur |
|-------|-------|---------|
| `/engine` | ⚙ | Cyan `#00d4ff` |
| `/dashboard` | ▦ | Violet `#a78bfa` |
| `/leads` | ◈ | Bleu `#38bdf8` |
| `/nouveautes` | ⚡ | Jaune `#fbbf24` |
| `/nouvelles` | ✦ | Vert `#4ade80` |
| `/reouvertures` | ↺ | Cyan `#2dd4bf` |
| `/demenagements` | → | Orange `#fb923c` |
| `/fermetures` | ✕ | Rouge `#f87171` |
| `/carte` | ◉ | Vert `#34d399` |
| `/tests` | ⚗ | Violet `#c084fc` |
| `/database` | ◫ | Gris `#94a3b8` |

**Lien actif :** fond semi-transparent + bordure droite colorée.

---

## 14. Composants UI réutilisables

### `ConfirmModal` (index.jsx)

Modale de confirmation avant action destructive.
```jsx
<ConfirmModal
  title="Titre"
  message="Description"
  confirmLabel="Confirmer"
  cancelLabel="Annuler"
  color="#ef4444"
  onConfirm={() => ...}
  onCancel={() => ...}
/>
```
Fermeture avec `Escape`. Animation `cfmFadeUp` (0.25s).

### `ScoreBadge` (index.jsx)

```jsx
<ScoreBadge score={5} />   // → "5/6" avec fond orange
```

### `SignalBadge` (index.jsx)

```jsx
<SignalBadge signal="nouvelle" />   // → "● Nouvelle" en vert
```

### `ProgressBar` (index.jsx)

```jsx
<ProgressBar percent={75} step="Traitement..." />
```

### `fmtDate(date)` et `fmtRelative(date)` (index.jsx)

```javascript
fmtDate(new Date())           // → "2026-05-08" (fr-CA)
fmtRelative(new Date())       // → "Aujourd'hui"
fmtRelative(yesterdayDate)    // → "Hier"
fmtRelative(olderDate)        // → "Il y a 5 jours"
```

### `LeadDetailModal` (LeadDetailModal.jsx)

Popup complet sur un lead. Fermeture avec `Escape` ou clic backdrop.

Sections affichées :
1. **CompareBlock** : bloc contextuel selon le signal
   - `nouvelle` : date création + fraîcheur/secteur
   - `demenagement` : ancienne adresse ~~barré~~ → nouvelle adresse
   - `reouverture` : ancien statut → Actif
   - `fermeture` : Actif → Fermé
2. **Coordonnées** : adresse, ville, code postal, province, NEQ
3. **Informations REQ** : statut, secteur brut, secteur match, région
4. **Score détaillé** : total/6, fraîcheur/3, secteur/3
5. **Dates** : création REQ, détection, version REQ, créé en BD
6. **Liens** : Maps, Google, FB, Instagram, Web + bouton PDF

### `SignalAlerts` (SignalAlerts.jsx)

Toasts automatiques dans le coin bas-droit.

**Fonctionnement :**
- Poll `GET /api/stats/signals` toutes les 15 secondes
- Compare avec les valeurs précédentes
- Si un compteur augmente → crée un toast avec `+diff / total`
- Auto-dismiss après 6 secondes (barre de progression visible)
- Clic sur le toast → navigation vers la page du signal

**Sons (WebAudio API) :**
| Signal | Son | Description |
|--------|-----|-------------|
| `nouvelle` | `discover` | Arpège majeur ascendant C5-E5-G5-C6 |
| `reouverture` | `bell` | Cloche avec harmoniques (A5) |
| `demenagement` | `swoosh` | Glissement de fréquence (sawtooth) |
| `fermeture` | `drop` | Descente mineure A3-G3-F3 (triangle) |

Erreurs AudioContext → silencieuses (catch vide).

---

## 15. WebSocket — logs en temps réel

### Côté serveur (server.js + scheduler.js)

```javascript
// server.js — même port que l'API HTTP
const wss = new WebSocket.Server({ server })
app.set('wsServer', wss)  // disponible partout via req.app.get('wsServer')

// scheduler.js
const wsLog = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1)  // OPEN seulement
      client.send(JSON.stringify({ type: 'log', message }))
  })
}
```

### Messages envoyés par le backend

```javascript
{ type: 'connected', message: 'Connecté au moteur' }   // connexion initiale
{ type: 'log',       message: 'Texte du log' }          // pendant le run
{ type: 'progress',  step: 'Extraction...', percent: 55 } // barre de progression
{ type: 'done',      leadsFound: 42, duration: 65000 }  // fin du run
```

### Progression et étapes

| % | Étape |
|---|-------|
| 5% | Vérification version |
| 10% | Téléchargement ZIP |
| 55% | Extraction CSV |
| 65% | Lecture données |
| 75% | Traitement / Chargement baseline |
| 75-92% | Progression par tranche de 200K entreprises |
| 92% | Détection fermetures |
| 100% | Terminé |

### Côté frontend (engineStore.js)

```javascript
connectWS: () => {
  const ws = new WebSocket(`ws://${window.location.hostname}:3001`)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'log')      addLog(data.message)
    if (data.type === 'progress') update status.progress + currentStep
    if (data.type === 'done') {
      fetchStatus()
      window.dispatchEvent(new Event('engine:done'))  // → Sidebar recharge
    }
  }

  ws.onclose = () => {
    // Reconnexion automatique avec backoff exponentiel
    const delay = Math.min(3000 * Math.pow(1.3, retries-1), 30000)
    // Délais : 3s → 3.9s → 5.1s → 6.6s → ... → 30s max
    setTimeout(() => connectWS(), delay)
  }
}
```

**Garde les 200 derniers logs :**
```javascript
logs: [...state.logs.slice(-200), { id: Date.now(), message, time }]
```

---

## 16. Stores Zustand — état global

### engineStore.js

Accessible dans n'importe quel composant via `useEngineStore()`.

**State :**
```javascript
status: {
  isRunning,       // moteur en mode surveillance (cosmétique)
  isProcessing,    // run en cours
  lastRun,         // Date du dernier run
  nextRun,         // null (pas de scheduler automatique)
  lastLeadsFound,  // Nombre de leads détectés
  lastDuration,    // Durée en ms
  progress,        // 0-100
  currentStep,     // Texte de l'étape
}
logs: []           // { id, message, time }[]
ws: WebSocket|null // Instance WebSocket
_wsRetries: 0      // Compteur de reconnexions
```

**Actions :**
```javascript
fetchStatus()         → GET /engine/status
start()               → POST /engine/start
stop()                → POST /engine/stop
runNow()              → POST /engine/run
resetDB()             → POST /engine/reset
runTestMode(limit)    → POST /engine/test { limit }
addLog(message)       → ajoute au tableau logs (max 200)
clearLogs()           → vide logs
connectWS()           → ouvre WebSocket + reconnexion auto
```

### uiStore.js

Accessible via `useUiStore()`.

```javascript
lang:          'fr'            // Langue — toujours 'fr' pour l'instant
theme:         'dark'|'light'  // Sauvegardé dans localStorage['theme']
toggleTheme()                  // Bascule + applique sur document.body.classList
```

---

## 17. Internationalisation i18n

Toutes les chaînes de texte affichées dans l'interface sont centralisées dans `frontend/src/i18n/fr.js`.

### Hook useT()

```javascript
// useT.js
export function useT() {
  return (key, fallback) => fr[key] ?? fallback ?? key
  // Si clé introuvable → fallback si fourni, sinon la clé elle-même
}

// Utilisation dans un composant
const t = useT()
t('nav.engine')           // → "Moteur"
t('engine.launch')        // → "⚡ Lancer maintenant"
t('clé.inexistante')      // → "clé.inexistante" (retourne la clé)
t('clé.inexistante', 'defaut') // → "defaut"
```

### Organisation des clés dans fr.js

| Préfixe | Où utilisé |
|---------|-----------|
| `nav.*` | Sidebar (labels navigation) |
| `status.*` | Sidebar (statut moteur) |
| `engine.*` | Engine.jsx |
| `dashboard.*` | Dashboard.jsx |
| `nouvelle.*`, `reouverture.*`, etc. | Pages signal |
| `signal.*` | SignalPage.jsx composant |
| `filter.*` | Filtres dans les pages |
| `leads.*` | Leads.jsx calendrier |
| `lastrun.*` | Nouveautes.jsx |
| `map.*` | MapPage.jsx |
| `db.*` | Database.jsx |
| `tests.*` | Tests.jsx |
| `common.*` | Commun |
| `modal.*` | LeadDetailModal.jsx |
| `signal.badge.*` | SignalBadge composant |
| `days.*`, `months.*` | Calendrier |

### Modifier un texte affiché

1. Ouvrir `frontend/src/i18n/fr.js`
2. Trouver la clé et modifier la valeur
3. Sauvegarde → Vite hot-reload → visible immédiatement

### Ajouter une nouvelle clé

```javascript
// Dans fr.js
'ma.nouvelle.cle': 'Mon texte affiché',

// Dans le composant
const t = useT()
{t('ma.nouvelle.cle')}
```

---

## 18. Export PDF — pdf.js

### `generateLeadPDF(lead)` — PDF d'un vrai lead

Déclenché par le bouton `↓ PDF` partout dans l'interface.

**Sections du PDF (format A4) :**
1. **Header fond sombre** : "Jinbe" en violet + signal en majuscules
2. **Nom** (grand) + Score/6 + Statut REQ
3. **COORDONNÉES** : Adresse, Ville, Code postal, Province (+ Ancienne adresse si déménagement)
4. **INFORMATIONS REQ** : NEQ, Secteur brut, Secteur Jinbe, Catégorie, Groupe géo, Date création, Date détection, Version REQ, Score fraîcheur/secteur
5. **DONNÉES SYSTÈME** : ID MongoDB, isBaseline, créé/mis à jour
6. **RECHERCHE EN LIGNE** : liens cliquables Maps, Google, FB, Instagram, Site web, Registre REQ, Canada411
7. **Pied de page** : date/heure de génération

Sauvegardé comme `lead_<NEQ>.pdf`.

### `generateTestPDF()` — Gabarit avec explication de tous les champs

PDF avec 3 colonnes : **Champ / Exemple / Description**. Documente chaque champ du modèle Lead pour référence.

Sauvegardé comme `seculeads_gabarit_pdf.pdf`.

### `clean(str)` — nettoyage des caractères

```javascript
const clean = (str) => str.replace(/[^\x20-\xFF]/g, '?')
// Remplace les caractères hors Latin-1 par "?"
// jsPDF helvetica ne supporte que Latin-1 (0x20-0xFF)
```

---

## 19. Thème dark/light

### Variables CSS dans index.css

```css
:root {
  --bg:       #0f1117;    /* Fond principal */
  --bg2:      #1a1d27;    /* Fond secondaire */
  --bg3:      #232636;    /* Fond tertiaire */
  --text:     #e8eaf0;    /* Texte principal */
  --text2:    #a0a8c0;    /* Texte secondaire */
  --text3:    #6b7080;    /* Texte tertiaire */
  --border:   #2e3347;    /* Bordures */
  --accent:   #6c63ff;    /* Accent principal violet */
  --accent2:  #00cfff;    /* Accent secondaire cyan */
  --sidebar:  240px;      /* Largeur sidebar */
}

body.light {
  --bg:       #f8fafc;
  --bg2:      #ffffff;
  --bg3:      #f1f5f9;
  --text:     #1e293b;
  --text2:    #475569;
  --text3:    #94a3b8;
  --border:   #e2e8f0;
}
```

### Changement de thème (uiStore.js)

```javascript
toggleTheme: () => {
  const next = get().theme === 'dark' ? 'light' : 'dark'
  document.body.classList.toggle('light', next === 'light')
  localStorage.setItem('theme', next)
  set({ theme: next })
}
```

Le thème est appliqué via la classe `light` sur `<body>`. Si absente → dark. Si présente → light.

---

## 20. Où modifier quoi — guide rapide

### Données du moteur

| Je veux... | Fichier | Ce qu'il faut modifier |
|-----------|---------|----------------------|
| Ajouter un secteur ciblé | `backend/data/sectors.js` | Ajouter `{ id, name, category, score, keywords }` |
| Changer le score d'un secteur | `backend/data/sectors.js` | Modifier `score: 2` en `score: 3` |
| Exclure un type d'entreprise | `backend/data/sectors.js` | Ajouter un mot dans `EXCLUDED_KEYWORDS` |
| Ajouter une ville surveillée | `backend/data/cities.js` | Ajouter `{ id, group, name, active, variants }` |
| Désactiver une ville | `backend/data/cities.js` | Mettre `active: false` |
| Ajouter une variante d'écriture | `backend/data/cities.js` | Ajouter dans le tableau `variants` |
| Changer la taille des batchs CSV | `backend/engine/filter.js` | `const BATCH_SIZE = 50000` |
| Changer la taille des batchs MongoDB | `backend/engine/scheduler.js` | `const COMPARE_CHUNK = 500` |
| Changer le timeout de téléchargement | `backend/engine/downloader.js` | `timeoutMs = 300000` (5 min) |
| Changer la règle de fraîcheur | `backend/engine/scorer.js` | Modifier les seuils (30/90/365 jours) |

### Interface

| Je veux... | Fichier | Ce qu'il faut modifier |
|-----------|---------|----------------------|
| Changer un texte affiché | `frontend/src/i18n/fr.js` | Modifier la valeur de la clé |
| Ajouter une ville sur la carte | `frontend/src/pages/MapPage.jsx` | Ajouter dans `CITY_COORDS` |
| Changer le nombre de top leads | `frontend/src/pages/Dashboard.jsx` | `limit: 6` dans l'appel API |
| Changer le seuil haute priorité | `frontend/src/pages/Dashboard.jsx` | `score: 5` dans l'appel API |
| Changer l'image de fond Login | `frontend/src/pages/Login.jsx` | URL dans `<img src="...">` |
| Changer l'image Sidebar | `frontend/src/components/layout/Sidebar.jsx` | URL dans `<img src="...">` |
| Modifier les couleurs signal | `frontend/src/components/ui/index.jsx` | `SIG_COLOR` |

### Authentification et sécurité

| Je veux... | Fichier | Ce qu'il faut modifier |
|-----------|---------|----------------------|
| Changer le mot de passe | `.env` | Nouveau hash bcrypt dans `AUTH_PASS_HASH` |
| Changer le nom d'utilisateur | `.env` | `AUTH_USER=nouveaunom` |
| Changer la durée du token | `backend/routes/auth.js` | `expiresIn: '7d'` → `'30d'` |
| Changer la limite rate-limiting | `backend/routes/auth.js` | `max: 10` → autre valeur |

### Infrastructure

| Je veux... | Fichier | Ce qu'il faut modifier |
|-----------|---------|----------------------|
| Changer le port serveur | `.env` | `PORT=3001` |
| Changer la BDD MongoDB | `.env` | `MONGODB_URL=mongodb://...` |
| Activer les emails | `.env` | Ajouter `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_TO` |
| Désactiver les emails | `.env` | Retirer `EMAIL_USER` et `EMAIL_PASS` |
| Changer le CKAN REQ | `.env` | `CKAN_RESOURCE_ID=nouveau-id` |
| Modifier le rafraîchissement Sidebar | `frontend/src/components/layout/Sidebar.jsx` | `setInterval(..., 15000)` |
| Modifier le max logs en mémoire | `frontend/src/store/engineStore.js` | `slice(-200)` |

### Ajouter une nouvelle page

```
1. Créer frontend/src/pages/MaPage.jsx
2. Importer dans frontend/src/App.jsx
3. Ajouter <Route path="/ma-page" element={<MaPage />} />
4. Ajouter dans NAV_FR de Sidebar.jsx :
   { to: '/ma-page', icon: '⊕', color: '#...',  bg: '#...18', label: 'Ma Page', signal: null }
5. Ajouter les textes dans frontend/src/i18n/fr.js
```

### Ajouter une nouvelle route API

```
1. Créer ou modifier un fichier dans backend/routes/
2. L'enregistrer dans backend/server.js :
   app.use('/api/ma-route', require('./routes/maRoute'))
   (Après la ligne authMiddleware pour la protéger)
```

---

## 21. Variables d'environnement — .env

Le fichier `.env` est dans `backend/.env`. **Ne jamais le committer dans git.**

```env
# ── Base de données ──────────────────────────────────────
MONGODB_URL=mongodb://localhost:27017/jimbe_db

# ── Authentification ─────────────────────────────────────
AUTH_USER=nomutilisateur
AUTH_PASS_HASH=$2a$12$...    # Hash bcrypt du mot de passe (généré avec bcrypt.hash())
JWT_SECRET=cle_secrete_tres_longue_et_aleatoire

# ── Email de résumé après run (optionnel) ────────────────
EMAIL_USER=ton@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # "App Password" Google (pas ton vrai mdp Gmail)
EMAIL_TO=destinataire@email.com  # Optionnel — si absent, même adresse que EMAIL_USER

# ── REQ Québec (optionnel — valeur par défaut incluse) ───
CKAN_RESOURCE_ID=eac1b5f1-d8c0-4690-9c51-316d44ed9d94

# ── Serveur ───────────────────────────────────────────────
PORT=3001
NODE_ENV=development
```

### Comment générer un hash bcrypt

Dans un terminal Node.js :
```javascript
const bcrypt = require('bcryptjs')
console.log(await bcrypt.hash('MonMotDePasse123', 12))
// $2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Comment générer un JWT_SECRET fort

```javascript
require('crypto').randomBytes(64).toString('hex')
// donne une chaîne de 128 caractères aléatoires
```

---

## 22. Bugs corrigés — historique

### Bug 1 — Fausses fermetures répétées (CRITIQUE)
**Fichier :** `backend/engine/comparator.js` ligne 35

**Problème :**
La détection des fermetures cherchait les leads avec `lastRunId != runId`. Mais les leads déjà marqués comme fermetures avaient un `lastRunId` d'un run précédent — ils n'étaient donc jamais vus lors du run courant. Résultat : à chaque run, TOUTES les fermetures précédentes étaient re-détectées comme nouvelles fermetures.

**Effet :** Après 10 runs, un lead fermé lors du run 1 aurait été compté 10 fois.

**Correction :**
```javascript
// AVANT
{ statutREQ: 'Actif', isBaseline: { $ne: true }, lastRunId: { $ne: runId } }

// APRÈS
{ statutREQ: 'Actif', isBaseline: { $ne: true }, signal: { $ne: 'fermeture' }, lastRunId: { $ne: runId } }
```

---

### Bug 2 — ReDoS sur le filtre ville dans leads (SÉCURITÉ)
**Fichier :** `backend/routes/leads.js` ligne 46

**Problème :**
Le paramètre `ville` de la requête était utilisé directement dans `new RegExp(ville, 'i')` sans échappement. Un utilisateur malveillant pouvait envoyer `?ville=(a+)+b` pour provoquer un Catastrophic Backtracking dans l'évaluation de la regex par MongoDB.

**Correction :**
```javascript
// AVANT
} else if (ville) { query.ville = new RegExp(ville, 'i') }

// APRÈS
} else if (ville) { query.ville = new RegExp(ville.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
```

---

### Bug 3 — Même ReDoS dans le calendrier
**Fichier :** `backend/routes/leads.js` ligne 64

**Même correction appliquée pour le filtre `ville` dans la route `/calendar`.**

---

*Document généré le 2026-05-08 — analyse ligne par ligne complète — Projet Jinbe*
