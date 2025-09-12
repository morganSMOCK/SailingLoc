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
  return this.images.map(img => ({
    ...img.toObject(),
    fullUrl: img.url.startsWith('http') ? img.url : `${process.env.BASE_URL || 'http://localhost:3000'}/${img.url}`
  }));
});

// Méthode pour obtenir l'image principale
boatSchema.methods.getMainImage = function() {
  const mainImage = this.images.find(img => img.isMain);
  return mainImage || this.images[0] || null;
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
