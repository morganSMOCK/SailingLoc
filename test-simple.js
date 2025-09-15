// Test simple de l'API
setTimeout(async () => {
  try {
    console.log('🔍 Test de l\'API...');
    
    // Test de l'endpoint de santé
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test de l'endpoint de paiement (sans authentification d'abord)
    const paymentResponse = await fetch('http://localhost:3000/api/payments/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boatId: 'test',
        boatName: 'Test Boat',
        startDate: '2024-09-20',
        endDate: '2024-09-22',
        totalPrice: 100
      })
    });
    
    console.log('💳 Payment endpoint status:', paymentResponse.status);
    const paymentData = await paymentResponse.json();
    console.log('Payment response:', paymentData);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}, 3000); // Attendre 3 secondes que le serveur démarre
