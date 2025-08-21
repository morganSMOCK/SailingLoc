const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.cjs');
const { authenticateToken, requireAdmin, logUserAction } = require('../middleware/auth.cjs');

// Routes publiques (sans authentification)

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', 
  logUserAction('USER_REGISTER'),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', 
  logUserAction('USER_LOGIN'),
  authController.login
);

// Routes protégées (authentification requise)

/**
 * @route   GET /api/auth/profile
 * @desc    Récupération du profil utilisateur
 * @access  Private
 */
router.get('/profile', 
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mise à jour du profil utilisateur
 * @access  Private
 */
router.put('/profile', 
  authenticateToken,
  logUserAction('PROFILE_UPDATE'),
  authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Changement de mot de passe
 * @access  Private
 */
router.post('/change-password', 
  authenticateToken,
  logUserAction('PASSWORD_CHANGE'),
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion de l'utilisateur
 * @access  Private
 */
router.post('/logout', 
  authenticateToken,
  logUserAction('USER_LOGOUT'),
  authController.logout
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Vérification de la validité du token
 * @access  Private
 */
router.get('/verify-token', 
  authenticateToken,
  authController.verifyToken
);

// Routes administrateur

/**
 * @route   GET /api/auth/users
 * @desc    Récupération de tous les utilisateurs (admin uniquement)
 * @access  Private/Admin
 */
router.get('/users', 
  authenticateToken,
  requireAdmin,
  logUserAction('ADMIN_GET_USERS'),
  authController.getAllUsers
);

module.exports = router;