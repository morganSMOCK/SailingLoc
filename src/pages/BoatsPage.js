/**
 * Page de listing des bateaux
 */
export class BoatsPage {
  constructor(app) {
    this.app = app;
    this.currentPage = 1;
    this.boatsPerPage = 12;
    this.currentFilters = {};
    this.boats = [];
  }

  /**
   * Rendu de la page des bateaux
   */
  render() {
    return `
      <div class="boats-page">
        <div class="page-header">
          <div class="container">
            <h1 class="page-title">Notre Flotte</h1>
            <p class="page-subtitle">Découvrez nos bateaux exceptionnels pour tous vos besoins</p>
          </div>
        </div>
        
        <div class="container">
          <!-- Filtres -->
          <div class="filters-container">
            <div class="filters">
              <select id="filter-type" class="filter-select">
                <option value="">Type de bateau</option>
                <option value="voilier">Voilier</option>
                <option value="catamaran">Catamaran</option>
                <option value="yacht">Yacht</option>
                <option value="bateau_moteur">Bateau à moteur</option>
                <option value="semi_rigide">Semi-rigide</option>
              </select>
              
              <select id="filter-city" class="filter-select">
                <option value="">Ville</option>
                <option value="Cannes">Cannes</option>
                <option value="Nice">Nice</option>
                <option value="Saint-Tropez">Saint-Tropez</option>
                <option value="Monaco">Monaco</option>
                <option value="Antibes">Antibes</option>
              </select>
              
              <div class="filter-range">
                <label>Prix max: <span id="price-display">1000€</span></label>
                <input type="range" id="filter-price" min="100" max="2000" value="1000" step="50">
              </div>
              
              <select id="filter-capacity" class="filter-select">
                <option value="">Capacité</option>
                <option value="2">2+ personnes</option>
                <option value="4">4+ personnes</option>
                <option value="6">6+ personnes</option>
                <option value="8">8+ personnes</option>
                <option value="10">10+ personnes</option>
              </select>
              
              <select id="filter-sort" class="filter-select">
                <option value="createdAt">Plus récents</option>
                <option value="pricing.dailyRate">Prix croissant</option>
                <option value="-pricing.dailyRate">Prix décroissant</option>
                <option value="-rating.average">Mieux notés</option>
              </select>
              
              <button id="apply-filters" class="btn-primary">Appliquer</button>
              <button id="reset-filters" class="btn-secondary">Réinitialiser</button>
            </div>
          </div>
          
          <!-- Résultats -->
          <div class="results-header">
            <div id="results-count" class="results-count">
              Chargement...
            </div>
          </div>
          
          <!-- Loading -->
          <div id="boats-loading" class="loading-spinner" style="display: none;">
            <div class="spinner"></div>
            <p>Chargement des bateaux...</p>
          </div>
          
          <!-- Grille des bateaux -->
          <div id="boats-grid" class="boats-grid">
            <!-- Les bateaux seront chargés ici -->
          </div>
          
          <!-- Pagination -->
          <div id="boats-pagination" class="pagination" style="display: none;">
            <button id="prev-page" class="btn-page">Précédent</button>
            <div id="page-numbers" class="page-numbers"></div>
            <button id="next-page" class="btn-page">Suivant</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialisation des événements de la page
   */
  async initEvents() {
    // Filtres
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const priceFilter = document.getElementById('filter-price');
    const priceDisplay = document.getElementById('price-display');
    
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    }
    
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }
    
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

    // Charger les bateaux avec les paramètres URL
    await this.loadBoatsFromURL();
  }

  /**
   * Chargement des bateaux depuis les paramètres URL
   */
  async loadBoatsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {};
    
    // Récupérer les filtres depuis l'URL
    if (urlParams.get('search')) filters.search = urlParams.get('search');
    if (urlParams.get('type')) filters.type = urlParams.get('type');
    if (urlParams.get('city')) filters.city = urlParams.get('city');
    if (urlParams.get('minCapacity')) filters.minCapacity = urlParams.get('minCapacity');
    if (urlParams.get('maxPrice')) filters.maxPrice = urlParams.get('maxPrice');
    
    // Appliquer les filtres dans l'interface
    this.applyFiltersToUI(filters);
    
    // Charger les bateaux
    await this.loadBoats(filters);
  }

  /**
   * Application des filtres dans l'interface
   */
  applyFiltersToUI(filters) {
    if (filters.type) {
      const typeSelect = document.getElementById('filter-type');
      if (typeSelect) typeSelect.value = filters.type;
    }
    
    if (filters.city) {
      const citySelect = document.getElementById('filter-city');
      if (citySelect) citySelect.value = filters.city;
    }
    
    if (filters.minCapacity) {
      const capacitySelect = document.getElementById('filter-capacity');
      if (capacitySelect) capacitySelect.value = filters.minCapacity;
    }
    
    if (filters.maxPrice) {
      const priceFilter = document.getElementById('filter-price');
      const priceDisplay = document.getElementById('price-display');
      if (priceFilter) {
        priceFilter.value = filters.maxPrice;
        if (priceDisplay) priceDisplay.textContent = `${filters.maxPrice}€`;
      }
    }
  }

  /**
   * Chargement des bateaux
   */
  async loadBoats(filters = {}, page = 1) {
    try {
      const boatsGrid = document.getElementById('boats-grid');
      const boatsLoading = document.getElementById('boats-loading');
      const resultsCount = document.getElementById('results-count');
      
      if (boatsLoading) boatsLoading.style.display = 'block';
      if (boatsGrid) boatsGrid.innerHTML = '';
      
      const queryParams = {
        page,
        limit: this.boatsPerPage,
        ...filters
      };
      
      const response = await this.app.boatService.getBoats(queryParams);
      
      if (response.success) {
        this.boats = response.data.boats;
        this.renderBoats(response.data.boats);
        this.renderPagination(response.data.pagination);
        this.currentPage = page;
        this.currentFilters = filters;
        
        // Mettre à jour le compteur de résultats
        if (resultsCount) {
          const total = response.data.pagination.total;
          resultsCount.textContent = `${total} bateau${total > 1 ? 'x' : ''} trouvé${total > 1 ? 's' : ''}`;
        }
      } else {
        this.app.uiManager.showNotification('Erreur lors du chargement des bateaux', 'error');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des bateaux:', error);
      this.app.uiManager.showNotification('Erreur lors du chargement des bateaux', 'error');
      
      const boatsGrid = document.getElementById('boats-grid');
      if (boatsGrid) {
        boatsGrid.innerHTML = `
          <div class="no-results">
            <h3>Erreur de chargement</h3>
            <p>Impossible de charger les bateaux. Veuillez réessayer.</p>
            <button class="btn-primary" onclick="window.location.reload()">Réessayer</button>
          </div>
        `;
      }
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
    
    if (boats.length === 0) {
      boatsGrid.innerHTML = `
        <div class="no-results">
          <h3>Aucun bateau trouvé</h3>
          <p>Essayez de modifier vos critères de recherche</p>
          <button class="btn-primary" onclick="document.getElementById('reset-filters').click()">
            Réinitialiser les filtres
          </button>
        </div>
      `;
      return;
    }
    
    boatsGrid.innerHTML = boats.map(boat => this.createBoatCard(boat)).join('');
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
          <button class="favorite-btn" data-boat-id="${boat._id}">
            <span class="heart">🤍</span>
          </button>
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
   * Application des filtres
   */
  async applyFilters() {
    const filters = {};
    
    const type = document.getElementById('filter-type').value;
    const city = document.getElementById('filter-city').value;
    const price = document.getElementById('filter-price').value;
    const capacity = document.getElementById('filter-capacity').value;
    const sort = document.getElementById('filter-sort').value;
    
    if (type) filters.type = type;
    if (city) filters.city = city;
    if (price) filters.maxPrice = price;
    if (capacity) filters.minCapacity = capacity;
    if (sort) filters.sortBy = sort;
    
    // Mettre à jour l'URL avec les filtres
    const searchParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) searchParams.set(key, filters[key]);
    });
    
    const newUrl = searchParams.toString() ? `/boats?${searchParams.toString()}` : '/boats';
    history.pushState({}, '', newUrl);
    
    await this.loadBoats(filters, 1);
  }

  /**
   * Réinitialisation des filtres
   */
  async resetFilters() {
    // Réinitialiser les champs
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-city').value = '';
    document.getElementById('filter-price').value = '1000';
    document.getElementById('filter-capacity').value = '';
    document.getElementById('filter-sort').value = 'createdAt';
    document.getElementById('price-display').textContent = '1000€';
    
    // Mettre à jour l'URL
    history.pushState({}, '', '/boats');
    
    await this.loadBoats({}, 1);
  }

  /**
   * Changement de page
   */
  async changePage(page) {
    if (page < 1) return;
    
    await this.loadBoats(this.currentFilters, page);
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
}