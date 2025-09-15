const stripe = require('../config/stripe.cjs');

// Créer une session de paiement Stripe
exports.createPaymentSession = async (req, res) => {
  try {
    const { 
      boatId, 
      boatName, 
      startDate, 
      endDate, 
      totalPrice, 
      customerEmail, 
      customerName 
    } = req.body;

    // Validation des données requises
    if (!boatId || !boatName || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Données de réservation manquantes'
      });
    }

    console.log('💳 Création d\'une session de paiement Stripe:', {
      boatId,
      boatName,
      startDate,
      endDate,
      totalPrice,
      customerEmail
    });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Location de bateau: ${boatName}`,
              description: `Location du ${startDate} au ${endDate}`,
              images: [], // On peut ajouter l'image du bateau ici
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-confirmation.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-summary.html?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        boatId,
        boatName,
        startDate,
        endDate,
        totalPrice: totalPrice.toString()
      }
    });

    console.log('✅ Session Stripe créée:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la session Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message
    });
  }
};

// Récupérer les détails d'une session de paiement
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        session: {
          id: session.id,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_email,
          metadata: session.metadata
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Paiement non confirmé'
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la session',
      error: error.message
    });
  }
};