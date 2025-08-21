const mongoose = require('mongoose');

// Schéma pour les bateaux disponibles à la location
const boatSchema = new mongoose.Schema({
  // Informations de base du bateau
  name: {
    type: String,
    required: [true, 'Le nom du bateau est obligatoire'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  
  // Type et catégorie du bateau
  type: {
    type: String,
    required: [true, 'Le type de bateau est obligatoire'],
    enum: ['voilier', 'catamaran', 'yacht', 'bateau_moteur', 'semi_rigide', 'peniche']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: ['luxe', 'standard', 'economique', 'sportif', 'familial']
  },
  
  // Spécifications techniques
  specifications: {
    length: {
      type: Number,
      required: [true, 'La longueur est obligatoire'],
      min: [1, 'La longueur doit être positive']
    },
    width: {
      type: Number,
      required: [true, 'La largeur est obligatoire'],
      min: [1, 'La largeur doit être positive']
    },
    draft: Number, // Tirant d'eau
    displacement: Number, // Déplacement en tonnes
    enginePower: Number, // Puissance moteur en CV
    fuelCapacity: Number, // Capacité carburant en litres
    waterCapacity: Number, // Capacité eau douce en litres
    year: {
      type: Number,
      min: [1900, 'Année invalide'],
      max: [new Date().getFullYear() + 1, 'Année invalide']
    },
    brand: String,
    model: String
  },
  
  // Capacité et couchages
  capacity: {
    maxPeople: {
      type: Number,
      required: [true, 'Le nombre maximum de personnes est obligatoire'],
      min: [1, 'Doit accueillir au moins 1 personne']
    },
    cabins: {
      type: Number,
      min: [0, 'Le nombre de cabines ne peut pas être négatif']
    },
    berths: {
      type: Number,
      min: [0, 'Le nombre de couchages ne peut pas être négatif']
    },
    bathrooms: {
      type: Number,
      min: [0, 'Le nombre de salles de bain ne peut pas être négatif']
    }
  },
  
  // Équipements et options
  equipment: {
    navigation: {
      gps: { type: Boolean, default: false },
      autopilot: { type: Boolean, default: false },
      radar: { type: Boolean, default: false },
      chartPlotter: { type: Boolean, default: false },
      compass: { type: Boolean, default: true }
    },
    safety: {
      lifeJackets: { type: Boolean, default: true },
      lifeRaft: { type: Boolean, default: false },
      fireExtinguisher: { type: Boolean, default: true },
      firstAidKit: { type: Boolean, default: true },
      flares: { type: Boolean, default: false }
    },
    comfort: {
      airConditioning: { type: Boolean, default: false },
      heating: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      stereo: { type: Boolean, default: false },
      refrigerator: { type: Boolean, default: false },
      microwave: { type: Boolean, default: false },
      dishwasher: { type: Boolean, default: false }
    },
    water: {
      shower: { type: Boolean, default: false },
      hotWater: { type: Boolean, default: false },
      waterMaker: { type: Boolean, default: false }
    }
  },
  
  // Localisation
  location: {
    marina: {
      type: String,
      required: [true, 'Le port d\'attache est obligatoire']
    },
    city: {
      type: String,
      required: [true, 'La ville est obligatoire']
    },
    region: String,
    country: {
      type: String,
      default: 'France'
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude invalide'],
        max: [90, 'Latitude invalide']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude invalide'],
        max: [180, 'Longitude invalide']
      }
    }
  },
  
  // Tarification
  pricing: {
    dailyRate: {
      type: Number,
      required: [true, 'Le tarif journalier est obligatoire'],
      min: [0, 'Le tarif ne peut pas être négatif']
    },
    weeklyRate: Number,
    monthlyRate: Number,
    securityDeposit: {
      type: Number,
      required: [true, 'La caution est obligatoire'],
      min: [0, 'La caution ne peut pas être négative']
    },
    cleaningFee: {
      type: Number,
      default: 0,
      min: [0, 'Les frais de nettoyage ne peuvent pas être négatifs']
    },
    fuelIncluded: {
      type: Boolean,
      default: false
    }
  },
  
  // Images du bateau
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  
  // Propriétaire du bateau
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est obligatoire']
  },
  
  // Statut et disponibilité
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'inactive'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Périodes de non-disponibilité
  unavailablePeriods: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ['booked', 'maintenance', 'owner_use', 'other'],
      default: 'booked'
    }
  }],
  
  // Évaluations et avis
  rating: {
    average: {
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
  
  // Conditions de location
  rentalConditions: {
    minimumAge: {
      type: Number,
      default: 18
    },
    licenseRequired: {
      type: Boolean,
      default: true
    },
    licenseType: {
      type: String,
      enum: ['permis_plaisance', 'permis_cotier', 'permis_hauturier', 'aucun'],
      default: 'permis_plaisance'
    },
    minimumExperience: {
      type: Number,
      default: 0 // En années
    },
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    petsAllowed: {
      type: Boolean,
      default: false
    }
  },
  
  // Statistiques
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastBooked: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
boatSchema.index({ 'location.city': 1 });
boatSchema.index({ type: 1 });
boatSchema.index({ 'pricing.dailyRate': 1 });
boatSchema.index({ 'rating.average': -1 });
boatSchema.index({ status: 1, isActive: 1 });
boatSchema.index({ owner: 1 });

// Index géospatial pour les recherches par proximité
boatSchema.index({ 'location.coordinates': '2dsphere' });

// Propriété virtuelle pour l'image principale
boatSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg ? mainImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Propriété virtuelle pour le tarif hebdomadaire calculé
boatSchema.virtual('calculatedWeeklyRate').get(function() {
  return this.pricing.weeklyRate || (this.pricing.dailyRate * 7 * 0.85); // 15% de réduction
});

// Méthode pour vérifier la disponibilité
boatSchema.methods.isAvailable = function(startDate, endDate) {
  // Vérifier si le bateau est actif et disponible
  if (!this.isActive || this.status !== 'available') {
    return false;
  }
  
  // Vérifier les conflits avec les périodes indisponibles
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return !this.unavailablePeriods.some(period => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    
    return (start < periodEnd && end > periodStart);
  });
};

// Méthode pour ajouter une période d'indisponibilité
boatSchema.methods.addUnavailablePeriod = function(startDate, endDate, reason = 'booked') {
  this.unavailablePeriods.push({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason
  });
  
  return this.save();
};

// Méthode pour calculer le prix total d'une location
boatSchema.methods.calculateTotalPrice = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  let totalPrice = 0;
  
  // Calcul basé sur la durée
  if (days >= 30 && this.pricing.monthlyRate) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    totalPrice = (months * this.pricing.monthlyRate) + (remainingDays * this.pricing.dailyRate);
  } else if (days >= 7 && this.calculatedWeeklyRate) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    totalPrice = (weeks * this.calculatedWeeklyRate) + (remainingDays * this.pricing.dailyRate);
  } else {
    totalPrice = days * this.pricing.dailyRate;
  }
  
  return {
    subtotal: totalPrice,
    cleaningFee: this.pricing.cleaningFee,
    securityDeposit: this.pricing.securityDeposit,
    total: totalPrice + this.pricing.cleaningFee,
    days
  };
};

// Méthode pour mettre à jour la note moyenne
boatSchema.methods.updateRating = async function(newRating) {
  const currentTotal = this.rating.average * this.rating.totalReviews;
  this.rating.totalReviews += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.totalReviews;
  
  await this.save();
};

// Middleware pour s'assurer qu'il n'y a qu'une seule image principale
boatSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    let hasMain = false;
    this.images.forEach((img, index) => {
      if (img.isMain && hasMain) {
        img.isMain = false;
      } else if (img.isMain) {
        hasMain = true;
      }
    });
    
    // Si aucune image principale, définir la première comme principale
    if (!hasMain && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }
  next();
});

module.exports = mongoose.model('Boat', boatSchema);