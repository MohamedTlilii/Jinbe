# SOURCE DONNÉES — Registre des Entreprises du Québec (REQ)
## Tout ce qu'il faut savoir sur le fichier gouvernemental utilisé par Jinbe

*Mis à jour le 2026-05-08*

---

## Explication simple de la page gouvernement

### C'est quoi ce fichier ?

Le gouvernement du Québec publie **toutes les entreprises enregistrées au Québec** en format téléchargeable gratuitement. C'est ce fichier que Jinbe utilise.

---

### Fiche 1 — Le fichier ZIP (le vrai fichier de données)

| Info | Valeur | Explication simple |
|------|--------|-------------------|
| **Dernière modification** | 2026-04-16 | Dernière fois que le gouvernement a mis à jour le fichier — il y a 22 jours |
| **Première publication** | 2016-06-29 | Ce fichier existe depuis 2016 |
| **Type** | Données | C'est le vrai fichier avec les entreprises |
| **Taille** | 225 Mo | Gros fichier — ~2.9 millions d'entreprises |
| **Format** | ZIP | Fichier compressé qui contient les CSV |
| **Identifiant** | `eac1b5f1...` | Le numéro unique de ce fichier sur le site — c'est celui dans le `.env` de Jinbe |

---

### Fiche 2 — Le PDF de documentation

| Info | Valeur | Explication simple |
|------|--------|-------------------|
| **Dernière modification** | 2025-12-15 | Mis à jour en décembre 2025 |
| **Première publication** | 2021-04-01 | Existe depuis 2021 |
| **Type** | Documentation | C'est le **guide** qui explique les colonnes du CSV |
| **Taille** | 1 Mo | Petit fichier PDF |

> Ce PDF est important — si le gouvernement change les noms des colonnes, il mettra à jour ce PDF en premier. C'est le document à consulter si quelque chose casse.

Ce sont 2 fichiers différents :

  - Fiche 1 (ZIP) = le vrai fichier avec les 2.9M entreprises → mis à jour 16 avril 2026
  - Fiche 2 (PDF) = le guide qui explique les colonnes → mis à jour 15 décembre 2025

  Le PDF de documentation n'a pas besoin d'être mis à jour à chaque fois que les données changent — les colonnes
  restent les mêmes. Donc le PDF est plus vieux que le ZIP, c'est parfaitement logique.
---
 Oui exactement.              

  Le PDF c'est le guide officiel du gouvernement qui explique toutes les colonnes du CSV.                            
  
  Si le gouvernement renomme une colonne par exemple NEQ → ID_ENTREPRISE, il va :                                    
                                                            
  1. Changer le CSV (le vrai fichier de données)                                                                   
  2. Mettre à jour le PDF pour documenter le changement                                                            

  Donc si tu vois que la date du PDF a changé sur le site → c'est un signal d'alarme — quelque chose a changé dans la
   structure des données.

  ---
  En pratique pour toi :

  Quand tu vas sur la page gouvernement pour vérifier une mise à jour, regarde les 2 dates :

  ┌─────────┬──────────────────────┬─────────────────────────────────────────┐
  │ Fichier │     Date normale     │             Si date change              │
  ├─────────┼──────────────────────┼─────────────────────────────────────────┤
  │ ZIP     │ Change régulièrement │ Nouvelles données → lancer le moteur    │
  ├─────────┼──────────────────────┼─────────────────────────────────────────┤
  │ PDF     │ Change rarement      │ ⚠ Structure modifiée → vérifier le code │
  └─────────┴──────────────────────┴─────────────────────────────────────────┘

  Le PDF qui change = signe que Jinbe pourrait avoir besoin d'une mise à jour du code.
### Licence CC-BY-NC-SA 4.0 — c'est quoi ?

| Lettre | Signification |
|--------|--------------|
| **BY** | Tu dois créditer le gouvernement comme source |
| **NC** | Pas d'utilisation commerciale directe des données brutes |
| **SA** | Si tu partages, même licence |

Jinbe utilise les données pour **détecter des leads** — usage interne, pas de revente des données brutes. ✓

---

### Contact gouvernement

`Groupe.EOS@req.gouv.qc.ca` — si le format change ou si tu as une question sur les données, c'est l'adresse à contacter.

---

## Informations officielles

| Champ | Valeur |
|-------|--------|
| **Nom** | Registre des entreprises du Québec |
| **Diffuseur** | Registraire des entreprises du Québec |
| **Contact** | Groupe.EOS@req.gouv.qc.ca |
| **Licence** | CC-BY-NC-SA 4.0 (Attribution, pas commercial, partage identique) |
| **Format** | ZIP contenant des fichiers CSV |
| **Taille** | ~225 Mo |
| **Identifiant CKAN** | `eac1b5f1-d8c0-4690-9c51-316d44ed9d94` |

---

## Dates importantes

| Événement | Date |
|-----------|------|
| Première diffusion du fichier ZIP | 2016-06-29 |
| **Dernière modification du fichier ZIP** | **2026-04-16 10:05 EDT** |
| Dernière modification de la documentation PDF | 2025-12-15 11:36 EST |

---

## Fréquence de mise à jour

**Irrégulière** — le gouvernement ne publie pas de calendrier fixe.

Exemple observé :
- Dernière mise à jour connue : **16 avril 2026**
- Vérification : **8 mai 2026** → **aucune nouvelle mise à jour depuis 22 jours**

> Ce n'est pas hebdomadaire. Lancer le moteur chaque semaine est suffisant — si le fichier n'a pas changé, aucun nouveau lead ne sera détecté.

---

## URLs

| Ressource | URL |
|-----------|-----|
| Page officielle données ouvertes | https://www.donneesquebec.ca/recherche/dataset/entreprises-immatriculees-au-registre |
| Fichier ZIP direct (REQ) | https://www.registreentreprises.gouv.qc.ca/RQAnonymeGR/GR/GR03/GR03A2_22A_PIU_RecupDonnPub_PC/FichierDonneesOuvertes.aspx |
| API CKAN (URL dynamique du ZIP) | https://www.donneesquebec.ca/recherche/api/3/action/resource_show?id=eac1b5f1-d8c0-4690-9c51-316d44ed9d94 |
| Documentation PDF des champs | https://www.donneesquebec.ca/recherche/dataset/6f710997-b5f9-4347-893b-1a47ddb61437/resource/09008d3a-2e0e-4613-ab43-bd833f381929/download/in-5372025-11.pdf |

---

## Contenu du ZIP — 3 fichiers CSV

| Fichier | Contenu | Chargement dans Jinbe |
|---------|---------|----------------------|
| `Entreprise_*.csv` | ~2.9M lignes — NEQ, statut, date immatriculation, adresse domicile | Lu en **streaming** (jamais entier en RAM) |
| `Etablissement_*.csv` | Activité économique, adresse physique détaillée | Chargé **entier en RAM** (Map NEQ → données) |
| `Nom_*.csv` | Noms officiels des entreprises (STAT_NOM=A = nom actif) | Chargé **entier en RAM** (Map NEQ → nom) |

---

## Colonnes clés utilisées par Jinbe

### Entreprise.csv
| Colonne REQ | Utilisation dans Jinbe |
|-------------|----------------------|
| `NEQ` / `neq` | Identifiant unique — clé primaire |
| `COD_STAT_IMMAT` / `ETAT_ADMIN` | Statut → Actif / Radié / Fusionné / Inactif |
| `DAT_IMMAT` | Date de création → calcul score fraîcheur |
| `ADR_DOMCL_LIGN1_ADR` | Adresse (fallback si pas dans Établissement) |
| `ADR_DOMCL_LIGN2_ADR` | Ville (fallback) |
| `NOM` / `NOM_ASSUJ` | Nom (fallback si pas dans Nom.csv) |

### Etablissement.csv
| Colonne REQ | Utilisation dans Jinbe |
|-------------|----------------------|
| `NEQ` | Clé de jointure |
| `ACT_ECON_LIGN1` / `ACTIVITE` | Activité → matching secteur |
| `ADR_LIGN1_ADR` | Adresse physique principale |
| `ADR_LIGN2_ADR` | Ville principale |
| `ADR_LIGN4_ADR` | Code postal |

### Nom.csv
| Colonne REQ | Utilisation dans Jinbe |
|-------------|----------------------|
| `NEQ` | Clé de jointure |
| `NOM` | Nom officiel de l'entreprise |
| `STAT_NOM` | `A` = nom actif (prioritaire) |

---

## Mapping des statuts REQ → Jinbe

| Code REQ | Signification REQ | Statut dans Jinbe |
|----------|------------------|------------------|
| `IM` | Immatriculé | `Actif` |
| `RO` | Radié d'office | `Radié` |
| `RF` | Radié avec fermeture | `Radié` |
| `FU` | Fusionné | `Fusionné` |
| Autres | Tout le reste | `Inactif` |

---

## Risques si le gouvernement change le format

| Changement | Impact sur Jinbe | Détectable comment |
|------------|-----------------|-------------------|
| Nouveau nom de fichier CSV | **Aucun** — détection par mot-clé | Transparent |
| Nouveau délimiteur (`,` → `;`) | **Aucun** — détection automatique | Transparent |
| Nouvelle URL du ZIP | **Aucun** — URL récupérée via API CKAN | Transparent |
| Colonnes renommées | **Critique** — données vides/incorrectes | Leads vides dans l'interface |
| Fichiers fusionnés/supprimés | **Critique** — adresses ou noms vides | Leads sans adresse |
| ID CKAN changé | **Critique** — téléchargement impossible | Erreur au run |

> En cas de problème bizarre (0 leads, données vides, erreur téléchargement) → vérifier d'abord si le gouvernement a modifié le format sur la page officielle.

---

## Comment vérifier manuellement une mise à jour

1. Aller sur : `https://www.donneesquebec.ca/recherche/dataset/entreprises-immatriculees-au-registre`
2. Regarder **"Dernière modification (fichier ou lien)"** sous la fiche descriptive du ZIP
3. Comparer avec la date dans `backend/temp/last_version.txt` (date du dernier run Jinbe)
4. Si la date gouvernement > date Jinbe → un nouveau fichier est disponible → lancer le moteur

---

*Document créé le 2026-05-08 — Source : donneesquebec.ca — Projet Jinbe*
