/**
 * Routeur simple pour l'application SailingLoc
 * Gère la navigation entre les différentes pages
 */
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
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
      if (e.target.matches('a[data-route]') || e.target.closest('a[data-route]')) {
        e.preventDefault();
        const link = e.target.matches('a[data-route]') ? e.target : e.target.closest('a[data-route]');
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
  handleRoute() {
    const path = window.location.pathname;
    this.currentRoute = path;

    // Trouver la route correspondante
    let handler = this.routes.get(path);
    
    // Route par défaut si aucune correspondance
    if (!handler) {
      // Vérifier les routes avec paramètres
      for (const [routePath, routeHandler] of this.routes) {
        if (this.matchRoute(routePath, path)) {
          handler = routeHandler;
          break;
        }
      }
    }

    if (handler) {
      handler(this.extractParams(path));
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
   * @returns {boolean} True si correspondance
   */
  matchRoute(routePath, currentPath) {
    const routeParts = routePath.split('/');
    const currentParts = currentPath.split('/');

    if (routeParts.length !== currentParts.length) {
      return false;
    }

    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === currentParts[index];
    });
  }

  /**
   * Extraction des paramètres de l'URL
   * @param {string} path - Chemin actuel
   * @returns {Object} Paramètres extraits
   */
  extractParams(path) {
    const params = {};
    const pathParts = path.split('/');

    // Trouver la route correspondante pour extraire les paramètres
    for (const [routePath] of this.routes) {
      const routeParts = routePath.split('/');
      
      if (this.matchRoute(routePath, path)) {
        routeParts.forEach((part, index) => {
          if (part.startsWith(':')) {
            const paramName = part.substring(1);
            params[paramName] = pathParts[index];
          }
        });
        break;
      }
    }

    return params;
  }

  /**
   * Mise à jour de la navigation active
   */
  updateActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === this.currentRoute) {
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
              <h1>404</h1>
              <h2>Page non trouvée</h2>
              <p>La page que vous recherchez n'existe pas.</p>
              <a href="/" data-route="/" class="btn-primary">Retour à l'accueil</a>
            </div>
          </div>
        </div>
      `;
    }
  }
}