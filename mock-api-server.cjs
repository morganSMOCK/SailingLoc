// Serveur de test simple pour simuler l'API sans MongoDB
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Fonction pour valider un ObjectId MongoDB (format 24 caractères hexadécimaux)
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Données de test
const mockBoats = {
  '68c717e123456789abcdef01': {
    _id: '68c717e123456789abcdef01',
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
  }
};

// Route pour récupérer un bateau par ID
app.get('/api/boats/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Demande de bateau avec ID: ${id}`);
  
  // Validation de l'ID
  if (!isValidObjectId(id)) {
    console.log(`❌ ID invalide: ${id}`);
    return res.status(400).json({
      success: false,
      message: 'ID de bateau invalide'
    });
  }
  
  const boat = mockBoats[id];
  
  if (!boat) {
    console.log(`❌ Bateau non trouvé: ${id}`);
    return res.status(404).json({
      success: false,
      message: 'Bateau non trouvé'
    });
  }

  console.log(`✅ Bateau trouvé: ${boat.name}`);
  res.json({
    success: true,
    data: { boat }
  });
});

// Route pour récupérer tous les bateaux
app.get('/api/boats', (req, res) => {
  console.log('🔍 Demande de tous les bateaux');
  res.json({
    success: true,
    data: {
      boats: Object.values(mockBoats),
      pagination: { page: 1, limit: 12, total: Object.keys(mockBoats).length, pages: 1 }
    }
  });
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API de test fonctionne !', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur API:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API de test démarré sur http://localhost:${PORT}`);
  console.log(`📄 Test API: http://localhost:${PORT}/api/test`);
  console.log(`🛥️  Test bateau: http://localhost:${PORT}/api/boats/68c717e123456789abcdef01`);
  console.log(`📋 Tous les bateaux: http://localhost:${PORT}/api/boats`);
  console.log(`🔗 CORS configuré pour: http://localhost:5173`);
});
