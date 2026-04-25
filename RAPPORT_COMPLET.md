# RAPPORT COMPLET — PROJET JINBE
## Analyse technique et fonctionnelle — Backend + Frontend + Engine + ZIP

---

## TABLE DES MATIÈRES

1. Vue d'ensemble du projet
2. Architecture globale
3. Structure des dossiers
4. BACKEND — Fichiers et rôles
   - 4.1 server.js
   - 4.2 .env
   - 4.3 package.json
   - 4.4 models/Lead.js
   - 4.5 models/RunHistory.js
   - 4.6 models/CRM.js
5. ENGINE — Processus complet étape par étape
   - 5.1 downloader.js
   - 5.2 extractor.js + Structure du ZIP
   - 5.3 filter.js
   - 5.4 comparator.js
   - 5.5 scheduler.js
6. ROUTES API — Chaque endpoint
   - 6.1 routes/engine.js
   - 6.2 routes/leads.js
   - 6.3 routes/stats.js
   - 6.4 routes/runs.js
   - 6.5 routes/tests.js
   - 6.6 routes/version.js
   - 6.7 routes/crm.js
7. FRONTEND — Structure et stack
8. STORES Zustand
   - 8.1 engineStore.js
   - 8.2 uiStore.js
9. PAGES — Chaque page en détail (boutons, comportement, API)
   - 9.1 Dashboard (/dashboard)
   - 9.2 Engine (/engine)
   - 9.3 Leads (/leads)
   - 9.4 Nouveautes (/nouveautes)
   - 9.5 Nouvelles (/nouvelles)
   - 9.6 Demenagements (/demenagements)
   - 9.7 Fermetures (/fermetures)
   - 9.8 Reouvertures (/reouvertures)
   - 9.9 Carte (/carte)
   - 9.10 Database (/database)
   - 9.11 Tests (/tests)
10. COMPOSANTS UI
    - 10.1 Sidebar
    - 10.2 SignalAlerts
    - 10.3 Composants UI partagés (index.jsx)
11. UTILITAIRES
    - 11.1 pdf.js
    - 11.2 i18n / useT
12. COMMUNICATION TEMPS RÉEL — WebSocket
13. THÈMES ET CSS
14. DONNÉES GÉOGRAPHIQUES
15. SCORE — Comment il est calculé
16. GUIDE POUR MODIFICATIONS FUTURES
17. RISQUES ET LIMITES
18. RÉSUMÉ TECHNIQUE COMPLET

---

# 1. VUE D'ENSEMBLE DU PROJET

**Jinbe** est un outil B2B de détection automatique de leads d'affaires au Québec.

**Principe général :**
Le gouvernement du Québec publie chaque semaine une mise à jour du **REQ (Registre des Entreprises du Québec)** — une base de données de ~2,9 millions d'entreprises, disponible sous forme de fichier ZIP sur données.québec.ca.

Jinbe télécharge ce ZIP, compare son contenu avec sa propre base MongoDB, et détecte automatiquement 4 types de changements :

| Signal | Icône | Couleur | Définition |
|--------|-------|---------|------------|
| `nouvelle` | ✦ | Vert #4ade80 | Entreprise jamais vue dans la base |
| `reouverture` | ↺ | Cyan #2dd4bf | Entreprise qui était fermée et redevient active |
| `demenagement` | → | Orange #fb923c | Même NEQ mais adresse différente |
| `fermeture` | ✕ | Rouge #f87171 | Entreprise active dans la base mais absente du nouveau ZIP |

**Cas d'usage :**
Un commercial B2B utilise Jinbe pour identifier chaque semaine les nouvelles entreprises, les réouvertures et déménagements dans sa région — des moments clés où une entreprise a besoin de services.

---

# 2. ARCHITECTURE GLOBALE

```
JINBE
│
├── Backend Node.js         Port 3001 (HTTP REST API + WebSocket sur le même port)
├── Frontend React          Port 5173 (dev) / build statique (prod)
└── MongoDB local           Port 27017  base: securite-leads
```

**Communication entre les couches :**

```
Navigateur ←→ Frontend React (port 5173)
                    ↓ axios HTTP
               Backend Express (port 3001)
                    ↓ mongoose
               MongoDB local (port 27017)

Navigateur ←→ WebSocket (ws://localhost:3001)  ← MÊME port que l'API REST
               ↑ logs temps réel du moteur
```

---

# 3. STRUCTURE DES DOSSIERS

```
Jimbe/
├── backend/
│   ├── engine/
│   │   ├── scheduler.js      Orchestrateur principal du moteur
│   │   ├── downloader.js     Vérification version + téléchargement ZIP
│   │   ├── extractor.js      Extraction ZIP + lecture Etablissements + Nom CSV
│   │   ├── filter.js         Lecture streaming Entreprise.csv par batch
│   │   ├── comparator.js     Comparaison avec MongoDB via $in + détection fermetures via runId
│   │   └── scorer.js         Calcul du score 1-6
│   ├── models/
│   │   ├── Lead.js           Schéma MongoDB d'une entreprise (avec lastRunId)
│   │   ├── RunHistory.js     Schéma MongoDB d'un historique de run
│   │   └── CRM.js            Schéma MongoDB d'une entrée CRM
│   ├── routes/
│   │   ├── engine.js         POST /api/engine/run ...
│   │   ├── leads.js          GET/DELETE /api/leads ...
│   │   ├── stats.js          GET /api/stats ...
│   │   ├── runs.js           GET/DELETE /api/runs ...
│   │   ├── tests.js          POST/GET/DELETE /api/tests ...
│   │   ├── version.js        GET/POST /api/version ...
│   │   └── crm.js            GET/PATCH/DELETE /api/crm ...
│   ├── data/
│   │   ├── cities.js         Table GPS ~150 villes québécoises
│   │   └── sectors.js        Mapping codes SCIAN → catégories A/B/C
│   ├── temp/
│   │   ├── req_latest.zip    ZIP téléchargé du gouvernement
│   │   ├── last_version.txt  Date de la dernière version traitée
│   │   └── extracted/        CSV extraits du ZIP
│   │       ├── Entreprise.csv          ~2,9M entreprises
│   │       ├── Etablissements.csv      Adresses + secteurs par établissement
│   │       ├── Nom.csv                 Noms commerciaux
│   │       ├── ContinuationsTransformations.csv  (non utilisé)
│   │       └── FusionScissions.csv               (non utilisé)
│   ├── server.js             Point d'entrée backend
│   ├── .env                  Variables d'environnement (MongoDB, port)
│   ├── version.json          Version de l'application + historique
│   └── package.json          Dépendances + scripts
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Engine.jsx
        │   ├── Leads.jsx
        │   ├── Nouveautes.jsx
        │   ├── Nouvelles.jsx
        │   ├── Demenagements.jsx
        │   ├── Fermetures.jsx
        │   ├── Reouvertures.jsx
        │   ├── MapPage.jsx
        │   ├── Database.jsx
        │   └── Tests.jsx
        ├── components/
        │   ├── layout/
        │   │   └── Sidebar.jsx
        │   └── ui/
        │       ├── index.jsx       ConfirmModal, ScoreBadge, SignalBadge, ProgressBar, fmtDate...
        │       ├── SignalAlerts.jsx Toasts + sons Web Audio API
        │       └── SignalPage.jsx  Composant générique page signal
        ├── store/
        │   ├── engineStore.js      Zustand — état moteur + WebSocket
        │   └── uiStore.js          Zustand — langue + thème
        ├── utils/
        │   ├── api.js              Instance axios configurée
        │   └── pdf.js              Générateur PDF jsPDF
        ├── i18n/
        │   ├── fr.js               Traductions françaises
        │   ├── en.js               Traductions anglaises
        │   └── useT.js             Hook React pour la traduction
        ├── App.jsx                 Router + routes + SignalAlerts global
        └── index.css              Variables CSS + thèmes dark/light
```

---

# 4. BACKEND — FICHIERS ET RÔLES

## 4.1 server.js

Point d'entrée du backend. Lance trois services simultanément :

**Express REST API (port 3001) :**
```
GET/POST /api/engine/*   → routes/engine.js
GET/DELETE /api/leads/*  → routes/leads.js
GET      /api/stats/*    → routes/stats.js
GET/DELETE /api/runs/*   → routes/runs.js
GET/POST/DELETE /api/tests/*   → routes/tests.js
GET/POST /api/version/*  → routes/version.js
GET/PATCH/DELETE /api/crm/*    → routes/crm.js
```

**WebSocket (même port 3001) :**
- Attaché au même serveur HTTP via `new WebSocket.Server({ server })`
- Le moteur envoie des messages JSON en temps réel : logs de progression, pourcentage, signal "terminé"
- Le frontend se connecte à `ws://localhost:3001` au montage de la page Engine

**MongoDB :**
- Connexion via Mongoose sur `mongodb://localhost:27017/securite-leads`
- Si MongoDB n'est pas démarré → erreur au lancement du backend

**Middleware :**
- `helmet` → en-têtes de sécurité HTTP
- `cors` → autorise uniquement `http://localhost:*`
- `morgan` → logs HTTP en mode development
- `express.json()` → parsing JSON des requêtes

---

## 4.2 .env

```
MONGODB_URL=mongodb://localhost:27017/securite-leads
PORT=3001
NODE_ENV=development
```

---

## 4.3 package.json

Scripts :
```json
"start": "node --max-old-space-size=4096 server.js"
"dev":   "nodemon --max-old-space-size=4096 server.js"
```

`--max-old-space-size=4096` → autorise Node.js à utiliser jusqu'à **4 Go de RAM**.
Nécessaire car `Etablissements.csv` (~2,9M lignes) est chargé entièrement en mémoire comme Map.

**Dépendances principales :**

| Package | Usage |
|---------|-------|
| `express` | Framework API REST |
| `mongoose` | ODM MongoDB |
| `ws` | WebSocket server |
| `axios` | Client HTTP (API CKAN gouvernement) |
| `adm-zip` | Extraction du ZIP REQ |
| `csv-parse` | Parse streaming Etablissements.csv |
| `dotenv` | Variables d'environnement |
| `cors` / `helmet` / `morgan` | Middleware HTTP |
| `nodemailer` | Envoi email résumé de run |
| `xlsx` | Export Excel (`/api/leads/export-excel`) |
| `puppeteer-real-browser` | Présent en dépendance, non utilisé activement |

---

## 4.4 models/Lead.js

Chaque entreprise détectée (ou baseline) est stockée comme un document Lead dans MongoDB.

| Champ | Type | Index | Description |
|-------|------|-------|-------------|
| `neq` | String | unique | Numéro d'entreprise Québec — identifiant permanent |
| `nom` | String | — | Nom commercial ou raison sociale |
| `adresse` | String | — | Adresse physique |
| `ville` | String | oui | Ville |
| `groupe` | String | oui | Quartier/groupe géographique |
| `codePostal` | String | — | Code postal |
| `province` | String | — | Toujours 'QC' |
| `secteurActivite` | String | — | Secteur brut du CSV REQ |
| `secteurMatch` | String | — | Secteur normalisé |
| `categorieSecteur` | String | — | 'A', 'B', 'C' ou 'general' |
| `dateCreation` | Date | oui | Date d'incorporation |
| `dateTrouve` | Date | oui | Date de détection par Jinbe |
| `statutREQ` | Enum | — | 'Actif', 'Inactif', 'Radié', 'Fusionné', 'Fermé' |
| `signal` | Enum | — | 'nouvelle', 'reouverture', 'demenagement', 'nouvelle_activite', 'fermeture', 'baseline' |
| `score` | Number 1-6 | oui | Score de priorité calculé |
| `scoreDetails` | Object | — | `{ fraicheur: N, secteur: N }` — décomposition du score |
| `isBaseline` | Boolean | oui | true = chargé au premier run (référence, pas un lead réel) |
| `lastRunId` | String | oui | ID du dernier run ayant vu cet enregistrement — sert à détecter les fermetures sans Set RAM |
| `versionREQ` | String | — | Version REQ lors de la détection |
| `previousData` | Object | — | Pour déménagement : `{ adresse: "ancienne adresse", statutREQ: "" }` |

**Index composés MongoDB :**
- `{ ville: 1, score: -1 }` → filtrage par ville + tri par score décroissant
- `{ dateTrouve: -1 }` → tri chronologique
- `{ isBaseline: 1, dateTrouve: -1 }` → séparation baseline / leads réels

**Conversion statutREQ :**
- `Actif` → code REQ 'IM' (Immatriculé)
- `Radié` → codes 'RO' ou 'RF'
- `Fusionné` → code 'FU'
- `Inactif` → tout autre code

**Note sur `nouvelle_activite` :** Ce signal est présent dans l'enum mais n'est pas encore détecté par le moteur. Réservé pour usage futur.

---

## 4.5 models/RunHistory.js

Chaque exécution du moteur est enregistrée automatiquement à la fin du run.

| Champ | Type | Description |
|-------|------|-------------|
| `startedAt` | Date | Heure de début du run |
| `finishedAt` | Date | Heure de fin du run |
| `durationMs` | Number | Durée en millisecondes |
| `version` | String | Identifiant de version REQ (date ISO au format YYYY-MM-DDTHH:mm:ss...) |
| `isBaseline` | Boolean | true si c'était un run initial (chargement complet des 2,9M) |
| `isTest` | Boolean | true si lancé avec un testLimit > 0 |
| `counts` | Object | `{ nouvelle, reouverture, demenagement, fermeture, total }` |

---

## 4.6 models/CRM.js

Entrées CRM — leads promus depuis la page Leads vers le pipeline commercial.

| Champ | Type | Index | Description |
|-------|------|-------|-------------|
| `neq` | String | unique | Numéro d'entreprise |
| `nom` | String | — | Nom de l'entreprise |
| `adresse` | String | — | Adresse |
| `ville` | String | oui | Ville |
| `codePostal` | String | — | Code postal |
| `secteurMatch` | String | — | Secteur normalisé |
| `categorieSecteur` | String | — | Catégorie A/B/C |
| `dateCreation` | Date | — | Date d'incorporation REQ |
| `dateTrouve` | Date | — | Date détection Jinbe |
| `dateAjouteCRM` | Date | — | Date d'ajout au CRM |
| `score` | Number 1-6 | — | Score Jinbe |
| `signal` | String | — | Signal d'origine |
| `statutCRM` | Enum | oui | 'bon_lead', 'contacte', 'rdv_planifie', 'vendu', 'perdu' |
| `telephone` | String | — | Numéro de téléphone |
| `contact` | String | — | Nom du contact |
| `email` | String | — | Email de contact |
| `notes` | String | — | Notes libres |
| `historique` | Array | — | `[{ date, action, note }]` — historique des statuts |
| `dateModif` | Date | — | Date de dernière modification |

**Index composé :** `{ statutCRM: 1, dateAjouteCRM: -1 }`

---

# 5. ENGINE — PROCESSUS COMPLET ÉTAPE PAR ÉTAPE

Le moteur est lancé via `runFullProcess(force, resetDB, testLimit)` dans scheduler.js.

## 5.1 downloader.js

### checkForNewVersion(wsLog)

Vérifie si une nouvelle version REQ doit être téléchargée.

**Logique :**
1. Lit `temp/last_version.txt` — contient la date ISO du dernier téléchargement
2. Si la date est aujourd'hui ET que le ZIP existe et fait > 1 Ko → répond "pas de nouvelle version"
3. Sinon → répond "nouvelle version disponible"

**Note :** L'API CKAN n'est PAS interrogée pour comparer les versions. La logique est basée sur la date du jour + présence du ZIP local. Si le ZIP est absent ou daté d'hier → re-téléchargement.

### getPageUrl(wsLog)

Appelle l'API CKAN du gouvernement du Québec :
```
GET https://www.donneesquebec.ca/recherche/api/3/action/resource_show
    ?id=eac1b5f1-d8c0-4690-9c51-316d44ed9d94
```
→ Retourne les métadonnées du dataset, dont le champ `result.url` = URL directe du ZIP.

### downloadZIP(wsLog, onProgress)

1. Appelle `getPageUrl()` pour obtenir l'URL du ZIP
2. Lance `exec('start "" "URL"')` → ouvre la page dans le navigateur Windows
3. L'utilisateur doit **cliquer sur "Télécharger"** dans la page qui s'ouvre
4. Démarre `waitForDownloadedZip()` — surveillance du dossier Downloads

### waitForDownloadedZip(wsLog, timeoutMs=300000)

- Prend un snapshot des fichiers `.zip` existants dans le dossier Downloads AVANT d'ouvrir le navigateur
- Toutes les **2 secondes** : lit le dossier Downloads, cherche un nouveau `.zip` non présent dans le snapshot
- Ignore les fichiers en cours (taille < 1 Ko)
- Quand un nouveau ZIP apparaît et fait > 1 Ko :
  - Copie le fichier vers `backend/temp/req_latest.zip`
  - Supprime le fichier original du dossier Downloads
  - Valide les magic bytes PK (0x50 0x4B) pour confirmer que c'est bien un ZIP
- **Timeout de 5 minutes** → si aucun ZIP n'apparaît → erreur "Timeout"

---

## 5.2 extractor.js + Structure du ZIP REQ

### Structure du ZIP REQ

Le ZIP téléchargé contient **5 fichiers CSV** :

| Fichier | Contenu | Utilisé |
|---------|---------|---------|
| `Entreprise.csv` | ~2,9M lignes — une ligne par entreprise | OUI (streaming readline) |
| `Etablissements.csv` | Adresses, villes, secteurs par établissement | OUI (chargé en RAM Map) |
| `Nom.csv` | Noms commerciaux des entreprises | OUI (chargé en RAM Map) |
| `ContinuationsTransformations.csv` | Historique des transformations juridiques | NON utilisé |
| `FusionScissions.csv` | Historique des fusions/scissions | NON utilisé |

### Colonnes clés de Entreprise.csv

| Colonne CSV | Champ Lead | Description |
|-------------|------------|-------------|
| `NEQ` | `neq` | Numéro d'entreprise unique |
| `COD_STAT_IMMAT` | `statutREQ` | Code statut → mappé en texte |
| `DAT_IMMAT` | `dateCreation` | Date d'immatriculation |
| `ADR_DOMCL_LIGN1_ADR` | `adresse` (fallback) | Adresse si Etablissements absent |
| `ADR_DOMCL_LIGN2_ADR` | `ville` (fallback) | Ville si Etablissements absent |

### Colonnes clés de Etablissements.csv

| Colonne CSV | Description |
|-------------|-------------|
| `NEQ` | Numéro d'entreprise |
| `LIGN1_ADR` | Adresse |
| `LIGN2_ADR` | Ville format "Montréal (Québec)" → nettoyé par `parseCity()` |
| `LIGN4_ADR` | Code postal |
| `DESC_ACT_ECON_ETAB` | Description activité économique |

### Colonnes clés de Nom.csv

| Colonne CSV | Description |
|-------------|-------------|
| `NEQ` | Numéro d'entreprise |
| `NOM_ASSUJ` | Nom de l'entreprise |
| `STAT_NOM` | Statut du nom — 'A' = actif (prioritaire) |

### extractZIP(zipPath, wsLog)

- Utilise la bibliothèque `adm-zip`
- Extrait tout le contenu dans `backend/temp/extracted/`
- Écrase les anciens fichiers

### buildEtablissementsMap(etablissementPath, wsLog)

- Lit `Etablissements.csv` en streaming via `csv-parse`
- Détecte automatiquement le délimiteur (virgule, point-virgule ou tabulation) en lisant les 4000 premiers octets
- Construit un objet Map : `{ [neq]: { ville, cp, adresse, activite } }`
- Garde seulement le **premier établissement** par NEQ (siège social)
- **Ce Map est chargé entièrement en RAM** (~1 Go pour 2,9M entrées)

### buildNomMap(nomPath, wsLog)

- Lit `Nom.csv` en streaming
- Construit un objet Map : `{ [neq]: "nom commercial" }`
- Si plusieurs noms pour le même NEQ → priorité au nom avec `STAT_NOM = 'A'` (actif)

### prepareData(extractDir, wsLog)

Fonction principale d'extractor.js. Appelle les deux fonctions ci-dessus et retourne :
```javascript
{
  entreprisePath,     // Chemin vers Entreprise.csv
  etablissementsMap,  // Map NEQ → { ville, cp, adresse, activite }
  nomMap              // Map NEQ → nomCommercial
}
```

---

## 5.3 filter.js

### filterAndEnrich(entreprisePath, etablissementsMap, nomMap, settings, wsLog, onBatch, limit)

Lit `Entreprise.csv` ligne par ligne (**streaming readline**) — ne charge jamais tout le fichier en mémoire.

**Paramètres :**
- `onBatch` : callback appelé pour chaque batch de 50 000 entrées
- `limit` : en mode test, lit seulement les N premières lignes
- `settings` : `{ periodJours: 0, scoreMinimum: 1 }`

**Déroulement :**
1. Ouvre un `readline` sur `Entreprise.csv`
2. Ligne 1 → headers CSV
3. Pour chaque ligne suivante :
   - Parse la ligne (gère les guillemets et virgules dans les valeurs)
   - Extrait : NEQ, statutREQ (via `mapStatut()`), adresse/ville/cp (depuis `etablissementsMap`), nom (depuis `nomMap`), dateCreation
   - Calcule le score via `scoreLead()`
   - Ajoute au batch courant
4. Quand le batch atteint 50 000 :
   - Pause la lecture (`rl.pause()`)
   - Appelle `onBatch(batch)` → traitement asynchrone
   - Vide le batch
   - Reprend la lecture (`rl.resume()`)
5. Fin du fichier → flush du dernier batch

**Conversion statutREQ :**
```javascript
'IM' → 'Actif'
'RO' ou 'RF' → 'Radié'
'FU' → 'Fusionné'
tout autre → 'Inactif'
```

**Nettoyage de la ville :**
La fonction `extractCity()` supprime les suffixes du format REQ :
- `"Montréal (Québec)"` → `"Montréal"`
- `"LAVAL QC"` → `"LAVAL"`

---

## 5.4 comparator.js

### compareAndDetectBatch(batch)

Reçoit un batch de ~50 000 entreprises du CSV et détermine lesquelles ont changé.

```javascript
// 1. Extrait tous les NEQs du batch
const neqs = batch.map(l => l.neq);

// 2. UNE SEULE requête MongoDB — retourne seulement les docs existants
const existingDocs = await Lead.find(
  { neq: { $in: neqs } },
  { neq: 1, statutREQ: 1, adresse: 1 }  // projection — seulement les champs nécessaires
).lean();  // .lean() = objets JS purs, pas de surcharge Mongoose

// 3. Construction d'un Map local pour lookup O(1)
const existingMap = {};
for (const doc of existingDocs) existingMap[doc.neq] = doc;

// 4. Comparaison entreprise par entreprise
for (const lead of batch) {
  const existing = existingMap[lead.neq];

  if (!existing) {
    // NEQ absent de MongoDB → nouvelle entreprise
    lead.signal = 'nouvelle';

  } else if (existing.statutREQ !== 'Actif' && lead.statutREQ === 'Actif') {
    // Était fermée/inactive, redevient active
    lead.signal = 'reouverture';

  } else if (existing.adresse &&
             existing.adresse.trim().toLowerCase() !== lead.adresse.trim().toLowerCase()) {
    // Même NEQ mais adresse différente → déménagement
    // .trim().toLowerCase() évite les faux positifs liés aux espaces ou majuscules
    lead.signal = 'demenagement';
    lead.previousData = { adresse: existing.adresse };
  }
  // Sinon : aucun changement → ignoré, pas sauvegardé
}
```

**Avantage mémoire :** Au lieu de charger 2,9M documents MongoDB en RAM, on envoie uniquement les NEQs du batch et MongoDB retourne uniquement les correspondances.

### detectFermeturesByRunId(runId, wsLog)

Appelée APRÈS la lecture complète de `Entreprise.csv`. Utilise le champ `lastRunId` sur chaque document Lead au lieu d'un Set JavaScript en RAM.

```javascript
const detectFermeturesByRunId = async (runId, wsLog) => {
  // Trouve tous les leads actifs non-baseline qui n'ont PAS été vus dans ce run
  const fermetureLeads = await Lead.find(
    {
      statutREQ: 'Actif',
      isBaseline: { $ne: true },
      lastRunId: { $ne: runId }   // Pas vus dans ce run = absents du nouveau CSV
    },
    { neq: 1 }
  ).lean();
  return fermetureLeads.map(l => l.neq);
};
```

**Pourquoi `lastRunId` au lieu d'un Set :** Un Set JavaScript contenant 2,9M strings occupe ~250 Mo de RAM supplémentaire. Avec `lastRunId`, on stocke juste une string par document dans MongoDB — la détection fermetures se fait par requête, pas par comparaison en RAM.

---

## 5.5 scheduler.js — Orchestrateur

Contient toute la logique de coordination du moteur.

### État du moteur (engineState)

```javascript
const engineState = {
  isRunning: false,       // Planificateur cron actif (non utilisé — run manuel uniquement)
  isProcessing: false,    // Run actuellement en cours
  lastRun: null,          // Date du dernier run complété
  nextRun: null,          // Date du prochain run planifié (null si non planifié)
  lastLeadsFound: 0,      // Nombre de leads détectés au dernier run
  lastDuration: 0,        // Durée du dernier run en millisecondes
  cronJob: null,          // Instance du cron (non utilisé actuellement)
  progress: 0,            // Progression en % (0-100)
  currentStep: '',        // Texte de l'étape actuelle
}
```

### Fonctions WebSocket

**wsLog(message) :**
- Affiche le message dans la console backend avec timestamp
- Envoie `{ type: 'log', message }` à tous les clients WebSocket connectés

**wsProgress(step, percent) :**
- Met à jour `engineState.progress` et `engineState.currentStep`
- Envoie `{ type: 'progress', step, percent }` à tous les clients WebSocket

### Déroulement COMPLET d'un run — Run normal (non-baseline)

```
ÉTAPE 1 — Vérification (5%)
  wsProgress('Vérification...', 5)
  checkForNewVersion(wsLog)
  → Si pas de nouvelle version ET pas force → arrêt immédiat
  → Si force → "Forçage du traitement..."

ÉTAPE 2 — Téléchargement ZIP (10%)
  wsProgress('Téléchargement ZIP...', 10)
  → Vérifie si req_latest.zip existe déjà et fait > 100 Ko
  → Si oui : "ZIP déjà présent — téléchargement ignoré"
  → Si non : downloadZIP() → ouvre le navigateur → attend ZIP dans Downloads

ÉTAPE 3 — Extraction CSV (55%)
  wsProgress('Extraction CSV...', 55)
  extractZIP(ZIP_PATH, wsLog)
  → Extrait dans backend/temp/extracted/

ÉTAPE 4 — Lecture données (65%)
  wsProgress('Lecture données...', 65)
  prepareData(extractDir, wsLog)
  → Charge Etablissements.csv en RAM (~1 Go)
  → Charge Nom.csv en RAM (~200 Mo)
  → Retourne: { entreprisePath, etablissementsMap, nomMap }

ÉTAPE 5 — Traitement par batch (75% → 90%)
  wsProgress('Traitement en cours...', 75)

  Initialise :
    const runId = Date.now().toString()  // ID unique du run
    let processedCount = 0
    nouvelles = [], reouvertures = [], demenagements = []

  filterAndEnrich(..., async (batch) => {
    // Pour chaque batch de 50 000 :

    processedCount += batch.length

    const { nouvelles: bN, reouvertures: bR, demenagements: bD }
      = await compareAndDetectBatch(batch)

    nouvelles.push(...bN)
    reouvertures.push(...bR)
    demenagements.push(...bD)

    // Sauvegarde immédiate des changements détectés
    if (toSave.length > 0) {
      Lead.bulkWrite(ops avec { ...lead, lastRunId: runId })
    }

    // IMPORTANT : marquer tous les NEQs du batch comme "vus dans ce run"
    // → Remplace l'ancien Set en RAM — zéro mémoire supplémentaire
    Lead.updateMany(
      { neq: { $in: batch.map(l => l.neq) } },
      { $set: { lastRunId: runId } }
    )

    wsProgress('Traitement...', 75 + Math.min(15, round(processedCount / 200000)))
  })

ÉTAPE 6 — Détection fermetures (92%)
  wsProgress('Détection fermetures...', 92)
  detectFermeturesByRunId(runId, wsLog)
  → Lead.find({ statutREQ: 'Actif', isBaseline: $ne true, lastRunId: $ne runId })
  → Retourne les NEQs absents du run → fermetures
  → Lead.updateMany par chunks de 5000 : signal='fermeture', statutREQ='Fermé'

ÉTAPE 7 — Sauvegarde version (fin)
  saveVersion(version)
  → Écrit dans backend/temp/last_version.txt

ÉTAPE 8 — Historique run
  RunHistory.create({ startedAt, finishedAt, durationMs, version, counts })

ÉTAPE 9 — Terminé (100%)
  wsProgress('Terminé', 100)
  wsLog('Terminé : X entrées en Ys')
  ws.send({ type: 'done', leadsFound, duration })
  sendRunSummary(...)  // Email résumé (nodemailer)
```

### Déroulement — Run BASELINE (première fois ou après Reset)

Identique jusqu'à l'étape 5, puis :

```
ÉTAPE 5 BASELINE — Chargement complet (75% → 95%)
  filterAndEnrich(..., async (batch) => {
    // Toutes les entreprises → signal = 'baseline', isBaseline = true
    Lead.bulkWrite(ops, { ordered: false })
    saved += batch.length
    wsProgress('Chargement baseline...', 75 + Math.min(20, round(saved / 150000)))
  })
  → Charge ~2,9M entreprises en base
  → Pas de comparaison, pas de fermetures
```

### Fonctions exportées

| Fonction | Paramètres | Action |
|----------|------------|--------|
| `startEngine(ws)` | serveur WebSocket | Enregistre le WS server |
| `stopEngine()` | — | Arrête le planificateur |
| `runManual(ws)` | serveur WebSocket | Lance avec force=true |
| `runReset(ws)` | serveur WebSocket | Lance avec resetDB=true (supprime DB puis baseline) |
| `runTest(ws, limit)` | ws, limit=10 | Lance avec testLimit=N |

---

# 6. ROUTES API

## 6.1 routes/engine.js

| Méthode | URL | Corps/Params | Réponse | Action |
|---------|-----|-------------|---------|--------|
| GET | `/api/engine/status` | — | `engineState` | État complet du moteur |
| POST | `/api/engine/run` | — | `{ ok: true }` | Lance runManual() |
| POST | `/api/engine/reset` | — | `{ ok: true }` | Lance runReset() |
| POST | `/api/engine/test` | `{ limit: N }` | `{ ok: true }` | Lance runTest(ws, N) |
| POST | `/api/engine/start` | — | `{ ok: true }` | Active le planificateur |
| POST | `/api/engine/stop` | — | `{ ok: true }` | Arrête le planificateur |

---

## 6.2 routes/leads.js

| Méthode | URL | Params | Réponse | Action |
|---------|-----|--------|---------|--------|
| GET | `/api/leads` | signal, ville, score, search, date, groupe, page, limit, sort | `{ leads: [...], total, page, pages }` | Liste paginée avec filtres |
| GET | `/api/leads/nouveautes` | — | `[...]` | Leads des 24 dernières heures |
| GET | `/api/leads/calendar` | month, year, signal, ville, score | `[{ _id: { day }, count, topSignal, maxScore }]` | Données pour calendrier |
| GET | `/api/leads/export-csv` | (mêmes filtres) | Fichier CSV | Export CSV (pas de bouton UI actuel) |
| GET | `/api/leads/export-excel` | (mêmes filtres) | Fichier Excel (.xlsx) | Export Excel (pas de bouton UI actuel) |
| DELETE | `/api/leads/purge/:type` | type = signal | `{ deleted: N }` | Supprime tous les leads d'un signal |
| DELETE | `/api/leads/reset-db` | — | `{ ok: true }` | Supprime toute la base leads |
| DELETE | `/api/leads/:id` | — | `{ ok: true }` | Supprime un lead par MongoDB _id |

**Filtres de GET /api/leads :**
- `signal` : 'nouvelle' / 'reouverture' / 'demenagement' / 'fermeture'
- `ville` : filtrage exact ou partial
- `score` : score minimum (ex: `score=4` → retourne score >= 4)
- `search` : recherche dans nom + adresse (regex insensible à la casse)
- `date` : filtre par date spécifique (format YYYY-MM-DD)
- `groupe` : filtre par groupe géographique
- `page` : numéro de page (défaut 1)
- `limit` : résultats par page (défaut 20)
- `sort` : champ de tri

**Note :** Les routes `/api/leads/export-csv` et `/api/leads/export-excel` existent côté backend mais aucun bouton dans l'interface ne les appelle. Elles sont fonctionnelles mais non exposées dans l'UI.

---

## 6.3 routes/stats.js

| Méthode | URL | Réponse | Action |
|---------|-----|---------|--------|
| GET | `/api/stats/storage` | `{ storageSize, indexSize, leadsCount, dbName, disk }` | Espace MongoDB + disque (via `wmic` Windows) |
| GET | `/api/stats/distribution` | `{ distribution: [...], testCount: 0 }` | Répartition par mois (aggregation) |
| GET | `/api/stats/registry` | `{ total, baseline, actifs, inactifs, leads }` | Stats globales du registre |
| GET | `/api/stats/signals` | `{ nouvelle: N, reouverture: N, demenagement: N, fermeture: N }` | Counts par signal (pour SignalAlerts) |
| GET | `/api/stats/:year` | `{ totalLeads, nouvelles, fermetures, ..., monthly, groupes, secteurs, scoreMoyen, years }` | Stats complètes d'une année |

**Note :** `wmic` est une commande Windows. Si le serveur tourne sur Linux/Mac, `disk` retournera `null` et sera ignoré côté frontend.

---

## 6.4 routes/runs.js

| Méthode | URL | Réponse | Action |
|---------|-----|---------|--------|
| GET | `/api/runs` | `[RunHistory, ...]` | 20 derniers runs (tous types, tri décroissant) |
| GET | `/api/runs/latest` | `[RunHistory, RunHistory]` | 2 derniers runs non-baseline non-test |
| DELETE | `/api/runs/all` | `{ deleted: N }` | Supprime tout l'historique des runs |
| DELETE | `/api/runs/:id` | `{ ok: true }` | Supprime un run par MongoDB _id |

---

## 6.5 routes/tests.js

| Méthode | URL | Corps | Réponse | Action |
|---------|-----|-------|---------|--------|
| POST | `/api/tests/seed/:signal` | — | `{ neq, nom, ville, signal }` | Prend un lead baseline au hasard, lui donne le signal demandé, `isBaseline: false` |
| GET | `/api/tests/active` | — | `[Lead, ...]` | Liste des leads de test actifs (isBaseline: false) |
| DELETE | `/api/tests/reset` | — | `{ reset: N }` | Remet tous les leads de test en baseline |
| DELETE | `/api/tests/reset/:neq` | — | `{ ok: true }` | Remet un lead de test en baseline |
| GET | `/api/tests/health-full` | — | `{ mongodb, ram, disk, zip }` | Diagnostic complet — MongoDB + RAM + disque + ZIP |
| GET | `/api/tests/ram` | — | `{ heapUsed, heapTotal, rss }` | RAM Node.js en temps réel (en Mo) |
| GET | `/api/tests/check-download` | — | `{ steps: [...], allOk: bool }` | Vérifie l'accès CKAN + version locale + ZIP local + intégrité ZIP |

**Détail de `/api/tests/health-full` :**
```json
{
  "mongodb": { "ok": true, "docs": 2900000 },
  "ram":     { "heapUsed": 85, "heapTotal": 120, "rss": 210 },
  "disk":    { "free": 50000000000, "size": 250000000000, "pct": 80 },
  "zip":     { "exists": true, "sizeMb": 450, "version": "2026-04-20T..." }
}
```

**Détail de `/api/tests/check-download` :**
```json
{
  "steps": [
    { "label": "Serveur Données Québec", "ok": true, "detail": "142ms" },
    { "label": "Version locale", "ok": true, "detail": "2026-04-20T..." },
    { "label": "ZIP local (temp/)", "ok": true, "detail": "450 MB" },
    { "label": "Intégrité ZIP", "ok": true, "detail": "Valide" }
  ],
  "allOk": true
}
```

---

## 6.6 routes/version.js

| Méthode | URL | Corps | Réponse | Action |
|---------|-----|-------|---------|--------|
| GET | `/api/version` | — | `{ version, history: [...] }` | Version actuelle + historique |
| POST | `/api/version/bump` | `{ type, note }` ou `{ manual, note }` | `{ version, history }` | Incrémente la version |

Stocké dans `backend/version.json` (fichier JSON sur disque, pas en base).

**Types de bump :**
| Type | Règle | Exemple (depuis v1.2.3) |
|------|-------|------------------------|
| `patch` | x.x.N+1 | v1.2.4 |
| `minor` | x.N+1.0 | v1.3.0 |
| `major` | N+1.0.0 | v2.0.0 |
| `manual` | saisie libre (format x.y.z validé) | n'importe quelle version |

---

## 6.7 routes/crm.js

CRM interne — pipeline commercial des leads promus.

| Méthode | URL | Params/Corps | Réponse | Action |
|---------|-----|-------------|---------|--------|
| GET | `/api/crm` | statutCRM, ville, search, page, limit | `{ entries: [...], total }` | Liste paginée avec filtres |
| PATCH | `/api/crm/:id` | `{ statutCRM, notes, telephone, contact, email }` | `{ success, entry }` | Met à jour une entrée CRM + ajoute à l'historique |
| DELETE | `/api/crm/:id` | — | `{ success: true }` | Supprime une entrée CRM |
| GET | `/api/crm/export` | — | Fichier CSV | Export CSV des entrées CRM (hors perdus) |

**Logique PATCH :** Si `statutCRM` change, une entrée est automatiquement ajoutée au tableau `historique` du document avec la date et le label lisible (ex: "Contacté", "RDV planifié"...).

---

# 7. FRONTEND — STRUCTURE ET STACK

**Stack technique :**

| Technologie | Usage |
|-------------|-------|
| React 18 | Framework UI |
| Vite 8.x | Build tool + dev server (HMR) |
| React Router v6 | Navigation entre pages |
| Zustand 4.x | State management global |
| Leaflet + react-leaflet | Carte interactive OpenStreetMap |
| Chart.js + react-chartjs-2 | Graphiques (barres + donut) |
| jsPDF 2.x | Génération PDF côté client |
| CSS Variables | Thèmes dark/light |

**App.jsx — Routes :**
```
/              → Redirect → /dashboard  (pas de page Intro)
/dashboard     → Dashboard
/leads         → Leads (calendrier)
/nouveautes    → Nouveautes (24h)
/nouvelles     → Nouvelles (signal: nouvelle)
/demenagements → Demenagements (signal: demenagement)
/fermetures    → Fermetures (signal: fermeture)
/reouvertures  → Reouvertures (signal: reouverture)
/engine        → Engine (moteur)
/database      → Database (gestion base)
/carte         → MapPage (carte Leaflet)
/tests         → Tests (mode test + seed)
```

`<SignalAlerts />` est monté globalement dans App.jsx — actif sur toutes les pages.

---

# 8. STORES ZUSTAND

## 8.1 engineStore.js

État global partagé entre la page Engine et le Dashboard.

**State :**
```javascript
{
  status: {
    isRunning: false,
    isProcessing: false,
    lastRun: null,
    nextRun: null,
    lastLeadsFound: 0,
    lastDuration: 0,
    progress: 0,
    currentStep: ''
  },
  logs: [],    // Messages WebSocket [ { id, time, message }, ... ] — max 200 en mémoire
  ws: null,    // Instance WebSocket active
}
```

**Actions :**

| Action | Endpoint | Description |
|--------|----------|-------------|
| `fetchStatus()` | GET /api/engine/status | Met à jour `status` |
| `start()` | POST /api/engine/start | Active le planificateur |
| `stop()` | POST /api/engine/stop | Arrête le planificateur |
| `runNow()` | POST /api/engine/run | Lance le moteur maintenant |
| `resetDB()` | POST /api/engine/reset | Reset + recharge baseline |
| `runTestMode(limit)` | POST /api/engine/test | Lance en mode test |
| `addLog(msg)` | — | Ajoute un message aux logs (slice -200 pour limiter) |
| `clearLogs()` | — | Vide tous les logs |
| `connectWS()` | ws://localhost:3001 | Ouvre WebSocket, auto-reconnecte après 3s si fermé |

**Comportement WebSocket :**
- URL : `ws://localhost:3001` (même port que l'API REST)
- À la réception de `{ type: 'log', message }` → `addLog(message)`
- À la réception de `{ type: 'progress', step, percent }` → met à jour `status.progress` et `status.currentStep`
- À la réception de `{ type: 'done' }` → `fetchStatus()` + dispatch `window.dispatchEvent(new Event('engine:done'))` → SignalAlerts vérifie immédiatement
- Si WS déjà ouvert (`get().ws` non null) → `connectWS()` ne fait rien (évite doublons)

---

## 8.2 uiStore.js

État global de l'interface utilisateur.

```javascript
{
  lang: 'fr',     // 'fr' ou 'en' — persisté dans localStorage
  theme: 'dark',  // 'dark' ou 'light' — persisté dans localStorage
}
```

**Actions :**
- `setLang(lang)` → change la langue, sauvegarde dans localStorage
- `setTheme(theme)` → change le thème, ajoute/retire la classe `.light` sur `document.body`

---

# 9. PAGES — CHAQUE PAGE EN DÉTAIL

## 9.1 Dashboard (/dashboard)

**Vue d'ensemble statistique de l'année en cours.**

**APIs appelées au chargement :**
- `GET /api/stats/:year` → données de l'année sélectionnée

**Ce qui s'affiche :**

**Hero header :**
- Icône ▦, titre "Dashboard", sélecteur d'années (boutons)
- Si aucun lead → message "Pas de données pour [année], lancez le moteur"

**Zone principale (quand données présentes) :**

1. **Compteur total + score moyen** (colonne gauche)
   - Nombre total de leads de l'année
   - Score moyen : ★ X / 6

2. **4 cartes signal** (4 colonnes)
   - Nouvelle ✦ vert — Réouverture ↺ cyan — Déménagement → orange — Fermeture ✕ rouge
   - Chaque carte : icône + count + label + barre de progression (% du total)

3. **Graphique à barres** (2/3 largeur)
   - 12 mois en abscisse, 4 datasets (un par signal), couleurs correspondantes
   - Utilise Chart.js Bar avec tooltip dark theme

4. **Graphique donut** (1/3 largeur)
   - Répartition des 4 signaux
   - Cutout 68%, légende en bas

5. **Top 20 villes** + **Top 20 secteurs**
   - Classement avec numéro, nom, count, barre de progression colorée (HSL dégradé)

**Mise à jour :** Pas de polling — les données se chargent une fois et se mettent à jour quand l'utilisateur change d'année.

---

## 9.2 Engine (/engine)

**Contrôle et monitoring du moteur REQ.**

**Au montage :**
- `fetchStatus()` → charge l'état actuel
- `connectWS()` → ouvre le WebSocket ws://localhost:3001

**Polling :** Quand `isProcessing = true`, rafraîchit `fetchStatus()` toutes les 5 secondes.

**Zone Hero (haut de page) :**
- Radar animé SVG (couleur selon état : vert si en traitement, vert foncé si actif/veille, rouge si arrêté)
  - Animation de balayage radar quand actif
  - Anneaux pulsants quand actif
- Statut texte : "En traitement" / "Surveillance active" / "Moteur arrêté"
- Date du dernier run + date du prochain run (si planifié)
- Badge "X leads — Ys" si leads trouvés au dernier run
- **Bouton "Lancer le moteur"** → ouvre un `ConfirmModal` (bleu #00d4ff) → à confirmation → `runNow()` → POST /api/engine/run
  - Désactivé et grisé si moteur en cours (`isProcessing = true`)

**Barre de progression :**
- Visible uniquement quand `isProcessing = true`
- Affiche le pourcentage (0% → 100%) et le texte de l'étape actuelle
- Mise à jour via WebSocket (type: 'progress')

**4 cartes stats :**
- Leads trouvés (dernier run)
- Durée (dernier run en secondes)
- Statut du moteur
- Source : "REQ Québec"

**Comment ça marche + Garanties :**
- 2 panneaux côte-à-côte expliquant les 5 étapes et les 5 garanties
- Texte traduit via i18n (fr/en)

**Console LIVE :**
- Zone monospace fond sombre (#0a0d14), badge "LIVE" jaune
- Affiche tous les messages WebSocket, avec timestamp et couleur :
  - Vert si ✅ dans le message
  - Rouge si ❌
  - Jaune si ⚠
  - Gris sinon
- Auto-scroll vers le bas quand nouveaux logs
- Bouton "Effacer" → `clearLogs()`

---

## 9.3 Leads (/leads) — Vue Calendrier

**Calendrier mensuel des leads détectés.**

**Au montage :**
- `loadCalendar()` → GET /api/leads/calendar (mois courant)
- `selectDay(today)` → charge automatiquement les leads du jour actuel

**Header :**
- Icône ◈, mois et année actuels, total du mois
- **Filtres :** Signal (Tous/Nouvelle/Réouverture/Déménagement/Fermeture), Ville (input texte), Score minimum (select ≥ 2 à ≥ 6)
- Bouton ✕ pour effacer tous les filtres
- Navigation mois : ‹ et ›

**Calendrier :**
- Grille 7×N (semaine commence lundi)
- Chaque case : numéro du jour + count de leads si > 0
- Couleur de la case selon le signal dominant du jour
- Intensité de couleur proportionnelle au nombre de leads
- 🔥 si score max ≥ 5 dans cette journée
- Case d'aujourd'hui : bordure violette
- Case sélectionnée : fond violet + barre en haut
- Clic sur une case → `selectDay(day)` → charge les leads du jour

**Panneau jour (droite) :**
- Apparaît quand un jour est sélectionné
- Date + nombre de leads, bouton ✕ pour fermer
- Liste des leads du jour avec `LeadCard` :
  - Score badge + Signal badge
  - Nom + ville + secteur
  - Adresse + code postal + date création + NEQ
  - **Liens :** 📍 Google Maps, 📘 Facebook, 📸 Instagram, 🌐 Google Web
  - **Bouton ↓ PDF** → `generateLeadPDF(lead)`

**Légende :** En bas — 4 couleurs + nombre de jours avec activité

---

## 9.4 Nouveautes (/nouveautes)

**Leads détectés dans les 24 dernières heures.**

- API : `GET /api/leads/nouveautes`
- Affichage en cartes (tous signaux confondus)
- Aucun filtre — toujours les 24 dernières heures

---

## 9.5 Nouvelles (/nouvelles)

**Leads avec signal = 'nouvelle'** — nouvelles entreprises.

Composant `SignalPage` générique avec filtres ville/secteur/score, liste de cartes leads, liens Google/Facebook/Instagram/Web, bouton PDF.

---

## 9.6 Demenagements (/demenagements)

**Leads avec signal = 'demenagement'** — entreprises qui ont déménagé.

Identique à Nouvelles avec en plus :
- Affichage de l'ancienne adresse (`lead.previousData.adresse`) en orange sous la nouvelle adresse

---

## 9.7 Fermetures (/fermetures)

**Leads avec signal = 'fermeture'** — entreprises fermées.

Identique à Nouvelles.

---

## 9.8 Reouvertures (/reouvertures)

**Leads avec signal = 'reouverture'** — entreprises qui ont réouvert.

Identique à Nouvelles.

---

## 9.9 Carte (/carte) — MapPage

**Carte Leaflet interactive avec OpenStreetMap.**

**Au montage :**
- `loadLeads('all')` → GET /api/leads?limit=200

**Header :**
- Icône ◉ vert, titre "Carte des Leads"
- **Sélecteur de région :** Tous / Mtl / Mauricie / Québec / Outaouais
  - Clic → change la vue de la carte + charge les leads de cette région
- **Recherche par ville :** input + bouton →
  - Lookup dans `CITY_COORDS` pour centrer la carte
  - GET /api/leads?ville=X&limit=100
- Compteur de marqueurs sur la carte

**Légende cliquable :**
- 4 boutons (nouvelle/réouverture/déménagement/fermeture)
- Clic sur un signal → `flyTo` sur le prochain marqueur de ce signal (navigation cyclique)

**Carte Leaflet :**
- Tiles OpenStreetMap
- Marqueurs circulaires (`CircleMarker`), rayon 8px, couleur selon signal :
  - Nouvelle → #22c55e vert
  - Réouverture → #f97316 orange
  - Déménagement → #3b82f6 bleu
  - Fermeture → #ef4444 rouge
- Petit jitter aléatoire pour éviter les marqueurs empilés
- Popup au clic : nom, signal, adresse, ville, score, NEQ — lien 📍 Google Maps + bouton PDF

**Géolocalisation :**
- **Aucune API externe** — lookup dans `CITY_COORDS` (objet hardcodé dans MapPage.jsx)
- ~150 villes québécoises couvertes
- Ville inconnue → marqueur ignoré (le lead n'apparaît pas sur la carte, mais existe en base)

---

## 9.10 Database (/database)

**Gestion et monitoring de la base de données.**

**APIs appelées :**
- `GET /api/stats/:year`
- `GET /api/stats/registry`
- `GET /api/stats/storage`
- `GET /api/stats/signals`
- `GET /api/runs`

**Ce qui s'affiche :**

**Hero :** Icône ◫, titre "Base de données", total leads de l'année, sélecteur d'années

**Bande REQ :**
- 4 chiffres : Total registre, Actifs, Inactifs, Leads détectés

**4 cartes KPI par signal :**
- Count + barre de progression pour chaque signal

**Activité mensuelle :**
- Graphique à barres verticales manuel (pas Chart.js)
- 12 colonnes, hauteur proportionnelle au total du mois

**Top 20 villes + Top 20 secteurs :**
- Classement avec barre de progression colorée HSL

**Section "Leads par signal + Purge" :**
- Counts actuels depuis `/api/stats/signals`
- Zone de purge (fond rouge léger) avec 4 boutons :
  - Chaque bouton → `ConfirmModal` (rouge) → à confirmation → DELETE /api/leads/purge/:signal
  - Signaux : nouvelle, reouverture, demenagement, fermeture

**Stockage :**
- Taille MongoDB (données + index), espace disque Windows
- Bouton "Actualiser" → recharge GET /api/stats/storage
- Barre de progression disque : vert < 75%, orange < 90%, rouge ≥ 90%
- Auto-refresh toutes les 30 secondes

**Historique des runs :**
- 20 derniers runs via GET /api/runs
- Chaque run : date, durée, type (Baseline violet / Test orange / Normal vert)
- Pour les runs normaux : counts par signal avec icônes colorées
- **Bouton "Supprimer"** sur chaque run → `ConfirmModal` (rouge) → DELETE /api/runs/:id
- **Bouton "Supprimer tout l'historique"** → `ConfirmModal` (rouge) → DELETE /api/runs/all

---

## 9.11 Tests (/tests)

**Page de test + gestion de version + outils de diagnostic.**

**Hero :**
- Icône ⚗, titre "Laboratoire de tests"
- Indicateur "Moteur actif/arrêté" (dot vert pulsant si en cours)
- Compteur total de leads de test actifs

**4 cartes Seed (une par signal) :**
- Nouvelle ✦ / Réouverture ↺ / Déménagement → / Fermeture ✕
- Chaque carte :
  - Badge count de leads de test actifs pour ce signal
  - **Bouton "+ Créer lead test"** → `ConfirmModal` → POST /api/tests/seed/:signal
    - Prend une entrée baseline au hasard en DB
    - Lui assigne le signal demandé + `isBaseline: false`
    - Log dans le journal
  - **Lien "Voir ..."** → navigate vers la page signal correspondante

**Section "Leads actifs" :**
- Liste de tous les leads de test (GET /api/tests/active)
- Chaque ligne : icône signal, nom, ville, NEQ, date, bouton "Reset"
  - **Bouton "Reset"** → `ConfirmModal` → DELETE /api/tests/reset/:neq
- **Bouton "↺ Tout remettre en baseline"** → `ConfirmModal` → DELETE /api/tests/reset

**Section "Tester N leads" :**
- Presets rapides : 10 / 20 / 50 / 100
- Input numérique (1-500) pour valeur personnalisée
- **Bouton "⚡ Lancer — N leads"** → `ConfirmModal` → `runTestMode(N)`
  - Lance le moteur sur les N premières entrées du CSV
  - Désactivé si moteur en cours

**Section "Reset DB" :**
- Explication + avertissement en rouge
- **Bouton "Reset DB"** → `ConfirmModal` (rouge) → `resetDB()`
  - Lance runReset() → supprime toute la base + recharge le baseline complet (~2,9M)

**Section "Diagnostic" :**
- **Bouton "Lancer le diagnostic"** → GET /api/tests/health-full
- Affiche 4 indicateurs avec OK ✓ ou ERREUR ✗ :
  - MongoDB (connecté + nombre de documents)
  - RAM (heapUsed / heapTotal / RSS en Mo)
  - Disque C: (espace libre / total / pourcentage)
  - ZIP local (présent, taille, version)

**Section "RAM Monitor" :**
- Polling automatique GET /api/tests/ram
  - Toutes les 1,5 secondes si diagnostic en cours
  - Toutes les 6 secondes sinon
- Graphique sparkline maison : historique des 30 dernières mesures heapUsed
- Affiche : heapUsed / heapTotal / RSS / Peak (max atteint depuis l'ouverture de la page)
- Couleurs : vert < 500 Mo, orange < 1000 Mo, rouge ≥ 1000 Mo

**Section "Vérification Téléchargement" :**
- **Bouton "Vérifier"** → ouvre un modal → GET /api/tests/check-download
- Affiche 4 étapes avec ✓/✗ :
  1. Serveur Données Québec (ping CKAN)
  2. Version locale (last_version.txt)
  3. ZIP local (présence + taille)
  4. Intégrité ZIP (magic bytes PK)

**Version Manager :**
- Affiche la version actuelle (ex: v1.2.3)
- 4 boutons : Patch ◦ / Minor ◈ / Major ◉ / Manuel ✎
- Sélection → panneau aperçu "v1.2.3 → v1.2.4" + input Note + bouton "Appliquer" → POST /api/version/bump
- Historique des versions défilable

**Journal LIVE :**
- Zone monospace noire, timestamps gris, messages colorés (vert ✅, rouge ❌, gris sinon)
- 30 derniers logs d'action
- Bouton "Effacer"

**ConfirmModal :** TOUS les boutons dangereux passent par `ConfirmModal` — aucun `window.confirm()` dans cette page.

---

# 10. COMPOSANTS UI

## 10.1 Sidebar — Layout principal

Barre latérale gauche permanente, visible sur toutes les pages.

**Sections et liens :**
```
[Logo Jinbe]
[Statut moteur: point vert pulsant si en cours]

NAVIGATION
  ▦ Dashboard        → /dashboard
  ◈ Tous les leads   → /leads
  ✦ Nouvelles        → /nouvelles
  → Déménagements    → /demenagements
  ✕ Fermetures       → /fermetures
  ↺ Réouvertures     → /reouvertures
  ✨ Nouveautés 24h  → /nouveautes

OUTILS
  ◉ Carte            → /carte
  ⚙ Moteur          → /engine
  ◫ Base de données  → /database
  ⚗ Tests           → /tests

[Sélecteur thème dark/light]
[Sélecteur langue FR/EN]
```

Le lien actif est mis en évidence (background accent + couleur accent).

---

## 10.2 SignalAlerts — Alertes globales

`src/components/ui/SignalAlerts.jsx` — Monté une seule fois dans App.jsx.

**Fonctionnement :**
1. Polling toutes les **15 secondes** → GET /api/stats/signals
2. Compare les counts avec les counts précédents
3. Si un count a augmenté → affiche un toast + joue un son

**Sons (Web Audio API — zéro fichier audio) :**

| Signal | Nom | Description technique |
|--------|-----|----------------------|
| `nouvelle` | Arpège découverte | 4 notes C5→E5→G5→C6 (523→659→784→1047 Hz), oscillateurs sinus, attaque 0.01s, chaque note 0.12s |
| `reouverture` | Cloche | 3 harmoniques simultanées 523/659/784 Hz, déclin exponentiel sur 1.2s |
| `demenagement` | Swoosh | Glissement de fréquence 200→800 Hz sur 0.3s, gain décroissant |
| `fermeture` | Goutte descendante | 4 notes descendantes mineures, chaque note 0.15s |

**Toast notifications :**
- Position : bas-droit de l'écran
- Durée : 6 secondes (auto-disparition)
- Contenu : icône signal + texte + nombre de nouveaux leads
- **Clic sur le toast → navigate vers la page du signal**

**Événement engine:done :**
- Écoute `window.addEventListener('engine:done', ...)`
- Quand le moteur termine → vérifie immédiatement les nouveaux signals sans attendre les 15s

---

## 10.3 Composants UI partagés (components/ui/index.jsx)

**ConfirmModal :**
- Utilisé sur TOUS les boutons dangereux du projet (purge, reset, delete, seed, launch)
- Props : `title`, `message`, `confirmLabel`, `cancelLabel`, `color`, `onConfirm`, `onCancel`
- Backdrop flou (blur 7px), fermeture par clic backdrop ou touche Escape
- Animation entrée : fadeUp 0.25s
- Icône ⚠ dans un carré coloré, bouton annuler + bouton confirmer coloré

**ScoreBadge :**
- Affiche "X/6" avec fond et couleur selon le score
- Score 6 = rouge 🔥🔥🔥, score 5 = orange 🔥🔥, score 4 = jaune 🔥, score 3-2 = bleu ●, score 1 = gris ●

**StatusBadge :**
- Badge CRM statut : bon_lead / contacte / rdv_planifie / vendu / perdu / nouveau / plus_tard / verifie
- Couleur + label lisible

**SignalBadge :**
- Badge signal : nouvelle (vert) / reouverture (orange) / demenagement (bleu) / nouvelle_activite (violet) / fermeture (rouge)
- Format : "● Label"

**ProgressBar :**
- Barre de progression avec pourcentage + texte d'étape
- Gradient bleu → cyan, transition 0.3s

**LeadCard :**
- Carte complète d'un lead avec ScoreBadge, SignalBadge, nom, ville, secteur, adresse, CP, date, NEQ
- Liens : 📍 Google Maps, 📘 Facebook, 📸 Instagram, 🌐 Google Web
- Bouton ↓ PDF → `generateLeadPDF(lead)`
- Pour déménagements : affiche l'ancienne adresse en orange

**fmtDate(date) :**
- Formate une date en "24 avr. 2026" (toLocaleDateString fr-CA)

**fmtRelative(date) :**
- Date relative : "Aujourd'hui", "Hier", "Il y a X jours", "Il y a X mois", "Il y a X an(s)"

**StatCard, Card, Btn, PageHeader :**
- Composants layout génériques réutilisables

---

# 11. UTILITAIRES

## 11.1 pdf.js — Génération PDF

Utilise **jsPDF**, 100% côté client (navigateur), aucun appel backend.

**Marque dans le PDF : "SecuLeads"** — pas "Jinbe".

**Structure du PDF (format A4, portrait) :**

```
┌─────────────────────────────────────┐  ← Header noir
│  ██ SecuLeads              [LOGO]   │
│  Rapport d'analyse                  │
├─────────────────────────────────────┤
│  [NOM DE L'ENTREPRISE]              │
│  [Badge signal coloré]  ★★★☆☆ Score│
│  Statut REQ : Actif                 │
├─────────────────────────────────────┤
│  COORDONNÉES                        │
│  Adresse : 123 rue de la Paix       │
│  Ville   : Montréal, QC  H2X 1Y2   │
├─────────────────────────────────────┤
│  INFORMATIONS REQ                   │
│  NEQ            : 1234567890        │
│  Date création  : 2026-01-15        │
│  Version REQ    : 2026-04-15        │
├─────────────────────────────────────┤
│  RECHERCHE EN LIGNE                 │
│  [Google Maps]  [LinkedIn]          │
│  [Canada411]    [Registre REQ]      │
└─────────────────────────────────────┘
```

La fonction `generateLeadPDF(lead)` ouvre automatiquement le PDF dans un nouvel onglet.

---

## 11.2 i18n / useT

**Fichiers :** `src/i18n/fr.js`, `src/i18n/en.js`, `src/i18n/useT.js`

Système de traduction maison — pas de bibliothèque externe.

**Utilisation :**
```javascript
const t = useT()
t('engine.title')         // "Moteur REQ" (fr) ou "REQ Engine" (en)
t('engine.launch')        // "Lancer le moteur" / "Launch engine"
t('db.runs.delone')       // "Supprimer" / "Delete"
t('db.runs.delall')       // "Supprimer tout l'historique" / "Delete all history"
```

Le hook `useT()` lit la langue depuis `uiStore` (Zustand) et retourne la fonction de traduction.

La langue est persistée dans localStorage → survit aux rechargements.

---

# 12. COMMUNICATION TEMPS RÉEL — WEBSOCKET

**Port :** 3001 — **même port que l'API REST** (pas de port séparé)

**Architecture :**
```javascript
// backend/server.js
const server = http.createServer(app);         // Serveur HTTP Express
const wss = new WebSocket.Server({ server });  // WebSocket attaché AU MÊME serveur
server.listen(3001);                           // Un seul port pour les deux
```

**Messages du backend → frontend :**

```javascript
// Log de progression
{ type: 'log', message: 'Extraction du ZIP...' }

// Progression (étape + pourcentage)
{ type: 'progress', step: 'Traitement...', percent: 82 }

// Run terminé
{ type: 'done', leadsFound: 142, duration: 45230 }

// Connexion initiale
{ type: 'connected', message: 'Connecté au moteur' }
```

**Comportement frontend (engineStore.js) :**
- Connexion à `ws://localhost:3001` au montage de la page Engine
- Si déjà connecté → aucune action (guard `if (get().ws) return`)
- `log` → `addLog()` → affiché dans la console Engine
- `progress` → `status.progress` et `status.currentStep` → barre de progression
- `done` → `fetchStatus()` + `window.dispatchEvent(new Event('engine:done'))` → SignalAlerts vérifie immédiatement
- Déconnexion → reconnexion automatique après 3 secondes

---

# 13. THÈMES ET CSS

**Fichier :** `frontend/src/index.css`

**Thème Dark (défaut) :**

| Variable CSS | Valeur | Usage |
|-------------|--------|-------|
| `--bg` | #0f1117 | Fond principal |
| `--bg2` | #1a1d27 | Fond des cartes/surfaces |
| `--bg3` | #0f1117 | Fond des inputs |
| `--accent` | #6c63ff | Couleur accent (violet) |
| `--accent2` | #00d4ff | Couleur accent 2 (cyan) |
| `--text` | #e2e8f0 | Texte principal |
| `--text2` | #94a3b8 | Texte secondaire |
| `--text3` | #64748b | Texte tertiaire / labels |
| `--border` | #2d3148 | Bordures |
| `--radius` | 14px | Border-radius standard |
| `--radius-sm` | 8px | Border-radius petit |
| `--sidebar` | 220px | Largeur de la sidebar |

**Thème Light (`body.light`) :**

| Variable CSS | Valeur | Usage |
|-------------|--------|-------|
| `--bg` | #f0f4f8 | Fond principal |
| `--bg2` | #ffffff | Fond des cartes |
| `--accent` | #3b82f6 | Bleu |
| `--text` | #1e293b | Texte principal |
| `--border` | #e2e8f0 | Bordures claires |

**Police :** Inter (Google Fonts) — chargée via `@import`

**Changement de thème :**
```javascript
// uiStore.setTheme('light')
document.body.classList.add('light')    // → variables CSS light activées
document.body.classList.remove('light') // → retour dark
```

---

# 14. DONNÉES GÉOGRAPHIQUES

**Fichier backend :** `backend/data/cities.js`
**Fichier frontend :** coordonnées hardcodées dans `MapPage.jsx` (objet `CITY_COORDS`)

Les deux sources doivent être cohérentes — `cities.js` sert au filtrage backend, `CITY_COORDS` sert au positionnement des marqueurs Leaflet.

**Format :**
```javascript
{ 'montréal': [45.5017, -73.5673] }
{ 'laval':    [45.6066, -73.7124] }
```

**Régions couvertes :**
- Montréal & région (60+ villes)
- Mauricie (Trois-Rivières, Shawinigan, Drummondville...)
- Outaouais / Gatineau
- Québec (Lévis, Charlesbourg, Sainte-Foy...)

**Avertissement :** Si la ville d'un lead n'est pas dans `CITY_COORDS`, ce lead n'apparaît PAS sur la carte. Il existe bien dans la base et les listes, mais il est ignoré par MapPage.

---

# 15. SCORE — COMMENT IL EST CALCULÉ

**Fichier :** `backend/engine/scorer.js`

Le score va de **1 à 6** (6 = lead le plus intéressant).

**Deux composantes :**

**1. Fraîcheur (jusqu'à +3 points) :**
| Condition | Points |
|-----------|--------|
| Entreprise créée il y a < 30 jours | +3 |
| Entreprise créée il y a < 90 jours | +2 |
| Entreprise créée il y a < 180 jours | +1 |
| Plus ancienne | +0 |

**2. Secteur (jusqu'à +3 points) :**
| Catégorie | Points | Exemples |
|-----------|--------|---------|
| A — Prioritaire | +3 | Construction, Transport, Restauration, Commerce de détail |
| B — Secondaire | +2 | Services professionnels, Santé, Éducation |
| C — Standard | +1 | Autres secteurs |
| Général | +0 | Secteur non classifié |

**Score final = fraîcheur + secteur, minimum forcé à 1, maximum 6**

**Dans la base :**
```javascript
{
  score: 5,
  scoreDetails: {
    fraicheur: 2,   // < 90 jours
    secteur: 3      // catégorie A
  }
}
```

---

# 16. GUIDE POUR MODIFICATIONS FUTURES

## Ajouter une nouvelle page

1. Créer `frontend/src/pages/MaPage.jsx`
2. Ajouter la route dans `App.jsx` :
   ```jsx
   <Route path="/ma-page" element={<MaPage />} />
   ```
3. Ajouter le lien dans `Sidebar.jsx`
4. Ajouter les traductions dans `src/i18n/fr.js` et `en.js`

## Ajouter un nouveau signal

1. `backend/models/Lead.js` : ajouter dans l'enum `signal`
2. `backend/engine/comparator.js` : ajouter la logique dans `compareAndDetectBatch()`
3. `backend/engine/scheduler.js` : ajouter le compteur dans `runCounts`
4. `frontend/src/components/ui/SignalAlerts.jsx` : ajouter le son et le toast
5. `frontend/src/components/ui/index.jsx` : ajouter dans `SignalBadge` et `StatusBadge`
6. Créer la page frontend + route + lien Sidebar

## Ajouter une ville sur la carte

Dans `frontend/src/pages/MapPage.jsx`, objet `CITY_COORDS` :
```javascript
'nom-ville': [lat, lng],
```
(clé en minuscules)

Et dans `backend/data/cities.js` pour le filtrage backend.

## Changer le score

Dans `backend/engine/scorer.js`, modifier les seuils de fraîcheur ou les points par catégorie.

## Ajouter un secteur prioritaire

Dans `backend/data/sectors.js`, ajouter le code SCIAN dans la catégorie A, B ou C.

## Modifier le PDF

Dans `frontend/src/utils/pdf.js` :
- Format A4 = 210×297 mm
- Coordonnées `(x, y)` en millimètres depuis le coin supérieur-gauche
- La marque "SecuLeads" est dans l'en-tête

## Ajouter un champ à la base de données

1. `backend/models/Lead.js` → ajouter le champ au Schema Mongoose
2. `backend/engine/filter.js` → extraire du CSV et inclure dans le batch
3. Frontend → afficher dans les cartes de leads

## Changer le batch size

Dans `backend/engine/filter.js` :
```javascript
const BATCH_SIZE = 50000;
```
Augmenter = moins d'allers-retours MongoDB mais plus de RAM. Diminuer = moins de RAM mais plus d'allers-retours.

## Activer le planificateur automatique (cron)

Actuellement le moteur se lance uniquement manuellement. Pour automatiser :
Dans `backend/routes/engine.js`, `POST /api/engine/start` → configurer `node-cron` avec l'interval souhaité (ex: tous les lundis à 3h).

## Ajouter un champ au CRM

1. `backend/models/CRM.js` → ajouter le champ
2. `backend/routes/crm.js` → inclure dans le PATCH
3. Frontend page CRM → afficher et éditer le champ

---

# 17. RISQUES ET LIMITES

| Risque | Impact | Mitigation en place |
|--------|--------|---------------------|
| RAM — Etablissements.csv | ~1 Go chargé en RAM (Map NEQ) | `--max-old-space-size=4096` → 4 Go alloués |
| RAM — Nom.csv | ~200 Mo en RAM (Map NEQ → nom) | Inclus dans les 4 Go |
| Ancienne limite RAM — Set 2,9M NEQs | ~250 Mo supplémentaires | **Supprimé** — remplacé par champ `lastRunId` MongoDB |
| Téléchargement — site gouvernement inaccessible | Timeout 5min → erreur propre | Message d'erreur clair dans les logs |
| MongoDB non démarré | Backend refuse de démarrer | Message d'erreur au lancement |
| Ville inconnue de CITY_COORDS | Lead absent de la carte uniquement | Normal — pas un bug, lead visible dans les listes |
| Version REQ identique au jour | Run ignoré (si pas force) | Logique date + présence ZIP |
| ZIP corrompu | Magic bytes vérifiés → erreur propre | Validation 0x50 0x4B |
| Faux déménagements (espaces/casse) | Leads demenagement incorrects | `.trim().toLowerCase()` appliqué à la comparaison |
| `wmic` Windows uniquement | Espace disque = null sur Linux/Mac | Frontend gère null → affiche "N/A" |
| `nouvelle_activite` dans l'enum | Signal présent mais jamais détecté | Réservé usage futur — ne cause pas d'erreur |

---

# 18. RÉSUMÉ TECHNIQUE COMPLET

| Composant | Technologie | Note |
|-----------|-------------|------|
| Runtime backend | Node.js ≥ 18 | 4 Go RAM max configurés |
| Framework API | Express 5.x | CORS : localhost uniquement |
| WebSocket | `ws` 8.x | Port 3001 — même serveur que HTTP |
| Base de données | MongoDB local 7.x | Port 27017 |
| ODM | Mongoose 9.x | — |
| Lecture CSV streaming | `readline` (built-in Node) | Zéro chargement complet en RAM |
| Extraction ZIP | `adm-zip` | — |
| Parse CSV Etablissements | `csv-parse` | Détection délimiteur auto |
| HTTP client backend | `axios` | Pour API CKAN + tests/check-download |
| Email résumé | `nodemailer` | Envoi automatique post-run |
| Export Excel | `xlsx` | Route `/api/leads/export-excel` |
| Détection fermetures | MongoDB `lastRunId` | Zéro Set en RAM — requête $ne runId |
| Framework frontend | React 18 | — |
| Build tool | Vite 8.x | HMR en développement |
| Router | React Router 6 | Navigate redirect sur "/" |
| State management | Zustand 4.x | Persist localStorage pour lang/theme |
| Carte | Leaflet + react-leaflet | OpenStreetMap, zéro API payante |
| Graphiques | Chart.js + react-chartjs-2 | Bar + Doughnut |
| PDF | jsPDF 2.x | 100% côté client, marque "SecuLeads" |
| CSS | Variables CSS | Thèmes dark/light |
| Traduction | Système maison useT | FR + EN |
| Sons | Web Audio API | Zéro fichier audio |
| Géolocalisation | Table hardcodée CITY_COORDS | ~150 villes, zéro API |
| Confirmations UI | `ConfirmModal` | Tous les boutons dangereux — zéro window.confirm() |

---

*Rapport généré le 24 avril 2026 — Projet Jinbe*
*Ce document couvre l'intégralité du projet backend + frontend + engine + données.*
*Dernière mise à jour : architecture WebSocket unifiée port 3001, RAM optimisée (lastRunId), CRM route montée, ConfirmModal sur tous les boutons dangereux.*
