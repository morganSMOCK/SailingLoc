const User = require('../models/User.cjs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Fonction utilitaire pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token valide 7 jours
  });
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'client'
    } = req.body;

    // Vérification des champs obligatoires
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Création du nouvel utilisateur
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      role
    });

    await user.save();

    // Génération du token
    const token = generateToken(user._id);
    console.log('🎫 [AUTH] Token généré pour nouvel utilisateur');
    
    const responseData = {
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: user.getPublicProfile(),
        token
      }
    };
    
    console.log('✅ [AUTH] Inscription réussie, envoi réponse');

    // Réponse avec les informations utilisateur (sans le mot de passe)
    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    console.log('🔐 [AUTH] Tentative de connexion reçue');
    console.log('📊 [AUTH] Body:', { email: req.body.email, password: req.body.password ? '***' : 'vide' });
    console.log('📍 [AUTH] Origin:', req.headers.origin);
    console.log('🌐 [AUTH] User-Agent:', req.headers['user-agent']);
    
    const { email, password } = req.body;

    // Vérification des champs obligatoires
    if (!email || !password) {
      console.log('❌ [AUTH] Champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Recherche de l'utilisateur par email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    console.log('👤 [AUTH] Utilisateur trouvé:', user ? `Oui (${user.email})` : 'Non');
    
    if (!user) {
      console.log('❌ [AUTH] Utilisateur non trouvé pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 [AUTH] Mot de passe valide:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ [AUTH] Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mise à jour de la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Génération du token
    const token = generateToken(user._id);
    console.log('🎫 [AUTH] Token généré pour:', user.email);
    
    const responseData = {
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.getPublicProfile(),
        token
      }
    };
    
    console.log('✅ [AUTH] Connexion réussie, envoi réponse');

    res.json(responseData);

  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// Récupération du profil utilisateur
exports.getProfile = async (req, res) => {
  try {
    console.log('📝 [AUTH] Tentative d\'inscription reçue');
    console.log('📊 [AUTH] Body:', { ...req.body, password: req.body.password ? '***' : 'vide' });
    console.log('📍 [AUTH] Origin:', req.headers.origin);
    
    // L'utilisateur est déjà disponible grâce au middleware d'authentification
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// Mise à jour du profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Champs non modifiables
    const restrictedFields = ['password', 'email', 'role', '_id'];
    restrictedFields.forEach(field => delete updates[field]);

    // Mise à jour de l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// Changement de mot de passe
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Vérification des champs obligatoires
    if (!currentPassword || !newPassword) {
      console.log('❌ [AUTH] Champs obligatoires manquants');
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Vérification de la longueur du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
      console.log('❌ [AUTH] Mot de passe trop court');
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Récupération de l'utilisateur avec le mot de passe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
      console.log('❌ [AUTH] Email déjà utilisé:', email);
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification du mot de passe actuel
    console.log('✅ [AUTH] Validation OK, création utilisateur...');
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mise à jour du mot de passe
    user.password = newPassword;
    await user.save();
    console.log('✅ [AUTH] Utilisateur créé:', user.email);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};

// Déconnexion (côté client principalement)
exports.logout = async (req, res) => {
  try {
    // Dans une implémentation plus avancée, on pourrait blacklister le token
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

// Vérification de la validité du token
exports.verifyToken = async (req, res) => {
  try {
    // Si on arrive ici, c'est que le token est valide (grâce au middleware)
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou utilisateur inactif'
      });
    }

    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
};

// Récupération de la liste des utilisateurs (admin uniquement)
exports.getAllUsers = async (req, res) => {
  try {
    // Vérification des droits admin
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { page = 1, limit = 10, role, search } = req.query;
    const query = { isActive: true };

    // Filtrage par rôle
    if (role) {
      query.role = role;
    }

    // Recherche par nom ou email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.getPublicProfile()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};