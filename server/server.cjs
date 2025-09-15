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
  'https://dsp-dev-o23-g2.vercel.app', // Domaine Vercel actuel
  'https://sailing-loc.vercel.app', // Domaine de production
  'http://localhost:5173', // Développement local
  'http://localhost:3000' // Développement local alternatif
];

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les outils sans origin (ex: cURL, Postman)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Autoriser tous les domaines Vercel (pour les déploiements de preview)
    if (origin && origin.includes('.vercel.app')) {
      console.log('✅ Domaine Vercel autorisé:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origine non autorisée:', origin);
    return callback(new Error('Origine non autorisée par CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Permettre les cookies et headers d'authentification
}));

// Préflight - gérer toutes les requêtes OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Middleware de logging pour CORS
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

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


