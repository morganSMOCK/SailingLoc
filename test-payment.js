// Test de l'endpoint de paiement
async function testPaymentEndpoint() {
  console.log('💳 Test de l\'endpoint de paiement...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/payments/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Token de test
      },
      body: JSON.stringify({
        boatId: '68c760daad2396a80f379fe9',
        boatName: 'ANAS',
        startDate: '2024-09-20',
        endDate: '2024-09-22',
        totalPrice: 400,
        customerEmail: 'test@example.com',
        customerName: 'Test User'
      })
    });
    
    console.log('📊 Réponse de l\'API:');
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Data:', data);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testPaymentEndpoint();
