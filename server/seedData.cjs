const mongoose = require('mongoose');
const Boat = require('./models/Boat.cjs');
const User = require('./models/User.cjs');
require('dotenv').config();

// Données d'exemple pour les bateaux
const sampleBoats = [
  {
    name: "Ocean Dream",
    description: "Magnifique yacht de luxe parfait pour des vacances inoubliables. Équipé de tout le confort moderne avec une vue panoramique exceptionnelle sur l'océan.",
    type: "yacht",
    category: "luxe",
    specifications: {
      length: 15,
      width: 4.5,
      draft: 1.8,
      displacement: 8.5,
      enginePower: 300,
      fuelCapacity: 400,
      waterCapacity: 200,
      year: 2022,
      brand: "Sunseeker",
      model: "Manhattan 52"
    },
    capacity: {
      maxPeople: 8,
      cabins: 3,
      berths: 6,
      bathrooms: 2
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: true,
        radar: true,
        chartPlotter: true,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: true,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: true
      },
      comfort: {
        airConditioning: true,
        heating: true,
        wifi: true,
        tv: true,
        stereo: true,
        refrigerator: true,
        microwave: true,
        dishwasher: true
      },
      water: {
        shower: true,
        hotWater: true,
        waterMaker: true
      }
    },
    location: {
      marina: "Port Pierre Canto",
      city: "Cannes",
      region: "Côte d'Azur",
      country: "France",
      coordinates: {
        latitude: 43.5528,
        longitude: 7.0174
      }
    },
    pricing: {
      dailyRate: 850,
      weeklyRate: 5100,
      monthlyRate: 18000,
      securityDeposit: 5000,
      cleaningFee: 200,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Vue extérieure du yacht",
        isMain: true
      },
      {
        url: "https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Salon principal",
        isMain: false
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.8,
      totalReviews: 24
    },
    rentalConditions: {
      minimumAge: 25,
      licenseRequired: true,
      licenseType: "permis_cotier",
      minimumExperience: 2,
      smokingAllowed: false,
      petsAllowed: false
    }
  },
  {
    name: "Blue Horizon",
    description: "Catamaran spacieux et moderne, idéal pour les familles et groupes d'amis. Stabilité exceptionnelle et espaces de vie généreux.",
    type: "catamaran",
    category: "familial",
    specifications: {
      length: 12,
      width: 6.2,
      draft: 1.2,
      displacement: 6.8,
      enginePower: 2 * 40,
      fuelCapacity: 300,
      waterCapacity: 400,
      year: 2021,
      brand: "Lagoon",
      model: "40"
    },
    capacity: {
      maxPeople: 10,
      cabins: 4,
      berths: 8,
      bathrooms: 2
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: true,
        radar: false,
        chartPlotter: true,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: true,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: true
      },
      comfort: {
        airConditioning: false,
        heating: false,
        wifi: true,
        tv: false,
        stereo: true,
        refrigerator: true,
        microwave: true,
        dishwasher: false
      },
      water: {
        shower: true,
        hotWater: true,
        waterMaker: false
      }
    },
    location: {
      marina: "Port de Nice",
      city: "Nice",
      region: "Côte d'Azur",
      country: "France",
      coordinates: {
        latitude: 43.6951,
        longitude: 7.2758
      }
    },
    pricing: {
      dailyRate: 650,
      weeklyRate: 3900,
      monthlyRate: 14000,
      securityDeposit: 3000,
      cleaningFee: 150,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Catamaran au mouillage",
        isMain: true
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.6,
      totalReviews: 18
    },
    rentalConditions: {
      minimumAge: 21,
      licenseRequired: true,
      licenseType: "permis_plaisance",
      minimumExperience: 1,
      smokingAllowed: false,
      petsAllowed: true
    }
  },
  {
    name: "Sea Breeze",
    description: "Voilier classique et élégant pour les amateurs de navigation authentique. Performance et confort réunis pour une expérience unique.",
    type: "voilier",
    category: "standard",
    specifications: {
      length: 10,
      width: 3.4,
      draft: 1.9,
      displacement: 4.2,
      enginePower: 30,
      fuelCapacity: 120,
      waterCapacity: 150,
      year: 2020,
      brand: "Jeanneau",
      model: "Sun Odyssey 349"
    },
    capacity: {
      maxPeople: 6,
      cabins: 2,
      berths: 6,
      bathrooms: 1
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: false,
        radar: false,
        chartPlotter: true,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: false,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: true
      },
      comfort: {
        airConditioning: false,
        heating: false,
        wifi: false,
        tv: false,
        stereo: true,
        refrigerator: true,
        microwave: false,
        dishwasher: false
      },
      water: {
        shower: true,
        hotWater: false,
        waterMaker: false
      }
    },
    location: {
      marina: "Port de Saint-Tropez",
      city: "Saint-Tropez",
      region: "Var",
      country: "France",
      coordinates: {
        latitude: 43.2677,
        longitude: 6.6407
      }
    },
    pricing: {
      dailyRate: 450,
      weeklyRate: 2700,
      monthlyRate: 9500,
      securityDeposit: 2000,
      cleaningFee: 100,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Voilier en navigation",
        isMain: true
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.4,
      totalReviews: 12
    },
    rentalConditions: {
      minimumAge: 18,
      licenseRequired: true,
      licenseType: "permis_plaisance",
      minimumExperience: 0,
      smokingAllowed: false,
      petsAllowed: false
    }
  },
  {
    name: "Sunset Paradise",
    description: "Bateau à moteur rapide et confortable pour des excursions d'une journée inoubliables. Parfait pour découvrir les plus belles criques.",
    type: "bateau_moteur",
    category: "sportif",
    specifications: {
      length: 8,
      width: 2.8,
      draft: 0.8,
      displacement: 2.5,
      enginePower: 250,
      fuelCapacity: 200,
      waterCapacity: 80,
      year: 2023,
      brand: "Quicksilver",
      model: "805 Sundeck"
    },
    capacity: {
      maxPeople: 8,
      cabins: 1,
      berths: 2,
      bathrooms: 1
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: false,
        radar: false,
        chartPlotter: true,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: false,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: false
      },
      comfort: {
        airConditioning: false,
        heating: false,
        wifi: false,
        tv: false,
        stereo: true,
        refrigerator: true,
        microwave: false,
        dishwasher: false
      },
      water: {
        shower: true,
        hotWater: false,
        waterMaker: false
      }
    },
    location: {
      marina: "Port Vauban",
      city: "Antibes",
      region: "Alpes-Maritimes",
      country: "France",
      coordinates: {
        latitude: 43.5847,
        longitude: 7.1250
      }
    },
    pricing: {
      dailyRate: 380,
      weeklyRate: 2280,
      monthlyRate: 8000,
      securityDeposit: 1500,
      cleaningFee: 80,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Bateau à moteur",
        isMain: true
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.7,
      totalReviews: 15
    },
    rentalConditions: {
      minimumAge: 18,
      licenseRequired: true,
      licenseType: "permis_plaisance",
      minimumExperience: 0,
      smokingAllowed: false,
      petsAllowed: true
    }
  },
  {
    name: "Mediterranean Pearl",
    description: "Yacht de prestige pour une expérience de luxe absolue. Service haut de gamme et équipements exceptionnels pour des moments privilégiés.",
    type: "yacht",
    category: "luxe",
    specifications: {
      length: 20,
      width: 5.2,
      draft: 2.1,
      displacement: 15.8,
      enginePower: 2 * 400,
      fuelCapacity: 800,
      waterCapacity: 500,
      year: 2023,
      brand: "Princess",
      model: "V65"
    },
    capacity: {
      maxPeople: 12,
      cabins: 4,
      berths: 8,
      bathrooms: 3
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: true,
        radar: true,
        chartPlotter: true,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: true,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: true
      },
      comfort: {
        airConditioning: true,
        heating: true,
        wifi: true,
        tv: true,
        stereo: true,
        refrigerator: true,
        microwave: true,
        dishwasher: true
      },
      water: {
        shower: true,
        hotWater: true,
        waterMaker: true
      }
    },
    location: {
      marina: "Port Hercule",
      city: "Monaco",
      region: "Monaco",
      country: "Monaco",
      coordinates: {
        latitude: 43.7347,
        longitude: 7.4206
      }
    },
    pricing: {
      dailyRate: 1200,
      weeklyRate: 7200,
      monthlyRate: 25000,
      securityDeposit: 8000,
      cleaningFee: 300,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Yacht de luxe",
        isMain: true
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.9,
      totalReviews: 31
    },
    rentalConditions: {
      minimumAge: 30,
      licenseRequired: true,
      licenseType: "permis_hauturier",
      minimumExperience: 5,
      smokingAllowed: false,
      petsAllowed: false
    }
  },
  {
    name: "Freedom Explorer",
    description: "Semi-rigide performant et polyvalent pour tous types d'activités nautiques. Idéal pour la pêche, les sports nautiques et les balades côtières.",
    type: "semi_rigide",
    category: "sportif",
    specifications: {
      length: 7,
      width: 2.5,
      draft: 0.4,
      displacement: 1.2,
      enginePower: 150,
      fuelCapacity: 120,
      waterCapacity: 0,
      year: 2022,
      brand: "Zodiac",
      model: "Pro Open 650"
    },
    capacity: {
      maxPeople: 6,
      cabins: 0,
      berths: 0,
      bathrooms: 0
    },
    equipment: {
      navigation: {
        gps: true,
        autopilot: false,
        radar: false,
        chartPlotter: false,
        compass: true
      },
      safety: {
        lifeJackets: true,
        lifeRaft: false,
        fireExtinguisher: true,
        firstAidKit: true,
        flares: false
      },
      comfort: {
        airConditioning: false,
        heating: false,
        wifi: false,
        tv: false,
        stereo: true,
        refrigerator: false,
        microwave: false,
        dishwasher: false
      },
      water: {
        shower: false,
        hotWater: false,
        waterMaker: false
      }
    },
    location: {
      marina: "Port de Bandol",
      city: "Bandol",
      region: "Var",
      country: "France",
      coordinates: {
        latitude: 43.1350,
        longitude: 5.7500
      }
    },
    pricing: {
      dailyRate: 280,
      weeklyRate: 1680,
      monthlyRate: 5600,
      securityDeposit: 1000,
      cleaningFee: 50,
      fuelIncluded: false
    },
    images: [
      {
        url: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800",
        caption: "Semi-rigide",
        isMain: true
      }
    ],
    status: "available",
    isActive: true,
    rating: {
      average: 4.3,
      totalReviews: 8
    },
    rentalConditions: {
      minimumAge: 18,
      licenseRequired: true,
      licenseType: "permis_plaisance",
      minimumExperience: 0,
      smokingAllowed: false,
      petsAllowed: true
    }
  }
];

async function seedDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sailingloc');
    console.log('✅ Connexion à MongoDB réussie');

    // Créer un utilisateur propriétaire par défaut
    let defaultOwner = await User.findOne({ email: 'owner@sailingloc.com' });
    
    if (!defaultOwner) {
      defaultOwner = new User({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'owner@sailingloc.com',
        password: 'password123',
        role: 'owner',
        phone: '+33 6 12 34 56 78',
        isActive: true,
        isEmailVerified: true
      });
      
      await defaultOwner.save();
      console.log('✅ Utilisateur propriétaire créé');
    }

    // Vérifier s'il y a déjà des bateaux
    const existingBoats = await Boat.countDocuments();
    
    if (existingBoats === 0) {
      // Ajouter le propriétaire à chaque bateau
      const boatsWithOwner = sampleBoats.map(boat => ({
        ...boat,
        owner: defaultOwner._id
      }));

      // Insérer les bateaux
      await Boat.insertMany(boatsWithOwner);
      console.log(`✅ ${sampleBoats.length} bateaux ajoutés à la base de données`);
    } else {
      console.log(`ℹ️ ${existingBoats} bateaux déjà présents dans la base de données`);
    }

    // Afficher le résumé
    const totalBoats = await Boat.countDocuments();
    const availableBoats = await Boat.countDocuments({ status: 'available', isActive: true });
    
    console.log('\n📊 Résumé de la base de données:');
    console.log(`   Total bateaux: ${totalBoats}`);
    console.log(`   Bateaux disponibles: ${availableBoats}`);
    
    // Afficher les bateaux par type
    const boatsByType = await Boat.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\n🛥️ Bateaux par type:');
    boatsByType.forEach(type => {
      console.log(`   ${type._id}: ${type.count}`);
    });

    console.log('\n🎉 Base de données initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Connexion fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleBoats };