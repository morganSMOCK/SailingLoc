// Gestionnaire d'interface utilisateur - Partie Vue dans l'architecture MVC
export class UIManager {
  constructor() {
    this.loadingElement = null;
    this.notificationContainer = null;
    this.initNotificationContainer();
  }

  // Initialiser le conteneur de notifications
  initNotificationContainer() {
    // Créer le conteneur de notifications s'il n'existe pas
    this.notificationContainer = document.getElementById('notifications');
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notifications';
      this.notificationContainer.className = 'notifications-container';
      document.body.appendChild(this.notificationContainer);
    }
  }

  // Afficher un indicateur de chargement
  showLoading(message = 'Chargement...') {
    this.hideLoading(); // Supprimer tout loading existant

    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'loading-overlay';
    this.loadingElement.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;

    document.body.appendChild(this.loadingElement);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  }

  // Masquer l'indicateur de chargement
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
      document.body.style.overflow = '';
    }
  }

  // Afficher une notification de succès
  showSuccess(message, duration = 5000) {
    this.showNotification(message, 'success', duration);
  }

  // Afficher une notification d'erreur
  showError(message, duration = 7000) {
    this.showNotification(message, 'error', duration);
  }

  // Afficher une notification d'information
  showInfo(message, duration = 5000) {
    this.showNotification(message, 'info', duration);
  }

  // Afficher une notification d'avertissement
  showWarning(message, duration = 6000) {
    this.showNotification(message, 'warning', duration);
  }

  // Afficher une notification générique
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    this.notificationContainer.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 100);

    // Suppression automatique
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  }

  // Supprimer une notification
  removeNotification(notification) {
    if (notification && notification.parentElement) {
      notification.classList.add('notification-hide');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }

  // Ouvrir une modale
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le premier élément focusable
      const focusableElement = modal.querySelector('input, button, select, textarea');
      if (focusableElement) {
        setTimeout(() => focusableElement.focus(), 100);
      }
    }
  }

  // Fermer une modale
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  }

  // Fermer toutes les modales
  closeAllModals() {
    const modals = document.querySelectorAll('.modal.modal-open');
    modals.forEach(modal => {
      modal.classList.remove('modal-open');
    });
    document.body.style.overflow = '';
  }

  // Afficher une boîte de dialogue de confirmation
  showConfirmDialog(message, onConfirm, onCancel = null) {
    const dialog = document.createElement('div');
    dialog.className = 'modal modal-open';
    dialog.innerHTML = `
      <div class="modal-content modal-confirm">
        <div class="modal-header">
          <h3>Confirmation</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelBtn">Annuler</button>
          <button class="btn btn-primary" id="confirmBtn">Confirmer</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    document.body.style.overflow = 'hidden';

    // Gestionnaires d'événements
    const confirmBtn = dialog.querySelector('#confirmBtn');
    const cancelBtn = dialog.querySelector('#cancelBtn');

    confirmBtn.addEventListener('click', () => {
      dialog.remove();
      document.body.style.overflow = '';
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
      document.body.style.overflow = '';
      if (onCancel) onCancel();
    });

    // Fermer en cliquant à l'extérieur
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
        document.body.style.overflow = '';
        if (onCancel) onCancel();
      }
    });

    return dialog;
  }

  // Valider un formulaire
  validateForm(formElement) {
    const errors = [];
    const requiredFields = formElement.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        errors.push(`Le champ "${field.labels[0]?.textContent || field.name}" est requis`);
        field.classList.add('field-error');
      } else {
        field.classList.remove('field-error');
      }

      // Validation spécifique par type
      if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
          errors.push('Format d\'email invalide');
          field.classList.add('field-error');
        }
      }

      if (field.type === 'tel' && field.value) {
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(field.value)) {
          errors.push('Format de téléphone invalide');
          field.classList.add('field-error');
        }
      }

      if (field.type === 'password' && field.value) {
        if (field.value.length < 6) {
          errors.push('Le mot de passe doit contenir au moins 6 caractères');
          field.classList.add('field-error');
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Afficher les erreurs de validation
  showValidationErrors(errors, formElement) {
    // Supprimer les erreurs existantes
    const existingErrors = formElement.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());

    // Afficher les nouvelles erreurs
    if (errors.length > 0) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'validation-error';
      errorContainer.innerHTML = `
        <ul>
          ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
      `;

      formElement.insertBefore(errorContainer, formElement.firstChild);
    }
  }

  // Formater une date pour l'affichage
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
  }

  // Formater une date et heure
  formatDateTime(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
  }

  // Formater un prix
  formatPrice(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Créer un élément de pagination
  createPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    // Bouton précédent
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-outline';
      prevBtn.textContent = 'Précédent';
      prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
      pagination.appendChild(prevBtn);
    }

    // Numéros de page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => onPageChange(i));
      pagination.appendChild(pageBtn);
    }

    // Bouton suivant
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-outline';
      nextBtn.textContent = 'Suivant';
      nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
      pagination.appendChild(nextBtn);
    }

    return pagination;
  }

  // Animer un élément
  animateElement(element, animation, duration = 300) {
    element.style.animation = `${animation} ${duration}ms ease-in-out`;
    
    return new Promise(resolve => {
      setTimeout(() => {
        element.style.animation = '';
        resolve();
      }, duration);
    });
  }

  // Faire défiler vers un élément
  scrollToElement(element, offset = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }

  // Copier du texte dans le presse-papiers
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess('Copié dans le presse-papiers');
      return true;
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      this.showError('Impossible de copier le texte');
      return false;
    }
  }

  // Débouncer une fonction
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttler une fonction
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}