const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { sendContactMessage } = require('../controllers/contactController.cjs');

// Limite de taux spécifique pour les contacts (plus restrictive)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // maximum 3 messages par IP par fenêtre
  message: {
    success: false,
    message: 'Trop de messages envoyés. Réessayez dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactLimiter, sendContactMessage);

module.exports = router;



