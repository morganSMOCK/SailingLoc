const mongoose = require('mongoose');

// Schéma pour les réservations de bateaux
const bookingSchema = new mongoose.Schema({
  // Référence unique de la réservation
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Références vers les autres modèles
  boat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: [true, 'Le bateau est obligatoire']
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le locataire est obligatoire']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est obligatoire']
  },
  
  // Dates de la réservation
  startDate: {
    type: Date,
    required: [true, 'La date de début est obligatoire']
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est obligatoire'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'La date de fin doit être postérieure à la date de début'
    }
  },
  
  // Informations sur les participants
  participants: {
    adults: {
      type: Number,
      required: [true, 'Le nombre d\'adultes est obligatoire'],
      min: [1, 'Il doit y avoir au moins 1 adulte']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre d\'enfants ne peut pas être négatif']
    },
    total: {
      type: Number,
      required: true
    }
  },
  
  // Détails financiers
  pricing: {
    dailyRate: {
      type: Number,
      required: true
    },
    numberOfDays: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    cleaningFee: {
      type: Number,
      default: 0
    },
    securityDeposit: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'EUR'
    }
  },
  
  // Statut de la réservation
  status: {
    type: String,
    enum: [
      'pending',      // En attente de confirmation
      'confirmed',    // Confirmée
      'paid',         // Payée
      'active',       // En cours
      'completed',    // Terminée
      'cancelled',    // Annulée
      'refunded'      // Remboursée
    ],
    default: 'pending'
  },
  
  // Informations de paiement
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'cash'],
      default: 'stripe'
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String
  },
  
  // Informations sur le skipper (si demandé)
  skipperRequested: {
    type: Boolean,
    default: false
  },
  skipperInfo: {
    name: String,
    phone: String,
    email: String,
    experience: String,
    additionalCost: {
      type: Number,
      default: 0
    }
  },
  
  // Services additionnels
  additionalServices: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  
  // Informations de contact d'urgence
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Le nom du contact d\'urgence est obligatoire']
    },
    phone: {
      type: String,
      required: [true, 'Le téléphone du contact d\'urgence est obligatoire']
    },
    relationship: {
      type: String,
      required: [true, 'La relation avec le contact d\'urgence est obligatoire']
    }
  },
  
  // Expérience nautique du locataire
  renterExperience: {
    hasLicense: {
      type: Boolean,
      required: true
    },
    licenseType: {
      type: String,
      enum: ['permis_plaisance', 'permis_cotier', 'permis_hauturier', 'autre']
    },
    yearsOfExperience: {
      type: Number,
      min: 0
    },
    previousBoatTypes: [String],
    additionalInfo: String
  },
  
  // Instructions spéciales et demandes
  specialRequests: {
    type: String,
    maxlength: [1000, 'Les demandes spéciales ne peuvent pas dépasser 1000 caractères']
  },
  
  // Check-in et check-out
  checkIn: {
    scheduledTime: Date,
    actualTime: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    boatCondition: String,
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    photos: [String], // URLs des photos de l'état du bateau
    notes: String
  },
  
  checkOut: {
    scheduledTime: Date,
    actualTime: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    boatCondition: String,
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    damages: [{
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major']
      },
      estimatedCost: Number,
      photos: [String]
    }],
    cleaningRequired: {
      type: Boolean,
      default: false
    },
    photos: [String],
    notes: String
  },
  
  // Évaluation et avis
  review: {
    renterReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    },
    ownerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    }
  },
  
  // Historique des modifications
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  
  // Métadonnées
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'email'],
    default: 'website'
  },
  
  // Annulation
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    cancellationFee: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ boat: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ renter: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Propriété virtuelle pour la durée en jours
bookingSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Propriété virtuelle pour vérifier si la réservation est active
bookingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

// Propriété virtuelle pour vérifier si la réservation est à venir
bookingSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return ['confirmed', 'paid'].includes(this.status) && this.startDate > now;
});

// Middleware pour générer un numéro de réservation unique
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.bookingNumber = `SL${year}${month}${random}`;
  }
  
  // Calculer le nombre total de participants
  this.participants.total = this.participants.adults + this.participants.children;
  
  // Calculer le nombre de jours
  this.pricing.numberOfDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  
  next();
});

// Middleware pour ajouter l'historique des statuts
bookingSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

// Méthode pour calculer les frais d'annulation
bookingSchema.methods.calculateCancellationFee = function() {
  const now = new Date();
  const daysUntilStart = Math.ceil((this.startDate - now) / (1000 * 60 * 60 * 24));
  
  let feePercentage = 0;
  
  if (daysUntilStart < 1) {
    feePercentage = 100; // Pas de remboursement
  } else if (daysUntilStart < 7) {
    feePercentage = 50; // 50% de frais
  } else if (daysUntilStart < 14) {
    feePercentage = 25; // 25% de frais
  } else if (daysUntilStart < 30) {
    feePercentage = 10; // 10% de frais
  }
  // Sinon, annulation gratuite
  
  const cancellationFee = (this.pricing.totalAmount * feePercentage) / 100;
  const refundAmount = this.pricing.totalAmount - cancellationFee;
  
  return {
    feePercentage,
    cancellationFee,
    refundAmount,
    daysUntilStart
  };
};

// Méthode pour annuler la réservation
bookingSchema.methods.cancel = async function(cancelledBy, reason) {
  const cancellationInfo = this.calculateCancellationFee();
  
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason,
    refundAmount: cancellationInfo.refundAmount,
    cancellationFee: cancellationInfo.cancellationFee
  };
  
  await this.save();
  return cancellationInfo;
};

// Méthode pour confirmer la réservation
bookingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  await this.save();
};

// Méthode pour marquer comme payée
bookingSchema.methods.markAsPaid = async function(paymentInfo) {
  this.status = 'paid';
  this.payment = {
    ...this.payment,
    ...paymentInfo,
    paidAt: new Date()
  };
  await this.save();
};

// Méthode pour démarrer la location (check-in)
bookingSchema.methods.startRental = async function(checkInInfo) {
  this.status = 'active';
  this.checkIn = {
    ...checkInInfo,
    actualTime: new Date()
  };
  await this.save();
};

// Méthode pour terminer la location (check-out)
bookingSchema.methods.endRental = async function(checkOutInfo) {
  this.status = 'completed';
  this.checkOut = {
    ...checkOutInfo,
    actualTime: new Date()
  };
  await this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);