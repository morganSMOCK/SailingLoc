import mongoose from 'mongoose';
import Boat from './server/models/Boat.cjs';

// Configuration de la base de données
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sailingloc';

async function debugImages() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n📊 Analyse des données d\'images des bateaux:');
    console.log('=' .repeat(60));

    // Récupérer quelques bateaux avec leurs images
    const boats = await Boat.find({}, { 
      name: 1, 
      images: 1, 
      imageUrls: 1,
      type: 1,
      category: 1,
      isActive: 1
    }).limit(5).lean();

    console.log(`\n📈 Nombre de bateaux trouvés: ${boats.length}`);
    
    boats.forEach((boat, index) => {
      console.log(`\n🚤 Bateau ${index + 1}: ${boat.name}`);
      console.log(`   Type: ${boat.type}, Catégorie: ${boat.category}`);
      console.log(`   Actif: ${boat.isActive}`);
      console.log(`   Images (array): ${JSON.stringify(boat.images, null, 4)}`);
      console.log(`   ImageUrls (virtual): ${JSON.stringify(boat.imageUrls, null, 4)}`);
      
      // Analyser la structure des images
      if (boat.images && boat.images.length > 0) {
        console.log(`   📸 Structure des images:`);
        boat.images.forEach((img, imgIndex) => {
          console.log(`      Image ${imgIndex + 1}:`);
          console.log(`        - URL: ${img.url}`);
          console.log(`        - isMain: ${img.isMain}`);
          console.log(`        - filename: ${img.filename}`);
          console.log(`        - originalName: ${img.originalName}`);
        });
      } else {
        console.log(`   ❌ Aucune image trouvée`);
      }
    });

    // Vérifier les bateaux avec des images
    const boatsWithImages = await Boat.find({ 
      $or: [
        { 'images.0': { $exists: true } },
        { 'imageUrls.0': { $exists: true } }
      ]
    }, { name: 1, images: 1 }).countDocuments();

    console.log(`\n📊 Statistiques:`);
    console.log(`   Bateaux avec images: ${boatsWithImages}`);
    console.log(`   Total de bateaux: ${await Boat.countDocuments()}`);

    // Vérifier les URLs d'images
    const allBoats = await Boat.find({}, { images: 1 }).lean();
    const imageUrls = [];
    allBoats.forEach(boat => {
      if (boat.images) {
        boat.images.forEach(img => {
          if (img.url) {
            imageUrls.push(img.url);
          }
        });
      }
    });

    console.log(`\n🔗 Analyse des URLs d'images:`);
    const uniqueUrls = [...new Set(imageUrls)];
    console.log(`   URLs uniques: ${uniqueUrls.length}`);
    uniqueUrls.slice(0, 5).forEach(url => {
      console.log(`   - ${url}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugImages();
