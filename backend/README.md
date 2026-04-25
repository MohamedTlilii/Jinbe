# Sécurité Leads — Backend Moteur
## Guide d'installation complet

---

## Ce que ce backend fait exactement

1. Vérifie chaque jour à 3h si un nouveau fichier REQ existe
2. Télécharge le ZIP officiel (225 Mo) depuis Données Québec
3. Extrait et parse les 6 fichiers CSV
4. Filtre par tes 15 villes + secteurs PME
5. Détecte : nouvelles entreprises, réouvertures, déménagements
6. Calcule un score 1-6 pour chaque lead
7. Sauvegarde en MongoDB
8. Envoie les logs en temps réel au frontend via WebSocket

---

## Prérequis

### 1. Node.js (version 18 ou plus)
Télécharger : https://nodejs.org/
Vérifier : `node --version`

### 2. MongoDB Community (gratuit)
Télécharger : https://www.mongodb.com/try/download/community
Installer et démarrer :
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows
# Installer via le .msi téléchargé
# MongoDB se lance automatiquement comme service Windows

# Linux (Ubuntu)
sudo systemctl start mongod
```

Vérifier que MongoDB tourne : `mongosh` (doit ouvrir le shell)

---

## Installation

```bash
# 1. Aller dans le dossier backend
cd securite-leads-app/backend

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Le fichier .env est déjà créé — vérifier les valeurs
cat .env

# 4. Démarrer en mode développement
npm run dev

# 5. Vérifier que le serveur tourne
# Ouvrir : http://localhost:3001/api/health
# Doit répondre : {"status":"ok",...}
```

---

## Structure des fichiers

```
backend/
  server.js          ← Point d'entrée — démarrer ici
  .env               ← Configuration (MongoDB URL, ports)
  package.json       ← Dépendances npm

  engine/
    index.js         ← Moteur complet (downloader + extractor + filter + scorer + scheduler)

  models/
    index.js         ← Modèles MongoDB Lead + CRM
    Settings.js      ← Modèle paramètres

  routes/
    index.js         ← Toutes les routes API

  data/
    cities.js        ← 15 villes cibles (modifier pour ajouter/retirer)
    sectors.js       ← Secteurs PME + exclusions (modifier pour ajouter/retirer)

  db/
    connection.js    ← Connexion MongoDB
```

---

## Routes API disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/health | Santé du serveur |
| GET | /api/engine/status | Statut du moteur |
| POST | /api/engine/start | Démarrer le moteur auto |
| POST | /api/engine/stop | Arrêter le moteur |
| POST | /api/engine/run | Lancer recherche manuelle |
| GET | /api/leads | Lister les leads |
| GET | /api/leads/calendar | Leads par jour (calendrier) |
| PATCH | /api/leads/:id/status | Changer statut lead |
| DELETE | /api/leads/:id | Supprimer un lead |
| GET | /api/crm | Lister le CRM |
| PATCH | /api/crm/:id | Modifier entrée CRM |
| DELETE | /api/crm/:id | Supprimer entrée CRM |
| GET | /api/crm/export | Exporter CRM en CSV |
| GET | /api/stats/:year | Stats pour une année |
| GET | /api/settings | Lire paramètres |
| PATCH | /api/settings | Modifier paramètres |

---

## WebSocket — Logs temps réel

Connexion depuis le frontend :
```javascript
const ws = new WebSocket('ws://localhost:3002');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type : 'log' | 'progress' | 'done' | 'connected'
  // data.message : texte du log
  // data.step : étape en cours (pour progress)
  // data.percent : 0-100 (pour progress)
};
```

---

## Modifier les villes et secteurs

### Ajouter une ville
Dans `data/cities.js`, ajouter un objet :
```javascript
{
  id: 'ma-ville',
  name: 'Ma Ville',
  active: true,
  variants: ['Ma Ville', 'MA VILLE', 'ma ville'],
}
```

### Désactiver une ville
Dans `data/cities.js`, changer `active: false`

### Ajouter un secteur
Dans `data/sectors.js`, ajouter dans SECTORS :
```javascript
{
  id: 'mon-secteur',
  name: 'Mon Secteur',
  category: 'retail',
  score: 2,
  keywords: ['mot-clé 1', 'mot-clé 2'],
}
```

### Ajouter une exclusion
Dans `data/sectors.js`, ajouter dans EXCLUDED_KEYWORDS :
```javascript
'mon mot exclu',
```

---

## Prochaine étape

Une fois ce backend démarré et fonctionnel → Étape 2 : Frontend React
