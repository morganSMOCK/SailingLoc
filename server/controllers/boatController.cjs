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

// Fonction pour traiter les images d'un bateau
const processBoatImages = (boat) => {
  const boatObj = boat.toObject ? boat.toObject() : boat;
  const baseUrl = process.env.BASE_URL || 'https://sailingloc.onrender.com';
  
  // Fonction utilitaire pour nettoyer les URLs
  const cleanUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    // S'assurer que l'URL commence par / et que baseUrl ne finit pas par /
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };
  
  // Traiter les images si elles existent
  if (boatObj.images && Array.isArray(boatObj.images)) {
    boatObj.images = boatObj.images.map(img => ({
      ...img,
      url: cleanUrl(img.url),
      fullUrl: cleanUrl(img.url)
    }));
    
    // Ajouter coverImageUrl
    const mainImage = boatObj.images.find(img => img.isMain);
    if (mainImage) {
      boatObj.coverImageUrl = mainImage.url;
    } else if (boatObj.images.length > 0) {
      boatObj.coverImageUrl = boatObj.images[0].url;
    }
  }
  
  // Traiter imageUrls pour compatibilité legacy
  if (boatObj.imageUrls && Array.isArray(boatObj.imageUrls)) {
    boatObj.imageUrls = boatObj.imageUrls.map(img => {
      if (typeof img === 'string') {
        return {
          url: cleanUrl(img),
          fullUrl: cleanUrl(img)
        };
      }
      return {
        ...img,
        url: img.url ? cleanUrl(img.url) : img,
        fullUrl: img.fullUrl ? cleanUrl(img.fullUrl) : (img.url ? cleanUrl(img.url) : img)
      };
    });
  }
  
  // Traiter imageUrl pour compatibilité legacy
  if (boatObj.imageUrl) {
    boatObj.imageUrl = cleanUrl(boatObj.imageUrl);
  }
  
  return boatObj;
};

// Fonction pour convertir les données du bateau en français
const convertBoatToFrench = (boat) => {
  // Convertir en objet JSON avec les virtuals
  const boatObj = boat.toJSON ? boat.toJSON({ virtuals: true }) : boat;
  const processedBoat = processBoatImages(boatObj);
  return {
    ...processedBoat,
    type: typeMappingToFrench[processedBoat.type] || processedBoat.type,
    category: categoryMappingToFrench[processedBoat.category] || processedBoat.category
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
        'semi_rigide': 'motorboat', // Semi-rigide = bateau à moteur
        'peniche': 'motorboat', // Péniche = bateau à moteur
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
      'semi_rigide': 'motorboat', // Semi-rigide = bateau à moteur
      'peniche': 'motorboat', // Péniche = bateau à moteur
      'catamaran': 'catamaran',
      'yacht': 'yacht',
      'autre': 'other'
    };
    
    console.log('🔍 [BOAT] Mapping des types:', typeMapping);
    console.log('🔍 [BOAT] Test mapping bateau_moteur:', typeMapping['bateau_moteur']);
    console.log('🔍 [BOAT] Test mapping semi_rigide:', typeMapping['semi_rigide']);
    console.log('🔍 [BOAT] Test mapping peniche:', typeMapping['peniche']);

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
    console.log('🔄 [BOAT] Début de mise à jour du bateau');
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

    console.log('📝 [BOAT] Mise à jour du bateau:', boat.name);
    console.log('📊 [BOAT] Données reçues:', req.body);
    console.log('📁 [BOAT] Fichiers reçus:', req.files ? req.files.length : 0);

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

    // Conversion des données d'entrée françaises vers anglaises
    const updateData = { ...req.body };
    
    // Mapping des types
    if (updateData.type) {
      const typeMapping = {
        'voilier': 'sailboat',
        'bateau à moteur': 'motorboat',
        'bateau_moteur': 'motorboat',
        'semi_rigide': 'motorboat',
        'peniche': 'motorboat',
        'catamaran': 'catamaran',
        'yacht': 'yacht',
        'autre': 'other'
      };
      updateData.type = typeMapping[updateData.type] || updateData.type;
    }
    
    // Mapping des catégories
    if (updateData.category) {
      const categoryMapping = {
        'luxe': 'luxury',
        'standard': 'standard',
        'budget': 'budget'
      };
      updateData.category = categoryMapping[updateData.category] || updateData.category;
    }

    // Traitement des spécifications
    if (updateData.specifications) {
      updateData.specifications = parseField(updateData.specifications);
      if (updateData.specifications.length) {
        updateData.specifications.length = parseFloat(updateData.specifications.length) || boat.specifications.length;
      }
      if (updateData.specifications.width) {
        updateData.specifications.width = parseFloat(updateData.specifications.width) || boat.specifications.width;
      }
    }

    // Traitement de la capacité
    if (updateData.capacity) {
      updateData.capacity = parseField(updateData.capacity);
      if (updateData.capacity.maxPeople) {
        updateData.capacity.maxPeople = parseInt(updateData.capacity.maxPeople) || boat.capacity.maxPeople;
      }
    }

    // Traitement de la localisation
    if (updateData.location) {
      updateData.location = parseField(updateData.location);
    }

    // Traitement du pricing
    if (updateData.pricing) {
      updateData.pricing = parseField(updateData.pricing);
      if (updateData.pricing.dailyRate) {
        updateData.pricing.dailyRate = parseFloat(updateData.pricing.dailyRate) || boat.pricing.dailyRate;
      }
      if (updateData.pricing.securityDeposit) {
        updateData.pricing.securityDeposit = parseFloat(updateData.pricing.securityDeposit) || boat.pricing.securityDeposit;
      }
    }

    // Gestion des nouvelles images si présentes
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/boats/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        isMain: false
      }));
      
      // Ajouter les nouvelles images aux existantes
      updateData.images = [...(boat.images || []), ...newImages];
      
      // Si c'est la première image, la définir comme principale
      if (boat.images.length === 0 && newImages.length > 0) {
        updateData.images[0].isMain = true;
      }
    }

    // Gestion de la suppression d'images (si des IDs d'images à supprimer sont fournis)
    if (updateData.imagesToDelete && Array.isArray(updateData.imagesToDelete)) {
      const imagesToDelete = JSON.parse(updateData.imagesToDelete);
      updateData.images = (updateData.images || boat.images).filter(img => 
        !imagesToDelete.includes(img._id?.toString())
      );
      delete updateData.imagesToDelete;
    }

    // Gestion de l'image principale
    if (updateData.mainImageId) {
      const mainImageId = updateData.mainImageId;
      if (updateData.images) {
        updateData.images = updateData.images.map(img => ({
          ...img,
          isMain: img._id?.toString() === mainImageId
        }));
      }
      delete updateData.mainImageId;
    }

    console.log('🚤 [BOAT] Données finales de mise à jour:', updateData);

    // Validation des données avant mise à jour
    if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
      throw new Error('Le nom du bateau ne peut pas être vide');
    }
    if (updateData.description !== undefined && (!updateData.description || updateData.description.trim() === '')) {
      throw new Error('La description ne peut pas être vide');
    }
    if (updateData.specifications?.length !== undefined && updateData.specifications.length <= 0) {
      throw new Error('La longueur du bateau doit être positive');
    }
    if (updateData.capacity?.maxPeople !== undefined && updateData.capacity.maxPeople <= 0) {
      throw new Error('Le nombre maximum de personnes doit être positif');
    }
    if (updateData.pricing?.dailyRate !== undefined && updateData.pricing.dailyRate <= 0) {
      throw new Error('Le tarif journalier doit être positif');
    }

    // Mise à jour du bateau
    const updatedBoat = await Boat.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    console.log('✅ [BOAT] Bateau mis à jour avec succès:', updatedBoat._id);

    // Conversion du bateau en français
    const boatInFrench = convertBoatToFrench(updatedBoat);

    res.json({
      success: true,
      message: 'Bateau mis à jour avec succès',
      data: { boat: boatInFrench }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la mise à jour du bateau:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.entries(error.errors || {}).reduce((acc, [key, val]) => {
        acc[key] = val.message;
        return acc;
      }, {});
      return res.status(400).json({
        success: false,
        message: 'Données invalides pour la mise à jour du bateau',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du bateau',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Suppression d'un bateau
exports.deleteBoat = async (req, res) => {
  try {
    console.log('🗑️ [BOAT] Début de suppression du bateau');
    const { id } = req.params;
    const userId = req.user.userId;
    const { force = false } = req.query; // Paramètre pour forcer la suppression

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
    console.log('🔍 [BOAT] Vérification des permissions:');
    console.log('🔍 [BOAT] User ID:', userId);
    console.log('🔍 [BOAT] Boat Owner:', boat.owner.toString());
    console.log('🔍 [BOAT] User Role:', user ? user.role : 'User not found');
    console.log('🔍 [BOAT] Is Owner:', boat.owner.toString() === userId);
    console.log('🔍 [BOAT] Is Admin:', user ? user.role === 'admin' : false);
    
    if (boat.owner.toString() !== userId && user.role !== 'admin') {
      console.log('❌ [BOAT] Accès refusé - utilisateur non autorisé');
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce bateau'
      });
    }
    
    console.log('✅ [BOAT] Permissions validées');

    console.log('🔍 [BOAT] Vérification des réservations actives...');

    // Vérifier s'il y a des réservations actives ou futures
    const Booking = require('../models/Booking.cjs');
    const activeBookings = await Booking.find({
      boat: id,
      status: { $in: ['confirmed', 'paid', 'in_progress'] },
      endDate: { $gte: new Date() }
    });

    if (activeBookings.length > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce bateau car il a des réservations actives ou futures',
        data: {
          activeBookings: activeBookings.length,
          bookings: activeBookings.map(booking => ({
            id: booking._id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: booking.status
          }))
        }
      });
    }

    console.log('📊 [BOAT] Réservations trouvées:', activeBookings.length);

    // Si force=true, annuler toutes les réservations futures
    if (activeBookings.length > 0 && force) {
      console.log('⚠️ [BOAT] Annulation forcée des réservations...');
      await Booking.updateMany(
        { 
          boat: id, 
          status: { $in: ['confirmed', 'paid'] },
          startDate: { $gte: new Date() }
        },
        { 
          status: 'cancelled',
          cancellationReason: 'Bateau supprimé par le propriétaire',
          cancelledAt: new Date(),
          cancelledBy: userId
        }
      );
    }

    // Désactiver le bateau au lieu de le supprimer (soft delete)
    boat.isActive = false;
    boat.status = 'inactive';
    boat.deletedAt = new Date();
    boat.deletedBy = userId;
    await boat.save();

    console.log('✅ [BOAT] Bateau supprimé avec succès:', boat._id);

    res.json({
      success: true,
      message: 'Bateau supprimé avec succès',
      data: {
        boatId: boat._id,
        cancelledBookings: activeBookings.length
      }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la suppression du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du bateau',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const { startDate, endDate, month } = req.query;

    // Si un mois est fourni, générer les dates de début et fin du mois
    let startDateToCheck, endDateToCheck;
    
    if (month) {
      // Format attendu: YYYY-MM
      const [year, monthNum] = month.split('-');
      if (!year || !monthNum) {
        return res.status(400).json({
          success: false,
          message: 'Format de mois invalide. Utilisez YYYY-MM'
        });
      }
      
      startDateToCheck = new Date(year, monthNum - 1, 1);
      endDateToCheck = new Date(year, monthNum, 0); // Dernier jour du mois
    } else if (startDate && endDate) {
      startDateToCheck = new Date(startDate);
      endDateToCheck = new Date(endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Dates de début et de fin requises, ou paramètre month (YYYY-MM)'
      });
    }

    const boat = await Boat.findById(id);
    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    // Pour les requêtes par mois, retourner la disponibilité générale
    if (month) {
      // Vérifier si le bateau est actif et disponible
      const isAvailable = boat.isActive && boat.status === 'available';
      
      res.json({
        success: true,
        data: {
          available: isAvailable,
          month: month,
          message: isAvailable ? 'Bateau disponible ce mois' : 'Bateau non disponible ce mois'
        }
      });
    } else {
      // Vérification détaillée avec dates spécifiques
      const isAvailable = boat.isAvailable(startDateToCheck, endDateToCheck);
      const pricing = boat.calculateTotalPrice(startDateToCheck, endDateToCheck);

      res.json({
        success: true,
        data: {
          available: isAvailable,
          pricing: isAvailable ? pricing : null,
          message: isAvailable ? 'Bateau disponible' : 'Bateau non disponible pour ces dates'
        }
      });
    }

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
// Restauration d'un bateau supprimé
exports.restoreBoat = async (req, res) => {
  try {
    console.log('🔄 [BOAT] Début de restauration du bateau');
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

    // Vérifier les droits de restauration
    const user = await User.findById(userId);
    if (boat.owner.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à restaurer ce bateau'
      });
    }

    // Vérifier si le bateau est bien supprimé
    if (boat.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ce bateau n\'est pas supprimé'
      });
    }

    // Restaurer le bateau
    boat.isActive = true;
    boat.status = 'available';
    boat.deletedAt = undefined;
    boat.deletedBy = undefined;
    await boat.save();

    console.log('✅ [BOAT] Bateau restauré avec succès:', boat._id);

    // Conversion du bateau en français
    const boatInFrench = convertBoatToFrench(boat);

    res.json({
      success: true,
      message: 'Bateau restauré avec succès',
      data: { boat: boatInFrench }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la restauration du bateau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration du bateau',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Suppression d'une image spécifique d'un bateau
exports.deleteBoatImage = async (req, res) => {
  try {
    console.log('🖼️ [BOAT] Début de suppression d\'image');
    const { id, imageId } = req.params;
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

    // Trouver l'image à supprimer
    const imageIndex = boat.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    const imageToDelete = boat.images[imageIndex];
    const wasMainImage = imageToDelete.isMain;

    // Supprimer l'image du tableau
    boat.images.splice(imageIndex, 1);

    // Si c'était l'image principale et qu'il reste des images, définir la première comme principale
    if (wasMainImage && boat.images.length > 0) {
      boat.images[0].isMain = true;
    }

    await boat.save();

    console.log('✅ [BOAT] Image supprimée avec succès:', imageId);

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: {
        deletedImageId: imageId,
        remainingImages: boat.images.length,
        newMainImage: boat.images.length > 0 ? boat.images[0]._id : null
      }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Définir une image comme principale
exports.setMainImage = async (req, res) => {
  try {
    console.log('⭐ [BOAT] Début de définition d\'image principale');
    const { id, imageId } = req.params;
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

    // Trouver l'image à définir comme principale
    const targetImage = boat.images.find(img => img._id.toString() === imageId);
    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    // Retirer le statut principal de toutes les images
    boat.images.forEach(img => {
      img.isMain = false;
    });

    // Définir l'image cible comme principale
    targetImage.isMain = true;

    await boat.save();

    console.log('✅ [BOAT] Image principale définie avec succès:', imageId);

    res.json({
      success: true,
      message: 'Image principale définie avec succès',
      data: {
        mainImageId: imageId
      }
    });

  } catch (error) {
    console.error('❌ [BOAT] Erreur lors de la définition de l\'image principale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la définition de l\'image principale',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.upload = upload;