// Script pour tester la connexion à la base de données
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI || 'Non défini');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sailingloc';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connexion réussie !');
    console.log('📊 État de la connexion:', mongoose.connection.readyState);
    
    // Tester une requête simple
    const User = require('./server/models/User.cjs');
    const userCount = await User.countDocuments();
    console.log('👥 Nombre d\'utilisateurs:', userCount);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Connexion fermée');
  }
}

testConnection();
