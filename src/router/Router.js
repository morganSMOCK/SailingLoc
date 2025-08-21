/**
 * Routeur simple pour l'application SailingLoc
 * Gère la navigation entre les différentes pages
 */
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentPage = null;
    this.init();
  }

  /**
   * Initialisation du routeur
   */
  init() {
    // Écouter les changements d'URL
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Intercepter les clics sur les liens
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        this.navigate(route);
      }
    });

    // Gérer la route initiale
    this.handleRoute();
  }

  /**
   * Définition d'une route
   * @param {string} path - Chemin de la route
   * @param {Function} handler - Fonction à exécuter pour cette route
   */
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigation vers une route
   * @param {string} path - Chemin de destination
   * @param {Object} data - Données à passer à la route
   */
  navigate(path, data = {}) {
    if (path !== this.currentRoute) {
      history.pushState(data, '', path);
      this.handleRoute();
    }
  }

  /**
   * Gestion de la route actuelle
   */
  async handleRoute() {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    this.currentRoute = path;

    // Nettoyer la page précédente
    if (this.currentPage && this.currentPage.cleanup) {
      this.currentPage.cleanup();
    }

    // Trouver la route correspondante
    let handler = this.routes.get(path);
    let params = {};
    
    // Route par défaut si aucune correspondance
    if (!handler) {
      // Vérifier les routes avec paramètres
      for (const [routePath, routeHandler] of this.routes) {
        const match = this.matchRoute(routePath, path);
        if (match) {
          handler = routeHandler;
          params = match.params;
          break;
        }
      }
    }

    if (handler) {
      try {
        this.currentPage = await handler({ params, searchParams });
      } catch (error) {
        console.error('Erreur lors du chargement de la page:', error);
        this.show404();
      }
    } else {
      // Route 404
      this.show404();
    }

    // Mettre à jour la navigation active
    this.updateActiveNav();
  }

  /**
   * Correspondance de route avec paramètres
   * @param {string} routePath - Chemin de la route définie
   * @param {string} currentPath - Chemin actuel
   * @returns {Object|null} Paramètres extraits ou null
   */
  matchRoute(routePath, currentPath) {
    const routeParts = routePath.split('/');
    const currentParts = currentPath.split('/');

    if (routeParts.length !== currentParts.length) {
      return null;
    }

    const params = {};
    const isMatch = routeParts.every((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        params[paramName] = currentParts[index];
        return true;
      }
      return part === currentParts[index];
    });

    return isMatch ? { params } : null;
  }

  /**
   * Mise à jour de la navigation active
   */
  updateActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkRoute = link.getAttribute('data-route') || link.getAttribute('href');
      if (linkRoute === this.currentRoute || 
          (this.currentRoute.startsWith('/boats') && linkRoute === '/boats') ||
          (this.currentRoute === '/' && linkRoute === '#home')) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Affichage de la page 404
   */
  show404() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="page-404">
          <div class="container">
            <div class="error-content">
              <div class="error-icon">🌊</div>
              <h1>404</h1>
              <h2>Page non trouvée</h2>
              <p>Cette page semble avoir dérivé vers d'autres eaux...</p>
              <a href="/" data-route="/" class="btn-primary">Retour à l'accueil</a>
            </div>
          </div>
        </div>
      `;
    }
  }
}