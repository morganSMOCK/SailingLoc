/**
 * Script de test pour vérifier les URLs d'images
 * Usage: node server/test-image-urls.cjs
 */

const mongoose = require('mongoose');
const Boat = require('./models/Boat.cjs');
require('dotenv').config();

async function testImageUrls() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sailingloc';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connexion à MongoDB réussie');
    
    // Récupérer tous les bateaux
    console.log('🔍 Recherche des bateaux...');
    const boats = await Boat.find({});
    console.log(`📊 ${boats.length} bateaux trouvés`);
    
    let problematicBoats = 0;
    
    for (const boat of boats) {
      let hasProblems = false;
      
      // Vérifier les images principales
      if (boat.images && Array.isArray(boat.images)) {
        for (const img of boat.images) {
          if (img.url && img.url.includes('sailingloc.onrender.comhttps//')) {
            console.log(`❌ URL malformée trouvée dans ${boat.name}: ${img.url}`);
            hasProblems = true;
          }
        }
      }
      
      // Vérifier imageUrls (legacy)
      if (boat.imageUrls && Array.isArray(boat.imageUrls)) {
        for (const img of boat.imageUrls) {
          const url = typeof img === 'string' ? img : img.url;
          if (url && url.includes('sailingloc.onrender.comhttps//')) {
            console.log(`❌ URL malformée trouvée dans ${boat.name}: ${url}`);
            hasProblems = true;
          }
        }
      }
      
      // Vérifier imageUrl (legacy)
      if (boat.imageUrl && boat.imageUrl.includes('sailingloc.onrender.comhttps//')) {
        console.log(`❌ URL malformée trouvée dans ${boat.name}: ${boat.imageUrl}`);
        hasProblems = true;
      }
      
      if (hasProblems) {
        problematicBoats++;
      }
    }
    
    console.log(`\n📊 Résultats:`);
    console.log(`   - Bateaux avec URLs problématiques: ${problematicBoats}`);
    console.log(`   - Bateaux sans problème: ${boats.length - problematicBoats}`);
    
    if (problematicBoats === 0) {
      console.log('🎉 Toutes les URLs sont correctes !');
    } else {
      console.log('⚠️ Des URLs nécessitent une correction. Exécutez: node server/fix-image-urls.cjs');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
    process.exit(0);
  }
}

// Exécuter le test
testImageUrls();
