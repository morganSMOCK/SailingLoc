/**
 * Service de gestion des bateaux
 * Gère toutes les opérations CRUD liées aux bateaux
 */
export class BoatService {
  constructor() {
    // URL de base de l'API
    this.baseURL = '/api';
    this.boatsEndpoint = `${this.baseURL}/boats`;
  }

  /**
   * Récupération de tous les bateaux avec filtres et pagination
   * @param {Object} params - Paramètres de recherche et filtres
   * @returns {Promise<Object>} Liste des bateaux avec pagination
   */
  async getBoats(params = {}) {
    try {
      // Construction de l'URL avec les paramètres de requête
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `${this.boatsEndpoint}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des bateaux');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bateaux:', error);
      throw error;
    }
  }

  /**
   * Récupération d'un bateau par son ID
   * @param {string} boatId - ID du bateau
   * @returns {Promise<Object>} Détails du bateau
   */
  async getBoatById(boatId) {
    try {
      const response = await fetch(`${this.boatsEndpoint}/${boatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération du bateau');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du bateau:', error);
      throw error;
    }
  }

  /**
   * Création d'un nouveau bateau (propriétaires uniquement)
   * @param {Object} boatData - Données du bateau
   * @returns {Promise<Object>} Bateau créé
   */
  async createBoat(boatData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(this.boatsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(boatData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du bateau');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du bateau:', error);
      throw error;
    }
  }

  /**
   * Mise à jour d'un bateau
   * @param {string} boatId - ID du bateau
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Bateau mis à jour
   */
  async updateBoat(boatId, updateData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.boatsEndpoint}/${boatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du bateau');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bateau:', error);
      throw error;
    }
  }

  /**
   * Suppression d'un bateau
   * @param {string} boatId - ID du bateau
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteBoat(boatId) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.boatsEndpoint}/${boatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression du bateau');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression du bateau:', error);
      throw error;
    }
  }

  /**
   * Récupération des bateaux d'un propriétaire
   * @param {Object} params - Paramètres de pagination
   * @returns {Promise<Object>} Bateaux du propriétaire
   */
  async getOwnerBoats(params = {}) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const queryParams = new URLSearchParams(params);
      const url = `${this.boatsEndpoint}/owner/my-boats?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des bateaux');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bateaux du propriétaire:', error);
      throw error;
    }
  }

  /**
   * Vérification de la disponibilité d'un bateau
   * @param {string} boatId - ID du bateau
   * @param {string} startDate - Date de début (YYYY-MM-DD)
   * @param {string} endDate - Date de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Disponibilité et tarification
   */
  async checkAvailability(boatId, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(`${this.boatsEndpoint}/${boatId}/availability?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification de disponibilité');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      throw error;
    }
  }

  /**
   * Recherche de bateaux par proximité géographique
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} maxDistance - Distance maximale en mètres
   * @returns {Promise<Object>} Bateaux à proximité
   */
  async searchNearby(latitude, longitude, maxDistance = 50000) {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        maxDistance: maxDistance.toString()
      });

      const response = await fetch(`${this.boatsEndpoint}/search/nearby?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la recherche par proximité');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la recherche par proximité:', error);
      throw error;
    }
  }

  /**
   * Récupération des statistiques des bateaux
   * @returns {Promise<Object>} Statistiques
   */
  async getBoatStats() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.boatsEndpoint}/stats/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Upload d'images pour un bateau
   * @param {string} boatId - ID du bateau
   * @param {FileList} files - Fichiers images
   * @returns {Promise<Object>} URLs des images uploadées
   */
  async uploadBoatImages(boatId, files) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const formData = new FormData();
      
      // Ajouter chaque fichier au FormData
      Array.from(files).forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await fetch(`${this.boatsEndpoint}/${boatId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'upload des images');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      throw error;
    }
  }

  /**
   * Suppression d'une image de bateau
   * @param {string} boatId - ID du bateau
   * @param {string} imageId - ID de l'image
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteBoatImage(boatId, imageId) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${this.boatsEndpoint}/${boatId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression de l\'image');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      throw error;
    }
  }

  /**
   * Récupération des types de bateaux disponibles
   * @returns {Array} Liste des types de bateaux
   */
  getBoatTypes() {
    return [
      { value: 'voilier', label: 'Voilier' },
      { value: 'catamaran', label: 'Catamaran' },
      { value: 'yacht', label: 'Yacht' },
      { value: 'bateau_moteur', label: 'Bateau à moteur' },
      { value: 'semi_rigide', label: 'Semi-rigide' },
      { value: 'peniche', label: 'Péniche' }
    ];
  }

  /**
   * Récupération des catégories de bateaux
   * @returns {Array} Liste des catégories
   */
  getBoatCategories() {
    return [
      { value: 'luxe', label: 'Luxe' },
      { value: 'standard', label: 'Standard' },
      { value: 'economique', label: 'Économique' },
      { value: 'sportif', label: 'Sportif' },
      { value: 'familial', label: 'Familial' }
    ];
  }

  /**
   * Validation des données d'un bateau
   * @param {Object} boatData - Données du bateau à valider
   * @returns {Object} Résultat de la validation
   */
  validateBoatData(boatData) {
    const errors = [];

    // Validation des champs obligatoires
    if (!boatData.name || boatData.name.trim().length === 0) {
      errors.push('Le nom du bateau est obligatoire');
    }

    if (!boatData.description || boatData.description.trim().length === 0) {
      errors.push('La description est obligatoire');
    }

    if (!boatData.type) {
      errors.push('Le type de bateau est obligatoire');
    }

    if (!boatData.category) {
      errors.push('La catégorie est obligatoire');
    }

    // Validation des spécifications
    if (!boatData.specifications) {
      errors.push('Les spécifications sont obligatoires');
    } else {
      if (!boatData.specifications.length || boatData.specifications.length <= 0) {
        errors.push('La longueur doit être positive');
      }

      if (!boatData.specifications.width || boatData.specifications.width <= 0) {
        errors.push('La largeur doit être positive');
      }
    }

    // Validation de la capacité
    if (!boatData.capacity) {
      errors.push('La capacité est obligatoire');
    } else {
      if (!boatData.capacity.maxPeople || boatData.capacity.maxPeople <= 0) {
        errors.push('Le nombre maximum de personnes doit être positif');
      }
    }

    // Validation de la localisation
    if (!boatData.location) {
      errors.push('La localisation est obligatoire');
    } else {
      if (!boatData.location.marina || boatData.location.marina.trim().length === 0) {
        errors.push('Le port d\'attache est obligatoire');
      }

      if (!boatData.location.city || boatData.location.city.trim().length === 0) {
        errors.push('La ville est obligatoire');
      }
    }

    // Validation des tarifs
    if (!boatData.pricing) {
      errors.push('Les tarifs sont obligatoires');
    } else {
      if (!boatData.pricing.dailyRate || boatData.pricing.dailyRate <= 0) {
        errors.push('Le tarif journalier doit être positif');
      }

      if (!boatData.pricing.securityDeposit || boatData.pricing.securityDeposit < 0) {
        errors.push('La caution ne peut pas être négative');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Récupération du token d'authentification
   * @returns {string|null} Token d'authentification
   */
  getAuthToken() {
    try {
      return localStorage.getItem('sailingloc_token');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Formatage des données de bateau pour l'affichage
   * @param {Object} boat - Données du bateau
   * @returns {Object} Données formatées
   */
  formatBoatForDisplay(boat) {
    return {
      ...boat,
      formattedPrice: `${boat.pricing.dailyRate}€/jour`,
      formattedCapacity: `${boat.capacity.maxPeople} personnes`,
      formattedLength: `${boat.specifications.length}m`,
      formattedLocation: `${boat.location.city}, ${boat.location.country}`,
      mainImage: boat.images?.find(img => img.isMain)?.url || boat.images?.[0]?.url,
      rating: {
        ...boat.rating,
        formattedAverage: boat.rating?.average?.toFixed(1) || '0.0'
      }
    };
  }

  /**
   * Calcul du prix total pour une période donnée
   * @param {Object} boat - Données du bateau
   * @param {string} startDate - Date de début
   * @param {string} endDate - Date de fin
   * @returns {Object} Détail des prix
   */
  calculateTotalPrice(boat, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    let subtotal = 0;

    // Calcul basé sur la durée
    if (days >= 30 && boat.pricing.monthlyRate) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      subtotal = (months * boat.pricing.monthlyRate) + (remainingDays * boat.pricing.dailyRate);
    } else if (days >= 7 && boat.pricing.weeklyRate) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      subtotal = (weeks * boat.pricing.weeklyRate) + (remainingDays * boat.pricing.dailyRate);
    } else {
      subtotal = days * boat.pricing.dailyRate;
    }

    return {
      days,
      subtotal,
      cleaningFee: boat.pricing.cleaningFee || 0,
      securityDeposit: boat.pricing.securityDeposit,
      total: subtotal + (boat.pricing.cleaningFee || 0)
    };
  }
}