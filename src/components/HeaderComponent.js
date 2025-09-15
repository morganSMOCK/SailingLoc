/**
 * Composant de header avec gestion de l'authentification
 */
import { appState } from '../services/AppStateService.js';

export class HeaderComponent {
  constructor() {
    this.headerElement = null;
    this.isInitialized = false;
  }

  /**
   * Initialiser le composant header
   */
  async initialize() {
    if (this.isInitialized) return;

    // Attendre que l'état de l'app soit initialisé
    await appState.initialize();

    // Trouver l'élément header
    this.headerElement = document.querySelector('nav#navbar');
    if (!this.headerElement) {
      console.warn('⚠️ Header non trouvé dans le DOM');
      return;
    }

    // Écouter les changements d'état
    this.unsubscribe = appState.addListener((state) => {
      this.updateHeader(state);
    });

    // Mettre à jour immédiatement
    this.updateHeader({
      isAuthenticated: appState.isAuthenticated(),
      currentUser: appState.getCurrentUser(),
      isInitialized: appState.isInitialized
    });

    this.isInitialized = true;
    console.log('✅ HeaderComponent initialisé');
  }

  /**
   * Mettre à jour le header selon l'état d'authentification
   */
  updateHeader(state) {
    if (!this.headerElement) return;

    const { isAuthenticated, currentUser } = state;

    // Trouver les éléments d'authentification
    const headerActions = this.headerElement.querySelector('.nav-auth');
    if (!headerActions) return;

    // Vider le contenu existant
    headerActions.innerHTML = '';

    if (isAuthenticated && currentUser) {
      // Utilisateur connecté - afficher le menu utilisateur
      this.renderUserMenu(headerActions, currentUser);
    } else {
      // Utilisateur non connecté - afficher les boutons de connexion/inscription
      this.renderAuthButtons(headerActions);
    }
  }

  /**
   * Afficher les boutons de connexion/inscription
   */
  renderAuthButtons(container) {
    container.innerHTML = `
      <button id="login-btn" class="btn-secondary">Connexion</button>
      <button id="register-btn" class="btn-primary">Inscription</button>
    `;
    
    // Ajouter les événements
    this.setupAuthButtons();
  }

  /**
   * Afficher le menu utilisateur
   */
  renderUserMenu(container, user) {
    const userInitials = this.getUserInitials(user);
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email || 'Utilisateur';

    container.innerHTML = `
      <div class="user-menu" style="position: relative; display: flex; align-items: center; gap: 12px;">
        <div class="user-avatar" style="
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          color: white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 700; 
          font-size: 14px;
          cursor: pointer;
        " title="${userName}">
          ${userInitials}
        </div>
        <div class="user-dropdown" style="
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          min-width: 200px;
          z-index: 1000;
          display: none;
        ">
          <div style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">${userName}</div>
            <div style="font-size: 0.875rem; color: #64748b;">${user.email}</div>
          </div>
          <a href="/profile.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Mon profil
          </a>
          <a href="/my-bookings.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Mes réservations
          </a>
          <a href="/boat-management.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Gérer mes bateaux
          </a>
          <div style="border-top: 1px solid #f1f5f9; margin: 8px 0;"></div>
          <button onclick="headerComponent.logout()" style="
            display: block; 
            width: 100%; 
            padding: 12px 16px; 
            color: #dc2626; 
            background: none; 
            border: none; 
            text-align: left; 
            cursor: pointer; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#fef2f2'" onmouseout="this.style.backgroundColor='transparent'">
            Déconnexion
          </button>
        </div>
      </div>
    `;

    // Ajouter les événements
    this.setupUserMenuEvents();
  }

  /**
   * Configurer les boutons d'authentification
   */
  setupAuthButtons() {
    const loginBtn = this.headerElement.querySelector('#login-btn');
    const registerBtn = this.headerElement.querySelector('#register-btn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
      });
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        window.location.href = '/register.html';
      });
    }
  }

  /**
   * Configurer les événements du menu utilisateur
   */
  setupUserMenuEvents() {
    const userMenu = this.headerElement.querySelector('.user-menu');
    const dropdown = this.headerElement.querySelector('.user-dropdown');

    if (!userMenu || !dropdown) return;

    // Toggle du dropdown
    userMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Fermer le dropdown en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(user) {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout() {
    try {
      await appState.logout();
      // Rediriger vers la page d'accueil
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la redirection même en cas d'erreur
      window.location.href = '/';
    }
  }

  /**
   * Nettoyer le composant
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.isInitialized = false;
  }
}

// Instance globale
export const headerComponent = new HeaderComponent();
