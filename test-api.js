// Script de test pour vérifier l'API des bateaux

async function testAPI() {
  console.log('🔍 Test de l\'API des bateaux...\n');
  
  try {
    // Test de l'API
    const response = await fetch('https://sailingloc.onrender.com/api/boats');
    const data = await response.json();
    
    console.log('📊 Réponse de l\'API:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Nombre de bateaux:', data.data?.boats?.length || 0);
    
    if (data.data?.boats?.length > 0) {
      const firstBoat = data.data.boats[0];
      console.log('\n🚤 Premier bateau:');
      console.log('Nom:', firstBoat.name);
      console.log('ID:', firstBoat._id);
      console.log('Images:', firstBoat.images);
      console.log('ImageUrls:', firstBoat.imageUrls);
      console.log('CoverImageUrl:', firstBoat.coverImageUrl);
      
      if (firstBoat.images && firstBoat.images.length > 0) {
        console.log('\n🖼️ Détails des images:');
        firstBoat.images.forEach((img, index) => {
          console.log(`  Image ${index + 1}:`);
          console.log(`    URL: ${img.url}`);
          console.log(`    FullURL: ${img.fullUrl}`);
          console.log(`    IsMain: ${img.isMain}`);
          console.log(`    Filename: ${img.filename}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Test d'un bateau spécifique
async function testSpecificBoat(boatId) {
  console.log(`\n🔍 Test du bateau spécifique: ${boatId}\n`);
  
  try {
    const response = await fetch(`https://sailingloc.onrender.com/api/boats/${boatId}`);
    const data = await response.json();
    
    console.log('📊 Réponse de l\'API:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.data?.boat) {
      const boat = data.data.boat;
      console.log('\n🚤 Bateau:');
      console.log('Nom:', boat.name);
      console.log('ID:', boat._id);
      console.log('Images:', boat.images);
      console.log('ImageUrls:', boat.imageUrls);
      console.log('CoverImageUrl:', boat.coverImageUrl);
      
      if (boat.images && boat.images.length > 0) {
        console.log('\n🖼️ Détails des images:');
        boat.images.forEach((img, index) => {
          console.log(`  Image ${index + 1}:`);
          console.log(`    URL: ${img.url}`);
          console.log(`    FullURL: ${img.fullUrl}`);
          console.log(`    IsMain: ${img.isMain}`);
          console.log(`    Filename: ${img.filename}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter les tests
testAPI().then(() => {
  testSpecificBoat('68c760daad2396a80f379fe9');
});
