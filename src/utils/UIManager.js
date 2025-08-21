/**
 * Gestionnaire d'interface utilisateur
 * Gère les interactions UI, modales, notifications, animations, etc.
 */
export class UIManager {
  constructor() {
    // Configuration des notifications
    this.notificationContainer = null;
    this.notificationQueue = [];
    this.maxNotifications = 5;
    
    // Configuration des modales
    this.activeModals = new Set();
    
    // Configuration du loading
    this.loadingElements = new Map();
    
    // Initialisation
    this.init();
  }

  /**
   * Initialisation du gestionnaire UI
   */
  init() {
    this.createNotificationContainer();
    this.setupGlobalEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Création du conteneur de notifications
   */
  createNotificationContainer() {
    this.notificationContainer = document.getElementById('notifications');
    
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notifications';
      this.notificationContainer.className = 'notifications';
      document.body.appendChild(this.notificationContainer);
    }
  }

  /**
   * Configuration des écouteurs d'événements globaux
   */
  setupGlobalEventListeners() {
    // Fermeture des modales avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopModal();
      }
    });

    // Gestion du redimensionnement de fenêtre
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Gestion du scroll pour les effets
    window.addEventListener('scroll', () => {
      this.handleScroll();
    });
  }

  /**
   * Configuration des raccourcis clavier
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K pour ouvrir la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearchInput();
      }
    });
  }

  /**
   * Affichage d'une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   * @param {number} duration - Durée d'affichage en ms (0 = permanent)
   * @param {Object} options - Options supplémentaires
   */
  showNotification(message, type = 'info', duration = 5000, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      ...options
    };

    // Ajouter à la queue si trop de notifications
    if (this.notificationContainer.children.length >= this.maxNotifications) {
      this.notificationQueue.push(notification);
      return;
    }

    this.renderNotification(notification);
  }

  /**
   * Rendu d'une notification
   * @param {Object} notification - Données de la notification
   */
  renderNotification(notification) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification notification-${notification.type}`;
    notificationElement.setAttribute('data-notification-id', notification.id);

    // Icône selon le type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notificationElement.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[notification.type] || icons.info}</span>
        <span class="notification-message">${notification.message}</span>
        <button class="notification-close" aria-label="Fermer">×</button>
      </div>
      ${notification.duration > 0 ? `<div class="notification-progress"></div>` : ''}
    `;

    // Écouteur pour fermer la notification
    const closeBtn = notificationElement.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hideNotification(notification.id);
    });

    // Animation d'entrée
    notificationElement.style.transform = 'translateX(100%)';
    notificationElement.style.opacity = '0';
    
    this.notificationContainer.appendChild(notificationElement);

    // Animation d'apparition
    requestAnimationFrame(() => {
      notificationElement.style.transform = 'translateX(0)';
      notificationElement.style.opacity = '1';
    });

    // Barre de progression et suppression automatique
    if (notification.duration > 0) {
      const progressBar = notificationElement.querySelector('.notification-progress');
      if (progressBar) {
        progressBar.style.animationDuration = `${notification.duration}ms`;
      }

      setTimeout(() => {
        this.hideNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Masquage d'une notification
   * @param {string} notificationId - ID de la notification
   */
  hideNotification(notificationId) {
    const notification = this.notificationContainer.querySelector(
      `[data-notification-id="${notificationId}"]`
    );

    if (notification) {
      // Animation de sortie
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';

      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
          
          // Afficher la prochaine notification en queue
          if (this.notificationQueue.length > 0) {
            const nextNotification = this.notificationQueue.shift();
            this.renderNotification(nextNotification);
          }
        }
      }, 300);
    }
  }

  /**
   * Affichage d'une modale
   * @param {string} modalId - ID de la modale
   * @param {Object} options - Options d'affichage
   */
  showModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    
    if (!modal) {
      console.error(`Modale ${modalId} non trouvée`);
      return;
    }

    // Ajouter à la liste des modales actives
    this.activeModals.add(modalId);

    // Configuration par défaut
    const config = {
      closeOnBackdrop: true,
      closeOnEscape: true,
      focus: true,
      ...options
    };

    // Affichage de la modale
    modal.style.display = 'flex';
    modal.classList.add('modal-active');
    
    // Animation d'ouverture
    requestAnimationFrame(() => {
      modal.classList.add('modal-open');
    });

    // Focus sur le premier élément focusable
    if (config.focus) {
      setTimeout(() => {
        const focusableElement = modal.querySelector('input, button, textarea, select');
        if (focusableElement) {
          focusableElement.focus();
        }
      }, 100);
    }

    // Désactiver le scroll du body
    document.body.classList.add('modal-open');

    // Écouteur pour fermeture sur backdrop
    if (config.closeOnBackdrop) {
      modal.addEventListener('click', this.handleModalBackdropClick.bind(this));
    }
  }

  /**
   * Masquage d'une modale
   * @param {string} modalId - ID de la modale
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (!modal) {
      return;
    }

    // Retirer de la liste des modales actives
    this.activeModals.delete(modalId);

    // Animation de fermeture
    modal.classList.remove('modal-open');
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('modal-active');
      
      // Réactiver le scroll si aucune modale n'est ouverte
      if (this.activeModals.size === 0) {
        document.body.classList.remove('modal-open');
      }
    }, 300);

    // Nettoyer les écouteurs
    modal.removeEventListener('click', this.handleModalBackdropClick.bind(this));
  }

  /**
   * Fermeture de la modale du dessus
   */
  closeTopModal() {
    if (this.activeModals.size > 0) {
      const lastModal = Array.from(this.activeModals).pop();
      this.hideModal(lastModal);
    }
  }

  /**
   * Gestion du clic sur le backdrop d'une modale
   * @param {Event} e - Événement de clic
   */
  handleModalBackdropClick(e) {
    if (e.target.classList.contains('modal')) {
      const modalId = e.target.id;
      this.hideModal(modalId);
    }
  }

  /**
   * Affichage d'un indicateur de chargement
   * @param {string} elementId - ID de l'élément ou sélecteur
   * @param {string} message - Message de chargement
   */
  showLoading(elementId, message = 'Chargement...') {
    const element = typeof elementId === 'string' 
      ? document.getElementById(elementId) || document.querySelector(elementId)
      : elementId;
    
    if (!element) {
      console.error(`Élément ${elementId} non trouvé pour le loading`);
      return;
    }

    // Sauvegarder le contenu original
    if (!this.loadingElements.has(element)) {
      this.loadingElements.set(element, {
        originalContent: element.innerHTML,
        originalDisabled: element.disabled
      });
    }

    // Créer l'indicateur de chargement
    const loadingHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span class="loading-message">${message}</span>
        </div>
      </div>
    `;

    // Appliquer le loading
    if (element.tagName === 'BUTTON') {
      element.disabled = true;
      element.innerHTML = `<span class="spinner-small"></span> ${message}`;
    } else {
      element.style.position = 'relative';
      element.insertAdjacentHTML('beforeend', loadingHTML);
    }
  }

  /**
   * Masquage d'un indicateur de chargement
   * @param {string} elementId - ID de l'élément ou sélecteur
   */
  hideLoading(elementId) {
    const element = typeof elementId === 'string' 
      ? document.getElementById(elementId) || document.querySelector(elementId)
      : elementId;
    
    if (!element) {
      return;
    }

    const savedData = this.loadingElements.get(element);
    
    if (savedData) {
      // Restaurer le contenu original
      element.innerHTML = savedData.originalContent;
      element.disabled = savedData.originalDisabled;
      
      // Nettoyer la sauvegarde
      this.loadingElements.delete(element);
    }

    // Supprimer l'overlay de chargement
    const loadingOverlay = element.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  /**
   * Animation de scroll fluide vers un élément
   * @param {string|HTMLElement} target - Élément cible ou sélecteur
   * @param {Object} options - Options de scroll
   */
  scrollTo(target, options = {}) {
    const element = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!element) {
      console.error(`Élément ${target} non trouvé pour le scroll`);
      return;
    }

    const config = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      offset: 0,
      ...options
    };

    // Calcul de la position avec offset
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - config.offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: config.behavior
    });
  }

  /**
   * Gestion du redimensionnement de fenêtre
   */
  handleWindowResize() {
    // Ajuster les modales si nécessaire
    this.activeModals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        // Logique d'ajustement si nécessaire
      }
    });
  }

  /**
   * Gestion du scroll pour les effets
   */
  handleScroll() {
    const scrollY = window.scrollY;
    
    // Effet parallaxe sur le hero
    const hero = document.querySelector('.hero');
    if (hero) {
      const heroImage = hero.querySelector('.hero-image');
      if (heroImage) {
        heroImage.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
    }

    // Navbar transparente
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }

  /**
   * Focus sur le champ de recherche
   */
  focusSearchInput() {
    const searchInput = document.getElementById('search-location');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
}