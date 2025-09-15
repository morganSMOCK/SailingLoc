/**
 * Configuration des URLs d'API
 * Gère automatiquement les URLs selon l'environnement
 */

export function getApiBaseUrl() {
  // URL de base de l'API (auto-détection env)
  const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';
  
  // En production, utiliser l'URL complète de Render
  // En développement, utiliser le proxy Vite
  if (envBase) {
    return envBase;
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api'; // Proxy Vite en développement
  } else {
    return 'https://sailingloc.onrender.com/api'; // URL complète en production
  }
}

export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}
