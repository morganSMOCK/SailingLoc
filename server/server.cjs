const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes.cjs');
const boatRoutes = require('./routes/boatRoutes.cjs');
const bookingRoutes = require('./routes/bookingRoutes.cjs');
const paymentRoutes = require('./routes/paymentRoutes.cjs');
const contactRoutes = require('./routes/contactRoutes.cjs');

const app = express();

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

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

module.exports = app;


