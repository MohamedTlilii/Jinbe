// ============================================
// db/connection.js — Connexion MongoDB
// ============================================
// Ce fichier gère la connexion à MongoDB local.
// MongoDB doit être installé et démarré sur ta machine.
// Installation : https://www.mongodb.com/try/download/community
// ============================================

const mongoose = require('mongoose');

// Fonction principale de connexion
const connectDB = async () => {
  try {
    // URL MongoDB depuis le fichier .env
    // Modifier MONGODB_URL dans .env si besoin
    const conn = await mongoose.connect(process.env.MONGODB_URL);

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    console.log(`📦 Base de données : ${conn.connection.name}`);

    // Écoute les erreurs après la connexion initiale
    mongoose.connection.on('error', (err) => {
      console.error(`❌ Erreur MongoDB : ${err.message}`);
    });

    // Log quand la connexion est perdue
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté — tentative de reconnexion...');
    });

    // Log quand reconnecté
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnecté');
    });

  } catch (error) {
    console.error(`❌ Impossible de se connecter à MongoDB : ${error.message}`);
    console.error('➡️  Vérifie que MongoDB est démarré sur ta machine');
    console.error('➡️  Commande pour démarrer : mongod --dbpath /data/db');
    process.exit(1); // Arrête l'app si MongoDB inaccessible
  }
};

// Fonction pour fermer proprement la connexion
// Appelée lors de l'arrêt du serveur
const closeDB = async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB déconnecté proprement');
};

module.exports = { connectDB, closeDB };
