const express = require('express');
const router = express.Router();
const boatController = require('../controllers/boatController.cjs');
const { 
  authenticateToken, 
  requireOwner, 
  optionalAuth,
  checkResourceOwnership,
  logUserAction 
} = require('../middleware/auth.cjs');
const { uploadBoatImages, handleUploadError } = require('../middleware/upload.cjs');
const Boat = require('../models/Boat.cjs');

// Routes publiques (avec authentification optionnelle)

/**
 * @route   GET /api/boats
 * @desc    Récupération de tous les bateaux avec filtres
 * @access  Public
 */
router.get('/', 
  optionalAuth,
  boatController.getAllBoats
);

/**
 * @route   GET /api/boats/search/nearby
 * @desc    Recherche de bateaux par proximité géographique
 * @access  Public
 */
router.get('/search/nearby', 
  optionalAuth,
  boatController.searchNearby
);

/**
 * @route   GET /api/boats/:id
 * @desc    Récupération d'un bateau par son ID
 * @access  Public
 */
router.get('/:id', 
  optionalAuth,
  boatController.getBoatById
);

/**
 * @route   GET /api/boats/:id/availability
 * @desc    Vérification de la disponibilité d'un bateau
 * @access  Public
 */
router.get('/:id/availability', 
  optionalAuth,
  boatController.checkAvailability
);

// Routes protégées (authentification requise)

/**
 * @route   POST /api/boats
 * @desc    Création d'un nouveau bateau
 * @access  Private/Owner
 */
router.post('/', 
  authenticateToken,
  requireOwner,
  uploadBoatImages,
  handleUploadError,
  logUserAction('BOAT_CREATE'),
  boatController.createBoat
);

/**
 * @route   GET /api/boats/owner/my-boats
 * @desc    Récupération des bateaux du propriétaire connecté
 * @access  Private/Owner
 */
router.get('/owner/my-boats', 
  authenticateToken,
  requireOwner,
  boatController.getOwnerBoats
);

/**
 * @route   PUT /api/boats/:id
 * @desc    Mise à jour d'un bateau
 * @access  Private/Owner (propriétaire du bateau)
 */
router.put('/:id', 
  authenticateToken,
  checkResourceOwnership(Boat),
  logUserAction('BOAT_UPDATE'),
  boatController.updateBoat
);

/**
 * @route   DELETE /api/boats/:id
 * @desc    Suppression d'un bateau
 * @access  Private/Owner (propriétaire du bateau)
 */
router.delete('/:id', 
  authenticateToken,
  checkResourceOwnership(Boat),
  logUserAction('BOAT_DELETE'),
  boatController.deleteBoat
);

/**
 * @route   GET /api/boats/stats/overview
 * @desc    Statistiques des bateaux
 * @access  Private/Owner
 */
router.get('/stats/overview', 
  authenticateToken,
  requireOwner,
  boatController.getBoatStats
);

module.exports = router;