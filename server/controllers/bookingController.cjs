const Booking = require('../models/Booking.cjs');
const Boat = require('../models/Boat.cjs');
const User = require('../models/User.cjs');

// Création d'une nouvelle réservation
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      boatId,
      startDate,
      endDate,
      participants,
      emergencyContact,
      renterExperience,
      specialRequests,
      skipperRequested = false,
      additionalServices = []
    } = req.body;

    // Vérification des champs obligatoires
    if (!boatId || !startDate || !endDate || !participants || !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Récupération du bateau
    const boat = await Boat.findById(boatId).populate('owner');
    if (!boat) {
      return res.status(404).json({
        success: false,
        message: 'Bateau non trouvé'
      });
    }

    // Vérification que le bateau est disponible
    if (!boat.isAvailable(startDate, endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Bateau non disponible pour ces dates'
      });
    }

    // Vérification de la capacité
    const totalParticipants = participants.adults + participants.children;
    if (totalParticipants > boat.capacity.maxPeople) {
      return res.status(400).json({
        success: false,
        message: `Le bateau ne peut accueillir que ${boat.capacity.maxPeople} personnes maximum`
      });
    }

    // Calcul du prix
    const pricing = boat.calculateTotalPrice(startDate, endDate);

    // Calcul des services additionnels
    let additionalServicesCost = 0;
    if (additionalServices.length > 0) {
      additionalServicesCost = additionalServices.reduce((total, service) => {
        return total + (service.price * service.quantity);
      }, 0);
    }

    // Coût du skipper si demandé
    let skipperCost = 0;
    if (skipperRequested) {
      skipperCost = pricing.days * 150; // 150€ par jour pour un skipper
    }

    // Calcul du montant total
    const totalAmount = pricing.total + additionalServicesCost + skipperCost;

    // Création de la réservation
    const booking = new Booking({
      boat: boatId,
      renter: userId,
      owner: boat.owner._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      participants: {
        adults: participants.adults,
        children: participants.children,
        total: totalParticipants
      },
      pricing: {
        dailyRate: boat.pricing.dailyRate,
        numberOfDays: pricing.days,
        subtotal: pricing.subtotal,
        cleaningFee: pricing.cleaningFee,
        securityDeposit: pricing.securityDeposit,
        totalAmount
      },
      emergencyContact,
      renterExperience,
      specialRequests,
      skipperRequested,
      additionalServices,
      skipperInfo: skipperRequested ? {
        additionalCost: skipperCost
      } : undefined
    });

    await booking.save();

    // Ajouter la période d'indisponibilité au bateau
    await boat.addUnavailablePeriod(startDate, endDate, 'booked');

    // Peupler les informations pour la réponse
    await booking.populate([
      { path: 'boat', select: 'name type location images pricing' },
      { path: 'renter', select: 'firstName lastName email phone' },
      { path: 'owner', select: 'firstName lastName email phone' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation'
    });
  }
};

// Récupération des réservations de l'utilisateur
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, type = 'all' } = req.query;

    let query = {};

    // Filtrage par type de réservation
    if (type === 'renter') {
      query.renter = userId;
    } else if (type === 'owner') {
      query.owner = userId;
    } else {
      query.$or = [{ renter: userId }, { owner: userId }];
    }

    // Filtrage par statut
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('boat', 'name type location images pricing')
      .populate('renter', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
};

// Récupération d'une réservation par ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findById(id)
      .populate('boat')
      .populate('renter', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur a le droit de voir cette réservation
    const user = await User.findById(userId);
    if (booking.renter._id.toString() !== userId && 
        booking.owner._id.toString() !== userId && 
        user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir cette réservation'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
};

// Confirmation d'une réservation (propriétaire)
exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est le propriétaire qui confirme
    if (booking.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut confirmer la réservation'
      });
    }

    // Vérifier que la réservation est en attente
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être confirmée'
      });
    }

    await booking.confirm();

    res.json({
      success: true,
      message: 'Réservation confirmée avec succès',
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation de la réservation'
    });
  }
};

// Annulation d'une réservation
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier les droits d'annulation
    const user = await User.findById(userId);
    if (booking.renter.toString() !== userId && 
        booking.owner.toString() !== userId && 
        user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à annuler cette réservation'
      });
    }

    // Vérifier que la réservation peut être annulée
    if (['cancelled', 'completed', 'refunded'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être annulée'
      });
    }

    const cancellationInfo = await booking.cancel(userId, reason);

    // Libérer les dates dans le bateau
    const boat = await Boat.findById(booking.boat);
    if (boat) {
      boat.unavailablePeriods = boat.unavailablePeriods.filter(period => {
        return !(period.startDate.getTime() === booking.startDate.getTime() &&
                period.endDate.getTime() === booking.endDate.getTime());
      });
      await boat.save();
    }

    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: {
        booking,
        cancellationInfo
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la réservation'
    });
  }
};

// Check-in d'une réservation
exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const checkInData = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est le propriétaire qui fait le check-in
    if (booking.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut effectuer le check-in'
      });
    }

    // Vérifier que la réservation est payée
    if (booking.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'La réservation doit être payée pour effectuer le check-in'
      });
    }

    await booking.startRental({
      ...checkInData,
      performedBy: userId
    });

    res.json({
      success: true,
      message: 'Check-in effectué avec succès',
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors du check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du check-in'
    });
  }
};

// Check-out d'une réservation
exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const checkOutData = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est le propriétaire qui fait le check-out
    if (booking.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le propriétaire peut effectuer le check-out'
      });
    }

    // Vérifier que la réservation est active
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'La réservation doit être active pour effectuer le check-out'
      });
    }

    await booking.endRental({
      ...checkOutData,
      performedBy: userId
    });

    // Mettre à jour les statistiques du bateau
    const boat = await Boat.findById(booking.boat);
    if (boat) {
      boat.stats.totalBookings += 1;
      boat.stats.totalRevenue += booking.pricing.totalAmount;
      boat.stats.lastBooked = new Date();
      await boat.save();
    }

    res.json({
      success: true,
      message: 'Check-out effectué avec succès',
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors du check-out:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du check-out'
    });
  }
};

// Ajout d'un avis sur une réservation
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être comprise entre 1 et 5'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que la réservation est terminée
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez évaluer que les réservations terminées'
      });
    }

    // Déterminer qui laisse l'avis
    let reviewType;
    if (booking.renter.toString() === userId) {
      reviewType = 'renterReview';
    } else if (booking.owner.toString() === userId) {
      reviewType = 'ownerReview';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à évaluer cette réservation'
      });
    }

    // Vérifier qu'un avis n'a pas déjà été laissé
    if (booking.review[reviewType]) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà évalué cette réservation'
      });
    }

    // Ajouter l'avis
    booking.review[reviewType] = {
      rating,
      comment,
      createdAt: new Date()
    };

    await booking.save();

    // Mettre à jour la note du bateau si c'est un avis de locataire
    if (reviewType === 'renterReview') {
      const boat = await Boat.findById(booking.boat);
      if (boat) {
        await boat.updateRating(rating);
      }
    }

    // Mettre à jour la note du propriétaire si c'est un avis de locataire
    if (reviewType === 'renterReview') {
      const owner = await User.findById(booking.owner);
      if (owner && owner.role === 'owner') {
        await owner.updateOwnerRating(rating);
      }
    }

    res.json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: { booking }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'avis'
    });
  }
};

// Statistiques des réservations
exports.getBookingStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    let matchQuery = {};

    // Filtrer selon le rôle
    if (user.role === 'admin') {
      // Admin voit tout
    } else if (user.role === 'owner') {
      matchQuery.owner = userId;
    } else {
      matchQuery.renter = userId;
    }

    const stats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageBookingValue: { $avg: '$pricing.totalAmount' },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyStats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          averageBookingValue: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0
        },
        monthly: monthlyStats
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