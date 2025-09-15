// Service Stripe pour la gestion des paiements
export class StripeService {
  constructor(appStateService = null) {
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.isInitialized = false;
    this.appStateService = appStateService;
    
    // URL de base de l'API (auto-détection env)
    const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
    
    // En production, utiliser l'URL complète de Render
    // En développement, utiliser le proxy Vite
    if (envBase) {
      this.baseURL = envBase;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.baseURL = '/api'; // Proxy Vite en développement
    } else {
      this.baseURL = 'https://sailingloc.onrender.com/api'; // URL complète en production
    }
  }

  // Récupérer le token d'authentification
  getAuthToken() {
    if (this.appStateService) {
      return this.appStateService.getAuthToken();
    }
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
      console.log('🔑 Token récupéré:', token ? 'Présent' : 'Absent');
      console.log('🔑 Token complet:', token);
      
      if (!token) {
        throw new Error('Vous devez être connecté pour effectuer un paiement');
      }

      console.log('📤 Données envoyées au serveur:', bookingData);
      
      const response = await fetch(`${this.baseURL}/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('📥 Réponse du serveur:', response.status, response.statusText);

      if (!response.ok) {
        // Récupérer le message d'erreur détaillé
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('📥 Détails de l\'erreur:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log('📥 Impossible de parser la réponse d\'erreur');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Session de paiement créée:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la session de paiement:', error);
      throw error;
    }
  }

  // Vérifier le statut d'une session
  async verifySession(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/payments/verify-session/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Session vérifiée:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la session:', error);
      throw error;
    }
  }

  // Créer les éléments de paiement
  async createPaymentElements(clientSecret) {
    try {
      if (!this.stripe) {
        await this.initialize();
      }

      const elements = this.stripe.elements({
        clientSecret: clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2f7fe0',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          }
        }
      });

      this.paymentElement = elements.create('payment');
      return this.paymentElement;
    } catch (error) {
      console.error('❌ Erreur lors de la création des éléments de paiement:', error);
      throw error;
    }
  }

  // Confirmer le paiement
  async confirmPayment(clientSecret, returnUrl) {
    try {
      if (!this.stripe || !this.paymentElement) {
        throw new Error('Stripe non initialisé');
      }

      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.stripe.elements({ clientSecret }),
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ Erreur de paiement:', error);
        throw new Error(error.message);
      }

      console.log('✅ Paiement confirmé:', paymentIntent);
      return paymentIntent;
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation du paiement:', error);
      throw error;
    }
  }

  // Récupérer le statut d'un paiement
  async retrievePaymentIntent(paymentIntentId) {
    try {
      if (!this.stripe) {
        await this.initialize();
      }

      const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId);
      console.log('✅ PaymentIntent récupéré:', paymentIntent);
      return paymentIntent;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du PaymentIntent:', error);
      throw error;
    }
  }
}