// Gestionnaire de stockage local - Utilitaire pour l'architecture MVC
export class StorageManager {
  constructor() {
    this.prefix = 'sailingloc_';
  }

  // Sauvegarder le token d'authentification
  setToken(token) {
    try {
      localStorage.setItem(`${this.prefix}token`, token);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
      return false;
    }
  }

  // Récupérer le token d'authentification
  getToken() {
    try {
      return localStorage.getItem(`${this.prefix}token`);
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  // Supprimer le token d'authentification
  removeToken() {
    try {
      localStorage.removeItem(`${this.prefix}token`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  // Sauvegarder les données utilisateur
  setUserData(userData) {
    try {
      localStorage.setItem(`${this.prefix}user`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
      return false;
    }
  }

  // Récupérer les données utilisateur
  getUserData() {
    try {
      const userData = localStorage.getItem(`${this.prefix}user`);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  // Supprimer les données utilisateur
  removeUserData() {
    try {
      localStorage.removeItem(`${this.prefix}user`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données utilisateur:', error);
      return false;
    }
  }

  // Sauvegarder les préférences de recherche
  setSearchPreferences(preferences) {
    try {
      localStorage.setItem(`${this.prefix}search_prefs`, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      return false;
    }
  }

  // Récupérer les préférences de recherche
  getSearchPreferences() {
    try {
      const prefs = localStorage.getItem(`${this.prefix}search_prefs`);
      return prefs ? JSON.parse(prefs) : {
        location: '',
        type: 'all',
        maxPrice: 1000,
        minCapacity: 1
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      return {
        location: '',
        type: 'all',
        maxPrice: 1000,
        minCapacity: 1
      };
    }
  }

  // Sauvegarder l'historique de recherche
  addToSearchHistory(searchTerm) {
    try {
      let history = this.getSearchHistory();
      
      // Supprimer le terme s'il existe déjà
      history = history.filter(term => term !== searchTerm);
      
      // Ajouter le nouveau terme au début
      history.unshift(searchTerm);
      
      // Limiter à 10 éléments
      history = history.slice(0, 10);
      
      localStorage.setItem(`${this.prefix}search_history`, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      return false;
    }
  }

  // Récupérer l'historique de recherche
  getSearchHistory() {
    try {
      const history = localStorage.getItem(`${this.prefix}search_history`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  // Effacer l'historique de recherche
  clearSearchHistory() {
    try {
      localStorage.removeItem(`${this.prefix}search_history`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
      return false;
    }
  }

  // Sauvegarder les bateaux favoris
  addToFavorites(boatId) {
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

  // Supprimer des favoris
  removeFromFavorites(boatId) {
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

  // Récupérer les favoris
  getFavorites() {
    try {
      const favorites = localStorage.getItem(`${this.prefix}favorites`);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return [];
    }
  }

  // Vérifier si un bateau est en favoris
  isFavorite(boatId) {
    const favorites = this.getFavorites();
    return favorites.includes(boatId);
  }

  // Sauvegarder les paramètres de l'application
  setAppSettings(settings) {
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

  // Récupérer les paramètres de l'application
  getAppSettings() {
    try {
      const settings = localStorage.getItem(`${this.prefix}app_settings`);
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        language: 'fr',
        currency: 'EUR',
        notifications: true,
        emailUpdates: true
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return {
        theme: 'light',
        language: 'fr',
        currency: 'EUR',
        notifications: true,
        emailUpdates: true
      };
    }
  }

  // Sauvegarder temporairement des données de formulaire
  setFormData(formName, data) {
    try {
      localStorage.setItem(`${this.prefix}form_${formName}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du formulaire:', error);
      return false;
    }
  }

  // Récupérer les données de formulaire temporaires
  getFormData(formName) {
    try {
      const data = localStorage.getItem(`${this.prefix}form_${formName}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du formulaire:', error);
      return null;
    }
  }

  // Supprimer les données de formulaire temporaires
  removeFormData(formName) {
    try {
      localStorage.removeItem(`${this.prefix}form_${formName}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du formulaire:', error);
      return false;
    }
  }

  // Nettoyer toutes les données de l'application
  clearAllData() {
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

  // Obtenir la taille utilisée par l'application
  getStorageSize() {
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

  // Vérifier si le stockage local est disponible
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.error('Stockage local non disponible:', error);
      return false;
    }
  }

  // Sauvegarder avec expiration
  setWithExpiry(key, value, ttl) {
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

  // Récupérer avec vérification d'expiration
  getWithExpiry(key) {
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
}