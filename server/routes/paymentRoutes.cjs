const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// Route pour créer une session de paiement
router.post('/create-session', 
  authenticateToken, // Authentification requise
  paymentController.createPaymentSession
);

// Route pour récupérer les détails d'une session
router.get('/session/:sessionId', 
  authenticateToken, // Authentification requise
  paymentController.getSessionDetails
);

module.exports = router;