// data/sectors.js — Secteurs PME ciblés

const SECTORS = [

  // ================================================================
  // 1 — DIVERS
  // ================================================================
  { id: 'coiffure',          name: 'Coiffure',                   category: 'divers', score: 2, keywords: ['coiffure', 'coiffeur', 'salon de coiffure', 'barbier', 'barbershop', 'barber'] },
  { id: 'esthetique',        name: 'Esthétique',                 category: 'divers', score: 2, keywords: ['esthétique', 'esthéticienne', 'soins esthétiques', 'soins de beauté', 'onglerie', 'nail'] },
  { id: 'gym',               name: 'Salle de sport',             category: 'divers', score: 2, keywords: ['gym', 'gymnase', 'fitness', 'entraînement', 'centre de conditionnement', 'musculation', 'crossfit', 'yoga', 'pilates', 'arts martiaux', 'boxe', 'karaté'] },
  { id: 'vape',              name: 'Vape',                       category: 'divers', score: 2, keywords: ['vape', 'vapotage', 'cigarette électronique', 'e-cigarette'] },
  { id: 'cafe',              name: 'Café',                       category: 'divers', score: 3, keywords: ['café', 'cafétéria', 'coffee shop', 'bistro', 'bistrot'] },
  { id: 'garderie',          name: 'Garderie',                   category: 'divers', score: 2, keywords: ['garderie', 'halte-garderie', 'centre de la petite enfance', 'cpe', 'service de garde', 'garde éducative', 'éducatrice à la petite enfance'] },
  { id: 'couture',           name: 'Couture',                    category: 'divers', score: 1, keywords: ['couture', 'retouche', 'confection', 'tailleur'] },
  { id: 'tatouage',          name: 'Tatouage',                   category: 'divers', score: 2, keywords: ['tatouage', 'tattoo', 'piercing', 'studio de tatouage'] },
  { id: 'auto-ecole',        name: 'Auto-école',                 category: 'divers', score: 1, keywords: ['auto-école', 'école de conduite', 'conduite automobile'] },
  { id: 'agence-voyage',     name: 'Agence de voyage',           category: 'divers', score: 1, keywords: ['agence de voyage', 'voyage', 'agent de voyage', 'tourisme'] },
  { id: 'alim-specialisee',  name: 'Alimentation spécialisée',   category: 'divers', score: 2, keywords: ['alimentation spécialisée', 'épicerie fine', 'produits fins', 'produits naturels', 'produits biologiques', 'bio', 'produits ethniques'] },
  { id: 'joaillier',         name: 'Joaillier',                  category: 'divers', score: 3, keywords: ['joaillier', 'bijouterie', 'bijoutier', 'joaillerie', 'orfèvrerie', 'diamants', 'montres de luxe'] },
  { id: 'rembourrage',       name: 'Rembourrage',                category: 'divers', score: 1, keywords: ['rembourrage', 'tapissier', 'capitonnage', 'rembourreur'] },
  { id: 'usinage',           name: 'Ateliers d\'usinage',        category: 'divers', score: 2, keywords: ['usinage', 'atelier d\'usinage', 'machinerie', 'pièces usinées', 'tournage', 'fraisage'] },
  { id: 'nettoyage',         name: 'Nettoyage',                  category: 'divers', score: 1, keywords: ['nettoyage', 'entretien ménager', 'nettoyage commercial', 'ménage', 'nettoyage à sec', 'pressing', 'blanchisserie', 'laverie'] },
  { id: 'formation',         name: 'Formation et éducation',     category: 'divers', score: 1, keywords: ['centre de formation', 'formation professionnelle', 'académie', 'studio de danse', 'cours de musique', 'école de musique', 'école de danse'] },
  { id: 'courtier-assurance', name: 'Courtier assurance/hypothèque', category: 'divers', score: 1, keywords: ['courtier hypothécaire', 'courtier d\'assurance', 'hypothèque', 'assurance vie', 'assurance habitation', 'cabinet d\'assurance'] },
  { id: 'inspecteur-bat',    name: 'Inspecteur en bâtiment',     category: 'divers', score: 1, keywords: ['inspecteur en bâtiment', 'inspection immobilière', 'inspection de bâtiment'] },
  { id: 'courtier-immo',     name: 'Courtier immobilier',        category: 'divers', score: 1, keywords: ['courtier immobilier', 'agent immobilier', 'agence immobilière', 'courtage immobilier'] },
  { id: 'vetements-pro',     name: 'Vêtements professionnels',   category: 'divers', score: 1, keywords: ['vêtements professionnels', 'uniformes', 'vêtements de travail', 'broderie', 'sérigraphie'] },
  { id: 'mineraux',          name: 'Produits minéraux',          category: 'divers', score: 1, keywords: ['produits minéraux', 'matériaux de construction', 'béton', 'ciment', 'briques', 'granit', 'marbre'] },
  { id: 'comptabilite',      name: 'Comptabilité',               category: 'divers', score: 1, keywords: ['comptabilité', 'tenue de livres', 'cabinet comptable', 'fiscalité', 'services comptables'] },
  { id: 'conciergerie',      name: 'Conciergerie et entretien',  category: 'divers', score: 1, keywords: ['conciergerie', 'entretien d\'immeuble', 'gestion d\'immeuble', 'syndic'] },
  { id: 'extermination',     name: 'Désinfection et extermination', category: 'divers', score: 2, keywords: ['désinfection', 'extermination', 'exterminateur', 'dératisation', 'désinfestation', 'nuisibles', 'insectes'] },
  { id: 'location',          name: 'Services de location',       category: 'divers', score: 1, keywords: ['location d\'équipement', 'location d\'outils', 'location de matériel', 'centre de location'] },
  { id: 'publicite',         name: 'Services de publicité',      category: 'divers', score: 1, keywords: ['agence de publicité', 'publicité', 'marketing', 'communication', 'graphisme', 'signalisation', 'enseigne'] },
  { id: 'soudure',           name: 'Soudeur',                    category: 'divers', score: 2, keywords: ['soudure', 'soudeur', 'soudage', 'ferblanterie', 'ferronnerie'] },
  { id: 'recyclage',         name: 'Recyclage',                  category: 'divers', score: 1, keywords: ['recyclage', 'récupération', 'matières résiduelles', 'ferraille', 'métaux recyclés'] },
  { id: 'photographie',      name: 'Photographie',               category: 'divers', score: 1, keywords: ['photographie', 'photographe', 'studio photo', 'studio photographique'] },
  { id: 'transport',         name: 'Services de transport',      category: 'divers', score: 2, keywords: ['service de transport', 'livraison', 'déménagement', 'camionnage', 'messagerie', 'courrier'] },
  { id: 'spa',               name: 'Spa',                        category: 'divers', score: 2, keywords: ['spa', 'centre de santé', 'détente', 'balnéothérapie'] },
  { id: 'massage',           name: 'Massothérapie',              category: 'divers', score: 2, keywords: ['massothérapie', 'massage', 'massothérapeute'] },

  // ================================================================
  // 2 — COMMERCE
  // ================================================================
  { id: 'boucherie',         name: 'Boucherie',                  category: 'commerce', score: 3, keywords: ['boucherie', 'boucher', 'viandes', 'charcuterie'] },
  { id: 'epicerie',          name: 'Épicerie / Dépanneur',       category: 'commerce', score: 3, keywords: ['épicerie', 'alimentation', 'marché d\'alimentation', 'dépanneur', 'supermarché', 'marché'] },
  { id: 'animalerie',        name: 'Animalerie',                 category: 'commerce', score: 2, keywords: ['animalerie', 'animaux de compagnie', 'animaux domestiques'] },
  { id: 'fleuriste',         name: 'Fleuriste',                  category: 'commerce', score: 2, keywords: ['fleuriste', 'fleurs', 'arrangements floraux', 'boutique florale'] },
  { id: 'poissonnerie',      name: 'Poissonnerie',               category: 'commerce', score: 2, keywords: ['poissonnerie', 'fruits de mer', 'poisson', 'poissonnière'] },
  { id: 'friperie',          name: 'Friperie',                   category: 'commerce', score: 2, keywords: ['friperie', 'vêtements usagés', 'seconde main', 'occasion'] },
  { id: 'antiquites',        name: 'Antiquités',                 category: 'commerce', score: 2, keywords: ['antiquités', 'antiquaire', 'objets anciens', 'brocante'] },
  { id: 'librairie',         name: 'Librairie',                  category: 'commerce', score: 2, keywords: ['librairie', 'livres', 'papeterie', 'bouquinerie'] },
  { id: 'nourriture-animaux', name: 'Nourriture animaux',        category: 'commerce', score: 2, keywords: ['nourriture pour animaux', 'aliments animaux', 'aliments pour animaux'] },
  { id: 'lunetier',          name: 'Lunetier',                   category: 'commerce', score: 2, keywords: ['lunetier', 'optique', 'lunettes', 'opticien', 'centre optique'] },
  { id: 'peinture-commerce', name: 'Peinture / vitrerie',        category: 'commerce', score: 2, keywords: ['peinture', 'papier peint', 'revêtements muraux', 'décoration murale'] },
  { id: 'commerce-gros',     name: 'Commerce en gros',           category: 'commerce', score: 1, keywords: ['commerce en gros', 'grossiste', 'distribution en gros', 'importateur', 'exportateur'] },
  { id: 'fruits-legumes',    name: 'Fruits et légumes',          category: 'commerce', score: 2, keywords: ['fruits et légumes', 'maraîcher', 'primeurs', 'marché de fruits'] },
  { id: 'vetements',         name: 'Vêtements',                  category: 'commerce', score: 2, keywords: ['boutique de vêtements', 'mode', 'habillement', 'vêtements pour enfants', 'lingerie', 'chaussures', 'accessoires de mode'] },
  { id: 'moto-motoneige',    name: 'Motos et motoneiges',        category: 'commerce', score: 3, keywords: ['motocyclette', 'motoneige', 'moto', 'quad', 'véhicule tout-terrain', 'vtt', 'scooter'] },
  { id: 'informatique',      name: 'Informatique',               category: 'commerce', score: 2, keywords: ['informatique', 'ordinateur', 'matériel informatique', 'réparation informatique', 'téléphones', 'cellulaires', 'tablettes'] },
  { id: 'electromenager',    name: 'Électroménager',             category: 'commerce', score: 2, keywords: ['électroménager', 'appareils ménagers', 'électro-ménager', 'appareils électroménagers'] },
  { id: 'horlogerie',        name: 'Montres et horlogerie',      category: 'commerce', score: 3, keywords: ['horlogerie', 'montres', 'horloger', 'réparation de montres', 'bijoux montres'] },
  { id: 'distribution-eau',  name: 'Distribution d\'eau',        category: 'commerce', score: 1, keywords: ['distribution d\'eau', 'eau en bouteille', 'purification d\'eau', 'eau purifiée'] },
  { id: 'ameublement',       name: 'Ameublement et décoration',  category: 'commerce', score: 2, keywords: ['ameublement', 'meubles', 'mobilier', 'décoration maison', 'décoration intérieure', 'literie'] },
  { id: 'produits-capillaires', name: 'Produits capillaires',    category: 'commerce', score: 2, keywords: ['produits capillaires', 'produits de beauté', 'cosmétiques', 'beauté', 'soins capillaires'] },
  { id: 'equipements',       name: 'Équipements',                category: 'commerce', score: 2, keywords: ['équipements sportifs', 'équipements de loisirs', 'matériel de sport', 'équipements outdoor'] },

  // ================================================================
  // 3 — AUTO
  // ================================================================
  { id: 'esthetique-auto',   name: 'Esthétique auto',            category: 'auto', score: 3, keywords: ['esthétique automobile', 'détailing', 'polish', 'lavage intérieur', 'nettoyage auto'] },
  { id: 'lave-auto',         name: 'Lave-auto',                  category: 'auto', score: 3, keywords: ['lave-auto', 'lavage auto', 'station de lavage', 'lavage de voiture'] },
  { id: 'mecanique',         name: 'Mécanique et pneus',         category: 'auto', score: 3, keywords: ['mécanique', 'garage', 'réparation automobile', 'atelier mécanique', 'pneus', 'pneumatiques', 'centre du pneu', 'vidange', 'entretien auto'] },
  { id: 'carrosserie',       name: 'Carrosserie',                category: 'auto', score: 3, keywords: ['carrosserie', 'débosselage', 'peinture automobile', 'réparation carrosserie'] },
  { id: 'vente-auto',        name: 'Vente automobile',           category: 'auto', score: 3, keywords: ['vente de véhicules', 'concessionnaire', 'auto usagée', 'véhicules usagés', 'vente d\'automobiles', 'dealership'] },
  { id: 'pieces-auto',       name: 'Pièces auto',                category: 'auto', score: 3, keywords: ['pièces automobiles', 'pièces de rechange', 'accessoires automobiles', 'pièces de voiture'] },
  { id: 'pare-brise',        name: 'Pare-brise',                 category: 'auto', score: 3, keywords: ['pare-brise', 'vitres automobiles', 'remplacement pare-brise', 'reparation pare-brise'] },
  { id: 'remorquage',        name: 'Remorquage',                 category: 'auto', score: 2, keywords: ['remorquage', 'dépannage routier', 'service de remorquage', 'remorque'] },

  // ================================================================
  // 4 — FOOD
  // ================================================================
  { id: 'pizzeria',          name: 'Pizzeria',                   category: 'food', score: 3, keywords: ['pizzeria', 'pizza'] },
  { id: 'restaurant',        name: 'Restaurant',                 category: 'food', score: 3, keywords: ['restaurant', 'resto', 'restauration', 'cantine', 'rôtisserie', 'grillade', 'sushi', 'pho', 'cuisine'] },
  { id: 'brunch',            name: 'Restaurant de déjeuners',    category: 'food', score: 3, keywords: ['brunch', 'déjeuner', 'café-restaurant', 'restaurant de déjeuners', 'petit-déjeuner'] },
  { id: 'boulangerie',       name: 'Boulangerie',                category: 'food', score: 3, keywords: ['boulangerie', 'pâtisserie', 'boulanger', 'viennoiserie', 'croissanterie'] },
  { id: 'traiteur',          name: 'Traiteur',                   category: 'food', score: 2, keywords: ['traiteur', 'service traiteur', 'cuisine traiteur', 'repas livrés'] },
  { id: 'desserts',          name: 'Desserts et confiseries',    category: 'food', score: 2, keywords: ['desserts congelés', 'crème glacée', 'gelato', 'glaces', 'confiserie', 'chocolaterie', 'chocolatier', 'bonbons', 'sucrerie', 'comptoir de glaces'] },

  // ================================================================
  // 5 — PARAMEDICAL
  // ================================================================
  { id: 'veterinaire',       name: 'Vétérinaire',                category: 'paramedical', score: 2, keywords: ['vétérinaire', 'clinique vétérinaire', 'médecin vétérinaire'] },
  { id: 'massotherapie',     name: 'Massothérapie',              category: 'paramedical', score: 2, keywords: ['massothérapie', 'massothérapeute', 'massage thérapeutique'] },
  { id: 'infirmiers',        name: 'Clinique santé',             category: 'paramedical', score: 2, keywords: ['clinique', 'soins infirmiers', 'infirmière', 'médecin', 'cabinet médical', 'centre médical'] },
  { id: 'dentiste',          name: 'Clinique dentaire',          category: 'paramedical', score: 2, keywords: ['dentiste', 'clinique dentaire', 'dentisterie', 'orthodontiste'] },
  { id: 'chiropraticien',    name: 'Chiropraticien',             category: 'paramedical', score: 2, keywords: ['chiropraticien', 'chiropractie', 'chiropracteur', 'ostéopathe', 'ostéopathie', 'physiothérapie', 'physiothérapeute', 'kinésiologue'] },

  // ================================================================
  // 6 — CONSTRUCTION
  // ================================================================
  { id: 'architecte',        name: 'Architecte',                 category: 'construction', score: 1, keywords: ['architecte', 'architecture', 'bureau d\'architectes'] },
  { id: 'designer',          name: 'Designer intérieur',         category: 'construction', score: 1, keywords: ['designer intérieur', 'design intérieur', 'décorateur', 'design d\'intérieur'] },
  { id: 'portes-fenetres',   name: 'Portes et fenêtres',         category: 'construction', score: 2, keywords: ['portes et fenêtres', 'fenêtres', 'installation fenêtres', 'remplacement fenêtres'] },
  { id: 'paysagiste',        name: 'Paysagiste',                 category: 'construction', score: 1, keywords: ['paysagiste', 'aménagement paysager', 'jardinier', 'entretien paysager'] },
  { id: 'entrepreneur',      name: 'Entrepreneur général',       category: 'construction', score: 2, keywords: ['entrepreneur général', 'entrepreneur en construction', 'gestion de construction', 'gestion de travaux', 'gérant de chantier', 'rénovation', 'rénovations'] },
  { id: 'sablage',           name: 'Sablage',                    category: 'construction', score: 1, keywords: ['sablage', 'jet de sable', 'grenaillage', 'décapage'] },
  { id: 'excavation',        name: 'Excavation',                 category: 'construction', score: 2, keywords: ['excavation', 'nivellement', 'terrassement', 'déblayage', 'remblayage'] },
  { id: 'amenagement',       name: 'Aménagement',                category: 'construction', score: 1, keywords: ['aménagement intérieur', 'aménagement de bureau', 'aménagement commercial'] },
  { id: 'hvac',              name: 'Climatisation et chauffage', category: 'construction', score: 2, keywords: ['climatisation', 'chauffage', 'ventilation', 'hvac', 'air conditionné', 'thermopompe', 'système de chauffage'] },
  { id: 'electricien',       name: 'Électricien',                category: 'construction', score: 2, keywords: ['électricien', 'électricité', 'installations électriques', 'maître électricien'] },
  { id: 'maconnerie',        name: 'Maçonnerie',                 category: 'construction', score: 2, keywords: ['maçonnerie', 'maçon', 'briquetage', 'plâtrage', 'stucco', 'béton'] },
  { id: 'plomberie',         name: 'Plomberie',                  category: 'construction', score: 2, keywords: ['plomberie', 'plombier', 'tuyauterie', 'installation sanitaire'] },
  { id: 'toiture',           name: 'Toiture',                    category: 'construction', score: 2, keywords: ['toiture', 'couvreur', 'toiturier', 'couverture de toits', 'toit', 'bardeau'] },
  { id: 'piscine',           name: 'Piscines',                   category: 'construction', score: 2, keywords: ['piscine', 'installation de piscines', 'pisciniste', 'spa extérieur', 'bain tourbillon'] },
  { id: 'ebenisterie',       name: 'Boiserie et ébénisterie',    category: 'construction', score: 2, keywords: ['ébénisterie', 'boiserie', 'menuiserie', 'ébéniste', 'armoires de cuisine', 'cuisiniste', 'armoires'] },
  { id: 'location-grues',    name: 'Location de grues',          category: 'construction', score: 1, keywords: ['location de grues', 'grue', 'équipement de levage', 'machinerie lourde'] },
  { id: 'vitrier',           name: 'Installation de vitres',     category: 'construction', score: 2, keywords: ['vitrier', 'vitrerie', 'miroiterie', 'installation de vitres', 'remplacement de vitres', 'verre'] },
  { id: 'serrurier',         name: 'Serrurier',                  category: 'construction', score: 3, keywords: ['serrurier', 'serrurerie', 'installation de serrures', 'contrôle d\'accès', 'serrures'] },
];

// ================================================================
// EXCLUSIONS — jamais de leads pour ces types
// ================================================================
const EXCLUDED_KEYWORDS = [
  'bar', 'taverne', 'brasserie', 'microbrasserie', 'distillerie',
  'vinerie', 'cave à vin', 'dégustation alcool', 'pub', 'lounge',
  'tim hortons', 'mcdonald', 'subway', 'burger king', 'starbucks',
  'costco', 'walmart', 'canadian tire', 'dollarama', 'jean coutu',
  'pharmaprix', 'metro', 'iga', 'provigo', 'maxi', 'super c',
  'église', 'temple', 'mosquée', 'synagogue',
  'organisme sans but lucratif', 'osbl', 'obnl',
  'municipalité', 'gouvernement', 'ministère',
  'école primaire', 'école secondaire', 'université', 'cégep',
  'hôpital', 'clsc',
];

const isExcluded = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return EXCLUDED_KEYWORDS.some((keyword) => lower.includes(keyword));
};

const getActiveSectors = () => SECTORS.filter((s) => s.active !== false);

const matchSector = (activityText) => {
  if (!activityText) return null;
  const lower = activityText.toLowerCase();
  if (isExcluded(lower)) return null;
  for (const sector of getActiveSectors()) {
    if (sector.keywords.some((kw) => lower.includes(kw))) return sector;
  }
  return null;
};

module.exports = { SECTORS, EXCLUDED_KEYWORDS, isExcluded, matchSector, getActiveSectors };
