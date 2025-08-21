/**
 * Page d'accueil de SailingLoc
 */
export class HomePage {
  constructor(app) {
    this.app = app;
  }

  /**
   * Rendu de la page d'accueil
   */
  render() {
    return `
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            Naviguez vers vos <span class="gradient-text">rêves</span>
          </h1>
          <p class="hero-subtitle">
            Découvrez notre flotte exceptionnelle de bateaux et vivez des aventures inoubliables sur les plus belles eaux d'Europe
          </p>
          
          <!-- Barre de recherche -->
          <div class="search-bar">
            <div class="search-field">
              <label>Destination</label>
              <input type="text" id="search-location" placeholder="Où souhaitez-vous naviguer ?">
            </div>
            <div class="search-field">
              <label>Départ</label>
              <input type="date" id="search-start-date">
            </div>
            <div class="search-field">
              <label>Retour</label>
              <input type="date" id="search-end-date">
            </div>
            <div class="search-field">
              <label>Passagers</label>
              <select id="search-guests">
                <option value="">Nombre</option>
                <option value="2">2 personnes</option>
                <option value="4">4 personnes</option>
                <option value="6">6 personnes</option>
                <option value="8">8 personnes</option>
                <option value="10">10+ personnes</option>
              </select>
            </div>
            <button id="search-btn" class="btn-primary search-btn">
              <span>🔍</span>
              Rechercher
            </button>
          </div>
        </div>
      </section>

      <!-- Section Services -->
      <section class="services-section">
        <div class="container">
          <div class="section-header">
            <h2>Nos Services</h2>
            <p>Une expérience complète pour votre location de bateau</p>
          </div>
          
          <div class="services-grid">
            <div class="service-card">
              <div class="service-icon">🛥️</div>
              <h3>Flotte Premium</h3>
              <p>Bateaux récents et parfaitement entretenus, inspectés régulièrement pour votre sécurité</p>
            </div>
            
            <div class="service-card">
              <div class="service-icon">👨‍✈️</div>
              <h3>Capitaines Expérimentés</h3>
              <p>Équipage professionnel disponible pour vous accompagner dans vos navigations</p>
            </div>
            
            <div class="service-card">
              <div class="service-icon">🏝️</div>
              <h3>Destinations Exclusives</h3>
              <p>Accès à des mouillages privés et des destinations secrètes</p>
            </div>
            
            <div class="service-card">
              <div class="service-icon">🔧</div>
              <h3>Support 24/7</h3>
              <p>Assistance technique et support client disponibles à tout moment</p>
            </div>
          </div>
          
          <div class="cta-section">
            <h3>Prêt à naviguer ?</h3>
            <p>Découvrez notre flotte exceptionnelle</p>
            <a href="/boats" data-route="/boats" class="btn-primary btn-large">
              Voir tous les bateaux
            </a>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Initialisation des événements de la page
   */
  initEvents() {
    // Bouton de recherche
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // Dates par défaut
    this.setDefaultDates();
  }

  /**
   * Configuration des dates par défaut
   */
  setDefaultDates() {
    const startDateInput = document.getElementById('search-start-date');
    const endDateInput = document.getElementById('search-end-date');
    
    if (startDateInput && endDateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);
      
      startDateInput.value = tomorrow.toISOString().split('T')[0];
      endDateInput.value = nextWeek.toISOString().split('T')[0];
    }
  }

  /**
   * Gestion de la recherche
   */
  handleSearch() {
    const location = document.getElementById('search-location').value;
    const startDate = document.getElementById('search-start-date').value;
    const endDate = document.getElementById('search-end-date').value;
    const guests = document.getElementById('search-guests').value;
    
    // Construire les paramètres de recherche
    const searchParams = new URLSearchParams();
    if (location) searchParams.set('search', location);
    if (guests) searchParams.set('minCapacity', guests);
    if (startDate) searchParams.set('startDate', startDate);
    if (endDate) searchParams.set('endDate', endDate);
    
    // Naviguer vers la page des bateaux avec les paramètres
    const queryString = searchParams.toString();
    const url = queryString ? `/boats?${queryString}` : '/boats';
    
    this.app.router.navigate(url);
  }
}