/**
 * Service de gestion des paiements
 * Gère toutes les opérations liées aux paiements via Stripe (simulation pour l'instant)
 */
export class PaymentService {
  constructor() {
    // URL de base de l'API (auto-détection env)
    const isBrowser = typeof window !== 'undefined';
    const isVercel = isBrowser && window.location.hostname.endsWith('.vercel.app');
    const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
    this.baseURL = isVercel ? '/api' : (envBase || 'https://sailingloc.onrender.com/api');
    this.paymentsEndpoint = `${this.baseURL}/payments`;
    
    // Configuration Stripe (à configurer plus tard)
    this.stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    this.stripe = null;
    
    // Initialisation de Stripe si la clé est disponible
    this.initializeStripe();
  }

  /**
   * Initialisation de Stripe
   */
  async initializeStripe() {
    if (this.stripePublishableKey && window.Stripe) {
      try {
        this.stripe = window.Stripe(this.stripePublishableKey);
        console.log('✅ Stripe initialisé');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Stripe:', error);
      }
    } else {
      console.log('ℹ️ Stripe non configuré - Mode simulation activé');
    }
  }

  /**
   * Création d'un Payment Intent
   * @param {string} bookingId - ID de la réservation
   * @returns {Promise<Object>} Payment Intent créé
   */
  async createPaymentIntent(bookingId) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.paymentsEndpoint}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du paiement');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du Payment Intent:', error);
      throw error;
    }
  }

  /**
   * Confirmation d'un paiement
   * @param {string} paymentIntentId - ID du Payment Intent
   * @param {string} paymentMethodId - ID de la méthode de paiement (optionnel en simulation)
   * @returns {Promise<Object>} Résultat du paiement
   */
  async confirmPayment(paymentIntentId, paymentMethodId = null) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      // Si Stripe est configuré, utiliser la vraie API
      if (this.stripe && paymentMethodId) {
        return await this.confirmStripePayment(paymentIntentId, paymentMethodId);
      }

      // Sinon, utiliser la simulation
      return await this.confirmSimulatedPayment(paymentIntentId, paymentMethodId);
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement:', error);
      throw error;
    }
  }

  /**
   * Confirmation d'un paiement Stripe réel
   * @param {string} paymentIntentId - ID du Payment Intent
   * @param {string} paymentMethodId - ID de la méthode de paiement
   * @returns {Promise<Object>} Résultat du paiement
   */
  async confirmStripePayment(paymentIntentId, paymentMethodId) {
    try {
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(paymentIntentId, {
        payment_method: paymentMethodId
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Notifier le serveur du succès du paiement
        return await this.notifyPaymentSuccess(paymentIntentId);
      }

      return {
        success: false,
        message: 'Le paiement n\'a pas pu être traité'
      };
    } catch (error) {
      console.error('Erreur lors du paiement Stripe:', error);
      throw error;
    }
  }

  /**
   * Confirmation d'un paiement simulé
   * @param {string} paymentIntentId - ID du Payment Intent
   * @param {string} paymentMethodId - ID de la méthode de paiement
   * @returns {Promise<Object>} Résultat du paiement simulé
   */
  async confirmSimulatedPayment(paymentIntentId, paymentMethodId) {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${this.paymentsEndpoint}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          paymentIntentId, 
          paymentMethodId: paymentMethodId || 'pm_simulation_card'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la confirmation du paiement');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du paiement simulé:', error);
      throw error;
    }
  }

  /**
   * Notification du serveur du succès du paiement
   * @param {string} paymentIntentId - ID du Payment Intent
   * @returns {Promise<Object>} Confirmation du serveur
   */
  async notifyPaymentSuccess(paymentIntentId) {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${this.paymentsEndpoint}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentIntentId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la notification du paiement');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la notification du paiement:', error);
      throw error;
    }
  }

  /**
   * Demande de remboursement
   * @param {string} bookingId - ID de la réservation
   * @param {number} amount - Montant à rembourser (optionnel)
   * @param {string} reason - Raison du remboursement
   * @returns {Promise<Object>} Résultat du remboursement
   */
  async refundPayment(bookingId, amount = null, reason = '') {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.paymentsEndpoint}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId, amount, reason })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du remboursement');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      throw error;
    }
  }

  /**
   * Récupération de l'historique des paiements
   * @param {Object} params - Paramètres de filtrage et pagination
   * @returns {Promise<Object>} Historique des paiements
   */
  async getPaymentHistory(params = {}) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${this.paymentsEndpoint}/history?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'historique');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
      throw error;
    }
  }

  /**
   * Récupération des statistiques de paiement
   * @returns {Promise<Object>} Statistiques des paiements
   */
  async getPaymentStats() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.paymentsEndpoint}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de paiement:', error);
      throw error;
    }
  }

  /**
   * Création d'un formulaire de paiement simulé
   * @param {Object} paymentIntent - Payment Intent
   * @param {HTMLElement} container - Conteneur pour le formulaire
   * @returns {Object} Formulaire de paiement
   */
  createSimulatedPaymentForm(paymentIntent, container) {
    // Création d'un formulaire de paiement simulé
    const form = document.createElement('form');
    form.className = 'payment-form';
    form.innerHTML = `
      <div class="payment-header">
        <h3>Paiement sécurisé</h3>
        <p class="payment-amount">Montant: ${(paymentIntent.amount / 100).toFixed(2)}€</p>
      </div>
      
      <div class="payment-method">
        <h4>Mode de paiement</h4>
        <div class="payment-options">
          <label class="payment-option">
            <input type="radio" name="payment-method" value="card" checked>
            <span class="option-label">
              💳 Carte bancaire
            </span>
          </label>
        </div>
      </div>
      
      <div class="card-form" id="card-form">
        <div class="form-group">
          <label for="card-number">Numéro de carte</label>
          <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" required>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="card-expiry">MM/AA</label>
            <input type="text" id="card-expiry" placeholder="12/25" maxlength="5" required>
          </div>
          <div class="form-group">
            <label for="card-cvc">CVC</label>
            <input type="text" id="card-cvc" placeholder="123" maxlength="4" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="card-name">Nom sur la carte</label>
          <input type="text" id="card-name" placeholder="Jean Dupont" required>
        </div>
      </div>
      
      <div class="payment-summary">
        <div class="summary-line">
          <span>Sous-total:</span>
          <span>${(paymentIntent.amount / 100).toFixed(2)}€</span>
        </div>
        <div class="summary-line total">
          <span>Total:</span>
          <span>${(paymentIntent.amount / 100).toFixed(2)}€</span>
        </div>
      </div>
      
      <button type="submit" class="btn-primary btn-full payment-submit">
        Payer ${(paymentIntent.amount / 100).toFixed(2)}€
      </button>
      
      <div class="payment-security">
        <p>🔒 Paiement sécurisé SSL</p>
      </div>
    `;

    // Formatage automatique des champs
    this.setupCardFormatting(form);

    // Gestion de la soumission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const submitBtn = form.querySelector('.payment-submit');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Traitement...';
        
        // Simulation d'un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Confirmation du paiement simulé
        const result = await this.confirmPayment(paymentIntent.id);
        
        if (result.success) {
          this.showPaymentSuccess(container, result.data);
        } else {
          throw new Error(result.message || 'Erreur de paiement');
        }
        
      } catch (error) {
        console.error('Erreur de paiement:', error);
        this.showPaymentError(container, error.message);
        
        const submitBtn = form.querySelector('.payment-submit');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    container.innerHTML = '';
    container.appendChild(form);

    return {
      form,
      submit: () => form.dispatchEvent(new Event('submit'))
    };
  }

  /**
   * Configuration du formatage automatique des champs de carte
   * @param {HTMLElement} form - Formulaire de paiement
   */
  setupCardFormatting(form) {
    const cardNumber = form.querySelector('#card-number');
    const cardExpiry = form.querySelector('#card-expiry');
    const cardCvc = form.querySelector('#card-cvc');

    // Formatage du numéro de carte
    if (cardNumber) {
      cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
      });
    }

    // Formatage de la date d'expiration
    if (cardExpiry) {
      cardExpiry.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
      });
    }

    // Formatage du CVC
    if (cardCvc) {
      cardCvc.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
    }
  }

  /**
   * Affichage du succès du paiement
   * @param {HTMLElement} container - Conteneur
   * @param {Object} paymentData - Données du paiement
   */
  showPaymentSuccess(container, paymentData) {
    container.innerHTML = `
      <div class="payment-success">
        <div class="success-icon">✅</div>
        <h3>Paiement réussi !</h3>
        <p>Votre réservation a été confirmée.</p>
        <div class="payment-details">
          <p><strong>Numéro de réservation:</strong> ${paymentData.booking.bookingNumber}</p>
          <p><strong>Montant payé:</strong> ${paymentData.payment.amount}€</p>
        </div>
        <button class="btn-primary" onclick="window.location.reload()">
          Retour à l'accueil
        </button>
      </div>
    `;
  }

  /**
   * Affichage d'une erreur de paiement
   * @param {HTMLElement} container - Conteneur
   * @param {string} errorMessage - Message d'erreur
   */
  showPaymentError(container, errorMessage) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error';
    errorDiv.innerHTML = `
      <div class="error-icon">❌</div>
      <p><strong>Erreur de paiement:</strong> ${errorMessage}</p>
      <button class="btn-secondary" onclick="this.parentElement.remove()">
        Réessayer
      </button>
    `;
    
    container.insertBefore(errorDiv, container.firstChild);
    
    // Supprimer l'erreur après 5 secondes
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  /**
   * Validation des données de carte de crédit
   * @param {Object} cardData - Données de la carte
   * @returns {Object} Résultat de la validation
   */
  validateCardData(cardData) {
    const errors = [];

    // Validation du numéro de carte (algorithme de Luhn simplifié)
    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
      errors.push('Numéro de carte invalide');
    }

    // Validation de la date d'expiration
    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      errors.push('Date d\'expiration invalide (MM/AA)');
    } else {
      const [month, year] = cardData.expiry.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.push('Mois d\'expiration invalide');
      }
      
      if (parseInt(year) < currentYear || 
          (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.push('Carte expirée');
      }
    }

    // Validation du CVC
    if (!cardData.cvc || cardData.cvc.length < 3 || cardData.cvc.length > 4) {
      errors.push('Code CVC inval ide');
    }

    // Validation du nom
    if (!cardData.name || cardData.name.trim().length < 2) {
      errors.push('Nom sur la carte requis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Récupération du token d'authentification
   * @returns {string|null} Token d'authentification
   */
  getAuthToken() {
    try {
      return localStorage.getItem('sailingloc_token');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Formatage d'un montant pour l'affichage
   * @param {number} amount - Montant en centimes
   * @param {string} currency - Devise
   * @returns {string} Montant formaté
   */
  formatAmount(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  /**
   * Vérification du statut de Stripe
   * @returns {boolean} True si Stripe est configuré et prêt
   */
  isStripeReady() {
    return this.stripe !== null && this.stripePublishableKey !== undefined;
  }

  /**
   * Chargement dynamique de Stripe.js
   * @returns {Promise<boolean>} True si le chargement réussit
   */
  async loadStripe() {
    if (window.Stripe) {
      return true;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          this.initializeStripe();
          resolve(true);
        };
        script.onerror = () => reject(false);
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Erreur lors du chargement de Stripe:', error);
      return false;
    }
  }
}