/**
 * Service d'authentification
 * Gère toutes les opérations liées à l'authentification des utilisateurs
 */
export class AuthService {
  constructor() {
    // URL de base de l'API
    this.baseURL = 'https://sailingloc.onrender.com/api';
    this.authEndpoint = `${this.baseURL}/auth`;
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Réponse de l'API
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.authEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('📡 Réponse HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      let data;
      try {
        data = await response.json();
        console.log('📊 Données JSON reçues:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const textResponse = await response.text();
        console.log('📄 Réponse texte:', textResponse);
        throw new Error(`Réponse invalide du serveur: ${response.status}`);
      }
      
      if (!response.ok) {
        console.error('❌ Réponse HTTP non-OK:', response.status, data);
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur AuthService.register:', error);
      throw error;
    }
  }

  /**
   * Connexion d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Réponse de l'API avec token et données utilisateur
   */
  async login(email, password) {
    try {
      const loginUrl = `${this.authEndpoint}/login`;
      console.log('🔐 AuthService.login appelé');
      console.log('📍 URL:', loginUrl);
      console.log('📊 Données:', { email, password: password ? '***' : 'vide' });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Réponse HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      let data;
      try {
        data = await response.json();
        console.log('📊 Données JSON reçues:', data);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError);
        const textResponse = await response.text();
        console.log('📄 Réponse texte:', textResponse);
        throw new Error(`Réponse invalide du serveur: ${response.status}`);
      }
      
      if (!response.ok) {
        console.error('❌ Réponse HTTP non-OK:', response.status, data);
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur AuthService.login:', error);
      throw error;
    }
  }

  /**
   * Déconnexion de l'utilisateur
   * @returns {Promise<Object>} Réponse de l'API
   */
  async logout() {
    try {
      const token = this.getAuthToken();
      
      const registerUrl = `${this.authEndpoint}/register`;
      console.log('📝 AuthService.register appelé');
      console.log('📍 URL:', registerUrl);
      console.log('📊 Données:', { ...userData, password: userData.password ? '***' : 'vide' });
      
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la déconnexion');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  /**
   * Récupération du profil utilisateur
   * @returns {Promise<Object>} Données du profil utilisateur
   */
  async getProfile() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.authEndpoint}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Nouvelles données du profil
   * @returns {Promise<Object>} Profil mis à jour
   */
  async updateProfile(profileData) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.authEndpoint}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Changement de mot de passe
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<Object>} Réponse de l'API
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.authEndpoint}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  /**
   * Vérification de la validité du token
   * @returns {Promise<Object>} Réponse de l'API avec les données utilisateur
   */
  async verifyToken() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      const response = await fetch(`${this.authEndpoint}/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token invalide');
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      throw error;
    }
  }

  /**
   * Récupération du token d'authentification depuis le localStorage
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
   * Vérification si l'utilisateur est connecté
   * @returns {boolean} True si connecté, false sinon
   */
  isAuthenticated() {
    const token = this.getAuthToken();
    
    if (!token) {
      return false;
    }

    try {
      // Vérification basique de la structure du JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Vérifier si le token n'est pas expiré
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token invalide:', error);
      return false;
    }
  }

  /**
   * Récupération des informations utilisateur depuis le localStorage
   * @returns {Object|null} Données utilisateur
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('sailingloc_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  /**
   * Nettoyage des données d'authentification
   */
  clearAuthData() {
    try {
      localStorage.removeItem('sailingloc_token');
      localStorage.removeItem('sailingloc_user');
    } catch (error) {
      console.error('Erreur lors du nettoyage des données d\'authentification:', error);
    }
  }

  /**
   * Gestion des erreurs d'authentification
   * @param {Error} error - Erreur à traiter
   * @returns {Object} Objet d'erreur formaté
   */
  handleAuthError(error) {
    // Si l'erreur indique un token expiré ou invalide, nettoyer les données
    if (error.message.includes('Token') || error.message.includes('401')) {
      this.clearAuthData();
    }

    return {
      success: false,
      message: error.message || 'Erreur d\'authentification',
      error: error
    };
  }

  /**
   * Rafraîchissement automatique du token (si implémenté côté serveur)
   * @returns {Promise<Object>} Nouveau token
   */
  async refreshToken() {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Aucun token à rafraîchir');
      }

      const response = await fetch(`${this.authEndpoint}/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du rafraîchissement du token');
      }

      // Sauvegarder le nouveau token
      if (data.data && data.data.token) {
        localStorage.setItem('sailingloc_token', data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Intercepteur pour les requêtes authentifiées
   * Ajoute automatiquement le token d'authentification
   * @param {string} url - URL de la requête
   * @param {Object} options - Options de la requête fetch
   * @returns {Promise<Response>} Réponse de la requête
   */
  async authenticatedFetch(url, options = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Authentification requise');
    }

    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await fetch(url, authOptions);
      
      // Si le token est expiré, essayer de le rafraîchir
      if (response.status === 401) {
        try {
          await this.refreshToken();
          // Retry avec le nouveau token
          const newToken = this.getAuthToken();
          authOptions.headers['Authorization'] = `Bearer ${newToken}`;
          return await fetch(url, authOptions);
        } catch (refreshError) {
          // Si le rafraîchissement échoue, rediriger vers la connexion
          this.clearAuthData();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la requête authentifiée:', error);
      throw error;
    }
  }
}