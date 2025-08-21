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
  async render() {
    console.log('HomePage: Starting render');
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) {
      console.error('HomePage: main-content element not found');
      return this;
    }
    
    mainContent.innerHTML = `
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

      <!-- Section Bateaux populaires -->
      <section id="boats" class="featured-boats-section">
        <div class="container">
          <div class="section-header">
            <h2>Bateaux Populaires</h2>
            <p>Découvrez nos bateaux les plus appréciés</p>
          </div>
          
          <div id="featured-boats-grid" class="boats-grid">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Chargement des bateaux...</p>
            </div>
          </div>
          
          <div class="cta-section">
            <a href="/boats" data-route="/boats" class="btn-primary btn-large">
              Voir tous les bateaux
            </a>
          </div>
        </div>
      </section>

      <!-- Section Services -->
      <section id="services" class="services-section">
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
        </div>
      </section>

      <!-- Section Contact -->
      <section id="contact" class="contact-section">
        <div class="container">
          <div class="section-header">
            <h2>Contactez-nous</h2>
            <p>Une question ? Besoin d'aide ? Notre équipe est là pour vous</p>
          </div>
          
          <div class="contact-content">
            <div class="contact-info">
              <div class="contact-item">
                <div class="contact-icon">📍</div>
                <div>
                  <h4>Adresse</h4>
                  <p>Port de Plaisance<br>06400 Cannes, France</p>
                </div>
              </div>
              
              <div class="contact-item">
                <div class="contact-icon">📞</div>
                <div>
                  <h4>Téléphone</h4>
                  <p>+33 4 93 99 99 99</p>
                </div>
              </div>
              
              <div class="contact-item">
                <div class="contact-icon">✉️</div>
                <div>
                  <h4>Email</h4>
                  <p>contact@sailingloc.com</p>
                </div>
              </div>
            </div>
            
            <form id="contact-form" class="contact-form">
              <div class="form-group">
                <input type="text" id="contact-name" placeholder="Votre nom" required>
              </div>
              <div class="form-group">
                <input type="email" id="contact-email" placeholder="Votre email" required>
              </div>
              <div class="form-group">
                <textarea id="contact-message" placeholder="Votre message" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn-primary btn-full">Envoyer le message</button>
            </form>
          </div>
        </div>
      </section>
    `;

    console.log('HomePage: HTML rendered, initializing events');
    await this.initEvents();
    console.log('HomePage: Events initialized');
    return this;
  }

  /**
   * Initialisation des événements de la page
   */
  async initEvents() {
    // Bouton de recherche
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // Formulaire de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
    }

    // Dates par défaut
    this.setDefaultDates();

    // Charger les bateaux populaires
    await this.loadFeaturedBoats();
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
   * Chargement des bateaux populaires
   */
  async loadFeaturedBoats() {
    try {
      const response = await this.app.boatService.getBoats({ 
        limit: 3, 
        sortBy: '-rating.average' 
      });
      
      if (response.success && response.data.boats.length > 0) {
        this.renderFeaturedBoats(response.data.boats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bateaux populaires:', error);
      const grid = document.getElementById('featured-boats-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="no-results">
            <p>Impossible de charger les bateaux populaires</p>
          </div>
        `;
      }
    }
  }

  /**
   * Rendu des bateaux populaires
   */
  renderFeaturedBoats(boats) {
    const grid = document.getElementById('featured-boats-grid');
    if (!grid) return;

    grid.innerHTML = boats.map(boat => this.createBoatCard(boat)).join('');
  }

  /**
   * Création d'une carte de bateau
   */
  createBoatCard(boat) {
    const mainImage = boat.mainImage || boat.images?.[0]?.url || 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop';
    
    return `
      <div class="boat-card" data-boat-id="${boat._id}">
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
          <button class="btn-primary btn-full boat-details-btn" onclick="app.router.navigate('/boat/${boat._id}')">
            Voir les détails
          </button>
        </div>
      </div>
    `;
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

  /**
   * Gestion du formulaire de contact
   */
  async handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    
    try {
      this.app.uiManager.showLoading('contact-form');
      
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.app.uiManager.showNotification('Message envoyé avec succès !', 'success');
      document.getElementById('contact-form').reset();
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.app.uiManager.showNotification('Erreur lors de l\'envoi du message', 'error');
    } finally {
      this.app.uiManager.hideLoading('contact-form');
    }
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
    
    for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
    }
    
    if (hasHalfStar) {
      stars += '⭐';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars += '☆';
    }
    
    return stars;
  }

  /**
   * Nettoyage de la page
   */
  cleanup() {
    // Nettoyer les écouteurs d'événements si nécessaire
  }
}