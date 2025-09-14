// Serveur de test simple pour tester la page boat.html
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Servir les fichiers statiques
app.use(express.static('.'));

// Route de test pour l'API des bateaux
app.get('/api/boats/:id', (req, res) => {
  const { id } = req.params;
  
  // Données de test
  const mockBoat = {
    _id: id,
    name: 'Ocean Dream',
    type: 'Yacht',
    category: 'Luxe',
    status: 'available',
    description: 'Un yacht de luxe exceptionnel pour des croisières inoubliables. Équipé des dernières technologies et offrant un confort incomparable.',
    location: {
      marina: 'Port de Cannes',
      city: 'Cannes',
      country: 'France'
    },
    capacity: {
      maxPeople: 8
    },
    specifications: {
      length: 15,
      width: 4.5,
      fuelType: 'Diesel'
    },
    pricing: {
      dailyRate: 850,
      securityDeposit: 2000
    },
    amenities: ['GPS', 'Radio', 'Cuisine équipée', '3 Cabines', '2 Douches', 'Pont solarium'],
    imageUrls: [
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
    ],
    reviews: [
      {
        rating: 5,
        comment: 'Excellent bateau, très confortable ! L\'équipage était parfait.',
        user: { firstName: 'Jean', fullName: 'Jean Dupont' },
        date: new Date(Date.now() - 86400000).toISOString()
      },
      {
        rating: 4,
        comment: 'Très belle expérience, je recommande !',
        user: { firstName: 'Marie', fullName: 'Marie Martin' },
        date: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  };

  if (id === 'invalid-id') {
    return res.status(404).json({
      success: false,
      message: 'Bateau non trouvé'
    });
  }

  res.json({
    success: true,
    data: { boat: mockBoat }
  });
});

// Route pour tous les bateaux
app.get('/api/boats', (req, res) => {
  res.json({
    success: true,
    data: {
      boats: [
        {
          _id: 'test-boat-1',
          name: 'Ocean Dream',
          type: 'Yacht',
          category: 'Luxe',
          status: 'available',
          location: { city: 'Cannes', country: 'France' },
          pricing: { dailyRate: 850 },
          capacity: { maxPeople: 8 },
          imageUrls: ['https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop']
        }
      ],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`📄 Page de test: http://localhost:${PORT}/test-boat-detail.html`);
  console.log(`🛥️  Page bateau: http://localhost:${PORT}/boat.html?id=test-boat-1`);
});
