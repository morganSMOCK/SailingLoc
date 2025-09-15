const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du bateau est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  type: {
    type: String,
    required: [true, 'Le type de bateau est requis'],
    enum: ['sailboat', 'motorboat', 'catamaran', 'yacht', 'other'],
    default: 'sailboat'
  },
  category: {
    type: String,
    enum: ['luxury', 'standard', 'budget'],
    default: 'standard'
  },
  specifications: {
    length: {
      type: Number,
      required: [true, 'La longueur est requise'],
      min: [1, 'La longueur doit être positive']
    },
    width: {
      type: Number,
      min: [1, 'La largeur doit être positive']
    },
    draft: {
      type: Number,
      min: [0, 'Le tirant d\'eau doit être positif']
    },
    engine: {
      type: String,
      trim: true
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'gasoline', 'electric', 'hybrid', 'wind'],
      default: 'diesel'
    }
  },
  capacity: {
    maxPeople: {
      type: Number,
      required: [true, 'La capacité maximale est requise'],
      min: [1, 'La capacité doit être d\'au moins 1 personne']
    },
    cabins: {
      type: Number,
      min: [0, 'Le nombre de cabines doit être positif']
    },
    bathrooms: {
      type: Number,
      min: [0, 'Le nombre de salles de bain doit être positif']
    }
  },
  location: {
    city: {
      type: String,
      required: [true, 'La ville est requise'],
      trim: true
    },
    marina: {
      type: String,
      required: [true, 'Le port de plaisance est requis'],
      trim: true
    },
    country: {
      type: String,
      default: 'France',
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  pricing: {
    dailyRate: {
      type: Number,
      required: [true, 'Le tarif journalier est requis'],
      min: [0, 'Le tarif doit être positif']
    },
    securityDeposit: {
      type: Number,
      min: [0, 'La caution doit être positive']
    },
    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP']
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est requis']
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance', 'inactive'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    },
    alt: {
      type: String,
      trim: true
    }
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  rules: [{
    type: String,
    trim: true
  }],
  availability: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches
boatSchema.index({ name: 'text', description: 'text' });
boatSchema.index({ 'location.city': 1 });
boatSchema.index({ type: 1 });
boatSchema.index({ status: 1 });
boatSchema.index({ owner: 1 });

// Virtual pour l'URL complète des images
boatSchema.virtual('imageUrls').get(function() {
  if (!this.images || this.images.length === 0) return [];
  const baseUrl = process.env.BASE_URL || 'https://sailingloc.onrender.com';
  return this.images.map(img => ({
    ...img.toObject(),
    fullUrl: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
  }));
});

// Virtual pour l'image de couverture
boatSchema.virtual('coverImageUrl').get(function() {
  if (!this.images || this.images.length === 0) return null;
  
  const baseUrl = process.env.BASE_URL || 'https://sailingloc.onrender.com';
  
  // Chercher l'image principale
  const mainImage = this.images.find(img => img.isMain);
  if (mainImage && mainImage.url) {
    return mainImage.url.startsWith('http') ? mainImage.url : `${baseUrl}${mainImage.url}`;
  }
  
  // Sinon prendre la première image
  const firstImage = this.images[0];
  if (firstImage && firstImage.url) {
    return firstImage.url.startsWith('http') ? firstImage.url : `${baseUrl}${firstImage.url}`;
  }
  
  return null;
});

// Méthode pour obtenir l'image principale
boatSchema.methods.getMainImage = function() {
  const mainImage = this.images.find(img => img.isMain);
  return mainImage || this.images[0] || null;
};

// Méthode pour vérifier la disponibilité
boatSchema.methods.isAvailable = function(startDate, endDate) {
  // Vérifier si le bateau est actif
  if (!this.isActive || this.status !== 'available') {
    return false;
  }
  
  // Pour l'instant, retourner true si le bateau est actif et disponible
  // TODO: Implémenter la vérification des réservations existantes
  return true;
};

// Méthode pour calculer le prix total
boatSchema.methods.calculateTotalPrice = function(startDate, endDate) {
  if (!this.pricing || !this.pricing.dailyRate) {
    return null;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  const dailyRate = this.pricing.dailyRate;
  const subtotal = dailyRate * days;
  const serviceFee = subtotal * 0.1; // 10% de frais de service
  const total = subtotal + serviceFee;
  
  return {
    dailyRate,
    days,
    subtotal,
    serviceFee,
    total
  };
};

// Middleware pre-save pour s'assurer qu'une seule image principale
boatSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const mainImages = this.images.filter(img => img.isMain);
    if (mainImages.length === 0) {
      this.images[0].isMain = true;
    } else if (mainImages.length > 1) {
      mainImages.forEach((img, index) => {
        img.isMain = index === 0;
      });
    }
  }
  next();
});

module.exports = mongoose.model('Boat', boatSchema);
