/**
 * Gestionnaire de confirmation de réservation pour SailingLoc
 * Affiche les détails de la réservation confirmée
 */

import { BookingService } from './services/BookingService.js';
import { AuthService } from './services/AuthService.js';
import { UIManager } from './utils/UIManager.js';

class BookingConfirmationManager {
  constructor() {
    this.bookingService = new BookingService();
    this.authService = new AuthService();
    this.uiManager = new UIManager();
    
    this.bookingData = null;
    
    this.init();
  }

  /**
   * Initialisation du gestionnaire
   */
  init() {
    this.loadBookingData();
    this.setupEventListeners();
  }

  /**
   * Chargement des données de réservation
   */
  async loadBookingData() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bookingId = urlParams.get('id');

      if (!bookingId) {
        throw new Error('Aucune réservation spécifiée');
      }

      // Charger les données de la réservation
      const response = await this.bookingService.getBookingById(bookingId);
      
      if (response.success) {
        this.bookingData = response.data.booking;
        this.displayBookingDetails();
        this.showContent();
      } else {
        throw new Error(response.message || 'Réservation non trouvée');
      }

    } catch (error) {
      console.error('Erreur lors du chargement de la réservation:', error);
      this.showError('Impossible de charger les détails de votre réservation');
    }
  }

  /**
   * Affichage des détails de la réservation
   */
  displayBookingDetails() {
    if (!this.bookingData) return;

    // Numéro de réservation
    document.getElementById('booking-number').textContent = this.bookingData.bookingNumber;

    // Informations du bateau
    if (this.bookingData.boat) {
      document.getElementById('boat-name').textContent = this.bookingData.boat.name;
      document.getElementById('boat-location').textContent = `${this.bookingData.boat.location.city}, ${this.bookingData.boat.location.country}`;
      document.getElementById('boat-capacity').textContent = `${this.bookingData.boat.capacity.maxPeople} personnes`;
      document.getElementById('boat-type').textContent = this.bookingData.boat.type;

      // Image du bateau
      const boatImage = document.getElementById('boat-image');
      if (this.bookingData.boat.images && this.bookingData.boat.images.length > 0) {
        boatImage.src = this.bookingData.boat.images[0];
        boatImage.style.display = 'block';
        document.querySelector('.boat-placeholder').style.display = 'none';
      }
    }

    // Dates
    document.getElementById('start-date').textContent = this.formatDate(this.bookingData.startDate);
    document.getElementById('end-date').textContent = this.formatDate(this.bookingData.endDate);
    document.getElementById('duration').textContent = this.calculateDuration();

    // Participants
    document.getElementById('adults-count').textContent = `${this.bookingData.participants.adults} adulte${this.bookingData.participants.adults > 1 ? 's' : ''}`;
    document.getElementById('children-count').textContent = `${this.bookingData.participants.children} enfant${this.bookingData.participants.children > 1 ? 's' : ''}`;

    // Prix
    this.displayPricing();

    // Statut
    this.displayStatus();
  }

  /**
   * Affichage des prix
   */
  displayPricing() {
    const pricing = this.bookingData.pricing;
    
    // Prix de base
    document.getElementById('subtotal-price').textContent = `${pricing.subtotal}€`;

    // Skipper
    if (this.bookingData.skipperRequested) {
      const skipperCost = pricing.numberOfDays * 150;
      document.getElementById('skipper-price').textContent = `${skipperCost}€`;
      document.getElementById('skipper-price-item').style.display = 'flex';
    }

    // Services additionnels
    if (this.bookingData.additionalServices && this.bookingData.additionalServices.length > 0) {
      const servicesCost = this.bookingData.additionalServices.reduce((total, service) => total + (service.price * service.quantity), 0);
      document.getElementById('services-price').textContent = `${servicesCost}€`;
      document.getElementById('services-price-item').style.display = 'flex';
    }

    // Frais de nettoyage
    document.getElementById('cleaning-fee').textContent = `${pricing.cleaningFee || 0}€`;

    // Total
    document.getElementById('total-price').textContent = `${pricing.totalAmount}€`;
  }

  /**
   * Affichage du statut
   */
  displayStatus() {
    const status = this.bookingData.status;
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const statusDescription = document.getElementById('status-description');

    // Mise à jour du badge de statut
    statusBadge.className = `status-badge status-${status}`;
    
    // Texte du statut
    const statusLabels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'paid': 'Payée',
      'active': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };

    statusText.textContent = statusLabels[status] || status;

    // Description du statut
    const statusDescriptions = {
      'pending': 'Votre réservation est en attente de confirmation par le propriétaire.',
      'confirmed': 'Votre réservation a été confirmée. Vous pouvez maintenant effectuer le paiement.',
      'paid': 'Votre réservation est payée. Préparez-vous pour votre aventure !',
      'active': 'Votre location est en cours. Profitez bien de votre séjour !',
      'completed': 'Votre location est terminée. Merci d\'avoir choisi SailingLoc !',
      'cancelled': 'Votre réservation a été annulée.',
      'refunded': 'Votre réservation a été remboursée.'
    };

    statusDescription.textContent = statusDescriptions[status] || 'Statut inconnu';
  }

  /**
   * Calcul de la durée
   */
  calculateDuration() {
    const start = new Date(this.bookingData.startDate);
    const end = new Date(this.bookingData.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  /**
   * Formatage d'une date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Bouton "Voir ma réservation"
    document.getElementById('view-booking').addEventListener('click', () => {
      // Redirection vers la page des réservations
      window.location.href = 'boats.html#bookings';
    });

    // Bouton "Télécharger le reçu"
    document.getElementById('download-invoice').addEventListener('click', () => {
      this.downloadInvoice();
    });

    // Bouton "Réserver un autre bateau"
    document.getElementById('book-another').addEventListener('click', () => {
      window.location.href = 'boats.html';
    });
  }

  /**
   * Téléchargement du reçu
   */
  downloadInvoice() {
    if (!this.bookingData) return;

    // Création d'un PDF simple (en réalité, vous utiliseriez une bibliothèque comme jsPDF)
    const invoiceData = {
      bookingNumber: this.bookingData.bookingNumber,
      boatName: this.bookingData.boat.name,
      startDate: this.formatDate(this.bookingData.startDate),
      endDate: this.formatDate(this.bookingData.endDate),
      totalAmount: this.bookingData.pricing.totalAmount,
      renterName: `${this.bookingData.renter.firstName} ${this.bookingData.renter.lastName}`
    };

    // Pour l'instant, on affiche juste une notification
    this.uiManager.showNotification('Fonctionnalité de téléchargement en cours de développement', 'info');
    
    // En production, vous généreriez un vrai PDF ici
    console.log('Données du reçu:', invoiceData);
  }

  /**
   * Affichage du contenu
   */
  showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('confirmation-content').style.display = 'block';
  }

  /**
   * Affichage d'une erreur
   */
  showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').textContent = message;
    document.getElementById('error').style.display = 'block';
  }
}

// Initialisation du gestionnaire de confirmation
document.addEventListener('DOMContentLoaded', () => {
  new BookingConfirmationManager();
});
