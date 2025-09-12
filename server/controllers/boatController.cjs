const Boat = require('../models/Boat.cjs');
const User = require('../models/User.cjs');
const multer = require('multer');
const path = require('path');

// Mapping des valeurs enum anglaises vers françaises pour l'affichage
const typeMappingToFrench = {
  'sailboat': 'voilier',
  'motorboat': 'bateau à moteur',
  'catamaran': 'catamaran',
  'yacht': 'yacht',
  'other': 'autre'
};

const categoryMappingToFrench = {
  'luxury': 'luxe',
  'standard': 'standard',
  'budget': 'budget'
};

// Fonction pour convertir les données du bateau en français
const convertBoatToFrench = (boat) => {
  const boatObj = boat.toObject ? boat.toObject() : boat;
  return {
    ...boatObj,
    type: typeMappingToFrench[boatObj.type] || boatObj.type,
    category: categoryMappingToFrench[boatObj.category] || boatObj.category
  };
};







// Récupération de tous les bateaux avec filtres
exports.getAllBoats = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      type,
      city,
      minPrice,
      maxPrice,
      minCapacity,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      available = true
    } = req.query;

    // Construction de la requête de filtrage
    const query = { isActive: true };

    // Filtrage par disponibilité
    if (available === 'true') {
      query.status = 'available';
    }

    // Filtrage par type de bateau
    if (type) {
      // Conversion du type français vers anglais pour la requête
      const typeMapping = {
        'voilier': 'sailboat',
        'bateau à moteur': 'motorboat',
        'bateau_moteur': 'motorboat', // Variante avec underscore
        'catamaran': 'catamaran',
        'yacht': 'yacht',
        'autre': 'other'
      };
      query.type = typeMapping[type] || type;
    }

    // Filtrage par ville
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filtrage par catégorie
    if (category) {
      // Conversion de la catégorie française vers anglaise pour la requête
      const categoryMapping = {
        'luxe': 'luxury',
        'standard': 'standard',
        'budget': 'budget'
      };
      query.category = categoryMapping[category] || category;
    }

    // Filtrage par prix
    if (minPrice || maxPrice) {
      query['pricing.dailyRate'] = {};
      if (minPrice) query['pricing.dailyRate'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.dailyRate'].$lte = parseFloat(maxPrice);
    }

    // Filtrage par capacité minimale
    if (minCapacity) {
      query['capacity.maxPeople'] = { $gte: parseInt(minCapacity) };
    }

    // Recherche textuelle
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.marina': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Configuration du tri
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Exécution de la requête avec pagination
    const boats = await Boat.find(query)
      .populate('owner', 'firstName lastName rating.average rating.totalReviews')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    // Comptage total pour la pagination
    const total = await Boat.countDocuments(query);

    // Conversion des bateaux en français
    const boatsInFrench = boats.map(convertBoatToFrench);

    res.json({
      success: true,
      data: {
        boats: boatsInFrench,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          type,
          city,
          minPrice,
          maxPrice,
          minCapacity,
          category,
          search
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des bateaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bateaux'
    });
  }
};

// Récupération d'un bateau par son ID
exports.getBoatById = async (req, res) => {
  try {
    const { id } = req.params;

    const boat = await Boat.findById(id)
      .populate('owner', 'firstName lastName email phone rating ownerInfo');

    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    // Vérifier si le bateau est actif
    if (!boat.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non disponible'
      });
    }

    // Conversion du bateau en français
    const boatInFrench = convertBoatToFrench(boat);

    res.json({
      success: true,
      data: { boat: boatInFrench }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du bateau'
    });
  }
};

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/boats'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Seuls les fichiers JPG, PNG et WebP sont autorisés'));
  }
});

// Création d'un nouveau bateau (propriétaires uniquement)
exports.createBoat = async (req, res) => {
  try {
    console.log('🔐 [BOAT] Début de création de bateau');
    console.log('🔐 [BOAT] req.user:', req.user);
    
    const userId = req.user.userId;
    console.log('🔐 [BOAT] User ID:', userId);

    // Vérifier que l'utilisateur est propriétaire ou admin
    const user = await User.findById(userId);
    console.log('🔐 [BOAT] Utilisateur trouvé:', user ? { id: user._id, email: user.email, role: user.role } : 'Non trouvé');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    if (!['owner', 'admin'].includes(user.role)) {
      console.log('❌ [BOAT] Rôle insuffisant:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Seuls les propriétaires peuvent ajouter des bateaux'
      });
    }

    console.log('📝 [BOAT] Création d\'un nouveau bateau par:', user.email);
    console.log('📊 [BOAT] Données reçues:', req.body);
    console.log('📁 [BOAT] Fichiers reçus:', req.files ? req.files.length : 0);
    console.log('🔍 [BOAT] Headers:', req.headers);
    console.log('🔍 [BOAT] Content-Type:', req.get('Content-Type'));

    // Helper pour parser un champ qui peut être objet ou JSON string
    const parseField = (value, fallback = {}) => {
      if (value === undefined || value === null || value === '') return fallback;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch (_e) {
        return fallback;
      }
    };

    // Mapping des valeurs françaises vers les valeurs enum anglaises
    const typeMapping = {
      'voilier': 'sailboat',
      'bateau à moteur': 'motorboat',
      'bateau_moteur': 'motorboat', // Variante avec underscore
      'catamaran': 'catamaran',
      'yacht': 'yacht',
      'autre': 'other'
    };
    
    console.log('🔍 [BOAT] Mapping des types:', typeMapping);
    console.log('🔍 [BOAT] Test mapping bateau_moteur:', typeMapping['bateau_moteur']);

    const categoryMapping = {
      'luxe': 'luxury',
      'standard': 'standard',
      'budget': 'budget'
    };
    

    // Préparation des données du bateau
    console.log('🔍 [BOAT] Type reçu:', req.body.type);
    console.log('🔍 [BOAT] Type mappé:', typeMapping[req.body.type]);
    console.log('🔍 [BOAT] Type final:', typeMapping[req.body.type] || req.body.type);
    
    const boatData = {
      name: req.body.name,
      description: req.body.description,
      type: typeMapping[req.body.type] || req.body.type,
      category: categoryMapping[req.body.category] || req.body.category || 'standard',
      specifications: {
        length: parseFloat(req.body.specifications?.length || req.body['specifications[length]'] || 0),
        width: parseFloat(req.body.specifications?.width || req.body['specifications[width]'] || 0)
      },
      capacity: {
        maxPeople: parseInt(req.body.capacity?.maxPeople || req.body['capacity[maxPeople]'] || 0)
      },
      location: {
        city: req.body.location?.city || req.body['location[city]'] || '',
        marina: req.body.location?.marina || req.body['location[marina]'] || '',
        country: req.body.location?.country || req.body['location[country]'] || 'France'
      },
      pricing: {
        dailyRate: parseFloat(req.body.pricing?.dailyRate || req.body['pricing[dailyRate]'] || 0),
        securityDeposit: parseFloat(req.body.pricing?.securityDeposit || req.body['pricing[securityDeposit]'] || 0)
      },
      owner: userId,
      status: 'available',
      isActive: true
    };

    // Gestion des images si présentes
    if (req.files && req.files.length > 0) {
      boatData.images = req.files.map(file => ({
        url: `/uploads/boats/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));
      
      // Image principale (première image)
      if (boatData.images.length > 0) {
        boatData.mainImage = boatData.images[0].url;
      }
    }

    console.log('🚤 [BOAT] Données finales du bateau:', boatData);

    // Validation des données avant création
    console.log('🔍 [BOAT] Validation des données...');
    if (!boatData.name || boatData.name.trim() === '') {
      throw new Error('Le nom du bateau est obligatoire');
    }
    if (!boatData.description || boatData.description.trim() === '') {
      throw new Error('La description est obligatoire');
    }
    if (!boatData.type || boatData.type.trim() === '') {
      throw new Error('Le type de bateau est obligatoire');
    }
    if (!boatData.specifications.length || boatData.specifications.length <= 0) {
      throw new Error('La longueur du bateau est obligatoire et doit être positive');
    }
    if (!boatData.capacity.maxPeople || boatData.capacity.maxPeople <= 0) {
      throw new Error('Le nombre maximum de personnes est obligatoire et doit être positif');
    }
    if (!boatData.location.city || boatData.location.city.trim() === '') {
      throw new Error('La ville est obligatoire');
    }
    if (!boatData.location.marina || boatData.location.marina.trim() === '') {
      throw new Error('Le port d\'attache est obligatoire');
    }
    if (!boatData.pricing.dailyRate || boatData.pricing.dailyRate <= 0) {
      throw new Error('Le tarif journalier est obligatoire et doit être positif');
    }

    console.log('✅ [BOAT] Validation réussie, création du bateau...');
    console.log('🔍 [BOAT] Type final avant création:', boatData.type);
    const boat = new Boat(boatData);
    await boat.save();

    // Peupler les informations du propriétaire
    await boat.populate('owner', 'firstName lastName email');

    console.log('✅ [BOAT] Bateau créé avec succès:', boat._id);

    // Conversion du bateau en français
    const boatInFrench = convertBoatToFrench(boat);

    res.status(201).json({
      success: true,
      message: 'Bateau créé avec succès',
      data: { boat: boatInFrench }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la création du bateau:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.entries(error.errors || {}).reduce((acc, [key, val]) => {
        acc[key] = val.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        message: 'Données invalides pour la création du bateau',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du bateau',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mise à jour d'un bateau
exports.updateBoat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Récupérer le bateau
    const boat = await Boat.findById(id);
    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    // Vérifier les droits de modification
    const user = await User.findById(userId);
    if (boat.owner.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce bateau'
      });
    }

    // Conversion des données d'entrée françaises vers anglaises
    const updateData = { ...req.body };
    if (updateData.type) {
      const typeMapping = {
        'voilier': 'sailboat',
        'bateau à moteur': 'motorboat',
        'bateau_moteur': 'motorboat', // Variante avec underscore
        'catamaran': 'catamaran',
        'yacht': 'yacht',
        'autre': 'other'
      };
      updateData.type = typeMapping[updateData.type] || updateData.type;
    }
    if (updateData.category) {
      const categoryMapping = {
        'luxe': 'luxury',
        'standard': 'standard',
        'budget': 'budget'
      };
      updateData.category = categoryMapping[updateData.category] || updateData.category;
    }

    // Mise à jour du bateau
    const updatedBoat = await Boat.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    // Conversion du bateau en français
    const boatInFrench = convertBoatToFrench(updatedBoat);

    res.json({
      success: true,
      message: 'Bateau mis à jour avec succès',
      data: { boat: boatInFrench }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du bateau'
    });
  }
};

// Suppression d'un bateau
exports.deleteBoat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Récupérer le bateau
    const boat = await Boat.findById(id);
    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    // Vérifier les droits de suppression
    const user = await User.findById(userId);
    if (boat.owner.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce bateau'
      });
    }

    // Désactiver le bateau au lieu de le supprimer (soft delete)
    boat.isActive = false;
    boat.status = 'inactive';
    await boat.save();

    res.json({
      success: true,
      message: 'Bateau supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du bateau'
    });
  }
};

// Récupération des bateaux d'un propriétaire
exports.getOwnerBoats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const boats = await Boat.find({ owner: userId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Boat.countDocuments({ owner: userId });

    // Conversion des bateaux en français
    const boatsInFrench = boats.map(convertBoatToFrench);

    res.json({
      success: true,
      data: {
        boats: boatsInFrench,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des bateaux du propriétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bateaux'
    });
  }
};

// Vérification de la disponibilité d'un bateau
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Dates de début et de fin requises'
      });
    }

    const boat = await Boat.findById(id);
    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    const isAvailable = boat.isAvailable(startDate, endDate);
    const pricing = boat.calculateTotalPrice(startDate, endDate);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        pricing: isAvailable ? pricing : null,
        message: isAvailable ? 'Bateau disponible' : 'Bateau non disponible pour ces dates'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de disponibilité'
    });
  }
};

// Recherche de bateaux par proximité géographique
exports.searchNearby = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000 } = req.query; // Distance en mètres

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Coordonnées géographiques requises'
      });
    }

    const boats = await Boat.find({
      isActive: true,
      status: 'available',
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('owner', 'firstName lastName rating');

    // Conversion des bateaux en français
    const boatsInFrench = boats.map(convertBoatToFrench);

    res.json({
      success: true,
      data: {
        boats: boatsInFrench,
        searchCenter: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        maxDistance: parseInt(maxDistance)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche par proximité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche par proximité'
    });
  }
};

// Récupération des statistiques des bateaux (admin/propriétaire)
exports.getBoatStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    let matchQuery = { isActive: true };

    // Si ce n'est pas un admin, limiter aux bateaux du propriétaire
    if (user.role !== 'admin') {
      matchQuery.owner = userId;
    }

    const stats = await Boat.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBoats: { $sum: 1 },
          availableBoats: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          averagePrice: { $avg: '$pricing.dailyRate' },
          totalRevenue: { $sum: '$stats.totalRevenue' },
          totalBookings: { $sum: '$stats.totalBookings' },
          averageRating: { $avg: '$rating.average' }
        }
      }
    ]);

    const typeStats = await Boat.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averagePrice: { $avg: '$pricing.dailyRate' }
        }
      }
    ]);

    // Conversion des types de bateaux en français dans les statistiques
    const typeStatsInFrench = typeStats.map(stat => ({
      ...stat,
      _id: typeMappingToFrench[stat._id] || stat._id
    }));

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalBoats: 0,
          availableBoats: 0,
          averagePrice: 0,
          totalRevenue: 0,
          totalBookings: 0,
          averageRating: 0
        },
        byType: typeStatsInFrench
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
module.exports.upload = upload;