/**
 * Page de détail d'un bateau
 */
export class BoatDetailPage {
  constructor(app) {
    this.app = app;
    this.boat = null;
  }

  /**
   * Rendu de la page de détail
   */
  async render({ params }) {
    const boatId = params.id;
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="boat-detail-page">
        <div id="boat-loading" class="loading-spinner">
          <div class="spinner"></div>
          <p>Chargement du bateau...</p>
        </div>
        
        <div id="boat-content" style="display: none;">
          <!-- Le contenu sera chargé ici -->
        </div>
      </div>
    `;

    await this.loadBoat(boatId);
    return this;
  }

  /**
   * Chargement des détails du bateau
   */
  async loadBoat(boatId) {
    try {
      const response = await this.app.boatService.getBoatById(boatId);
      
      if (response.success) {
        this.boat = response.data.boat;
        this.renderBoatDetails();
      } else {
        this.showError('Bateau non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du bateau:', error);
      this.showError('Erreur lors du chargement du bateau');
    } finally {
      document.getElementById('boat-loading').style.display = 'none';
    }
  }

  /**
   * Rendu des détails du bateau
   */
  renderBoatDetails() {
    const boatContent = document.getElementById('boat-content');
    const boat = this.boat;
    
    boatContent.innerHTML = `
      <!-- Navigation breadcrumb -->
      <div class="breadcrumb">
        <div class="container">
          <a href="/" data-route="/">Accueil</a>
          <span class="separator">›</span>
          <a href="/boats" data-route="/boats">Bateaux</a>
          <span class="separator">›</span>
          <span class="current">${boat.name}</span>
        </div>
      </div>

      <!-- Galerie d'images -->
      <div class="boat-gallery">
        <div class="container">
          <div class="gallery-main">
            <img id="main-image" src="${boat.mainImage || boat.images?.[0]?.url}" alt="${boat.name}">
          </div>
          ${boat.images?.length > 1 ? `
            <div class="gallery-thumbnails">
              ${boat.images.map((img, index) => `
                <img src="${img.url}" alt="${img.caption || boat.name}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     onclick="this.changeMainImage('${img.url}', this)">
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Informations principales -->
      <div class="boat-info-section">
        <div class="container">
          <div class="boat-info-grid">
            <div class="boat-main-info">
              <div class="boat-header">
                <div class="boat-title">
                  <h1>${boat.name}</h1>
                  <div class="boat-meta">
                    <span class="boat-type">${this.formatBoatType(boat.type)}</span>
                    <span class="boat-category">${boat.category}</span>
                  </div>
                </div>
                <div class="boat-rating-large">
                  <div class="stars">${this.renderStars(boat.rating?.average || 0)}</div>
                  <span class="rating-text">${boat.rating?.average?.toFixed(1) || '0.0'} (${boat.rating?.totalReviews || 0} avis)</span>
                </div>
              </div>

              <div class="boat-location-info">
                <h3>📍 Localisation</h3>
                <p>${boat.location.marina}, ${boat.location.city}, ${boat.location.country}</p>
              </div>

              <div class="boat-description">
                <h3>Description</h3>
                <p>${boat.description}</p>
              </div>

              <div class="boat-specs-section">
                <h3>Spécifications</h3>
                <div class="specs-grid">
                  <div class="spec-item">
                    <span class="spec-label">Longueur</span>
                    <span class="spec-value">${boat.specifications.length}m</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Largeur</span>
                    <span class="spec-value">${boat.specifications.width}m</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Capacité</span>
                    <span class="spec-value">${boat.capacity.maxPeople} personnes</span>
                  </div>
                  ${boat.capacity.cabins ? `
                    <div class="spec-item">
                      <span class="spec-label">Cabines</span>
                      <span class="spec-value">${boat.capacity.cabins}</span>
                    </div>
                  ` : ''}
                  ${boat.capacity.berths ? `
                    <div class="spec-item">
                      <span class="spec-label">Couchages</span>
                      <span class="spec-value">${boat.capacity.berths}</span>
                    </div>
                  ` : ''}
                  ${boat.capacity.bathrooms ? `
                    <div class="spec-item">
                      <span class="spec-label">Salles de bain</span>
                      <span class="spec-value">${boat.capacity.bathrooms}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="boat-equipment">
                <h3>Équipements</h3>
                <div class="equipment-categories">
                  <div class="equipment-category">
                    <h4>🧭 Navigation</h4>
                    <ul>
                      ${boat.equipment.navigation.gps ? '<li>GPS</li>' : ''}
                      ${boat.equipment.navigation.autopilot ? '<li>Pilote automatique</li>' : ''}
                      ${boat.equipment.navigation.radar ? '<li>Radar</li>' : ''}
                      ${boat.equipment.navigation.chartPlotter ? '<li>Traceur de cartes</li>' : ''}
                      ${boat.equipment.navigation.compass ? '<li>Compas</li>' : ''}
                    </ul>
                  </div>
                  <div class="equipment-category">
                    <h4>🛡️ Sécurité</h4>
                    <ul>
                      ${boat.equipment.safety.lifeJackets ? '<li>Gilets de sauvetage</li>' : ''}
                      ${boat.equipment.safety.lifeRaft ? '<li>Radeau de survie</li>' : ''}
                      ${boat.equipment.safety.fireExtinguisher ? '<li>Extincteur</li>' : ''}
                      ${boat.equipment.safety.firstAidKit ? '<li>Trousse de secours</li>' : ''}
                      ${boat.equipment.safety.flares ? '<li>Fusées de détresse</li>' : ''}
                    </ul>
                  </div>
                  <div class="equipment-category">
                    <h4>🏠 Confort</h4>
                    <ul>
                      ${boat.equipment.comfort.airConditioning ? '<li>Climatisation</li>' : ''}
                      ${boat.equipment.comfort.heating ? '<li>Chauffage</li>' : ''}
                      ${boat.equipment.comfort.wifi ? '<li>WiFi</li>' : ''}
                      ${boat.equipment.comfort.tv ? '<li>Télévision</li>' : ''}
                      ${boat.equipment.comfort.stereo ? '<li>Chaîne stéréo</li>' : ''}
                      ${boat.equipment.comfort.refrigerator ? '<li>Réfrigérateur</li>' : ''}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="boat-booking-sidebar">
              <div class="pricing-card">
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
                  <div class="price-detail">
                    <span>Caution</span>
                    <span>${boat.pricing.securityDeposit}€</span>
                  </div>
                  ${boat.pricing.cleaningFee > 0 ? `
                    <div class="price-detail">
                      <span>Frais de nettoyage</span>
                      <span>${boat.pricing.cleaningFee}€</span>
                    </div>
                  ` : ''}
                </div>

                <div class="booking-form">
                  <div class="form-group">
                    <label>Date de début</label>
                    <input type="date" id="booking-start-date">
                  </div>
                  <div class="form-group">
                    <label>Date de fin</label>
                    <input type="date" id="booking-end-date">
                  </div>
                  <div class="form-group">
                    <label>Nombre de personnes</label>
                    <select id="booking-guests">
                      ${Array.from({length: boat.capacity.maxPeople}, (_, i) => 
                        `<option value="${i + 1}">${i + 1} personne${i > 0 ? 's' : ''}</option>`
                      ).join('')}
                    </select>
                  </div>
                  
                  <div id="booking-total" class="booking-total" style="display: none;">
                    <div class="total-breakdown">
                      <div class="total-line">
                        <span>Sous-total</span>
                        <span id="subtotal">0€</span>
                      </div>
                      <div class="total-line">
                        <span>Frais de nettoyage</span>
                        <span>${boat.pricing.cleaningFee}€</span>
                      </div>
                      <div class="total-line total">
                        <span>Total</span>
                        <span id="total-amount">0€</span>
                      </div>
                    </div>
                  </div>

                  ${this.app.currentUser ? `
                    <button id="book-now-btn" class="btn-primary btn-full btn-large">
                      Réserver maintenant
                    </button>
                  ` : `
                    <button class="btn-primary btn-full btn-large" onclick="app.uiManager.showModal('login-modal')">
                      Connectez-vous pour réserver
                    </button>
                  `}
                </div>
              </div>

              <div class="owner-info">
                <h4>Propriétaire</h4>
                <div class="owner-card">
                  <div class="owner-avatar">
                    ${boat.owner.firstName[0]}${boat.owner.lastName[0]}
                  </div>
                  <div class="owner-details">
                    <div class="owner-name">${boat.owner.firstName} ${boat.owner.lastName}</div>
                    ${boat.owner.rating ? `
                      <div class="owner-rating">
                        ${this.renderStars(boat.owner.rating.average || 0)}
                        <span>(${boat.owner.rating.totalReviews || 0} avis)</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    boatContent.style.display = 'block';
    this.initEvents();
  }

  /**
   * Initialisation des événements
   */
  initEvents() {
    // Changement d'image principale
    window.changeMainImage = (imageUrl, thumbnail) => {
      const mainImage = document.getElementById('main-image');
      if (mainImage) {
        mainImage.src = imageUrl;
      }
      
      // Mettre à jour les thumbnails actifs
      document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
      });
      thumbnail.classList.add('active');
    };

    // Calcul du prix en temps réel
    const startDateInput = document.getElementById('booking-start-date');
    const endDateInput = document.getElementById('booking-end-date');
    
    if (startDateInput && endDateInput) {
      // Dates par défaut
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);
      
      startDateInput.value = tomorrow.toISOString().split('T')[0];
      endDateInput.value = nextWeek.toISOString().split('T')[0];
      
      // Écouteurs pour le calcul du prix
      startDateInput.addEventListener('change', () => this.calculatePrice());
      endDateInput.addEventListener('change', () => this.calculatePrice());
      
      // Calcul initial
      this.calculatePrice();
    }

    // Bouton de réservation
    const bookNowBtn = document.getElementById('book-now-btn');
    if (bookNowBtn) {
      bookNowBtn.addEventListener('click', () => this.handleBooking());
    }
  }

  /**
   * Calcul du prix total
   */
  calculatePrice() {
    const startDate = document.getElementById('booking-start-date').value;
    const endDate = document.getElementById('booking-end-date').value;
    
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) return;
    
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const dailyRate = this.boat.pricing.dailyRate;
    const cleaningFee = this.boat.pricing.cleaningFee || 0;
    
    const subtotal = days * dailyRate;
    const total = subtotal + cleaningFee;
    
    // Afficher le total
    const bookingTotal = document.getElementById('booking-total');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total-amount');
    
    if (bookingTotal && subtotalElement && totalElement) {
      bookingTotal.style.display = 'block';
      subtotalElement.textContent = `${subtotal}€`;
      totalElement.textContent = `${total}€`;
    }
  }

  /**
   * Gestion de la réservation
   */
  handleBooking() {
    const startDate = document.getElementById('booking-start-date').value;
    const endDate = document.getElementById('booking-end-date').value;
    const guests = document.getElementById('booking-guests').value;
    
    if (!startDate || !endDate) {
      this.app.uiManager.showNotification('Veuillez sélectionner les dates', 'warning');
      return;
    }
    
    // Stocker les données de réservation
    const bookingData = {
      boatId: this.boat._id,
      startDate,
      endDate,
      guests: parseInt(guests)
    };
    
    localStorage.setItem('booking_data', JSON.stringify(bookingData));
    
    // Rediriger vers la page de réservation (à créer)
    this.app.uiManager.showNotification('Fonctionnalité de réservation en cours de développement', 'info');
  }

  /**
   * Affichage d'une erreur
   */
  showError(message) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="error-page">
        <div class="container">
          <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h2>${message}</h2>
            <p>Impossible de charger les détails de ce bateau.</p>
            <a href="/boats" data-route="/boats" class="btn-primary">Retour aux bateaux</a>
          </div>
        </div>
      </div>
    `;
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
    // Nettoyer les variables globales
    if (window.changeMainImage) {
      delete window.changeMainImage;
    }
  }
}