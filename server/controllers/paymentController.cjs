const Booking = require('../models/Booking.cjs');
const Boat = require('../models/Boat.cjs');

// Simulation d'un processus de paiement (sans Stripe pour l'instant)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    // Récupération de la réservation
    const booking = await Booking.findById(bookingId)
      .populate('boat', 'name pricing')
      .populate('renter', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est bien le locataire qui fait le paiement
    if (booking.renter._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à payer cette réservation'
      });
    }

    // Vérifier que la réservation est confirmée
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'La réservation doit être confirmée avant le paiement'
      });
    }

    // Simulation d'un Payment Intent (normalement créé avec Stripe)
    const paymentIntent = {
      id: `pi_simulation_${Date.now()}`,
      amount: Math.round(booking.pricing.totalAmount * 100), // Montant en centimes
      currency: 'eur',
      status: 'requires_payment_method',
      client_secret: `pi_simulation_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId
      }
    };

    // Sauvegarder l'ID du Payment Intent dans la réservation
    booking.payment.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment Intent créé avec succès',
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        },
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          totalAmount: booking.pricing.totalAmount,
          boat: booking.boat.name
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement'
    });
  }
};

// Confirmation du paiement (simulation)
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    const userId = req.user.userId;

    // Récupération de la réservation par Payment Intent ID
    const booking = await Booking.findOne({
      'payment.stripePaymentIntentId': paymentIntentId
    }).populate('boat', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier que c'est bien le locataire
    if (booking.renter.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Simulation du traitement du paiement
    // Dans un vrai environnement, on utiliserait l'API Stripe ici
    const simulatedPayment = {
      id: `ch_simulation_${Date.now()}`,
      status: 'succeeded',
      amount: Math.round(booking.pricing.totalAmount * 100),
      currency: 'eur',
      payment_method: paymentMethodId || 'pm_simulation_card'
    };

    // Marquer la réservation comme payée
    await booking.markAsPaid({
      method: 'stripe',
      stripeChargeId: simulatedPayment.id,
      stripePaymentIntentId: paymentIntentId
    });

    res.json({
      success: true,
      message: 'Paiement confirmé avec succès',
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          totalAmount: booking.pricing.totalAmount
        },
        payment: {
          id: simulatedPayment.id,
          status: simulatedPayment.status,
          amount: simulatedPayment.amount / 100
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement'
    });
  }
};

// Remboursement d'un paiement
exports.refundPayment = async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findById(bookingId)
      .populate('boat', 'name')
      .populate('owner', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Vérifier les droits (propriétaire ou admin)
    if (booking.owner._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à effectuer ce remboursement'
      });
    }

    // Vérifier que la réservation a été payée
    if (!booking.payment.paidAt) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation n\'a pas été payée'
      });
    }

    // Vérifier que le remboursement n'a pas déjà été effectué
    if (booking.payment.refundedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation a déjà été remboursée'
      });
    }

    const refundAmount = amount || booking.pricing.totalAmount;

    // Simulation du remboursement
    const simulatedRefund = {
      id: `re_simulation_${Date.now()}`,
      status: 'succeeded',
      amount: Math.round(refundAmount * 100),
      currency: 'eur',
      charge: booking.payment.stripeChargeId,
      reason: reason || 'requested_by_customer'
    };

    // Mettre à jour la réservation
    booking.payment.refundedAt = new Date();
    booking.payment.refundAmount = refundAmount;
    booking.payment.refundReason = reason;
    booking.status = 'refunded';

    await booking.save();

    res.json({
      success: true,
      message: 'Remboursement effectué avec succès',
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          status: booking.status
        },
        refund: {
          id: simulatedRefund.id,
          status: simulatedRefund.status,
          amount: simulatedRefund.amount / 100,
          reason: simulatedRefund.reason
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement'
    });
  }
};

// Récupération de l'historique des paiements
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    let query = {
      $or: [
        { renter: userId },
        { owner: userId }
      ],
      'payment.paidAt': { $exists: true }
    };

    if (status) {
      query.status = status;
    }

    const payments = await Booking.find(query)
      .populate('boat', 'name type location')
      .populate('renter', 'firstName lastName email')
      .populate('owner', 'firstName lastName email')
      .select('bookingNumber startDate endDate pricing payment status')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'payment.paidAt': -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique des paiements'
    });
  }
};

// Webhook pour les événements Stripe (simulation)
exports.handleWebhook = async (req, res) => {
  try {
    // Dans un vrai environnement, on vérifierait la signature du webhook Stripe
    const event = req.body;

    console.log('Webhook reçu:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Traitement du succès du paiement
        const paymentIntent = event.data.object;
        const booking = await Booking.findOne({
          'payment.stripePaymentIntentId': paymentIntent.id
        });

        if (booking && booking.status === 'confirmed') {
          await booking.markAsPaid({
            method: 'stripe',
            stripeChargeId: paymentIntent.charges?.data[0]?.id,
            stripePaymentIntentId: paymentIntent.id
          });
          console.log(`Réservation ${booking.bookingNumber} marquée comme payée`);
        }
        break;

      case 'payment_intent.payment_failed':
        // Traitement de l'échec du paiement
        console.log('Échec du paiement:', event.data.object.id);
        break;

      case 'charge.dispute.created':
        // Traitement des litiges
        console.log('Litige créé:', event.data.object.id);
        break;

      default:
        console.log(`Type d'événement non géré: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(400).json({
      success: false,
      message: 'Erreur lors du traitement du webhook'
    });
  }
};

// Statistiques des paiements
exports.getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Statistiques globales
    const stats = await Booking.aggregate([
      {
        $match: {
          owner: userId,
          'payment.paidAt': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalPayments: { $sum: 1 },
          averagePayment: { $avg: '$pricing.totalAmount' },
          totalRefunded: {
            $sum: {
              $cond: [
                { $exists: ['$payment.refundedAt', true] },
                '$payment.refundAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Revenus par mois
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          owner: userId,
          'payment.paidAt': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$payment.paidAt' },
            month: { $month: '$payment.paidAt' }
          },
          revenue: { $sum: '$pricing.totalAmount' },
          payments: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRevenue: 0,
          totalPayments: 0,
          averagePayment: 0,
          totalRefunded: 0
        },
        monthly: monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};