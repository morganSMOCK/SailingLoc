// Importation des modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Ajout du module path
const multer = require('multer'); // Ajout du module multer
require('dotenv').config();

// Importation des routes
const authRoutes = require('./routes/authRoutes.cjs');
const boatRoutes = require('./routes/boatRoutes.cjs'); // Modifié pour être une fonction
const bookingRoutes = require('./routes/bookingRoutes.cjs');
const paymentRoutes = require('./routes/paymentRoutes.cjs');

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Configuration du rate limiting pour éviter les attaques par déni de service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par IP par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});
app.use(limiter);

// Configuration CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://localhost:5173', 
    'https://sailing-loc.vercel.app',
    'https://sailing-loc.vercel.app',
    'https://sailingloc.vercel.app',
    'https://sailingloc-frontend.vercel.app',
    'https://*.vercel.app',
    /\.stackblitz\.io$/,
    /\.webcontainer\.io$/,
    /\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Middleware supplémentaire pour gérer les requêtes OPTIONS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware de debug pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('📍 Origin:', req.headers.origin);
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***';
    console.log('📊 Body:', logBody);
  }
  next();
});

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration de Multer pour le téléchargement d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/boats/'); // Dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nom du fichier
  },
});

const upload = multer({ storage: storage });
app.set('upload', upload); // Rendre l'instance multer disponible via app.set

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, '..\', 'public')));

// Connexion à MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI n\'est pas défini dans les variables d\'environnement');
  process.exit(1);
}

console.log('🔗 Tentative de connexion à MongoDB...');
console.log('🔗 URI configurée:', MONGODB_URI ? 'Oui' : 'Non');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connexion à MongoDB Atlas réussie');
  console.log('📊 Base de données:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ Erreur de connexion à MongoDB:', error);
  console.error('💡 Vérifiez que MONGODB_URI est correctement configuré dans les variables d\'environnement');
  // Ne pas arrêter le serveur immédiatement, laisser une chance de retry
  setTimeout(() => {
    console.error('🛑 Arrêt du serveur après échec de connexion MongoDB');
    process.exit(1);
  }, 10000);
});

app.get('/', (req, res) => {
  res.redirect('/api');
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API SailingLoc ⛵',
    availableRoutes: ['/api/auth', '/api/boats', '/api/bookings', '/api/payments']
  });
});

// Configuration des routes API
app.use('/api/auth', authRoutes);
app.use('/api/boats', boatRoutes(upload)); // Passe l'instance upload aux routes de bateaux
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur SailingLoc opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Erreur de validation Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
  
  // Erreur de duplication (email déjà utilisé, etc.)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} déjà utilisé`
    });
  }
  
  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur'
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur SailingLoc démarré sur le port ${PORT}`);
  console.log(`🌐 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Configuré' : 'Non configuré'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  mongoose.connection.close(() => {
    console.log('📦 Connexion MongoDB fermée');
    process.exit(0);
  });
});