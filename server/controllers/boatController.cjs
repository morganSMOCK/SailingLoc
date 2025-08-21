const Boat = require('../models/Boat.cjs');
const User = require('../models/User.cjs');

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
      query.type = type;
    }

    // Filtrage par ville
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filtrage par catégorie
    if (category) {
      query.category = category;
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

    res.json({
      success: true,
      data: {
        boats,
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

    res.json({
      success: true,
      data: { boat }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du bateau'
    });
  }
};

// Création d'un nouveau bateau (propriétaires uniquement)
exports.createBoat = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Vérifier que l'utilisateur est propriétaire ou admin
    const user = await User.findById(userId);
    if (!['owner', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les propriétaires peuvent ajouter des bateaux'
      });
    }

    // Création du bateau avec le propriétaire
    const boatData = {
      ...req.body,
      owner: userId
    };

    const boat = new Boat(boatData);
    await boat.save();

    // Peupler les informations du propriétaire
    await boat.populate('owner', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Bateau créé avec succès',
      data: { boat }
    });

  } catch (error) {
    console.error('Erreur lors de la création du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du bateau'
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

    // Mise à jour du bateau
    const updatedBoat = await Boat.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Bateau mis à jour avec succès',
      data: { boat: updatedBoat }
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

    res.json({
      success: true,
      data: {
        boats,
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

    res.json({
      success: true,
      data: {
        boats,
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
        byType: typeStats
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