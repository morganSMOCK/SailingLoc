/**
 * Service de gestion de l'état global de l'application
 * Gère l'authentification, la navigation et l'état utilisateur
 */
import { AuthService } from './AuthService.js';

export class AppStateService {
  constructor() {
    this.authService = new AuthService();
    this.currentUser = null;
    this.isInitialized = false;
    this.listeners = new Set();
  }

  /**
   * Initialiser l'état de l'application
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Vérifier l'authentification
      if (this.authService.isAuthenticated()) {
        await this.loadCurrentUser();
      }
      
      this.isInitialized = true;
      this.notifyListeners();
      
      console.log('✅ AppStateService initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de AppStateService:', error);
      // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
      this.currentUser = null;
      this.isInitialized = true;
      this.notifyListeners();
    }
  }

  /**
   * Charger les données de l'utilisateur actuel
   */
  async loadCurrentUser() {
    try {
      const user = await this.authService.getCurrentUser();
      this.currentUser = user;
      console.log('✅ Utilisateur chargé:', user);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      this.currentUser = null;
      // Si on ne peut pas charger l'utilisateur, on le déconnecte
      this.authService.clearAuthData();
    }
  }

  /**
   * Connexion de l'utilisateur
   */
  async login(credentials) {
    try {
      const result = await this.authService.login(credentials);
      await this.loadCurrentUser();
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout() {
    try {
      await this.authService.logout();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion locale
      this.currentUser = null;
      this.authService.clearAuthData();
      this.notifyListeners();
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    return this.authService.isAuthenticated() && this.currentUser !== null;
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtenir le token d'authentification
   */
  getAuthToken() {
    return this.authService.getAuthToken();
  }

  /**
   * Ajouter un listener pour les changements d'état
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          isAuthenticated: this.isAuthenticated(),
          currentUser: this.currentUser,
          isInitialized: this.isInitialized
        });
      } catch (error) {
        console.error('❌ Erreur dans un listener:', error);
      }
    });
  }

  /**
   * Rafraîchir l'état de l'authentification
   */
  async refreshAuthState() {
    if (this.authService.isAuthenticated()) {
      await this.loadCurrentUser();
    } else {
      this.currentUser = null;
    }
    this.notifyListeners();
  }
}

// Instance singleton
export const appState = new AppStateService();
