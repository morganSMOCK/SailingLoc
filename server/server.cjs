const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes.cjs');
const boatRoutes = require('./routes/boatRoutes.cjs');
const bookingRoutes = require('./routes/bookingRoutes.cjs');
const paymentRoutes = require('./routes/paymentRoutes.cjs');
const contactRoutes = require('./routes/contactRoutes.cjs');

const app = express();

// Connexion à MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sailingloc';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion à MongoDB réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

// Initialiser la connexion à la base de données
connectDB();

// CORS avant les routes
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://sailing-loc.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les outils sans origin (ex: cURL, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origine non autorisée par CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Préflight
app.options('*', cors());

// Parsers
app.use(express.json());

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    env: process.env.NODE_ENV || 'development',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Gestion d'erreurs globale
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API démarrée sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


