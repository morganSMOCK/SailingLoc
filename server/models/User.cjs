const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma pour les utilisateurs du système de location de bateau
const userSchema = new mongoose.Schema({
  // Informations personnelles
  firstName: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  
  // Informations de contact
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Numéro de téléphone invalide']
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'France'
    }
  },
  
  // Rôle de l'utilisateur dans le système
  role: {
    type: String,
    enum: ['client', 'owner', 'admin'],
    default: 'client'
  },
  
  // Statut du compte
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Informations pour les propriétaires de bateaux
  ownerInfo: {
    licenseNumber: String, // Numéro de licence nautique
    experience: Number, // Années d'expérience
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Avatar de l'utilisateur
  avatar: {
    type: String,
    default: null
  },
  
  // Historique des connexions
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Token de réinitialisation de mot de passe
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Préférences utilisateur
  preferences: {
    language: {
      type: String,
      default: 'fr'
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Propriété virtuelle pour le nom complet
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    // Générer un salt et hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Supprimer les informations sensibles
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  
  return userObject;
};

// Méthode pour mettre à jour la note moyenne d'un propriétaire
userSchema.methods.updateOwnerRating = async function(newRating) {
  if (this.role !== 'owner') return;
  
  const currentTotal = this.ownerInfo.rating * this.ownerInfo.totalReviews;
  this.ownerInfo.totalReviews += 1;
  this.ownerInfo.rating = (currentTotal + newRating) / this.ownerInfo.totalReviews;
  
  await this.save();
};

// Middleware pour nettoyer les données avant suppression
userSchema.pre('remove', async function(next) {
  try {
    // Ici on pourrait supprimer les bateaux associés, les réservations, etc.
    console.log(`Suppression de l'utilisateur: ${this.email}`);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);