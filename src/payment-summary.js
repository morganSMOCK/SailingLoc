import { StripeService } from './services/StripeService.js';
import { AppStateService } from './services/AppStateService.js';

// Créer une instance d'AppStateService
const appState = new AppStateService();

// Créer une instance de StripeService avec l'AppStateService
const stripeService = new StripeService(appState);

// Récupération des paramètres URL
const urlParams = new URLSearchParams(window.location.search);
const boatId = urlParams.get('boatId');
const startDate = urlParams.get('startDate');
const endDate = urlParams.get('endDate');
const passengers = urlParams.get('passengers');

// État de la réservation
let bookingData = null;
let boat = null;

// Éléments DOM
const elements = {
  boatImage: document.getElementById('boat-image'),
  noImage: document.getElementById('no-image'),
  boatName: document.getElementById('boat-name'),
  boatType: document.getElementById('boat-type'),
  boatLocation: document.getElementById('boat-location'),
  startDate: document.getElementById('start-date'),
  endDate: document.getElementById('end-date'),
  passengers: document.getElementById('passengers'),
  duration: document.getElementById('duration'),
  dailyRate: document.getElementById('daily-rate'),
  daysCount: document.getElementById('days-count'),
  subtotal: document.getElementById('subtotal'),
  serviceFee: document.getElementById('service-fee'),
  totalPrice: document.getElementById('total-price'),
  payButton: document.getElementById('pay-button'),
  payButtonText: document.getElementById('pay-button-text'),
  payButtonAmount: document.getElementById('pay-button-amount'),
  errorMessage: document.getElementById('error-message'),
  successMessage: document.getElementById('success-message')
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePage();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    showError('Une erreur est survenue lors du chargement de la page.');
  }
});

// Initialiser la page
async function initializePage() {
  // Attendre que l'AppStateService soit initialisé
  console.log('🔄 Vérification de l\'authentification...');
  
  // Initialiser l'AppStateService s'il ne l'est pas déjà
  if (!appState.isInitialized) {
    await appState.initialize();
  }
  
  // Attendre que l'AppStateService soit complètement initialisé
  await appState.waitForInitialization();
  
  // Vérifier l'authentification via AppStateService
  if (!appState.isAuthenticated()) {
    console.log('❌ Utilisateur non authentifié, redirection vers login');
    showError('Vous devez être connecté pour effectuer un paiement.');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 3000);
    return;
  }
  
  console.log('✅ Utilisateur authentifié, continuation du processus de paiement');
  console.log('🔑 Token disponible:', appState.getAuthToken() ? 'Oui' : 'Non');
  console.log('👤 Utilisateur actuel:', appState.currentUser?.firstName || 'Non défini');

  // Vérifier les paramètres requis
  if (!boatId || !startDate || !endDate || !passengers) {
    showError('Paramètres de réservation manquants. Veuillez recommencer.');
    return;
  }

  // Charger les données du bateau
  await loadBoatData();
  
  // Calculer les détails de la réservation
  calculateBookingDetails();
  
  // Afficher les informations
  displayBookingInfo();
  
  // Mettre à jour le breadcrumb
  updateBreadcrumb();
  
  // Configurer le bouton de paiement
  setupPaymentButton();
}

// Charger les données du bateau
async function loadBoatData() {
  try {
    const response = await fetch(`https://sailingloc.onrender.com/api/boats/${boatId}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    boat = result.data.boat;
    
    console.log('✅ Données du bateau chargées:', boat);
  } catch (error) {
    console.error('❌ Erreur lors du chargement du bateau:', error);
    throw error;
  }
}

// Calculer les détails de la réservation
function calculateBookingDetails() {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  const dailyRate = boat.pricing.dailyRate;
  const subtotal = days * dailyRate;
  const serviceFee = Math.round(subtotal * 0.05); // 5% de frais de service
  const total = subtotal + serviceFee;
  
  bookingData = {
    boatId: boat._id,
    boatName: boat.name,
    startDate: startDate,
    endDate: endDate,
    totalPrice: total, // Le backend attend 'totalPrice' et non 'total'
    customerEmail: appState.currentUser?.email,
    customerName: `${appState.currentUser?.firstName} ${appState.currentUser?.lastName}`,
    // Données supplémentaires pour le frontend
    passengers: parseInt(passengers),
    days: days,
    dailyRate: dailyRate,
    subtotal: subtotal,
    serviceFee: serviceFee,
    total: total,
    currency: boat.pricing.currency || 'EUR'
  };
  
  console.log('✅ Détails de la réservation calculés:', bookingData);
  console.log('🔍 Vérification des champs requis:');
  console.log('🔍 boatId:', bookingData.boatId ? '✅' : '❌');
  console.log('🔍 boatName:', bookingData.boatName ? '✅' : '❌');
  console.log('🔍 startDate:', bookingData.startDate ? '✅' : '❌');
  console.log('🔍 endDate:', bookingData.endDate ? '✅' : '❌');
  console.log('🔍 totalPrice:', bookingData.totalPrice ? '✅' : '❌');
  console.log('🔍 customerEmail:', bookingData.customerEmail ? '✅' : '❌');
  console.log('🔍 customerName:', bookingData.customerName ? '✅' : '❌');
}

// Mettre à jour le breadcrumb
function updateBreadcrumb() {
  const breadcrumbBoatName = document.getElementById('breadcrumb-boat-name');
  if (breadcrumbBoatName && boat) {
    breadcrumbBoatName.textContent = boat.name || 'Bateau';
  }
}

// Afficher les informations de la réservation
function displayBookingInfo() {
  // Image du bateau
  if (boat.images && boat.images.length > 0) {
    const mainImage = boat.images.find(img => img.isMain) || boat.images[0];
    if (mainImage && mainImage.url) {
      elements.boatImage.src = `https://sailingloc.onrender.com${mainImage.url}`;
      elements.boatImage.style.display = 'block';
      elements.noImage.style.display = 'none';
    }
  }
  
  // Informations du bateau
  elements.boatName.textContent = boat.name;
  elements.boatType.textContent = `${boat.type} • ${boat.category}`;
  elements.boatLocation.textContent = `${boat.location.city}, ${boat.location.marina}, ${boat.location.country} • ${boat.capacity.maxPeople} pers.`;
  
  // Détails de la réservation
  elements.startDate.textContent = formatDate(bookingData.startDate);
  elements.endDate.textContent = formatDate(bookingData.endDate);
  elements.passengers.textContent = bookingData.passengers;
  elements.duration.textContent = `${bookingData.days} jour${bookingData.days > 1 ? 's' : ''}`;
  
  // Prix
  elements.dailyRate.textContent = `${bookingData.dailyRate} ${bookingData.currency}`;
  elements.daysCount.textContent = bookingData.days;
  elements.subtotal.textContent = `${bookingData.subtotal} ${bookingData.currency}`;
  elements.serviceFee.textContent = `${bookingData.serviceFee} ${bookingData.currency}`;
  elements.totalPrice.textContent = `${bookingData.total} ${bookingData.currency}`;
  
  // Bouton de paiement
  elements.payButtonAmount.textContent = `${bookingData.total} ${bookingData.currency}`;
}

// Configurer le bouton de paiement
function setupPaymentButton() {
  elements.payButton.addEventListener('click', async () => {
    try {
      await processPayment();
    } catch (error) {
      console.error('❌ Erreur lors du paiement:', error);
      showError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
    }
  });
}

// Traiter le paiement
async function processPayment() {
  try {
    // Vérifier à nouveau l'authentification via AppStateService
    if (!appState.isAuthenticated()) {
      console.log('❌ Session expirée lors du paiement');
      showError('Session expirée. Veuillez vous reconnecter.');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
      return;
    }

    // Désactiver le bouton
    elements.payButton.disabled = true;
    elements.payButtonText.textContent = 'Traitement en cours...';
    elements.payButton.classList.add('loading');
    
    // Initialiser Stripe
    await stripeService.initialize();
    
    // Créer la session de paiement
    const session = await stripeService.createPaymentSession(bookingData);
    
    console.log('✅ Session de paiement créée:', session);
    
    // Rediriger vers Stripe Checkout
    await stripeService.redirectToCheckout(session.sessionId);
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement du paiement:', error);
    
    // Gestion spécifique des erreurs d'authentification
    if (error.message.includes('connecté') || error.message.includes('authentification')) {
      showError('Session expirée. Veuillez vous reconnecter.');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      showError(error.message || 'Une erreur est survenue lors du paiement.');
    }
    
    // Réactiver le bouton
    elements.payButton.disabled = false;
    elements.payButtonText.textContent = 'Payer maintenant';
    elements.payButton.classList.remove('loading');
  }
}

// Afficher un message d'erreur
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'flex';
  elements.successMessage.style.display = 'none';
}

// Afficher un message de succès
function showSuccess(message) {
  elements.successMessage.textContent = message;
  elements.successMessage.style.display = 'flex';
  elements.errorMessage.style.display = 'none';
}

// Formater une date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
  console.error('❌ Erreur globale:', event.error);
  showError('Une erreur inattendue est survenue.');
});

// Gestion des promesses rejetées
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesse rejetée:', event.reason);
  showError('Une erreur est survenue lors du traitement.');
});
