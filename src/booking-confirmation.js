// Récupération des paramètres URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
const bookingId = urlParams.get('booking_id');

// État de la réservation
let bookingData = null;
let boat = null;

// Éléments DOM
const elements = {
  bookingNumber: document.getElementById('booking-number'),
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
  errorMessage: document.getElementById('error-message')
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
  // Vérifier les paramètres requis
  if (!sessionId && !bookingId) {
    showError('Paramètres de confirmation manquants. Veuillez vérifier votre lien.');
    return;
  }

  // Charger les données de la réservation
  await loadBookingData();
  
  // Afficher les informations
  displayBookingInfo();
  
  // Mettre à jour le breadcrumb
  updateBreadcrumb();
      }

      // Charger les données de la réservation
async function loadBookingData() {
  try {
    let response;
    
    if (sessionId) {
      // Vérifier la session Stripe
      response = await fetch(`/api/payments/verify-session/${sessionId}`);
    } else if (bookingId) {
      // Charger directement la réservation
      response = await fetch(`/api/bookings/${bookingId}`);
    }
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    bookingData = result.data.booking || result.data;
    
    // Charger les données du bateau
    await loadBoatData(bookingData.boatId);
    
    console.log('✅ Données de la réservation chargées:', bookingData);
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la réservation:', error);
    throw error;
  }
}

// Charger les données du bateau
async function loadBoatData(boatId) {
  try {
    const response = await fetch(`/api/boats/${boatId}`);
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

// Mettre à jour le breadcrumb
function updateBreadcrumb() {
  const breadcrumbBoatName = document.getElementById('breadcrumb-boat-name');
  if (breadcrumbBoatName && boat) {
    breadcrumbBoatName.textContent = boat.name || 'Bateau';
  }
}

// Afficher les informations de la réservation
function displayBookingInfo() {
  // Numéro de réservation
  elements.bookingNumber.textContent = bookingData.bookingNumber || `#${bookingData._id?.slice(-8).toUpperCase()}`;
  
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
  elements.passengers.textContent = bookingData.passengers || bookingData.guests;
  
  // Calculer la durée
  const start = new Date(bookingData.startDate);
  const end = new Date(bookingData.endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  elements.duration.textContent = `${days} jour${days > 1 ? 's' : ''}`;
  
  // Prix
  const dailyRate = bookingData.dailyRate || boat.pricing.dailyRate;
  const subtotal = bookingData.subtotal || (days * dailyRate);
  const serviceFee = bookingData.serviceFee || Math.round(subtotal * 0.05);
  const total = bookingData.total || (subtotal + serviceFee);
  const currency = bookingData.currency || boat.pricing.currency || 'EUR';
  
  elements.dailyRate.textContent = `${dailyRate} ${currency}`;
  elements.daysCount.textContent = days;
  elements.subtotal.textContent = `${subtotal} ${currency}`;
  elements.serviceFee.textContent = `${serviceFee} ${currency}`;
  elements.totalPrice.textContent = `${total} ${currency}`;
}

// Afficher un message d'erreur
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'flex';
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