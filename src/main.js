// Importation des modules
import './style.css';
import { AuthService } from './services/AuthService.js';
import { BoatService } from './services/BoatService.js';
import { BookingService } from './services/BookingService.js';
import { PaymentService } from './services/PaymentService.js';
import { UIManager } from './utils/UIManager.js';
import { I18n } from './utils/i18n.js';
import { StorageManager } from './utils/StorageManager.js';

/**
 * Classe principale de l'application SailingLoc
 * Gère l'initialisation et la coordination des différents services
 */
class SailingLocApp {
  constructor() {
    // Initialisation des services
    this.authService = new AuthService();
    this.boatService = new BoatService();
    this.bookingService = new BookingService();
    this.paymentService = new PaymentService();
    this.uiManager = new UIManager();
    this.storageManager = new StorageManager();
    
    // État de l'application
    this.currentUser = null;
    this.currentPage = 1;
    this.boatsPerPage = 12;
    this.currentFilters = {};
    this.selectedImages = [];
    
    // Initialisation de l'application
    this.init();
  }

  /**
   * Initialisation de l'application
   */
  async init() {
    try {
      console.log('🚀 Initialisation de SailingLoc...');
      // i18n
      await I18n.init();
      
      // Vérification de l'authentification existante
      await this.checkAuthStatus();
      
      // Configuration des écouteurs d'événements
      this.setupEventListeners();
      
      // Chargement initial des bateaux (uniquement sur les pages appropriées)
      const currentPage = window.location.pathname;
      if (currentPage === '/' || currentPage.endsWith('index.html') || currentPage.endsWith('boats.html')) {
        await this.loadBoats();
      }
      
      // Configuration de la navigation
      this.setupNavigation();
      
      // Initialisation de la gestion des bateaux si nécessaire
      this.initBoatManagement();
      
      // Exposer des fonctions de débogage
      window.debugSailingLoc = {
        testBoatCard: (boatData) => {
          console.log('Test de création de carte de bateau:', boatData);
          const card = this.createBoatCard(boatData);
          console.log('Résultat:', card);
          return card;
        },
        loadBoats: () => this.loadBoats(),
        getCurrentBoats: () => this.currentBoats || []
      };
      
      console.log('✅ SailingLoc initialisé avec succès');
      console.log('🔧 Fonctions de débogage disponibles: window.debugSailingLoc');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.uiManager.showNotification('Erreur lors du chargement de l\'application', 'error');
    }
  }

  /**
   * Vérification du statut d'authentification
   */
  async checkAuthStatus() {
    const token = this.storageManager.getToken();
    const user = this.storageManager.getUser();
    console.log('🔐 [AUTH] Token trouvé:', token ? 'Oui' : 'Non');
    console.log('🔐 [AUTH] User trouvé:', user ? 'Oui' : 'Non');
    
    if (token && user) {
      // Utiliser les données du localStorage en premier
      this.currentUser = user;
      console.log('🔐 [AUTH] Utilisateur chargé depuis localStorage:', this.currentUser.email, 'Rôle:', this.currentUser.role);
      this.updateUIForAuthenticatedUser();
      
      try {
        // Vérification de la validité du token en arrière-plan
        const response = await this.authService.verifyToken();
        console.log('🔐 [AUTH] Vérification token:', response.success ? 'Valide' : 'Invalide');
        
        if (response.success && response.data.user) {
          // Mettre à jour avec les données fraîches du serveur
          this.currentUser = response.data.user;
          this.storageManager.setUser(this.currentUser);
          console.log('🔐 [AUTH] Utilisateur mis à jour depuis le serveur');
        } else {
          // Token invalide, nettoyage
          console.log('🔐 [AUTH] Token invalide, nettoyage...');
          this.storageManager.clearAuth();
          this.currentUser = null;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        // En cas d'erreur réseau, garder l'utilisateur du localStorage
        console.log('🔐 [AUTH] Erreur réseau, conservation de l\'utilisateur localStorage');
      }
    } else {
      console.log('🔐 [AUTH] Aucun token ou utilisateur trouvé, utilisateur non connecté');
      this.currentUser = null;
    }
  }

  /**
   * Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Authentification
    this.setupAuthListeners();
    
    // Recherche et filtres
    this.setupSearchListeners();
    
    // Navigation
    this.setupNavigationListeners();
    
    // Formulaires
    this.setupFormListeners();
    
    // Modales
    this.setupModalListeners();
  }

  /**
   * Configuration des écouteurs d'authentification
   */
  setupAuthListeners() {
    // Boutons de connexion/inscription
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.uiManager.showModal('login-modal'));
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this.uiManager.showModal('register-modal'));
    }

    // Formulaires d'authentification
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Basculement entre connexion et inscription
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.uiManager.hideModal('login-modal');
        this.uiManager.showModal('register-modal');
      });
    }
    
    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.uiManager.hideModal('register-modal');
        this.uiManager.showModal('login-modal');
      });
    }

    // Menu utilisateur
    const userAvatar = document.getElementById('user-avatar');
    const logoutLink = document.getElementById('logout-link');
    
    if (userAvatar) {
      userAvatar.addEventListener('click', () => this.toggleUserMenu());
    }
    
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Liens du menu utilisateur
    const profileLink = document.getElementById('profile-link');
    const bookingsLink = document.getElementById('bookings-link');
    const boatsLink = document.getElementById('boats-link');
    
    if (profileLink) {
      profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showProfile();
      });
    }
    
    if (bookingsLink) {
      bookingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showBookings();
      });
    }
    
    if (boatsLink) {
      boatsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMyBoats();
      });
    }
  }

  /**
   * Configuration des écouteurs de recherche
   */
  setupSearchListeners() {
    // Vérifier si nous sommes sur une page avec des fonctionnalités de recherche
    const currentPage = window.location.pathname;
    const hasSearchFeatures = currentPage === '/' || currentPage.endsWith('index.html') || currentPage.endsWith('boats.html');
    
    if (!hasSearchFeatures) {
      return; // Ne pas configurer les écouteurs sur les autres pages
    }
    
    // Bouton de recherche principal
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // Filtres
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    }

    // Slider de prix
    const priceFilter = document.getElementById('filter-price');
    const priceDisplay = document.getElementById('price-display');
    
    if (priceFilter && priceDisplay) {
      priceFilter.addEventListener('input', (e) => {
        priceDisplay.textContent = `${e.target.value}€`;
      });
    }

    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => this.changePage(this.currentPage - 1));
    }
    
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => this.changePage(this.currentPage + 1));
    }
  }

  /**
   * Configuration des écouteurs de navigation
   */
  setupNavigationListeners() {
    // Menu mobile
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuToggle && navMenu) {
      mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
      });
    }

    // Navigation smooth scroll (uniquement pour les liens internes sur la page d'accueil)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Si c'est un lien vers une page externe (boats.html, services.html, contact.html), laisser la navigation normale
        if (href && (href.includes('.html') || href.startsWith('http'))) {
          return; // Laisser la navigation normale
        }
        
        // Sinon, c'est un lien interne sur la page d'accueil
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Mise à jour de l'état actif
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Navbar transparente au scroll
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    });
  }

  /**
   * Configuration des écouteurs de formulaires
   */
  setupFormListeners() {
    // Formulaire de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
    }
    
    // Formulaire de profil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }
    
    // Formulaire de changement de mot de passe
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }
    
    // Formulaire de changement de mot de passe dans le profil
    const changePasswordFormProfile = document.getElementById('change-password-form-profile');
    if (changePasswordFormProfile) {
      changePasswordFormProfile.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }
    
    // Formulaire de préférences
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => this.handlePreferencesUpdate(e));
    }
    
    // Formulaire d'ajout de bateau
    const addBoatForm = document.getElementById('add-boat-form');
    if (addBoatForm) {
      addBoatForm.addEventListener('submit', (e) => this.handleAddBoat(e));
    }
    
    // Formulaire d'édition de bateau
    const editBoatForm = document.getElementById('edit-boat-form');
    if (editBoatForm) {
      editBoatForm.addEventListener('submit', (e) => this.handleEditBoat(e));
    }
    
    // Gestion de l'upload d'images
    this.setupImageUpload();
    
    // Bouton de changement de mot de passe
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        this.uiManager.showModal('change-password-modal');
      });
    }
    
    // Bouton d'ajout de bateau
    const addBoatBtn = document.getElementById('add-boat-btn');
    if (addBoatBtn) {
      addBoatBtn.addEventListener('click', () => {
        this.showAddBoatModal();
      });
    }
    
    // Onglets du profil
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
    
    // Boutons d'actualisation
    const refreshBookingsBtn = document.getElementById('refresh-bookings');
    const refreshBoatsBtn = document.getElementById('refresh-boats');
    
    if (refreshBookingsBtn) {
      refreshBookingsBtn.addEventListener('click', () => this.loadUserBookings());
    }
    
    if (refreshBoatsBtn) {
      refreshBoatsBtn.addEventListener('click', () => this.loadOwnerBoats());
    }
  }

  /**
   * Configuration des écouteurs de modales
   */
  setupModalListeners() {
    // Fermeture des modales
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        const modal = closeBtn.closest('.modal');
        if (modal) {
          this.uiManager.hideModal(modal.id);
        }
      });
    });

    // Fermeture en cliquant à l'extérieur
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.uiManager.hideModal(modal.id);
        }
      });
    });
  }

  /**
   * Gestion de la connexion
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('🔐 Tentative de connexion:', { email, password: password ? '***' : 'vide' });
    
    if (!email || !password) {
      this.uiManager.showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    try {
      this.uiManager.showLoading('login-form');
      
      console.log('🔐 Appel AuthService.login...');
      const response = await this.authService.login(email, password);
      console.log('📡 Réponse complète:', response);
      
      if (response.success) {
        console.log('✅ Connexion réussie, données utilisateur:', response.data.user);
        this.currentUser = response.data.user;
        this.storageManager.setToken(response.data.token);
        this.storageManager.setUser(response.data.user);
        
        this.updateUIForAuthenticatedUser();
        this.uiManager.hideModal('login-modal');
        this.uiManager.showNotification('Connexion réussie !', 'success');
        
        // Reset du formulaire
        document.getElementById('login-form').reset();
        
      } else {
        console.error('❌ Échec de connexion:', response.message);
        this.uiManager.showNotification(response.message || 'Email ou mot de passe incorrect', 'error');
      }
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      this.uiManager.showNotification(`Erreur de connexion: ${error.message || 'Problème de réseau'}`, 'error');
    } finally {
      this.uiManager.hideLoading('login-form');
    }
  }

  /**
   * Gestion de l'inscription
   */
  async handleRegister(e) {
    e.preventDefault();
    
    const formData = {
      firstName: document.getElementById('register-firstname').value,
      lastName: document.getElementById('register-lastname').value,
      email: document.getElementById('register-email').value,
      password: document.getElementById('register-password').value,
      phone: document.getElementById('register-phone').value,
      role: document.getElementById('register-role').value
    };
    
    console.log('📝 Tentative d\'inscription:', { ...formData, password: formData.password ? '***' : 'vide' });
    
    // Validation côté client
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role) {
      this.uiManager.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    
    if (formData.password.length < 6) {
      this.uiManager.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    
    try {
      this.uiManager.showLoading('register-form');
      
      console.log('📝 Appel AuthService.register...');
      const response = await this.authService.register(formData);
      console.log('📡 Réponse inscription:', response);
      
      if (response.success) {
        console.log('✅ Inscription réussie, données utilisateur:', response.data.user);
        this.currentUser = response.data.user;
        this.storageManager.setToken(response.data.token);
        this.storageManager.setUser(response.data.user);
        
        this.updateUIForAuthenticatedUser();
        this.uiManager.hideModal('register-modal');
        this.uiManager.showNotification('Inscription réussie !', 'success');
        
        // Reset du formulaire
        document.getElementById('register-form').reset();
        
      } else {
        console.error('❌ Échec d\'inscription:', response.message);
        this.uiManager.showNotification(response.message || 'Erreur d\'inscription', 'error');
      }
      
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      this.uiManager.showNotification(`Erreur d'inscription: ${error.message || 'Problème de réseau'}`, 'error');
    } finally {
      this.uiManager.hideLoading('register-form');
    }
  }

  /**
   * Gestion de la déconnexion
   */
  async handleLogout() {
    try {
      await this.authService.logout();
      
      this.currentUser = null;
      this.storageManager.clearAuth();
      this.updateUIForUnauthenticatedUser();
      this.uiManager.showNotification('Déconnexion réussie', 'success');
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Déconnexion locale même en cas d'erreur
      this.currentUser = null;
      this.storageManager.clearAuth();
      this.updateUIForUnauthenticatedUser();
    }
  }

  /**
   * Affichage du profil utilisateur
   */
  async showProfile() {
    try {
      this.uiManager.showModal('profile-modal');
      await this.loadUserProfile();
    } catch (error) {
      console.error('Erreur lors de l\'affichage du profil:', error);
      this.uiManager.showNotification('Erreur lors du chargement du profil', 'error');
    }
  }

  /**
   * Chargement des données du profil
   */
  async loadUserProfile() {
    try {
      const response = await this.authService.getProfile();
      
      if (response.success) {
        const user = response.data.user;
        
        // Remplir les champs du formulaire
        document.getElementById('profile-firstname').value = user.firstName || '';
        document.getElementById('profile-lastname').value = user.lastName || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        
        // Adresse
        if (user.address) {
          document.getElementById('profile-street').value = user.address.street || '';
          document.getElementById('profile-city').value = user.address.city || '';
          document.getElementById('profile-postal').value = user.address.postalCode || '';
        }
        
        // Préférences
        if (user.preferences) {
          document.getElementById('profile-language').value = user.preferences.language || 'fr';
          document.getElementById('profile-currency').value = user.preferences.currency || 'EUR';
          document.getElementById('email-notifications').checked = user.preferences.notifications?.email !== false;
          document.getElementById('sms-notifications').checked = user.preferences.notifications?.sms === true;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      this.uiManager.showNotification('Erreur lors du chargement du profil', 'error');
    }
  }

  /**
   * Mise à jour du profil
   */
  async handleProfileUpdate(e) {
    e.preventDefault();
    
    const profileData = {
      firstName: document.getElementById('profile-firstname').value,
      lastName: document.getElementById('profile-lastname').value,
      phone: document.getElementById('profile-phone').value,
      address: {
        street: document.getElementById('profile-street').value,
        city: document.getElementById('profile-city').value,
        postalCode: document.getElementById('profile-postal').value
      }
    };
    
    try {
      this.uiManager.showLoading('profile-form');
      
      const response = await this.authService.updateProfile(profileData);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.storageManager.setUser(response.data.user);
        this.updateUIForAuthenticatedUser();
        this.uiManager.showNotification('Profil mis à jour avec succès !', 'success');
      } else {
        this.uiManager.showNotification(response.message || 'Erreur lors de la mise à jour', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      this.uiManager.showNotification('Erreur lors de la mise à jour du profil', 'error');
    } finally {
      this.uiManager.hideLoading('profile-form');
    }
  }

  /**
   * Changement de mot de passe
   */
  async handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const currentPassword = form.querySelector('[id*="current-password"]').value;
    const newPassword = form.querySelector('[id*="new-password"]').value;
    const confirmPassword = form.querySelector('[id*="confirm-password"]').value;
    
    if (newPassword !== confirmPassword) {
      this.uiManager.showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    
    try {
      this.uiManager.showLoading(form);
      
      const response = await this.authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        this.uiManager.showNotification('Mot de passe modifié avec succès !', 'success');
        form.reset();
      } else {
        this.uiManager.showNotification(response.message || 'Erreur lors du changement de mot de passe', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      this.uiManager.showNotification('Erreur lors du changement de mot de passe', 'error');
    } finally {
      this.uiManager.hideLoading(form);
    }
  }

  /**
   * Mise à jour des préférences
   */
  async handlePreferencesUpdate(e) {
    e.preventDefault();
    
    const preferencesData = {
      preferences: {
        language: document.getElementById('profile-language').value,
        currency: document.getElementById('profile-currency').value,
        notifications: {
          email: document.getElementById('email-notifications').checked,
          sms: document.getElementById('sms-notifications').checked
        }
      }
    };
    
    try {
      this.uiManager.showLoading('preferences-form');
      
      const response = await this.authService.updateProfile(preferencesData);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.storageManager.setUser(response.data.user);
        this.uiManager.showNotification('Préférences mises à jour avec succès !', 'success');
      } else {
        this.uiManager.showNotification(response.message || 'Erreur lors de la mise à jour', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      this.uiManager.showNotification('Erreur lors de la mise à jour des préférences', 'error');
    } finally {
      this.uiManager.hideLoading('preferences-form');
    }
  }

  /**
   * Affichage des réservations
   */
  async showBookings() {
    try {
      this.uiManager.showModal('bookings-modal');
      await this.loadUserBookings();
    } catch (error) {
      console.error('Erreur lors de l\'affichage des réservations:', error);
      this.uiManager.showNotification('Erreur lors du chargement des réservations', 'error');
    }
  }

  /**
   * Chargement des réservations utilisateur
   */
  async loadUserBookings() {
    try {
      const bookingsList = document.getElementById('bookings-list');
      bookingsList.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Chargement des réservations...</p>
        </div>
      `;
      
      const response = await this.bookingService.getUserBookings();
      
      if (response.success) {
        this.renderBookings(response.data.bookings);
      } else {
        bookingsList.innerHTML = `
          <div class="no-results">
            <h3>Aucune réservation trouvée</h3>
            <p>Vous n'avez pas encore de réservations</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      const bookingsList = document.getElementById('bookings-list');
      bookingsList.innerHTML = `
        <div class="no-results">
          <h3>Erreur de chargement</h3>
          <p>Impossible de charger les réservations</p>
        </div>
      `;
    }
  }

  /**
   * Rendu des réservations
   */
  renderBookings(bookings) {
    const bookingsList = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
      bookingsList.innerHTML = `
        <div class="no-results">
          <h3>Aucune réservation</h3>
          <p>Vous n'avez pas encore de réservations</p>
        </div>
      `;
      return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => `
      <div class="booking-card">
        <div class="booking-header">
          <span class="booking-number">#${booking.bookingNumber}</span>
          <span class="booking-status status-${booking.status}">${this.getStatusLabel(booking.status)}</span>
        </div>
        <div class="booking-details">
          <div class="booking-detail">
            <span class="booking-detail-label">Bateau</span>
            <span class="booking-detail-value">${booking.boat?.name || 'N/A'}</span>
          </div>
          <div class="booking-detail">
            <span class="booking-detail-label">Dates</span>
            <span class="booking-detail-value">
              ${new Date(booking.startDate).toLocaleDateString('fr-FR')} - 
              ${new Date(booking.endDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div class="booking-detail">
            <span class="booking-detail-label">Montant</span>
            <span class="booking-detail-value">${booking.pricing?.totalAmount || 0}€</span>
          </div>
          <div class="booking-detail">
            <span class="booking-detail-label">Participants</span>
            <span class="booking-detail-value">${booking.participants?.total || 0} personnes</span>
          </div>
        </div>
        <div class="booking-actions">
          <button class="btn-secondary btn-small" onclick="app.viewBookingDetails('${booking._id}')">
            Voir détails
          </button>
          ${booking.status === 'pending' || booking.status === 'confirmed' ? `
            <button class="btn-ghost btn-small" onclick="app.cancelBooking('${booking._id}')">
              Annuler
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Affichage des bateaux du propriétaire
   */
  async showMyBoats() {
    try {
      // Rediriger vers la page de gestion des bateaux
      window.location.href = 'boat-management.html';
    } catch (error) {
      console.error('Erreur lors de la redirection:', error);
      this.uiManager.showNotification('Erreur lors de la redirection', 'error');
    }
  }

  /**
   * Chargement des bateaux du propriétaire
   */
  async loadOwnerBoats() {
    try {
      const boatsList = document.getElementById('my-boats-list');
      boatsList.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Chargement de vos bateaux...</p>
        </div>
      `;
      
      const response = await this.boatService.getOwnerBoats();
      
      if (response.success) {
        this.renderOwnerBoats(response.data.boats);
      } else {
        boatsList.innerHTML = `
          <div class="no-results">
            <h3>Aucun bateau trouvé</h3>
            <p>Vous n'avez pas encore ajouté de bateaux</p>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des bateaux:', error);
      const boatsList = document.getElementById('my-boats-list');
      boatsList.innerHTML = `
        <div class="no-results">
          <h3>Erreur de chargement</h3>
          <p>Impossible de charger vos bateaux</p>
        </div>
      `;
    }
  }

  /**
   * Rendu des bateaux du propriétaire
   */
  renderOwnerBoats(boats) {
    const boatsList = document.getElementById('my-boats-list');
    
    if (boats.length === 0) {
      boatsList.innerHTML = `
        <div class="no-results">
          <h3>Aucun bateau</h3>
          <p>Vous n'avez pas encore ajouté de bateaux</p>
          <button class="btn-primary" onclick="app.uiManager.showModal('add-boat-modal')">
            Ajouter votre premier bateau
          </button>
        </div>
      `;
      return;
    }
    
    boatsList.innerHTML = boats.map(boat => `
      <div class="my-boat-card">
        <div class="my-boat-image">
          <img src="${boat.mainImage || boat.images?.[0]?.url || 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'}" alt="${boat.name}">
          <div class="boat-status-badge status-${boat.status}">${this.getBoatStatusLabel(boat.status)}</div>
        </div>
        <div class="my-boat-content">
          <h3 class="my-boat-name">${boat.name}</h3>
          <p class="my-boat-location">📍 ${boat.location?.city || 'N/A'}</p>
          <div class="my-boat-stats">
            <div class="boat-stat">
              <div class="boat-stat-value">${boat.pricing?.dailyRate || 0}€</div>
              <div class="boat-stat-label">Prix/jour</div>
            </div>
            <div class="boat-stat">
              <div class="boat-stat-value">${boat.stats?.totalBookings || 0}</div>
              <div class="boat-stat-label">Réservations</div>
            </div>
            <div class="boat-stat">
              <div class="boat-stat-value">${boat.rating?.average?.toFixed(1) || '0.0'}</div>
              <div class="boat-stat-label">Note</div>
            </div>
          </div>
          <div class="my-boat-actions">
            <button class="btn-primary btn-small" onclick="app.editBoat('${boat._id}')">
              Modifier
            </button>
            <button class="btn-secondary btn-small" onclick="app.showBoatDetails('${boat._id}')">
              Voir
            </button>
            <button class="btn-ghost btn-small" onclick="app.toggleBoatStatus('${boat._id}')">
              ${boat.status === 'available' ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Basculement entre les onglets du profil
   */
  switchTab(tabId) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }

  /**
   * Libellés des statuts de réservation
   */
  getStatusLabel(status) {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'paid': 'Payée',
      'active': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    return labels[status] || status;
  }

  /**
   * Libellés des statuts de bateau
   */
  getBoatStatusLabel(status) {
    const labels = {
      'available': 'Disponible',
      'rented': 'Loué',
      'maintenance': 'Maintenance',
      'inactive': 'Inactif'
    };
    return labels[status] || status;
  }

  /**
   * Méthodes placeholder pour les actions
   */
  async viewBookingDetails(bookingId) {
    this.uiManager.showNotification('Fonctionnalité en cours de développement', 'info');
  }

  async cancelBooking(bookingId) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.uiManager.showNotification('Fonctionnalité en cours de développement', 'info');
    }
  }


  async toggleBoatStatus(boatId) {
    this.uiManager.showNotification('Fonctionnalité en cours de développement', 'info');
  }

  /**
   * Mise à jour de l'interface pour un utilisateur connecté
   */
  updateUIForAuthenticatedUser() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userInitials = document.getElementById('user-initials');
    const boatsLink = document.getElementById('boats-link');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    
    if (this.currentUser) {
      if (userName) userName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      if (userEmail) userEmail.textContent = this.currentUser.email;
      if (userInitials) {
        userInitials.textContent = `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
      }
      
      // Afficher le lien "Mes Bateaux" pour les propriétaires
      if (boatsLink && ['owner', 'admin'].includes(this.currentUser.role)) {
        boatsLink.style.display = 'block';
      }
    }
  }

  /**
   * Mise à jour de l'interface pour un utilisateur non connecté
   */
  updateUIForUnauthenticatedUser() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }

  /**
   * Basculement du menu utilisateur
   */
  toggleUserMenu() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
      userDropdown.classList.toggle('active');
    }
  }

  /**
   * Chargement des bateaux
   */
  async loadBoats(filters = {}, page = 1) {
    try {
      const boatsGrid = document.getElementById('boats-grid');
      const boatsLoading = document.getElementById('boats-loading');
      
      if (boatsLoading) boatsLoading.style.display = 'block';
      
      const queryParams = {
        page,
        limit: this.boatsPerPage,
        ...filters
      };
      
      console.log('🚤 Chargement des bateaux depuis:', this.boatService.boatsEndpoint);
      console.log('📊 Paramètres:', queryParams);
      
      const response = await this.boatService.getBoats(queryParams);
      
      console.log('📡 Réponse API:', response);
      
      if (response.success) {
        this.renderBoats(response.data.boats);
        this.renderPagination(response.data.pagination);
        this.currentPage = page;
        this.currentFilters = filters;
      } else {
        console.error('❌ Erreur API:', response);
        this.uiManager.showNotification(`Erreur API: ${response.message || 'Données non disponibles'}`, 'error');
        this.renderBoats([]); // Afficher "aucun bateau"
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des bateaux:', error);
      this.uiManager.showNotification(`Erreur de connexion: ${error.message}`, 'error');
      this.renderBoats([]); // Afficher "aucun bateau"
    } finally {
      const boatsLoading = document.getElementById('boats-loading');
      if (boatsLoading) boatsLoading.style.display = 'none';
    }
  }

  /**
   * Rendu des bateaux
   */
  renderBoats(boats) {
    const boatsGrid = document.getElementById('boats-grid');
    if (!boatsGrid) return;
    
    // Vider la grille
    boatsGrid.innerHTML = '';
    
    if (boats.length === 0) {
      boatsGrid.innerHTML = `
        <div class="no-results">
          <h3>Aucun bateau trouvé</h3>
          <p>Essayez de modifier vos critères de recherche</p>
        </div>
      `;
      return;
    }
    
    boats.forEach((boat, index) => {
      try {
        console.log(`Création de la carte pour le bateau ${index + 1}:`, boat.name, boat._id);
        const boatCard = this.createBoatCard(boat);
        if (boatCard && boatCard.nodeType) {
          boatsGrid.appendChild(boatCard);
          console.log(`✅ Carte créée avec succès pour: ${boat.name}`);
        } else {
          console.error('❌ Erreur: createBoatCard n\'a pas retourné un élément DOM valide pour le bateau:', boat);
          // Créer une carte d'erreur à la place
          const errorCard = this.createErrorCard(`Erreur: ${boat.name || 'Bateau inconnu'}`);
          boatsGrid.appendChild(errorCard);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la création de la carte du bateau:', error, boat);
        // Créer une carte d'erreur à la place
        const errorCard = this.createErrorCard(`Erreur: ${boat.name || 'Bateau inconnu'}`);
        boatsGrid.appendChild(errorCard);
      }
    });
  }

  /**
   * Création d'une carte de bateau
   */
  createBoatCard(boat) {
    try {
      // Validation des données du bateau
      if (!boat || !boat._id) {
        console.error('Données de bateau invalides:', boat);
        return this.createErrorCard('Données de bateau invalides');
      }

      const card = document.createElement('div');
      card.className = 'boat-card';
      card.setAttribute('data-boat-id', boat._id);
      
      // Gestion des images - essayer plusieurs sources
      let mainImage = 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop';
      
      if (boat.mainImage) {
        mainImage = boat.mainImage;
      } else if (boat.images && boat.images.length > 0) {
        // Chercher une image avec URL
        const imageWithUrl = boat.images.find(img => img.url);
        if (imageWithUrl) {
          mainImage = imageWithUrl.url;
        }
      } else if (boat.imageUrls && boat.imageUrls.length > 0) {
        mainImage = boat.imageUrls[0];
      }
      
      // Nettoyer les données pour éviter les erreurs d'affichage
      const boatName = (boat.name || 'Nom non disponible').replace(/[<>]/g, '');
      const boatType = this.formatBoatType(boat.type || 'voilier');
      const city = (boat.location?.city || 'Ville').replace(/[<>]/g, '');
      const country = (boat.location?.country || 'Pays').replace(/[<>]/g, '');
      const maxPeople = boat.capacity?.maxPeople || 0;
      const length = boat.specifications?.length || 0;
      const dailyRate = boat.pricing?.dailyRate || 0;
      const rating = boat.rating?.average || 0;
      const totalReviews = boat.rating?.totalReviews || 0;
      
      card.innerHTML = `
        <div class="boat-image">
          <img src="${mainImage}" alt="${boatName}" loading="lazy" onerror="this.src='https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'">
          <div class="boat-badge">${boatType}</div>
          <div class="boat-rating">
            <span class="rating-stars">${this.renderStars(rating)}</span>
            <span class="rating-count">(${totalReviews})</span>
          </div>
        </div>
        <div class="boat-content">
          <h3 class="boat-name">${boatName}</h3>
          <p class="boat-location">📍 ${city}, ${country}</p>
          <div class="boat-specs">
            <span class="spec">👥 ${maxPeople} pers.</span>
            <span class="spec">📏 ${length}m</span>
            ${boat.capacity?.cabins ? `<span class="spec">🛏️ ${boat.capacity.cabins} cabines</span>` : ''}
          </div>
          <div class="boat-price">
            <span class="price">${dailyRate}€</span>
            <span class="price-unit">/jour</span>
          </div>
          <button class="btn-primary btn-full boat-details-btn">Voir les détails</button>
        </div>
      `;
      
      // Écouteur pour afficher les détails
      const detailsBtn = card.querySelector('.boat-details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => this.showBoatDetails(boat._id));
      }
      
      return card;
    } catch (error) {
      console.error('Erreur lors de la création de la carte de bateau:', error, boat);
      return this.createErrorCard('Erreur lors du chargement');
    }
  }

  /**
   * Création d'une carte d'erreur
   */
  createErrorCard(message) {
    const card = document.createElement('div');
    card.className = 'boat-card error-card';
    card.innerHTML = `
      <div class="boat-content">
        <h3>Erreur</h3>
        <p>${message}</p>
      </div>
    `;
    return card;
  }

  /**
   * Formatage du type de bateau
   */
  formatBoatType(type) {
    const types = {
      'voilier': 'Voilier',
      'catamaran': 'Catamaran',
      'yacht': 'Yacht',
      'bateau_moteur': 'Bateau à moteur',
      'bateau à moteur': 'Bateau à moteur',
      'semi_rigide': 'Semi-rigide',
      'peniche': 'Péniche'
    };
    return types[type] || type;
  }

  /**
   * Rendu des étoiles de notation
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
    }
    
    // Demi-étoile
    if (hasHalfStar) {
      stars += '⭐';
    }
    
    // Étoiles vides
    for (let i = 0; i < emptyStars; i++) {
      stars += '☆';
    }
    
    return stars;
  }

  /**
   * Affichage des détails d'un bateau
   */
  async showBoatDetails(boatId) {
    try {
      this.uiManager.showLoading('boat-modal');
      
      const response = await this.boatService.getBoatById(boatId);
      
      if (response.success) {
        this.renderBoatDetails(response.data.boat);
        this.uiManager.showModal('boat-modal');
      } else {
        this.uiManager.showNotification('Erreur lors du chargement des détails', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      this.uiManager.showNotification('Erreur lors du chargement des détails', 'error');
    } finally {
      this.uiManager.hideLoading('boat-modal');
    }
  }

  /**
   * Rendu des détails d'un bateau
   */
  renderBoatDetails(boat) {
    const modalTitle = document.getElementById('boat-modal-title');
    const boatDetails = document.getElementById('boat-details');
    
    if (modalTitle) {
      modalTitle.textContent = boat.name;
    }
    
    if (boatDetails) {
      boatDetails.innerHTML = `
        <div class="boat-details-content">
          <div class="boat-gallery">
            <div class="main-image">
              <img src="${boat.mainImage || boat.images?.[0]?.url}" alt="${boat.name}">
            </div>
            ${boat.images?.length > 1 ? `
              <div class="image-thumbnails">
                ${boat.images.slice(1, 5).map(img => `
                  <img src="${img.url}" alt="${img.caption || boat.name}" class="thumbnail">
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="boat-info">
            <div class="boat-header">
              <div class="boat-meta">
                <span class="boat-type">${this.formatBoatType(boat.type)}</span>
                <span class="boat-category">${boat.category}</span>
              </div>
              <div class="boat-rating-large">
                ${this.renderStars(boat.rating?.average || 0)}
                <span class="rating-text">${boat.rating?.average?.toFixed(1) || '0.0'} (${boat.rating?.totalReviews || 0} avis)</span>
              </div>
            </div>
            
            <p class="boat-description">${boat.description}</p>
            
            <div class="boat-specs-grid">
              <div class="spec-item">
                <strong>Capacité:</strong> ${boat.capacity.maxPeople} personnes
              </div>
              <div class="spec-item">
                <strong>Longueur:</strong> ${boat.specifications.length}m
              </div>
              <div class="spec-item">
                <strong>Largeur:</strong> ${boat.specifications.width}m
              </div>
              ${boat.capacity.cabins ? `
                <div class="spec-item">
                  <strong>Cabines:</strong> ${boat.capacity.cabins}
                </div>
              ` : ''}
              ${boat.capacity.berths ? `
                <div class="spec-item">
                  <strong>Couchages:</strong> ${boat.capacity.berths}
                </div>
              ` : ''}
              ${boat.capacity.bathrooms ? `
                <div class="spec-item">
                  <strong>Salles de bain:</strong> ${boat.capacity.bathrooms}
                </div>
              ` : ''}
            </div>
            
            <div class="boat-location-info">
              <h3>Localisation</h3>
              <p>📍 ${boat.location.marina}, ${boat.location.city}, ${boat.location.country}</p>
            </div>
            
            <div class="boat-pricing">
              <div class="price-main">
                <span class="price-amount">${boat.pricing.dailyRate}€</span>
                <span class="price-unit">/jour</span>
              </div>
              ${boat.pricing.weeklyRate ? `
                <div class="price-secondary">
                  <span class="price-amount">${boat.pricing.weeklyRate}€</span>
                  <span class="price-unit">/semaine</span>
                </div>
              ` : ''}
              <div class="price-details">
                <p>Caution: ${boat.pricing.securityDeposit}€</p>
                ${boat.pricing.cleaningFee > 0 ? `<p>Frais de nettoyage: ${boat.pricing.cleaningFee}€</p>` : ''}
              </div>
            </div>
            
            <div class="boat-actions">
              ${this.currentUser ? `
                <button class="btn-primary btn-large" onclick="app.initiateBooking('${boat._id}')">
                  Réserver maintenant
                </button>
              ` : `
                <button class="btn-primary btn-large" onclick="app.uiManager.showModal('login-modal')">
                  Connectez-vous pour réserver
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Rendu de la pagination
   */
  renderPagination(pagination) {
    const paginationContainer = document.getElementById('boats-pagination');
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!paginationContainer || !pageNumbers) return;
    
    if (pagination.pages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Boutons précédent/suivant
    if (prevBtn) {
      prevBtn.disabled = pagination.page <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = pagination.page >= pagination.pages;
    }
    
    // Numéros de page
    pageNumbers.innerHTML = '';
    
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `btn-page ${i === pagination.page ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => this.changePage(i));
      pageNumbers.appendChild(pageBtn);
    }
  }

  /**
   * Changement de page
   */
  async changePage(page) {
    if (page < 1) return;
    
    await this.loadBoats(this.currentFilters, page);
    
    // Scroll vers le haut de la section bateaux
    const boatsSection = document.getElementById('boats');
    if (boatsSection) {
      boatsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Gestion de la recherche
   */
  async handleSearch() {
    const location = document.getElementById('search-location').value;
    const startDate = document.getElementById('search-start-date').value;
    const endDate = document.getElementById('search-end-date').value;
    const guests = document.getElementById('search-guests').value;
    
    const filters = {};
    
    if (location) {
      filters.search = location;
    }
    
    if (guests) {
      filters.minCapacity = guests;
    }
    
    // Scroll vers la section bateaux
    const boatsSection = document.getElementById('boats');
    if (boatsSection) {
      boatsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Charger les bateaux avec les filtres
    await this.loadBoats(filters, 1);
  }

  /**
   * Application des filtres
   */
  async applyFilters() {
    const filters = {};
    
    const type = document.getElementById('filter-type').value;
    const price = document.getElementById('filter-price').value;
    const capacity = document.getElementById('filter-capacity').value;
    
    if (type) filters.type = type;
    if (price) filters.maxPrice = price;
    if (capacity) filters.minCapacity = capacity;
    
    await this.loadBoats(filters, 1);
  }

  /**
   * Gestion du formulaire de contact
   */
  async handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    
    try {
      this.uiManager.showLoading('contact-form');
      
      const response = await fetch(`${this.apiBaseUrl || ''}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Échec de l\'envoi du message');
      }
      
      this.uiManager.showNotification('Message envoyé avec succès !', 'success');
      document.getElementById('contact-form').reset();
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.uiManager.showNotification('Erreur lors de l\'envoi du message', 'error');
    } finally {
      this.uiManager.hideLoading('contact-form');
    }
  }

  /**
   * Configuration de la navigation
   */
  setupNavigation() {
    // Intersection Observer pour la navigation active (uniquement sur la page d'accueil)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Vérifier si nous sommes sur la page d'accueil (avec des sections internes)
    if (sections.length > 0 && window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            
            navLinks.forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              }
            });
          }
        });
      }, {
        threshold: 0.3,
        rootMargin: '-100px 0px -100px 0px'
      });
      
      sections.forEach(section => observer.observe(section));
    }
  }

  /**
   * Configuration de l'upload d'images
   */
  setupImageUpload() {
    // Upload d'images pour le formulaire d'ajout
    const fileInput = document.getElementById('boat-image-input');
    const previewContainer = document.getElementById('image-preview-container');
    
    if (fileInput && previewContainer) {
      fileInput.addEventListener('change', (e) => {
        this.handleImageSelection(e.target.files, 'add');
      });
    }
    
    // Upload d'images pour le formulaire d'édition
    const editFileInput = document.getElementById('edit-boat-images');
    const editPreviewContainer = document.getElementById('edit-image-preview-container');
    
    if (editFileInput && editPreviewContainer) {
      editFileInput.addEventListener('change', (e) => {
        this.handleImageSelection(e.target.files, 'edit');
      });
    }
    
    // Gestion du clic sur la zone d'upload d'édition
    const editUploadArea = document.getElementById('edit-image-upload-area');
    if (editUploadArea) {
      editUploadArea.addEventListener('click', () => {
        editFileInput.click();
      });
    }
  }
  
  /**
   * Gestion de la sélection d'images
   */
  handleImageSelection(files, type = 'add') {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    Array.from(files).forEach(file => {
      // Vérification de la taille
      if (file.size > maxSize) {
        this.uiManager.showNotification(`L'image ${file.name} est trop volumineuse (max 5MB)`, 'error');
        return;
      }
      
      // Vérification du type
      if (!allowedTypes.includes(file.type)) {
        this.uiManager.showNotification(`Format non supporté pour ${file.name}`, 'error');
        return;
      }
      
      // Ajout de l'image
      if (type === 'add') {
        this.selectedImages.push(file);
        this.addImagePreview(file);
      } else if (type === 'edit') {
        this.addEditImagePreview(file);
      }
    });
  }
  
  /**
   * Ajout d'un aperçu d'image
   */
  addImagePreview(file) {
    const previewContainer = document.getElementById('image-preview-container');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const preview = document.createElement('div');
      preview.className = 'image-preview';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Aperçu">
        <button type="button" class="remove-image" onclick="app.removeImage('${file.name}')">×</button>
      `;
      previewContainer.appendChild(preview);
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Ajout d'un aperçu d'image pour l'édition
   */
  addEditImagePreview(file) {
    const previewContainer = document.getElementById('edit-image-preview-container');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const preview = document.createElement('div');
      preview.className = 'image-preview-item new';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Aperçu">
        <button type="button" class="remove-image-btn" onclick="app.removeEditImage('${file.name}')">×</button>
      `;
      previewContainer.appendChild(preview);
    };
    
    reader.readAsDataURL(file);
  }
  
  /**
   * Suppression d'une image
   */
  removeImage(fileName) {
    this.selectedImages = this.selectedImages.filter(file => file.name !== fileName);
    this.updateImagePreviews();
  }

  /**
   * Suppression d'une image d'édition
   */
  removeEditImage(fileName) {
    const previewContainer = document.getElementById('edit-image-preview-container');
    const previews = previewContainer.querySelectorAll('.image-preview-item.new');
    previews.forEach(preview => {
      const img = preview.querySelector('img');
      if (img && img.src.includes(fileName)) {
        preview.remove();
      }
    });
  }

  /**
   * Suppression d'une image existante
   */
  removeExistingImage(index) {
    // Cette méthode sera appelée pour supprimer une image existante
    // Pour l'instant, on peut juste retirer l'élément du DOM
    const previewContainer = document.getElementById('edit-image-preview-container');
    const existingImages = previewContainer.querySelectorAll('.image-preview-item.existing');
    if (existingImages[index]) {
      existingImages[index].remove();
    }
  }
  
  /**
   * Mise à jour des aperçus d'images
   */
  updateImagePreviews() {
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = '';
    
    this.selectedImages.forEach(file => {
      this.addImagePreview(file);
    });
  }
  
  /**
   * Gestion de l'ajout de bateau
   */
  async handleAddBoat(e) {
    e.preventDefault();
  
    if (!this.currentUser) {
      this.uiManager.showNotification('Vous devez être connecté pour ajouter un bateau', 'error');
      return;
    }
  
    const formData = new FormData();
  
    // Données du formulaire
    formData.append('name', document.getElementById('boat-name').value.trim());
    formData.append('type', document.getElementById('boat-type').value);
    formData.append('description', document.getElementById('boat-description').value.trim());
    formData.append('category', document.getElementById('boat-category').value);
  
    // Spécifications (conversion en float)
    const length = parseFloat(document.getElementById('boat-length').value);
    const width = parseFloat(document.getElementById('boat-width').value);
    formData.append('specifications[length]', isNaN(length) ? '' : length);
    formData.append('specifications[width]', isNaN(width) ? '' : width);
  
    // Capacité (conversion en int)
    const maxPeople = parseInt(document.getElementById('boat-capacity').value, 10);
    formData.append('capacity[maxPeople]', isNaN(maxPeople) ? '' : maxPeople);
  
    // Localisation
    formData.append('location[city]', document.getElementById('boat-city').value.trim());
    formData.append('location[marina]', document.getElementById('boat-marina').value.trim());
    formData.append('location[country]', 'France');
  
    // Tarification (conversion en float)
    const dailyRate = parseFloat(document.getElementById('boat-daily-rate').value);
    const securityDeposit = parseFloat(document.getElementById('boat-security-deposit').value);
    formData.append('pricing[dailyRate]', isNaN(dailyRate) ? '' : dailyRate);
    formData.append('pricing[securityDeposit]', isNaN(securityDeposit) ? '' : securityDeposit);
  
    // Images
    if (this.selectedImages && this.selectedImages.length > 0) {
      this.selectedImages.forEach(file => formData.append('images', file));
    }
  
    try {
      this.uiManager.showLoading('add-boat-form');
  
      const response = await fetch(`${this.boatService.boatsEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.boatService.getAuthToken()}`
          // Ne pas définir Content-Type pour FormData
        },
        body: formData
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        this.uiManager.showNotification('Bateau ajouté avec succès !', 'success');
        this.uiManager.hideModal('add-boat-modal');
  
        // Reset du formulaire
        document.getElementById('add-boat-form').reset();
        this.selectedImages = [];
        this.updateImagePreviews();
  
        // Recharger la liste des bateaux si le modal est ouvert
        if (document.getElementById('my-boats-modal').classList.contains('active')) {
          await this.loadOwnerBoats();
        }
      } else {
        throw new Error(data.message || 'Erreur lors de l\'ajout du bateau');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du bateau:', error);
      this.uiManager.showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      this.uiManager.hideLoading('add-boat-form');
    }
  }

  /**
   * Gestion de l'édition de bateau
   */
  async handleEditBoat(e) {
    e.preventDefault();

    if (!this.currentUser) {
      this.uiManager.showNotification('Vous devez être connecté pour modifier un bateau', 'error');
      return;
    }

    const form = e.target;
    const boatId = form.dataset.boatId;
    
    if (!boatId) {
      this.uiManager.showNotification('ID du bateau manquant', 'error');
      return;
    }

    const formData = new FormData(form);
    
    // Validation des champs requis
    const requiredFields = ['name', 'type', 'category', 'length', 'width', 'capacity', 'city', 'pricePerDay', 'deposit'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        this.uiManager.showNotification(`Le champ ${field} est requis`, 'error');
        return;
      }
    }

    try {
      this.uiManager.showLoading('edit-boat-form');

      const response = await fetch(`${this.boatService.boatsEndpoint}/${boatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.uiManager.showNotification('Bateau modifié avec succès !', 'success');
        this.uiManager.hideModal('edit-boat-modal');

        // Reset du formulaire
        form.reset();
        this.selectedImages = [];
        this.updateImagePreviews();

        // Recharger la liste des bateaux
        await this.loadBoatManagementData();
      } else {
        throw new Error(data.message || 'Erreur lors de la modification du bateau');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du bateau:', error);
      this.uiManager.showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      this.uiManager.hideLoading('edit-boat-form');
    }
  }

  /**
   * Initiation d'une réservation
   */
  async initiateBooking(boatId) {
    if (!this.currentUser) {
      this.uiManager.showModal('login-modal');
      return;
    }
    
    // Ici, on pourrait ouvrir une modale de réservation
    // Pour l'instant, on affiche juste une notification
    this.uiManager.showNotification('Fonctionnalité de réservation en cours de développement', 'info');
  }

  /**
   * Initialisation de la gestion des bateaux
   */
  initBoatManagement() {
    console.log('🚤 Initialisation de la gestion des bateaux...');
    
    // Vérifier si nous sommes sur la page de gestion des bateaux
    if (window.location.pathname.includes('boat-management.html')) {
      this.setupBoatManagementEventListeners();
      
      // Attendre un peu pour s'assurer que l'authentification est complètement chargée
      setTimeout(() => {
        this.loadBoatManagementData();
      }, 100);
    }
  }

  /**
   * Configuration des écouteurs d'événements pour la gestion des bateaux
   */
  setupBoatManagementEventListeners() {
    // Le bouton d'ajout de bateau est déjà configuré dans setupEventListeners()

    // Filtres
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterBoats());
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.filterBoats());
    }
    if (searchInput) {
      searchInput.addEventListener('input', () => this.debounceSearch());
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.filterBoats());
    }

    // Contrôles de vue
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
    }
    if (listViewBtn) {
      listViewBtn.addEventListener('click', () => this.setViewMode('list'));
    }

    // Pagination
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => this.changePage(-1));
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => this.changePage(1));
    }

    // Bouton de retry
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadBoatManagementData());
    }

    // Bouton d'ajout du premier bateau
    const addFirstBoatBtn = document.getElementById('add-first-boat-btn');
    if (addFirstBoatBtn) {
      addFirstBoatBtn.addEventListener('click', () => {
        this.uiManager.showModal('add-boat-modal');
      });
    }
  }

  /**
   * Chargement des données de gestion des bateaux
   */
  async loadBoatManagementData() {
    try {
      this.showLoadingState();
      
      console.log('🚤 [BOAT MANAGEMENT] Chargement des données de gestion des bateaux');
      
      // Vérifier l'authentification avant de charger les données
      if (!this.currentUser) {
        console.log('🔄 [BOAT MANAGEMENT] Utilisateur non trouvé, tentative de rechargement...');
        // Essayer de recharger l'utilisateur depuis le localStorage
        const user = this.storageManager.getUser();
        if (user) {
          this.currentUser = user;
          console.log('✅ [BOAT MANAGEMENT] Utilisateur rechargé depuis le localStorage');
        } else {
          throw new Error('Vous devez être connecté pour accéder à la gestion des bateaux');
        }
      }

      const token = this.storageManager.getToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      console.log('🔐 [BOAT MANAGEMENT] Utilisateur connecté:', this.currentUser.email);
      console.log('🔐 [BOAT MANAGEMENT] Token présent:', token ? 'Oui' : 'Non');
      
      // Charger les statistiques et les bateaux en parallèle
      const [statsResponse, boatsResponse] = await Promise.all([
        this.boatService.getBoatStats(),
        this.boatService.getOwnerBoats()
      ]);

      if (statsResponse.success) {
        this.updateStats(statsResponse.data.overview);
      }

      if (boatsResponse.success) {
        this.displayBoats(boatsResponse.data.boats);
        this.updatePagination(boatsResponse.data.pagination);
      }

      this.hideLoadingState();
      console.log('✅ [BOAT MANAGEMENT] Données chargées avec succès');
    } catch (error) {
      console.error('❌ [BOAT MANAGEMENT] Erreur lors du chargement des données:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message.includes('Vous devez être connecté') || 
          error.message.includes('Authentification requise') || 
          error.message.includes('Token')) {
        this.showErrorState('Vous devez être connecté pour accéder à cette page. Redirection vers la page de connexion...');
        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 3000);
      } else {
        this.showErrorState(error.message);
      }
    }
  }

  /**
   * Affichage de l'état de chargement
   */
  showLoadingState() {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const emptyMessage = document.getElementById('empty-message');
    const boatsGrid = document.getElementById('boats-grid');

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (boatsGrid) boatsGrid.style.display = 'none';
  }

  /**
   * Masquage de l'état de chargement
   */
  hideLoadingState() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) loadingMessage.style.display = 'none';
  }

  /**
   * Affichage de l'état d'erreur
   */
  showErrorState(message) {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const emptyMessage = document.getElementById('empty-message');
    const boatsGrid = document.getElementById('boats-grid');

    if (loadingMessage) loadingMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'block';
    if (errorText) errorText.textContent = message;
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (boatsGrid) boatsGrid.style.display = 'none';
  }

  /**
   * Mise à jour des statistiques
   */
  updateStats(stats) {
    const totalBoats = document.getElementById('total-boats');
    const availableBoats = document.getElementById('available-boats');
    const totalBookings = document.getElementById('total-bookings');
    const totalRevenue = document.getElementById('total-revenue');

    if (totalBoats) totalBoats.textContent = stats.totalBoats || 0;
    if (availableBoats) availableBoats.textContent = stats.availableBoats || 0;
    if (totalBookings) totalBookings.textContent = stats.totalBookings || 0;
    if (totalRevenue) totalRevenue.textContent = `${stats.totalRevenue || 0}€`;
  }

  /**
   * Affichage des bateaux
   */
  displayBoats(boats) {
    const boatsGrid = document.getElementById('boats-grid');
    const emptyMessage = document.getElementById('empty-message');
    const errorMessage = document.getElementById('error-message');

    if (!boatsGrid) return;

    if (boats.length === 0) {
      boatsGrid.style.display = 'none';
      if (emptyMessage) emptyMessage.style.display = 'block';
      if (errorMessage) errorMessage.style.display = 'none';
      return;
    }

    boatsGrid.style.display = 'grid';
    if (emptyMessage) emptyMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';

    boatsGrid.innerHTML = boats.map(boat => this.createBoatCard(boat)).join('');
  }

  /**
   * Création d'une carte de bateau
   */
  createBoatCard(boat) {
    const statusClass = boat.status || 'available';
    const statusText = this.getStatusText(boat.status);
    const typeText = this.getTypeText(boat.type);
    const mainImage = boat.images?.find(img => img.isMain)?.url || boat.images?.[0]?.url || 'boat-icon.svg';

    return `
      <div class="boat-management-card ${!boat.isActive ? 'inactive' : ''}" data-boat-id="${boat._id}">
        <img src="${mainImage}" alt="${boat.name}" class="boat-card-image" onerror="this.src='boat-icon.svg'">
        <div class="boat-card-content">
          <div class="boat-card-header">
            <div>
              <h3 class="boat-card-title">${boat.name}</h3>
              <span class="boat-card-type">${typeText}</span>
            </div>
            <span class="boat-card-status ${statusClass}">${statusText}</span>
          </div>
          
          <div class="boat-card-info">
            <div class="boat-info-item">
              <span class="boat-info-icon">👥</span>
              <span>${boat.capacity?.maxPeople || 0} personnes</span>
            </div>
            <div class="boat-info-item">
              <span class="boat-info-icon">📏</span>
              <span>${boat.specifications?.length || 0}m</span>
            </div>
            <div class="boat-info-item">
              <span class="boat-info-icon">💰</span>
              <span>${boat.pricing?.dailyRate || 0}€/jour</span>
            </div>
            <div class="boat-info-item">
              <span class="boat-info-icon">📍</span>
              <span>${boat.location?.city || 'N/A'}</span>
            </div>
          </div>
          
          <div class="boat-card-actions">
            <button class="boat-action-btn" onclick="window.app.editBoat('${boat._id}')">
              <span>✏️</span>
              Modifier
            </button>
            <button class="boat-action-btn" onclick="window.app.manageImages('${boat._id}')">
              <span>🖼️</span>
              Images
            </button>
            ${boat.isActive ? 
              `<button class="boat-action-btn danger" onclick="window.app.deleteBoat('${boat._id}')">
                <span>🗑️</span>
                Supprimer
              </button>` :
              `<button class="boat-action-btn primary" onclick="window.app.restoreBoat('${boat._id}')">
                <span>🔄</span>
                Restaurer
              </button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Obtention du texte du statut
   */
  getStatusText(status) {
    const statusMap = {
      'available': 'Disponible',
      'booked': 'Réservé',
      'maintenance': 'Maintenance',
      'inactive': 'Inactif'
    };
    return statusMap[status] || 'Inconnu';
  }

  /**
   * Obtention du texte du type
   */
  getTypeText(type) {
    const typeMap = {
      'sailboat': 'Voilier',
      'motorboat': 'Bateau à moteur',
      'catamaran': 'Catamaran',
      'yacht': 'Yacht',
      'other': 'Autre'
    };
    return typeMap[type] || type;
  }

  /**
   * Filtrage des bateaux
   */
  async filterBoats() {
    const status = document.getElementById('status-filter')?.value;
    const type = document.getElementById('type-filter')?.value;
    const search = document.getElementById('search-input')?.value;

    try {
      this.showLoadingState();
      
      const params = {};
      if (status) params.status = status;
      if (type) params.type = type;
      if (search) params.search = search;

      const response = await this.boatService.getOwnerBoats(params);
      
      if (response.success) {
        this.displayBoats(response.data.boats);
        this.updatePagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      this.showErrorState('Erreur lors du filtrage des bateaux');
    }
  }

  /**
   * Recherche avec debounce
   */
  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filterBoats();
    }, 500);
  }

  /**
   * Définition du mode d'affichage
   */
  setViewMode(mode) {
    const boatsGrid = document.getElementById('boats-grid');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (boatsGrid) {
      boatsGrid.className = mode === 'grid' ? 'boats-grid' : 'boats-grid list-view';
    }

    if (gridViewBtn) {
      gridViewBtn.classList.toggle('active', mode === 'grid');
    }
    if (listViewBtn) {
      listViewBtn.classList.toggle('active', mode === 'list');
    }
  }

  /**
   * Changement de page
   */
  async changePage(direction) {
    // Implémentation de la pagination
    console.log('Changement de page:', direction);
  }

  /**
   * Mise à jour de la pagination
   */
  updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (!paginationEl || !pagination) return;

    paginationEl.style.display = pagination.pages > 1 ? 'flex' : 'none';

    if (pageInfo) {
      pageInfo.textContent = `Page ${pagination.page} sur ${pagination.pages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = pagination.page <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = pagination.page >= pagination.pages;
    }
  }

  /**
   * Édition d'un bateau
   */
  async editBoat(boatId) {
    try {
      // Récupérer les données du bateau
      const response = await this.boatService.getBoatById(boatId);
      
      if (response.success) {
        const boat = response.data.boat;
        this.showEditBoatModal(boat);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du bateau:', error);
      this.uiManager.showNotification(`Erreur: ${error.message}`, 'error');
    }
  }

  /**
   * Gestion des images d'un bateau
   */
  manageImages(boatId) {
    this.uiManager.showNotification('Fonctionnalité de gestion d\'images en cours de développement', 'info');
    // TODO: Implémenter la gestion des images
  }

  /**
   * Suppression d'un bateau
   */
  async deleteBoat(boatId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bateau ?')) {
      return;
    }

    try {
      // Vérifier l'authentification avant la suppression
      if (!this.currentUser) {
        throw new Error('Vous devez être connecté pour supprimer un bateau');
      }

      const token = this.storageManager.getToken();
      if (!token) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      console.log('🗑️ [DELETE BOAT] Tentative de suppression du bateau:', boatId);
      console.log('🔐 [DELETE BOAT] Token présent:', token ? 'Oui' : 'Non');
      console.log('👤 [DELETE BOAT] Utilisateur connecté:', this.currentUser ? this.currentUser.email : 'Non');
      console.log('👤 [DELETE BOAT] User ID:', this.currentUser ? this.currentUser._id : 'Non');
      console.log('👤 [DELETE BOAT] User Role:', this.currentUser ? this.currentUser.role : 'Non');

      const response = await this.boatService.deleteBoat(boatId);
      
      if (response.success) {
        this.uiManager.showNotification('Bateau supprimé avec succès', 'success');
        await this.loadBoatManagementData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ [DELETE BOAT] Erreur lors de la suppression:', error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message.includes('Authentification requise') || error.message.includes('Token')) {
        this.uiManager.showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
        // Rediriger vers la page de connexion
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        this.uiManager.showNotification(`Erreur: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Restauration d'un bateau
   */
  async restoreBoat(boatId) {
    try {
      const response = await this.boatService.restoreBoat(boatId);
      
      if (response.success) {
        this.uiManager.showNotification('Bateau restauré avec succès', 'success');
        await this.loadBoatManagementData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      this.uiManager.showNotification(`Erreur: ${error.message}`, 'error');
    }
  }

  /**
   * Affichage de la modal d'ajout de bateau
   */
  showAddBoatModal() {
    // Ouvrir directement le modal d'ajout de bateau
    this.uiManager.showModal('add-boat-modal');
  }

  /**
   * Affichage de la modal d'édition de bateau
   */
  showEditBoatModal(boat) {
    // Remplir le formulaire avec les données du bateau
    this.populateEditForm(boat);
    // Ouvrir le modal d'édition
    this.uiManager.showModal('edit-boat-modal');
  }

  /**
   * Remplissage du formulaire d'édition avec les données du bateau
   */
  populateEditForm(boat) {
    // Vérifier que les éléments existent avant de les modifier
    const nameField = document.getElementById('edit-boat-name');
    const typeField = document.getElementById('edit-boat-type');
    const categoryField = document.getElementById('edit-boat-category');
    const descriptionField = document.getElementById('edit-boat-description');
    const lengthField = document.getElementById('edit-boat-length');
    const widthField = document.getElementById('edit-boat-width');
    const capacityField = document.getElementById('edit-boat-capacity');
    const cityField = document.getElementById('edit-boat-city');
    const marinaField = document.getElementById('edit-boat-marina');
    const priceField = document.getElementById('edit-boat-price');
    const depositField = document.getElementById('edit-boat-deposit');
    const form = document.getElementById('edit-boat-form');
    
    if (nameField) nameField.value = boat.name || '';
    if (typeField) typeField.value = boat.type || '';
    if (categoryField) categoryField.value = boat.category || '';
    if (descriptionField) descriptionField.value = boat.description || '';
    if (lengthField) lengthField.value = boat.length || '';
    if (widthField) widthField.value = boat.width || '';
    if (capacityField) capacityField.value = boat.capacity || '';
    if (cityField) cityField.value = boat.city || '';
    if (marinaField) marinaField.value = boat.marina || '';
    if (priceField) priceField.value = boat.pricePerDay || '';
    if (depositField) depositField.value = boat.deposit || '';
    
    // Stocker l'ID du bateau pour la mise à jour
    if (form) form.dataset.boatId = boat._id;
    
    // Afficher les images existantes
    this.displayExistingImages(boat.images || []);
  }

  /**
   * Affichage des images existantes du bateau
   */
  displayExistingImages(images) {
    const container = document.getElementById('edit-image-preview-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-preview-item existing';
        imageDiv.innerHTML = `
          <img src="${image}" alt="Image du bateau">
          <button type="button" class="remove-image-btn" onclick="app.removeExistingImage(${index})">×</button>
        `;
        container.appendChild(imageDiv);
      });
    }
  }
}

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Création de l'instance globale de l'application
  window.app = new SailingLocApp();
});

// Export pour les modules
export default SailingLocApp;