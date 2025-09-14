const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Récupération du token depuis l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérification que l'utilisateur existe toujours et est actif
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }

    // Ajout des informations utilisateur à la requête
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    console.log('🔐 [AUTH] Utilisateur authentifié:', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    next();

  } catch (error) {
    console.error('Erreur d\'authentification:', error);

    // Gestion des différents types d'erreurs JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
};

// Middleware pour vérifier les rôles spécifiques
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier que l'utilisateur a le bon rôle
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

// Middleware pour vérifier que l'utilisateur est propriétaire
const requireOwner = (req, res, next) => {
  return requireRole('owner', 'admin')(req, res, next);
};

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};

// Middleware optionnel d'authentification (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
      }
    }

    next();

  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

// Middleware pour vérifier la propriété d'une ressource
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // Récupérer la ressource
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée'
        });
      }

      // Vérifier la propriété ou les droits admin
      const user = await User.findById(userId);
      
      // Comparaison robuste des IDs (ObjectId vs String)
      let isOwner = false;
      if (resource.owner) {
        const ownerId = resource.owner.toString();
        const userIdStr = userId.toString();
        isOwner = ownerId === userIdStr;
        
        // Logs détaillés pour le débogage
        console.log('🔍 [OWNERSHIP DEBUG] Comparaison des IDs:');
        console.log('🔍 [OWNERSHIP DEBUG] resource.owner (raw):', resource.owner);
        console.log('🔍 [OWNERSHIP DEBUG] resource.owner (string):', ownerId);
        console.log('🔍 [OWNERSHIP DEBUG] userId (raw):', userId);
        console.log('🔍 [OWNERSHIP DEBUG] userId (string):', userIdStr);
        console.log('🔍 [OWNERSHIP DEBUG] Types - owner:', typeof ownerId, 'user:', typeof userIdStr);
        console.log('🔍 [OWNERSHIP DEBUG] Égalité stricte:', ownerId === userIdStr);
        console.log('🔍 [OWNERSHIP DEBUG] Égalité loose:', ownerId == userIdStr);
      }
      
      const isAdmin = user && user.role === 'admin';

      // Logs de débogage pour la vérification de propriété
      console.log('🔐 [CHECK OWNERSHIP] Vérification de propriété:');
      console.log('🔐 [CHECK OWNERSHIP] Resource ID:', resourceId);
      console.log('🔐 [CHECK OWNERSHIP] User ID:', userId);
      console.log('🔐 [CHECK OWNERSHIP] Resource Owner:', resource.owner);
      console.log('🔐 [CHECK OWNERSHIP] Resource Owner (string):', resource.owner ? resource.owner.toString() : 'null');
      console.log('🔐 [CHECK OWNERSHIP] User Role:', user.role);
      console.log('🔐 [CHECK OWNERSHIP] Is Owner:', isOwner);
      console.log('🔐 [CHECK OWNERSHIP] Is Admin:', isAdmin);

      if (!isOwner && !isAdmin) {
        console.log('❌ [CHECK OWNERSHIP] Accès refusé - ni propriétaire ni admin');
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à accéder à cette ressource'
        });
      }

      console.log('✅ [CHECK OWNERSHIP] Accès autorisé');

      // Ajouter la ressource à la requête pour éviter une nouvelle requête
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Erreur lors de la vérification de propriété:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des droits'
      });
    }
  };
};

// Middleware de limitation de taux par utilisateur
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Nettoyer les anciennes entrées
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const currentRequests = userRequests.get(userId);

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
      });
    }

    currentRequests.push(now);
    next();
  };
};

// Middleware pour logger les actions des utilisateurs
const logUserAction = (action) => {
  return (req, res, next) => {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    console.log(`[${new Date().toISOString()}] Action: ${action} | User: ${userEmail} (${userId}) | IP: ${ip} | UA: ${userAgent}`);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwner,
  requireAdmin,
  optionalAuth,
  checkResourceOwnership,
  rateLimitByUser,
  logUserAction
};