/**
 * Script d'initialisation global
 * Charge l'état de l'application et initialise les composants
 */
import { appState } from './services/AppStateService.js';
import { headerComponent } from './components/HeaderComponent.js';

// État global de l'application
window.appState = appState;
window.headerComponent = headerComponent;

/**
 * Initialiser l'application
 */
async function initializeApp() {
  try {
    console.log('🚀 Initialisation de l\'application...');
    
    // Initialiser l'état de l'application
    await appState.initialize();
    
    // Initialiser le header
    await headerComponent.initialize();
    
    console.log('✅ Application initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
  }
}

/**
 * Vérifier l'authentification avant de naviguer
 */
function setupNavigationGuards() {
  // Intercepter les clics sur les liens de navigation
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    
    // Vérifier si c'est un lien interne
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      // Vérifier l'authentification pour les pages protégées
      const protectedPages = ['/boat-management.html', '/my-bookings.html', '/profile.html'];
      const isProtectedPage = protectedPages.some(page => href.includes(page));
      
      if (isProtectedPage && !appState.isAuthenticated()) {
        e.preventDefault();
        // Rediriger vers la page de connexion
        window.location.href = '/login.html';
        return;
      }
    }
  });
}

/**
 * Gérer les erreurs d'authentification
 */
function setupAuthErrorHandling() {
  // Intercepter les erreurs 401 (non autorisé)
  const originalFetch = window.fetch;
  let isLoggingOut = false; // Flag pour éviter la boucle infinie
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      if (response.status === 401 && !isLoggingOut) {
        console.warn('⚠️ Session expirée, déconnexion...');
        isLoggingOut = true; // Marquer qu'on est en train de se déconnecter
        
        // Déconnexion locale sans appel API pour éviter la boucle
        appState.clearAuthData();
        
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = '/login.html';
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur fetch:', error);
      throw error;
    }
  };
}

/**
 * Rafraîchir l'état d'authentification périodiquement
 */
function setupAuthRefresh() {
  // Rafraîchir l'état toutes les 5 minutes
  setInterval(async () => {
    if (appState.isAuthenticated()) {
      await appState.refreshAuthState();
    }
  }, 5 * 60 * 1000);
}

/**
 * Gérer le scroll du header
 */
function setupHeaderScroll() {
  const header = document.querySelector('.navbar');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = scrollY;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick);
}

/**
 * Initialiser quand le DOM est prêt
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Configurer les gardes de navigation et la gestion d'erreurs
setupNavigationGuards();
setupAuthErrorHandling();
setupAuthRefresh();
setupHeaderScroll();

// Exposer les services globalement pour le debugging
if (typeof window !== 'undefined') {
  window.debugApp = {
    appState,
    headerComponent,
    refreshAuth: () => appState.refreshAuthState(),
    logout: () => appState.logout()
  };
}
