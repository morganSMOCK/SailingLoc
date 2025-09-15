// Test rapide de l'API
fetch('https://sailingloc.onrender.com/api/boats')
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Status:', data.success);
    if (data.data?.boats?.[0]) {
      const boat = data.data.boats[0];
      console.log('🚤 Bateau:', boat.name);
      console.log('🖼️ Images:', boat.images?.length || 0);
      console.log('📸 CoverImageUrl:', boat.coverImageUrl);
      if (boat.images?.[0]) {
        console.log('🔗 Première image URL:', boat.images[0].url);
      }
    }
  })
  .catch(err => console.error('❌ Erreur:', err.message));
