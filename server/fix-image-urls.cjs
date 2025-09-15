/**
 * Script de migration pour corriger les URLs d'images malformées
 * Usage: node server/fix-image-urls.cjs
 */

const mongoose = require('mongoose');
const Boat = require('./models/Boat.cjs');
require('dotenv').config();

// Fonction pour nettoyer les URLs
function cleanImageUrl(url) {
  if (!url) return url;
  
  // Si l'URL est déjà correcte, la retourner
  if (url.startsWith('https://sailingloc.onrender.com/')) {
    return url;
  }
  
  // Si l'URL est malformée (contient sailingloc.onrender.comhttps//)
  if (url.includes('sailingloc.onrender.comhttps//')) {
    // Extraire la partie après sailingloc.onrender.comhttps//
    const cleanPart = url.split('sailingloc.onrender.comhttps//')[1];
    return `https://sailingloc.onrender.com/${cleanPart}`;
  }
  
  // Si l'URL commence par /uploads, ajouter le domaine
  if (url.startsWith('/uploads/')) {
    return `https://sailingloc.onrender.com${url}`;
  }
  
  // Si l'URL ne commence pas par http, ajouter le domaine
  if (!url.startsWith('http')) {
    return `https://sailingloc.onrender.com/${url}`;
  }
  
  return url;
}

// Fonction pour nettoyer les images d'un bateau
function cleanBoatImages(boat) {
  let hasChanges = false;
  
  // Nettoyer les images principales
  if (boat.images && Array.isArray(boat.images)) {
    boat.images = boat.images.map(img => {
      const originalUrl = img.url;
      const cleanedUrl = cleanImageUrl(originalUrl);
      
      if (originalUrl !== cleanedUrl) {
        hasChanges = true;
        console.log(`  📷 Image corrigée: ${originalUrl} → ${cleanedUrl}`);
      }
      
      return {
        ...img,
        url: cleanedUrl,
        fullUrl: cleanedUrl
      };
    });
  }
  
  // Nettoyer imageUrls (legacy)
  if (boat.imageUrls && Array.isArray(boat.imageUrls)) {
    boat.imageUrls = boat.imageUrls.map(img => {
      if (typeof img === 'string') {
        const cleanedUrl = cleanImageUrl(img);
        if (img !== cleanedUrl) {
          hasChanges = true;
          console.log(`  📷 ImageUrl corrigée: ${img} → ${cleanedUrl}`);
        }
        return {
          url: cleanedUrl,
          fullUrl: cleanedUrl
        };
      }
      
      const originalUrl = img.url;
      const cleanedUrl = cleanImageUrl(originalUrl);
      
      if (originalUrl !== cleanedUrl) {
        hasChanges = true;
        console.log(`  📷 ImageUrl corrigée: ${originalUrl} → ${cleanedUrl}`);
      }
      
      return {
        ...img,
        url: cleanedUrl,
        fullUrl: cleanedUrl
      };
    });
  }
  
  // Nettoyer imageUrl (legacy)
  if (boat.imageUrl) {
    const originalUrl = boat.imageUrl;
    const cleanedUrl = cleanImageUrl(originalUrl);
    
    if (originalUrl !== cleanedUrl) {
      hasChanges = true;
      console.log(`  📷 ImageUrl corrigée: ${originalUrl} → ${cleanedUrl}`);
      boat.imageUrl = cleanedUrl;
    }
  }
  
  return hasChanges;
}

async function fixImageUrls() {
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
    
    let totalFixed = 0;
    
    for (const boat of boats) {
      console.log(`\n🚤 Traitement du bateau: ${boat.name} (${boat._id})`);
      
      const hasChanges = cleanBoatImages(boat);
      
      if (hasChanges) {
        try {
          await boat.save();
          console.log(`  ✅ Bateau mis à jour`);
          totalFixed++;
        } catch (error) {
          console.error(`  ❌ Erreur lors de la sauvegarde:`, error.message);
        }
      } else {
        console.log(`  ℹ️ Aucune correction nécessaire`);
      }
    }
    
    console.log(`\n🎉 Migration terminée !`);
    console.log(`📊 ${totalFixed} bateaux corrigés sur ${boats.length} total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
    process.exit(0);
  }
}

// Exécuter la migration
fixImageUrls();
