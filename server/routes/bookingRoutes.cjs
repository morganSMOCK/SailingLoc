const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController.cjs');
const { 
  authenticateToken, 
  requireOwner,
  logUserAction,
  rateLimitByUser 
} = require('../middleware/auth.cjs');

// Routes protégées (authentification requise)

/**
 * @route   POST /api/bookings
 * @desc    Création d'une nouvelle réservation
 * @access  Private
 */
router.post('/', 
  authenticateToken,
  rateLimitByUser(10, 60 * 60 * 1000), // Max 10 réservations par heure
  logUserAction('BOOKING_CREATE'),
  bookingController.createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Récupération des réservations de l'utilisateur
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  bookingController.getUserBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Récupération d'une réservation par ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  bookingController.getBookingById
);

/**
 * @route   PUT /api/bookings/:id/confirm
 * @desc    Confirmation d'une réservation (propriétaire)
 * @access  Private/Owner
 */
router.put('/:id/confirm', 
  authenticateToken,
  requireOwner,
  logUserAction('BOOKING_CONFIRM'),
  bookingController.confirmBooking
);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Annulation d'une réservation
 * @access  Private
 */
router.put('/:id/cancel', 
  authenticateToken,
  logUserAction('BOOKING_CANCEL'),
  bookingController.cancelBooking
);

/**
 * @route   POST /api/bookings/:id/checkin
 * @desc    Check-in d'une réservation (propriétaire)
 * @access  Private/Owner
 */
router.post('/:id/checkin', 
  authenticateToken,
  requireOwner,
  logUserAction('BOOKING_CHECKIN'),
  bookingController.checkIn
);

/**
 * @route   POST /api/bookings/:id/checkout
 * @desc    Check-out d'une réservation (propriétaire)
 * @access  Private/Owner
 */
router.post('/:id/checkout', 
  authenticateToken,
  requireOwner,
  logUserAction('BOOKING_CHECKOUT'),
  bookingController.checkOut
);

/**
 * @route   POST /api/bookings/:id/review
 * @desc    Ajout d'un avis sur une réservation
 * @access  Private
 */
router.post('/:id/review', 
  authenticateToken,
  logUserAction('BOOKING_REVIEW'),
  bookingController.addReview
);

/**
 * @route   GET /api/bookings/stats/overview
 * @desc    Statistiques des réservations
 * @access  Private
 */
router.get('/stats/overview', 
  authenticateToken,
  bookingController.getBookingStats
);

module.exports = router;