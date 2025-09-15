// Service Stripe pour la gestion des paiements
export class StripeService {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.isInitialized = false;
  }

  // Récupérer le token d'authentification
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Initialiser Stripe
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Charger Stripe.js
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialiser Stripe avec la clé publique
      this.stripe = window.Stripe('pk_live_51RrIXsCOaiVcTD9sZVaREYZc3QTQNeU8VQZ5VUDddHUNiPGVpMN1oiREmM3UcCBqdTfXF2SjO9YjGKsVy7iinX9n00bQXl4cig');
      this.isInitialized = true;
      
      console.log('✅ Stripe initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de Stripe:', error);
      throw error;
    }
  }

  // Créer une session de paiement
  async createPaymentSession(bookingData) {
    try {
      // Vérifier l'authentification avant l'appel
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour effectuer un paiement');
      }

      const response = await fetch('https://sailingloc.onrender.com/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const session = await response.json();
      return session;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  }

  // Rediriger vers Stripe Checkout
  async redirectToCheckout(sessionId) {
    try {
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la redirection vers Stripe:', error);
      throw error;
    }
  }

  // Vérifier le statut d'une session
  async verifySession(sessionId) {
    try {
      const response = await fetch(`/api/payments/verify-session/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la session:', error);
      throw error;
    }
  }

  // Créer un élément de paiement (pour les paiements intégrés)
  async createPaymentElement(clientSecret, containerId) {
    try {
      await this.initialize();
      
      const elements = this.stripe.elements({
        clientSecret: clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#667eea',
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorDanger: '#dc2626',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
          }
        }
      });

      this.paymentElement = elements.create('payment');
      this.paymentElement.mount(`#${containerId}`);
      
      return this.paymentElement;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'élément de paiement:', error);
      throw error;
    }
  }

  // Confirmer le paiement
  async confirmPayment(clientSecret, paymentMethodData = {}) {
    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret: clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation.html`,
          ...paymentMethodData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return paymentIntent;
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation du paiement:', error);
      throw error;
    }
  }
}

// Instance singleton
export const stripeService = new StripeService();
