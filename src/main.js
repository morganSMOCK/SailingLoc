// Importation des modules
import { AuthService } from './services/AuthService.js';
import { BoatService } from './services/BoatService.js';
import { BookingService } from './services/BookingService.js';
import { PaymentService } from './services/PaymentService.js';
import { UIManager } from './utils/UIManager.js';
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
    
    // Initialisation de l'application
    this.init();
  }

  /**
   * Initialisation de l'application
   */
  async init() {
    try {
      console.log('🚀 Initialisation de SailingLoc...');
      
      // Vérification de l'authentification existante
      await this.checkAuthStatus();
      
      // Configuration des écouteurs d'événements
      this.setupEventListeners();
      
      // Chargement initial des bateaux
      await this.loadBoats();
      
      // Configuration de la navigation
      this.setupNavigation();
      
      console.log('✅ SailingLoc initialisé avec succès');
      
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
    
    if (token) {
      try {
        // Vérification de la validité du token
        const response = await this.authService.verifyToken();
        
        if (response.success) {
          this.currentUser = response.data.user;
          this.updateUIForAuthenticatedUser();
        } else {
          // Token invalide, nettoyage
          this.storageManager.clearAuth();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        this.storageManager.clearAuth();
      }
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

    // Navigation smooth scroll
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
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
        this.uiManager.showModal('add-boat-modal');
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
    
    try {
      this.uiManager.showLoading('login-form');
      
      const response = await this.authService.login(email, password);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.storageManager.setToken(response.data.token);
        this.storageManager.setUser(response.data.user);
        
        this.updateUIForAuthenticatedUser();
        this.uiManager.hideModal('login-modal');
        this.uiManager.showNotification('Connexion réussie !', 'success');
        
        // Reset du formulaire
        document.getElementById('login-form').reset();
        
      } else {
        this.uiManager.showNotification(response.message || 'Erreur de connexion', 'error');
      }
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      this.uiManager.showNotification('Erreur de connexion', 'error');
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
    
    try {
      this.uiManager.showLoading('register-form');
      
      const response = await this.authService.register(formData);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.storageManager.setToken(response.data.token);
        this.storageManager.setUser(response.data.user);
        
        this.updateUIForAuthenticatedUser();
        this.uiManager.hideModal('register-modal');
        this.uiManager.showNotification('Inscription réussie !', 'success');
        
        // Reset du formulaire
        document.getElementById('register-form').reset();
        
      } else {
        this.uiManager.showNotification(response.message || 'Erreur d\'inscription', 'error');
      }
      
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      this.uiManager.showNotification('Erreur d\'inscription', 'error');
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
      this.uiManager.showModal('my-boats-modal');
      await this.loadOwnerBoats();
    } catch (error) {
      console.error('Erreur lors de l\'affichage des bateaux:', error);
      this.uiManager.showNotification('Erreur lors du chargement des bateaux', 'error');
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

  async editBoat(boatId) {
    this.uiManager.showNotification('Fonctionnalité en cours de développement', 'info');
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
      
      const response = await this.boatService.getBoats(queryParams);
      
      if (response.success) {
        this.renderBoats(response.data.boats);
        this.renderPagination(response.data.pagination);
        this.currentPage = page;
        this.currentFilters = filters;
      } else {
        this.uiManager.showNotification('Erreur lors du chargement des bateaux', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des bateaux:', error);
      this.uiManager.showNotification('Erreur lors du chargement des bateaux', 'error');
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
    
    boats.forEach(boat => {
      const boatCard = this.createBoatCard(boat);
      boatsGrid.appendChild(boatCard);
    });
  }

  /**
   * Création d'une carte de bateau
   */
  createBoatCard(boat) {
    const card = document.createElement('div');
    card.className = 'boat-card';
    card.setAttribute('data-boat-id', boat._id);
    
    const mainImage = boat.mainImage || boat.images?.[0]?.url || 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop';
    
    card.innerHTML = `
      <div class="boat-image">
        <img src="${mainImage}" alt="${boat.name}" loading="lazy">
        <div class="boat-badge">${this.formatBoatType(boat.type)}</div>
        <div class="boat-rating">
          <span class="rating-stars">${this.renderStars(boat.rating?.average || 0)}</span>
          <span class="rating-count">(${boat.rating?.totalReviews || 0})</span>
        </div>
      </div>
      <div class="boat-content">
        <h3 class="boat-name">${boat.name}</h3>
        <p class="boat-location">📍 ${boat.location.city}, ${boat.location.country}</p>
        <div class="boat-specs">
          <span class="spec">👥 ${boat.capacity.maxPeople} pers.</span>
          <span class="spec">📏 ${boat.specifications.length}m</span>
          ${boat.capacity.cabins ? `<span class="spec">🛏️ ${boat.capacity.cabins} cabines</span>` : ''}
        </div>
        <div class="boat-price">
          <span class="price">${boat.pricing.dailyRate}€</span>
          <span class="price-unit">/jour</span>
        </div>
        <button class="btn-primary btn-full boat-details-btn">Voir les détails</button>
      </div>
    `;
    
    // Écouteur pour afficher les détails
    const detailsBtn = card.querySelector('.boat-details-btn');
    detailsBtn.addEventListener('click', () => this.showBoatDetails(boat._id));
    
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
      
      // Simulation d'envoi (à remplacer par un vrai service)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    // Intersection Observer pour la navigation active
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
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
}

// Initialisation de l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Création de l'instance globale de l'application
  window.app = new SailingLocApp();
});

// Export pour les modules
export default SailingLocApp;