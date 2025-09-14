// src/boat.js
// NOTE: Cursor doit brancher les appels API ici.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const id = params.get('id');

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
    const response = await fetch(`/api/boats/${id}`, {
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
  $('#side-name').textContent = boat.name;

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

  // Pricing
  const daily = boat?.pricing?.dailyRate ?? 0;
  $('#price-amount').textContent = formatNumber(daily);
  $('#price-details').textContent = `Caution : ${formatNumber(boat?.pricing?.securityDeposit ?? 0)} €`;

  // Quick specs
  const cap = boat?.capacity?.maxPeople ? `${boat.capacity.maxPeople} pers` : null;
  const dims = (boat?.specifications?.length || boat?.specifications?.width)
    ? `${boat?.specifications?.length ?? '—'} m × ${boat?.specifications?.width ?? '—'} m` : null;
  const fuel = boat?.specifications?.fuelType ? capitalize(boat.specifications.fuelType) : null;
  $('#quick-specs').innerHTML = [cap, dims, fuel]
    .filter(Boolean)
    .map(s => `<span class="spec-pill">${s}</span>`).join('');

  // Description
  $('#boat-description').textContent = boat?.description || 'Aucune description disponible';

  // Amenities
  renderAmenities(boat?.amenities || []);

  // Specs grid
  renderSpecs(boat);

  // Images - PRIORITÉ AUX IMAGES UPLOADÉES (boat.images)
  let images = boat?.images || boat?.imageUrls || [];
  
  // Convertir les URLs relatives en URLs absolues
  if (Array.isArray(images) && images.length > 0) {
    images = images.map(img => {
      if (typeof img === 'string') {
        return img.startsWith('http') ? img : `https://sailingloc.onrender.com${img}`;
      } else if (img?.fullUrl) {
        // Corriger l'URL si elle pointe vers localhost
        return img.fullUrl.replace('http://localhost:3000', 'https://sailingloc.onrender.com');
      } else if (img?.url) {
        return img.url.startsWith('http') ? img.url : `https://sailingloc.onrender.com${img.url}`;
      }
      return img;
    });
  }
  
  console.log('🖼️ [DEBUG] Images traitées pour boat.js:', images);
  renderImages(images);

  // Reviews (si dispos) - pas de reviews dans l'API actuelle
  renderReviews(boat);
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
      <div class="spec-icon">⚓</div>
      <div class="spec-content">
        <h4>${k}</h4>
        <p>${escapeHtml(String(v))}</p>
      </div>
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
  
  main.innerHTML = `<img src="${urls[0]}" alt="Photo principale du bateau" onerror="this.src='https://images.unsplash.com/photo-1508599589920-14cfa1c1fe4d?q=80&w=1200&auto=format&fit=crop'">`;
  thumbs.innerHTML = urls.slice(0,8).map(u => `
    <div class="thumbnail"><img src="${u}" alt="Miniature" onerror="this.src='https://images.unsplash.com/photo-1508599589920-14cfa1c1fe4d?q=80&w=1200&auto=format&fit=crop'"></div>
  `).join('');
  
  thumbs.addEventListener('click', e => {
    const img = e.target.closest('.thumbnail img');
    if (!img) return;
    const big = main.querySelector('img');
    if (big) big.src = img.src;
  });
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
