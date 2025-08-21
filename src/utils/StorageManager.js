/**
 * Gestionnaire de stockage local
 * Gère la persistance des données côté client (localStorage, sessionStorage)
 */
export class StorageManager {
  constructor() {
    // Préfixe pour éviter les conflits avec d'autres applications
    this.prefix = 'sailingloc_';
    
    // Vérification de la disponibilité du localStorage
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  /**
   * Vérification de la disponibilité du localStorage
   * @returns {boolean} True si le localStorage est disponible
   */
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('localStorage non disponible:', error);
      return false;
    }
  }

  /**
   * Sauvegarde du token d'authentification
   * @param {string} token - Token JWT
   * @returns {boolean} Succès de l'opération
   */
  setToken(token) {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.setItem(`${this.prefix}token`, token);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
      return false;
    }
  }

  /**
   * Récupération du token d'authentification
   * @returns {string|null} Token JWT ou null
   */
  getToken() {
    if (!this.isStorageAvailable) return null;
    
    try {
      return localStorage.getItem(`${this.prefix}token`);
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Suppression du token d'authentification
   * @returns {boolean} Succès de l'opération
   */
  removeToken() {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.removeItem(`${this.prefix}token`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  /**
   * Sauvegarde des données utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {boolean} Succès de l'opération
   */
  setUser(userData) {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.setItem(`${this.prefix}user`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
      return false;
    }
  }

  /**
   * Récupération des données utilisateur
   * @returns {Object|null} Données utilisateur ou null
   */
  getUser() {
    if (!this.isStorageAvailable) return null;
    
    try {
      const userData = localStorage.getItem(`${this.prefix}user`);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  /**
   * Suppression des données utilisateur
   * @returns {boolean} Succès de l'opération
   */
  removeUser() {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.removeItem(`${this.prefix}user`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données utilisateur:', error);
      return false;
    }
  }

  /**
   * Nettoyage complet des données d'authentification
   * @returns {boolean} Succès de l'opération
   */
  clearAuth() {
    const tokenRemoved = this.removeToken();
    const userRemoved = this.removeUser();
    return tokenRemoved && userRemoved;
  }

  /**
   * Sauvegarde des préférences de recherche
   * @param {Object} preferences - Préférences de recherche
   * @returns {boolean} Succès de l'opération
   */
  setSearchPreferences(preferences) {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.setItem(`${this.prefix}search_prefs`, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      return false;
    }
  }

  /**
   * Récupération des préférences de recherche
   * @returns {Object} Préférences de recherche
   */
  getSearchPreferences() {
    if (!this.isStorageAvailable) {
      return this.getDefaultSearchPreferences();
    }
    
    try {
      const prefs = localStorage.getItem(`${this.prefix}search_prefs`);
      return prefs ? JSON.parse(prefs) : this.getDefaultSearchPreferences();
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      return this.getDefaultSearchPreferences();
    }
  }

  /**
   * Préférences de recherche par défaut
   * @returns {Object} Préférences par défaut
   */
  getDefaultSearchPreferences() {
    return {
      location: '',
      type: 'all',
      maxPrice: 1000,
      minCapacity: 1,
      sortBy: 'price',
      sortOrder: 'asc'
    };
  }

  /**
   * Ajout d'un terme à l'historique de recherche
   * @param {string} searchTerm - Terme de recherche
   * @returns {boolean} Succès de l'opération
   */
  addToSearchHistory(searchTerm) {
    if (!this.isStorageAvailable || !searchTerm.trim()) return false;
    
    try {
      let history = this.getSearchHistory();
      
      // Supprimer le terme s'il existe déjà
      history = history.filter(term => term.toLowerCase() !== searchTerm.toLowerCase());
      
      // Ajouter le nouveau terme au début
      history.unshift(searchTerm.trim());
      
      // Limiter à 10 éléments
      history = history.slice(0, 10);
      
      localStorage.setItem(`${this.prefix}search_history`, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      return false;
    }
  }

  /**
   * Récupération de l'historique de recherche
   * @returns {Array} Historique de recherche
   */
  getSearchHistory() {
    if (!this.isStorageAvailable) return [];
    
    try {
      const history = localStorage.getItem(`${this.prefix}search_history`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  /**
   * Effacement de l'historique de recherche
   * @returns {boolean} Succès de l'opération
   */
  clearSearchHistory() {
    if (!this.isStorageAvailable) return false;
    
    try {
      localStorage.removeItem(`${this.prefix}search_history`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
      return false;
    }
  }

  /**
   * Ajout d'un bateau aux favoris
   * @param {string} boatId - ID du bateau
   * @returns {boolean} Succès de l'opération
   */
  addToFavorites(boatId) {
    if (!this.isStorageAvailable || !boatId) return false;
    
    try {
      let favorites = this.getFavorites();
      
      if (!favorites.includes(boatId)) {
        favorites.push(boatId);
        localStorage.setItem(`${this.prefix}favorites`, JSON.stringify(favorites));
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      return false;
    }
  }

  /**
   * Suppression d'un bateau des favoris
   * @param {string} boatId - ID du bateau
   * @returns {boolean} Succès de l'opération
   */
  removeFromFavorites(boatId) {
    if (!this.isStorageAvailable || !boatId) return false;
    
    try {
      let favorites = this.getFavorites();
      favorites = favorites.filter(id => id !== boatId);
      localStorage.setItem(`${this.prefix}favorites`, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      return false;
    }
  }

  /**
   * Récupération des favoris
   * @returns {Array} Liste des IDs des bateaux favoris
   */
  getFavorites() {
    if (!this.isStorageAvailable) return [];
    
    try {
      const favorites = localStorage.getItem(`${this.prefix}favorites`);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return [];
    }
  }

  /**
   * Vérification si un bateau est en favoris
   * @param {string} boatId - ID du bateau
   * @returns {boolean} True si le bateau est en favoris
   */
  isFavorite(boatId) {
    const favorites = this.getFavorites();
    return favorites.includes(boatId);
  }

  /**
   * Sauvegarde des paramètres de l'application
   * @param {Object} settings - Paramètres à sauvegarder
   * @returns {boolean} Succès de l'opération
   */
  setAppSettings(settings) {
    if (!this.isStorageAvailable) return false;
    
    try {
      const currentSettings = this.getAppSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(`${this.prefix}app_settings`, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  }

  /**
   * Récupération des paramètres de l'application
   * @returns {Object} Paramètres de l'application
   */
  getAppSettings() {
    if (!this.isStorageAvailable) {
      return this.getDefaultAppSettings();
    }
    
    try {
      const settings = localStorage.getItem(`${this.prefix}app_settings`);
      return settings ? JSON.parse(settings) : this.getDefaultAppSettings();
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return this.getDefaultAppSettings();
    }
  }

  /**
   * Paramètres par défaut de l'application
   * @returns {Object} Paramètres par défaut
   */
  getDefaultAppSettings() {
    return {
      theme: 'light',
      language: 'fr',
      currency: 'EUR',
      notifications: true,
      emailUpdates: true,
      autoSave: true
    };
  }

  /**
   * Sauvegarde temporaire de données de formulaire
   * @param {string} formName - Nom du formulaire
   * @param {Object} data - Données du formulaire
   * @returns {boolean} Succès de l'opération
   */
  setFormData(formName, data) {
    if (!this.isStorageAvailable || !formName) return false;
    
    try {
      localStorage.setItem(`${this.prefix}form_${formName}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du formulaire:', error);
      return false;
    }
  }

  /**
   * Récupération des données de formulaire temporaires
   * @param {string} formName - Nom du formulaire
   * @returns {Object|null} Données du formulaire ou null
   */
  getFormData(formName) {
    if (!this.isStorageAvailable || !formName) return null;
    
    try {
      const data = localStorage.getItem(`${this.prefix}form_${formName}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du formulaire:', error);
      return null;
    }
  }

  /**
   * Suppression des données de formulaire temporaires
   * @param {string} formName - Nom du formulaire
   * @returns {boolean} Succès de l'opération
   */
  removeFormData(formName) {
    if (!this.isStorageAvailable || !formName) return false;
    
    try {
      localStorage.removeItem(`${this.prefix}form_${formName}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du formulaire:', error);
      return false;
    }
  }

  /**
   * Nettoyage de toutes les données de l'application
   * @returns {boolean} Succès de l'opération
   */
  clearAllData() {
    if (!this.isStorageAvailable) return false;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      return false;
    }
  }

  /**
   * Calcul de la taille utilisée par l'application
   * @returns {Object} Taille en bytes, KB et MB
   */
  getStorageSize() {
    if (!this.isStorageAvailable) {
      return { bytes: 0, kb: 0, mb: 0 };
    }
    
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          totalSize += localStorage.getItem(key).length;
        }
      });
      
      return {
        bytes: totalSize,
        kb: Math.round(totalSize / 1024 * 100) / 100,
        mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la taille:', error);
      return { bytes: 0, kb: 0, mb: 0 };
    }
  }

  /**
   * Sauvegarde avec expiration
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker
   * @param {number} ttl - Durée de vie en millisecondes
   * @returns {boolean} Succès de l'opération
   */
  setWithExpiry(key, value, ttl) {
    if (!this.isStorageAvailable) return false;
    
    try {
      const now = new Date();
      const item = {
        value: value,
        expiry: now.getTime() + ttl
      };
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde avec expiration:', error);
      return false;
    }
  }

  /**
   * Récupération avec vérification d'expiration
   * @param {string} key - Clé de stockage
   * @returns {*|null} Valeur stockée ou null si expirée
   */
  getWithExpiry(key) {
    if (!this.isStorageAvailable) return null;
    
    try {
      const itemStr = localStorage.getItem(`${this.prefix}${key}`);
      
      if (!itemStr) {
        return null;
      }
      
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error('Erreur lors de la récupération avec expiration:', error);
      return null;
    }
  }

  /**
   * Sauvegarde dans sessionStorage (données temporaires de session)
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker
   * @returns {boolean} Succès de l'opération
   */
  setSessionData(key, value) {
    try {
      sessionStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en session:', error);
      return false;
    }
  }

  /**
   * Récupération depuis sessionStorage
   * @param {string} key - Clé de stockage
   * @returns {*|null} Valeur stockée ou null
   */
  getSessionData(key) {
    try {
      const data = sessionStorage.getItem(`${this.prefix}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération en session:', error);
      return null;
    }
  }

  /**
   * Suppression depuis sessionStorage
   * @param {string} key - Clé de stockage
   * @returns {boolean} Succès de l'opération
   */
  removeSessionData(key) {
    try {
      sessionStorage.removeItem(`${this.prefix}${key}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression en session:', error);
      return false;
    }
  }
}