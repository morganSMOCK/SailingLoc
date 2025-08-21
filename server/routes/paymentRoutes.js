const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { 
  authenticateToken, 
  requireOwner,
  logUserAction,
  rateLimitByUser 
} = require('../middleware/auth');

// Routes protégées (authentification requise)

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Création d'un Payment Intent pour une réservation
 * @access  Private
 */
router.post('/create-payment-intent', 
  authenticateToken,
  rateLimitByUser(5, 60 * 1000), // Max 5 tentatives par minute
  logUserAction('PAYMENT_INTENT_CREATE'),
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/payments/confirm-payment
 * @desc    Confirmation d'un paiement
 * @access  Private
 */
router.post('/confirm-payment', 
  authenticateToken,
  logUserAction('PAYMENT_CONFIRM'),
  paymentController.confirmPayment
);

/**
 * @route   POST /api/payments/refund
 * @desc    Remboursement d'un paiement (propriétaire)
 * @access  Private/Owner
 */
router.post('/refund', 
  authenticateToken,
  requireOwner,
  logUserAction('PAYMENT_REFUND'),
  paymentController.refundPayment
);

/**
 * @route   GET /api/payments/history
 * @desc    Historique des paiements de l'utilisateur
 * @access  Private
 */
router.get('/history', 
  authenticateToken,
  paymentController.getPaymentHistory
);

/**
 * @route   GET /api/payments/stats
 * @desc    Statistiques des paiements (propriétaire)
 * @access  Private/Owner
 */
router.get('/stats', 
  authenticateToken,
  requireOwner,
  paymentController.getPaymentStats
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook pour les événements de paiement (Stripe)
 * @access  Public (mais sécurisé par signature)
 */
router.post('/webhook', 
  express.raw({ type: 'application/json' }), // Middleware pour recevoir le body brut
  paymentController.handleWebhook
);

module.exports = router;