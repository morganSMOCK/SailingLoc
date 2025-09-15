// src/boat.js
// NOTE: Cursor doit brancher les appels API ici.

import { getApiBaseUrl } from './utils/apiConfig.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const id = params.get('id');

// Fonction globale pour obtenir une image de bateau basée sur le type
window.getBoatImageByType = window.getBoatImageByType || function(type, category) {
  console.log('🔍 getBoatImageByType appelée avec:', { type, category });
  
  const images = {
    'voilier': 'https://images.unsplash.com/photo-1508599589920-14cfa1c1fe4d?q=80&w=1200&auto=format&fit=crop',
    'catamaran': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
    'yacht': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
    'bateau': 'https://images.unsplash.com/photo-1508599589920-14cfa1c1fe4d?q=80&w=1200&auto=format&fit=crop'
  };
  
  // Si c'est un catégorie luxe, utiliser une image plus premium
  if (category === 'luxe') {
    console.log('✅ Catégorie luxe détectée, utilisation image premium');
    return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop';
  }
  
  const selectedImage = images[type] || images['bateau'];
  console.log('✅ Image sélectionnée:', selectedImage);
  return selectedImage;
};

const state = {
  boat: null
};

init().catch(err => {
  console.error('Boat detail init failed:', err);
  showNotFound();
});

async function init(){
  if(!id) return showNotFound();

  try {
    console.log('🚤 Chargement du bateau depuis l\'API Render...');
    const response = await fetch(`${getApiBaseUrl()}/boats/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ Bateau non trouvé');
        return showNotFound();
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Données reçues de l\'API:', data);

    if (data.success && data.data && data.data.boat) {
      state.boat = data.data.boat;
      hydrate(data.data.boat);
    } else {
      console.error('❌ Format de données invalide:', data);
      return showNotFound();
    }

  } catch (error) {
    console.error('❌ Erreur lors du chargement du bateau:', error);
    return showNotFound();
  }
}

function useMockData() {
  // Données de test pour démonstration
  const mockBoat = {
    _id: id,
    name: 'Ocean Dream',
    type: 'Yacht',
    category: 'Luxe',
    status: 'available',
    description: 'Un yacht de luxe exceptionnel pour des croisières inoubliables. Équipé des dernières technologies et offrant un confort incomparable.',
    location: {
      marina: 'Port de Cannes',
      city: 'Cannes',
      country: 'France'
    },
    capacity: {
      maxPeople: 8
    },
    specifications: {
      length: 15,
      width: 4.5,
      fuelType: 'Diesel'
    },
    pricing: {
      dailyRate: 850,
      securityDeposit: 2000
    },
    amenities: ['GPS', 'Radio', 'Cuisine équipée', '3 Cabines', '2 Douches', 'Pont solarium'],
    imageUrls: [
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
    ],
    reviews: [
      {
        rating: 5,
        comment: 'Excellent bateau, très confortable ! L\'équipage était parfait.',
        user: { firstName: 'Jean', fullName: 'Jean Dupont' },
        date: new Date(Date.now() - 86400000).toISOString()
      },
      {
        rating: 4,
        comment: 'Très belle expérience, je recommande !',
        user: { firstName: 'Marie', fullName: 'Marie Martin' },
        date: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  };

  // Accepter différents IDs de test
  const validTestIds = [
    '68c717e123456789abcdef01',
    'test-boat-1',
    '68c7', // ID tronqué pour test
    'boat1',
    'boat2',
    'boat3'
  ];
  
  if (validTestIds.includes(id) || id.startsWith('68c7')) {
    state.boat = mockBoat;
    hydrate(mockBoat);
  } else {
    showNotFound();
  }
}

function hydrate(boat){
  console.log('🔄 Hydratation avec les données:', boat);
  
  // Title / breadcrumb
  document.title = `${boat.name} — SailingLoc`;
  $('#crumb-boat').textContent = boat.name;

  // Hero
  $('#boat-name').textContent = boat.name;

  // Chips avec capitalisation
  setChip('#boat-type', capitalize(boat.type));
  setChip('#boat-category', capitalize(boat.category));
  setStatus('#boat-status', boat.status);

  // Localisation
  const locationParts = [
    boat?.location?.marina,
    boat?.location?.city,
    boat?.location?.country
  ].filter(Boolean);
  $('#boat-location').textContent = locationParts.join(' • ');

  // Pricing (mise à jour des nouveaux éléments)
  const daily = boat?.pricing?.dailyRate ?? 0;
  $('#price-amount').textContent = formatNumber(daily);
  $('#price-details').textContent = `Caution : ${formatNumber(boat?.pricing?.securityDeposit ?? 0)} €`;
  $('#booking-price').textContent = formatNumber(daily);
  $('#booking-deposit').textContent = `${formatNumber(boat?.pricing?.securityDeposit ?? 0)} €`;

  // Highlights
  const cap = boat?.capacity?.maxPeople ? `${boat.capacity.maxPeople} personnes` : 'Non spécifié';
  const dims = (boat?.specifications?.length || boat?.specifications?.width)
    ? `${boat?.specifications?.length ?? '—'}m × ${boat?.specifications?.width ?? '—'}m` : 'Non spécifié';
  const fuel = boat?.specifications?.fuelType ? capitalize(boat.specifications.fuelType) : 'Non spécifié';
  
  $('#boat-capacity').textContent = cap;
  $('#boat-dimensions').textContent = dims;
  $('#boat-engine').textContent = fuel;

  // Description
  $('#boat-description').textContent = boat?.description || 'Aucune description disponible';

  // Amenities
  renderAmenities(boat?.amenities || []);

  // Specs grid
  renderSpecs(boat);

  // Images - PRIORITÉ ABSOLUE AUX IMAGES UPLOADÉES
  let images = [];
  
  console.log('🔍 [DEBUG] Données du bateau reçues:', {
    hasImages: Array.isArray(boat.images) && boat.images.length > 0,
    hasImageUrls: Array.isArray(boat.imageUrls) && boat.imageUrls.length > 0,
    hasImageUrl: boat.imageUrl,
    hasCoverImageUrl: boat.coverImageUrl,
    images: boat.images,
    imageUrls: boat.imageUrls,
    imageUrl: boat.imageUrl,
    coverImageUrl: boat.coverImageUrl
  });
  
  // PRIORITÉ 1 : Images uploadées (boat.images)
  if (Array.isArray(boat.images) && boat.images.length > 0) {
    images = boat.images.map(img => {
      if (typeof img === 'string') {
        // Si c'est une string, vérifier si c'est une URL complète
        return img.startsWith('http') ? img : `https://sailingloc.onrender.com${img}`;
      } else if (img && typeof img === 'object') {
        // Si c'est un objet avec url
        if (img.url) {
          return img.url.startsWith('http') ? img.url : `https://sailingloc.onrender.com${img.url}`;
        }
        // Si c'est un objet avec fullUrl
        if (img.fullUrl) {
          return img.fullUrl.replace('http://localhost:3000', 'https://sailingloc.onrender.com');
        }
      }
      return null;
    }).filter(Boolean);
    console.log('✅ Images trouvées dans boat.images:', images);
  }
  // PRIORITÉ 2 : imageUrls (legacy)
  else if (Array.isArray(boat.imageUrls) && boat.imageUrls.length > 0) {
    images = boat.imageUrls.map(img => {
      if (typeof img === 'string') {
        return img.startsWith('http') ? img : `https://sailingloc.onrender.com${img}`;
      } else if (img?.fullUrl) {
        return img.fullUrl.replace('http://localhost:3000', 'https://sailingloc.onrender.com');
      } else if (img?.url) {
        return img.url.startsWith('http') ? img.url : `https://sailingloc.onrender.com${img.url}`;
      }
      return null;
    }).filter(Boolean);
    console.log('✅ Images trouvées dans boat.imageUrls:', images);
  }
  // PRIORITÉ 3 : imageUrl (single image)
  else if (boat.imageUrl) {
    images = [boat.imageUrl.startsWith('http') ? boat.imageUrl : `https://sailingloc.onrender.com${boat.imageUrl}`];
    console.log('✅ Image trouvée dans boat.imageUrl:', images);
  }
  // PRIORITÉ 4 : coverImageUrl (si disponible)
  else if (boat.coverImageUrl) {
    images = [boat.coverImageUrl];
    console.log('✅ Image trouvée dans boat.coverImageUrl:', images);
  }
  // DERNIER RECOURS : image par défaut (seulement si vraiment aucune image)
  else {
    console.log('⚠️ Aucune image uploadée trouvée, utilisation image par défaut');
    images = [window.getBoatImageByType(boat.type, boat.category)];
  }
  
  console.log('🖼️ [DEBUG] Images traitées pour boat.js:', images);
  
  // Test de validité des URLs
  if (images.length > 0) {
    console.log('🧪 Test de validité des URLs:');
    images.forEach((url, index) => {
      console.log(`  Image ${index + 1}: ${url}`);
      // Test de chargement de la première image
      if (index === 0) {
        const testImg = new Image();
        testImg.onload = () => console.log(`  ✅ Image ${index + 1} chargée avec succès`);
        testImg.onerror = () => console.log(`  ❌ Image ${index + 1} erreur de chargement`);
        testImg.src = url;
      }
    });
  }
  
  renderImages(images);

  // Reviews (si dispos) - pas de reviews dans l'API actuelle
  renderReviews(boat);

  // Redirige le CTA vers la page de réservation avec l'id du bateau
  const cta = document.getElementById('cta-contact');
  if (cta && boat && boat._id) {
    cta.href = `reserve.html?id=${encodeURIComponent(boat._id)}`;
  }
}

function setChip(sel, val){
  const el = $(sel);
  if (!val){ el.style.display = 'none'; return; }
  el.textContent = val;
}
function setStatus(sel, status){
  const el = $(sel);
  if (!status){ el.style.display = 'none'; return; }
  const labels = { available: 'Disponible', maintenance: 'Maintenance', rented: 'Loué', inactive:'Inactif' };
  el.textContent = labels[status] || status;
}

function renderAmenities(list){
  const wrap = $('#amenities-grid');
  if (!list.length){ wrap.innerHTML = '<em>Aucun équipement renseigné.</em>'; return; }
  wrap.innerHTML = list.map(a => `
    <div class="amenity-item"><i>✅</i><span>${escapeHtml(a)}</span></div>
  `).join('');
}

function renderSpecs(boat){
  const grid = $('#specs-grid');
  const specs = [
    ['Type', capitalize(boat?.type) || '—'],
    ['Catégorie', capitalize(boat?.category) || '—'],
    ['Capacité', boat?.capacity?.maxPeople ? `${boat.capacity.maxPeople} personnes` : '—'],
    ['Longueur', boat?.specifications?.length ? `${boat.specifications.length} m` : '—'],
    ['Largeur', boat?.specifications?.width ? `${boat.specifications.width} m` : '—'],
    ['Carburant', boat?.specifications?.fuelType ? capitalize(boat.specifications.fuelType) : '—'],
    ['Port', boat?.location?.marina || '—'],
    ['Ville', boat?.location?.city || '—'],
    ['Pays', boat?.location?.country || '—'],
    ['Statut', boat?.status === 'available' ? 'Disponible' : capitalize(boat?.status) || '—'],
    ['Propriétaire', boat?.owner?.fullName || '—']
  ];
  grid.innerHTML = specs.map(([k,v]) => `
    <div class="spec-item">
      <span class="spec-label">${k}</span>
      <span class="spec-value">${escapeHtml(String(v))}</span>
    </div>
  `).join('');
}

function renderImages(urls){
  console.log('🖼️ [DEBUG] renderImages appelé avec:', urls);
  
  const main = $('#main-image');
  const thumbs = $('#thumbs');
  
  if (!urls || !urls.length){
    console.log('⚠️ Aucune image fournie, utilisation du placeholder');
    // placeholder déjà dans le HTML
    thumbs.innerHTML = '';
    return;
  }
  
  console.log('✅ Affichage de', urls.length, 'image(s)');
  
  // Image principale avec overlay
  main.innerHTML = `
    <img src="${urls[0]}" alt="Photo principale du bateau" onerror="handleImageError(this, '${urls[0]}')">
    <div class="image-overlay">
      <button class="gallery-btn gallery-btn-prev" id="prev-image">‹</button>
      <button class="gallery-btn gallery-btn-next" id="next-image">›</button>
      <div class="image-counter">
        <span id="current-image">1</span> / <span id="total-images">${urls.length}</span>
      </div>
    </div>
  `;
  
  // Miniatures
  thumbs.innerHTML = urls.slice(0,8).map((u, i) => `
    <div class="thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${u}" alt="Miniature" onerror="handleImageError(this, '${u}')">
    </div>
  `).join('');
  
  // Gestion des clics sur les miniatures
  thumbs.addEventListener('click', e => {
    const thumb = e.target.closest('.thumbnail');
    if (!thumb) return;
    
    const index = parseInt(thumb.dataset.index);
    const main = $('#main-image');
    main.innerHTML = `
      <img src="${urls[index]}" alt="Photo principale du bateau" onerror="handleImageError(this, '${urls[index]}')">
      <div class="image-overlay">
        <button class="gallery-btn gallery-btn-prev" id="prev-image">‹</button>
        <button class="gallery-btn gallery-btn-next" id="next-image">›</button>
        <div class="image-counter">
          <span id="current-image">${index + 1}</span> / <span id="total-images">${urls.length}</span>
        </div>
      </div>
    `;
    
    // Mise à jour des classes actives
    thumbs.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    
    // Re-attacher les événements des boutons
    setupGalleryNavigation(urls);
  });
  
  // Configuration de la navigation de la galerie
  setupGalleryNavigation(urls);
}

// Fonction pour gérer les erreurs d'images
function handleImageError(img, originalSrc) {
  console.error('❌ Erreur de chargement d\'image:', originalSrc);
  
  // Afficher un message d'erreur au lieu d'une image par défaut
  const container = img.closest('.main-image-container') || img.closest('.thumbnail');
  if (container) {
    container.innerHTML = `
      <div class="image-error">
        <div class="error-icon">⚠️</div>
        <div class="error-text">Image non accessible</div>
        <div class="error-url">${originalSrc}</div>
      </div>
    `;
  }
}

function setupGalleryNavigation(urls) {
  const prevBtn = $('#prev-image');
  const nextBtn = $('#next-image');
  const currentSpan = $('#current-image');
  
  if (!prevBtn || !nextBtn || !currentSpan) return;
  
  let currentIndex = 0;
  
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + urls.length) % urls.length;
    updateMainImage(urls, currentIndex);
  });
  
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % urls.length;
    updateMainImage(urls, currentIndex);
  });
  
  function updateMainImage(urls, index) {
    const main = $('#main-image');
    main.innerHTML = `
      <img src="${urls[index]}" alt="Photo principale du bateau" onerror="handleImageError(this, '${urls[index]}')">
      <div class="image-overlay">
        <button class="gallery-btn gallery-btn-prev" id="prev-image">‹</button>
        <button class="gallery-btn gallery-btn-next" id="next-image">›</button>
        <div class="image-counter">
          <span id="current-image">${index + 1}</span> / <span id="total-images">${urls.length}</span>
        </div>
      </div>
    `;
    
    // Mise à jour des miniatures
    const thumbs = $('#thumbs');
    thumbs.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
    
    // Re-attacher les événements
    setupGalleryNavigation(urls);
  }
}

function renderReviews(boat){
  const section = $('#reviews-section');
  const wrapStars = $('#rating-stars');
  const valEl = $('#rating-value');
  const countEl = $('#rating-count');

  const reviews = boat?.reviews || [];
  const count = reviews.length;
  if (!count){
    section.hidden = true;
    $('#rating-wrap').style.display = 'none';
    return;
  }
  const avg = Math.round((reviews.reduce((s,r)=>s+(r?.rating||0),0) / count) * 10)/10;
  valEl.textContent = String(avg);
  countEl.textContent = String(count);
  wrapStars.textContent = '★★★★★'; // style gradient appliqué en CSS
  section.hidden = false;

  // liste
  const list = $('#reviews-list');
  list.innerHTML = reviews.slice(0,6).map(r=>`
    <div class="review-item">
      <div class="review-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">${(r?.user?.firstName || 'A')[0]}</div>
          <div>
            <div class="reviewer-name">${escapeHtml(r?.user?.fullName || 'Client')}</div>
            <div class="review-date">${new Date(r?.date || r?.createdAt || Date.now()).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <div class="review-rating">⭐ ${r?.rating ?? '-'}/5</div>
      </div>
      <div class="review-text">${escapeHtml(r?.comment || '')}</div>
    </div>
  `).join('');
}

function showNotFound(){
  // On masque le hero uniquement
  const hero = document.querySelector('.boat-hero');
  if (hero) hero.style.display = 'none';

  // On affiche le bloc 404 mais on NE cache PAS .boat-detail
  const notFound = document.getElementById('boat-not-found');
  if (notFound) notFound.style.display = 'block';
}

/* utils */
function formatNumber(n){
  try { return new Intl.NumberFormat('fr-FR').format(n); }
  catch { return String(n); }
}
function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
