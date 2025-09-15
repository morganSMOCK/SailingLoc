/**
 * Gestionnaire de réservation pour SailingLoc
 * Gère le processus de réservation étape par étape
 */

import { BookingService } from './services/BookingService.js';
import { AuthService } from './services/AuthService.js';
import { UIManager } from './utils/UIManager.js';

class BookingManager {
  constructor() {
    this.bookingService = new BookingService();
    this.authService = new AuthService();
    this.uiManager = new UIManager();
    
    this.currentStep = 1;
    this.totalSteps = 4;
    this.boatData = null;
    this.bookingData = {
      boatId: null,
      startDate: '',
      endDate: '',
      participants: {
        adults: 0,
        children: 0
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      renterExperience: {
        hasLicense: false,
        licenseType: '',
        yearsOfExperience: 0,
        previousBoatTypes: '',
        additionalInfo: ''
      },
      specialRequests: '',
      skipperRequested: false,
      additionalServices: []
    };
    
    this.init();
  }

  /**
   * Initialisation du gestionnaire de réservation
   */
  init() {
    this.loadBoatData();
    this.setupEventListeners();
    this.setupDateValidation();
    this.updateSummary();
  }

  /**
   * Chargement des données du bateau depuis l'URL
   */
  async loadBoatData() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const boatId = urlParams.get('boatId');
      const startDate = urlParams.get('startDate');
      const endDate = urlParams.get('endDate');

      if (!boatId) {
        throw new Error('Aucun bateau spécifié');
      }

      // Charger les données du bateau
      const response = await fetch(`/api/boats/${boatId}`);
      if (!response.ok) {
        throw new Error('Bateau non trouvé');
      }

      this.boatData = await response.json();
      this.bookingData.boatId = boatId;

      // Pré-remplir les dates si fournies
      if (startDate) {
        this.bookingData.startDate = startDate;
        document.getElementById('start-date').value = startDate;
      }
      if (endDate) {
        this.bookingData.endDate = endDate;
        document.getElementById('end-date').value = endDate;
      }

      this.displayBoatInfo();
      this.updateSummary();
      this.showContent();

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.showError('Impossible de charger les informations du bateau');
    }
  }

  /**
   * Affichage des informations du bateau
   */
  displayBoatInfo() {
    if (!this.boatData) return;

    // Mise à jour du breadcrumb
    document.getElementById('boat-name').textContent = this.boatData.name;

    // Mise à jour du résumé
    document.getElementById('boat-name').textContent = this.boatData.name;
    document.getElementById('boat-location').textContent = `${this.boatData.location.city}, ${this.boatData.location.country}`;
    document.getElementById('boat-capacity').textContent = `${this.boatData.capacity.maxPeople} personnes`;
    document.getElementById('boat-type').textContent = this.boatData.type;

    // Image du bateau
    const boatImage = document.getElementById('boat-image');
    if (this.boatData.images && this.boatData.images.length > 0) {
      boatImage.src = this.boatData.images[0];
      boatImage.style.display = 'block';
      document.querySelector('.boat-placeholder').style.display = 'none';
    }
  }

  /**
   * Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Navigation entre les étapes
    document.getElementById('next-step').addEventListener('click', () => this.nextStep());
    document.getElementById('prev-step').addEventListener('click', () => this.prevStep());

    // Soumission du formulaire
    document.getElementById('booking-form').addEventListener('submit', (e) => this.submitBooking(e));

    // Changements dans le formulaire
    this.setupFormListeners();

    // Checkbox du skipper
    document.getElementById('skipper-requested').addEventListener('change', (e) => {
      this.bookingData.skipperRequested = e.target.checked;
      this.updateSummary();
    });

    // Checkbox du permis
    document.getElementById('has-license').addEventListener('change', (e) => {
      this.bookingData.renterExperience.hasLicense = e.target.checked;
      const licenseDetails = document.getElementById('license-details');
      licenseDetails.style.display = e.target.checked ? 'block' : 'none';
    });

    // Services additionnels
    document.querySelectorAll('input[name="additionalServices"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateAdditionalServices());
    });
  }

  /**
   * Configuration des écouteurs du formulaire
   */
  setupFormListeners() {
    // Dates
    document.getElementById('start-date').addEventListener('change', (e) => {
      this.bookingData.startDate = e.target.value;
      this.updateSummary();
      this.validateStep(1);
    });

    document.getElementById('end-date').addEventListener('change', (e) => {
      this.bookingData.endDate = e.target.value;
      this.updateSummary();
      this.validateStep(1);
    });

    // Participants
    document.getElementById('adults').addEventListener('change', (e) => {
      this.bookingData.participants.adults = parseInt(e.target.value);
      this.updateSummary();
      this.validateStep(1);
    });

    document.getElementById('children').addEventListener('change', (e) => {
      this.bookingData.participants.children = parseInt(e.target.value);
      this.updateSummary();
    });

    // Contact d'urgence
    document.getElementById('emergency-name').addEventListener('input', (e) => {
      this.bookingData.emergencyContact.name = e.target.value;
      this.validateStep(2);
    });

    document.getElementById('emergency-phone').addEventListener('input', (e) => {
      this.bookingData.emergencyContact.phone = e.target.value;
      this.validateStep(2);
    });

    document.getElementById('emergency-relationship').addEventListener('change', (e) => {
      this.bookingData.emergencyContact.relationship = e.target.value;
      this.validateStep(2);
    });

    // Expérience nautique
    document.getElementById('license-type').addEventListener('change', (e) => {
      this.bookingData.renterExperience.licenseType = e.target.value;
    });

    document.getElementById('experience-years').addEventListener('change', (e) => {
      this.bookingData.renterExperience.yearsOfExperience = parseInt(e.target.value);
    });

    document.getElementById('previous-boats').addEventListener('input', (e) => {
      this.bookingData.renterExperience.previousBoatTypes = e.target.value;
    });

    document.getElementById('additional-info').addEventListener('input', (e) => {
      this.bookingData.renterExperience.additionalInfo = e.target.value;
    });

    // Demandes spéciales
    document.getElementById('special-requests').addEventListener('input', (e) => {
      this.bookingData.specialRequests = e.target.value;
    });
  }

  /**
   * Configuration de la validation des dates
   */
  setupDateValidation() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    // Date minimale à aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    startDateInput.min = today;
    endDateInput.min = today;
    
    // Mise à jour de la date minimale de fin
    startDateInput.addEventListener('change', function() {
      endDateInput.min = this.value;
      if (endDateInput.value && endDateInput.value <= this.value) {
        endDateInput.value = '';
      }
    });
  }

  /**
   * Passage à l'étape suivante
   */
  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateStepDisplay();
      }
    }
  }

  /**
   * Retour à l'étape précédente
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }

  /**
   * Mise à jour de l'affichage des étapes
   */
  updateStepDisplay() {
    // Masquer toutes les étapes
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });

    // Afficher l'étape courante
    document.getElementById(`step-${this.currentStep}`).classList.add('active');

    // Mise à jour des boutons de navigation
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const submitBtn = document.getElementById('submit-booking');

    prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
    
    if (this.currentStep === this.totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      submitBtn.style.display = 'none';
    }

    // Validation de l'étape courante
    this.validateStep(this.currentStep);
  }

  /**
   * Validation de l'étape courante
   */
  validateCurrentStep() {
    return this.validateStep(this.currentStep);
  }

  /**
   * Validation d'une étape spécifique
   */
  validateStep(step) {
    let isValid = true;
    const nextBtn = document.getElementById('next-step');
    const submitBtn = document.getElementById('submit-booking');

    switch (step) {
      case 1:
        isValid = this.bookingData.startDate && 
                 this.bookingData.endDate && 
                 this.bookingData.participants.adults > 0;
        break;
      case 2:
        isValid = this.bookingData.emergencyContact.name && 
                 this.bookingData.emergencyContact.phone && 
                 this.bookingData.emergencyContact.relationship;
        break;
      case 3:
        isValid = true; // L'expérience nautique est optionnelle
        break;
      case 4:
        isValid = true; // Les services additionnels sont optionnels
        break;
    }

    // Mise à jour de l'état des boutons
    if (step === this.currentStep) {
      nextBtn.disabled = !isValid;
      submitBtn.disabled = !isValid;
    }

    return isValid;
  }

  /**
   * Mise à jour des services additionnels
   */
  updateAdditionalServices() {
    const checkboxes = document.querySelectorAll('input[name="additionalServices"]:checked');
    this.bookingData.additionalServices = Array.from(checkboxes).map(checkbox => ({
      name: checkbox.value,
      price: parseFloat(checkbox.dataset.price)
    }));
    this.updateSummary();
  }

  /**
   * Mise à jour du résumé de réservation
   */
  updateSummary() {
    if (!this.boatData) return;

    // Dates
    document.getElementById('summary-start-date').textContent = 
      this.bookingData.startDate ? this.formatDate(this.bookingData.startDate) : '-';
    document.getElementById('summary-end-date').textContent = 
      this.bookingData.endDate ? this.formatDate(this.bookingData.endDate) : '-';

    // Durée
    if (this.bookingData.startDate && this.bookingData.endDate) {
      const days = this.calculateDays();
      document.getElementById('summary-duration').textContent = `${days} jour${days > 1 ? 's' : ''}`;
    } else {
      document.getElementById('summary-duration').textContent = '-';
    }

    // Participants
    document.getElementById('summary-adults').textContent = 
      this.bookingData.participants.adults > 0 ? `${this.bookingData.participants.adults} adulte${this.bookingData.participants.adults > 1 ? 's' : ''}` : '-';
    document.getElementById('summary-children').textContent = 
      this.bookingData.participants.children > 0 ? `${this.bookingData.participants.children} enfant${this.bookingData.participants.children > 1 ? 's' : ''}` : '-';

    // Calcul des prix
    this.updatePricing();
  }

  /**
   * Mise à jour des prix dans le résumé
   */
  updatePricing() {
    if (!this.boatData || !this.bookingData.startDate || !this.bookingData.endDate) return;

    const days = this.calculateDays();
    const dailyRate = this.boatData.pricing.dailyRate;
    const subtotal = days * dailyRate;

    // Prix de base
    document.getElementById('daily-rate').textContent = dailyRate;
    document.getElementById('days-count').textContent = days;
    document.getElementById('subtotal-price').textContent = `${subtotal}€`;

    // Skipper
    const skipperItem = document.getElementById('skipper-price-item');
    const skipperDays = document.getElementById('skipper-days');
    const skipperTotal = document.getElementById('skipper-total');
    
    if (this.bookingData.skipperRequested) {
      const skipperCost = days * 150;
      skipperDays.textContent = days;
      skipperTotal.textContent = `${skipperCost}€`;
      skipperItem.style.display = 'flex';
    } else {
      skipperItem.style.display = 'none';
    }

    // Services additionnels
    const servicesItem = document.getElementById('services-price-item');
    const servicesTotal = document.getElementById('services-total');
    
    if (this.bookingData.additionalServices.length > 0) {
      const servicesCost = this.bookingData.additionalServices.reduce((total, service) => total + service.price, 0);
      servicesTotal.textContent = `${servicesCost}€`;
      servicesItem.style.display = 'flex';
    } else {
      servicesItem.style.display = 'none';
    }

    // Frais fixes
    document.getElementById('cleaning-fee').textContent = `${this.boatData.pricing.cleaningFee || 0}€`;
    document.getElementById('security-deposit').textContent = `${this.boatData.pricing.securityDeposit || 0}€`;

    // Total
    const total = subtotal + 
                  (this.bookingData.skipperRequested ? days * 150 : 0) +
                  this.bookingData.additionalServices.reduce((total, service) => total + service.price, 0) +
                  (this.boatData.pricing.cleaningFee || 0);
    
    document.getElementById('total-price').textContent = `${total}€`;
  }

  /**
   * Calcul du nombre de jours
   */
  calculateDays() {
    if (!this.bookingData.startDate || !this.bookingData.endDate) return 0;
    
    const start = new Date(this.bookingData.startDate);
    const end = new Date(this.bookingData.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
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
   * Soumission de la réservation
   */
  async submitBooking(e) {
    e.preventDefault();

    // Vérification de l'authentification
    if (!this.authService.isAuthenticated()) {
      this.uiManager.showNotification('Vous devez être connecté pour effectuer une réservation', 'error');
      this.uiManager.showModal('login-modal');
      return;
    }

    // Validation finale
    if (!this.validateAllSteps()) {
      this.uiManager.showNotification('Veuillez compléter tous les champs obligatoires', 'error');
      return;
    }

    try {
      this.uiManager.showLoading('submit-booking');

      // Préparation des données de réservation
      const bookingData = {
        boatId: this.bookingData.boatId,
        startDate: this.bookingData.startDate,
        endDate: this.bookingData.endDate,
        participants: this.bookingData.participants,
        emergencyContact: this.bookingData.emergencyContact,
        renterExperience: this.bookingData.renterExperience,
        specialRequests: this.bookingData.specialRequests,
        skipperRequested: this.bookingData.skipperRequested,
        additionalServices: this.bookingData.additionalServices
      };

      // Création de la réservation
      const response = await this.bookingService.createBooking(bookingData);

      if (response.success) {
        this.uiManager.showNotification('Réservation créée avec succès !', 'success');
        
        // Redirection vers la page de confirmation
        setTimeout(() => {
          window.location.href = `booking-confirmation.html?id=${response.data.booking._id}`;
        }, 2000);
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la réservation');
      }

    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      this.uiManager.showNotification(error.message || 'Erreur lors de la création de la réservation', 'error');
    } finally {
      this.uiManager.hideLoading('submit-booking');
    }
  }

  /**
   * Validation de toutes les étapes
   */
  validateAllSteps() {
    for (let i = 1; i <= this.totalSteps; i++) {
      if (!this.validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Affichage du contenu
   */
  showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('booking-content').style.display = 'block';
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

// Initialisation du gestionnaire de réservation
document.addEventListener('DOMContentLoaded', () => {
  new BookingManager();
});
