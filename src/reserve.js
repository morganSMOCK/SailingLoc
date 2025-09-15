import { getApiBaseUrl } from './utils/apiConfig.js';

const API = getApiBaseUrl();

const params = new URLSearchParams(location.search);
const boatId = params.get('id');

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

let boat = null;
let unavailableSet = new Set();
let selectedStart = null;
let selectedEnd = null;
let currentYearMonth = new Date();

init().catch(err => {
  console.error(err);
  showNotFound();
});

async function init(){
  if (!boatId) return showNotFound();

  // 1) Charger le bateau
  const boatRes = await fetch(`${API}/boats/${encodeURIComponent(boatId)}`, { credentials:'include', cache:'no-store' });
  if (!boatRes.ok) return showNotFound();
  const boatData = await boatRes.json();
  
  // Gérer la structure de réponse de l'API
  if (boatData.success && boatData.data && boatData.data.boat) {
    boat = boatData.data.boat;
  } else if (boatData.data) {
    boat = boatData.data.boat || boatData.data;
  } else {
    boat = boatData;
  }
  
  if (!boat || !boat._id) return showNotFound();
  
  hydrateBoat(boat);

  // 2) Charger le mois courant d'indispo
  const today = new Date();
  await loadMonth(today.getFullYear(), today.getMonth()+1);

  // 3) Events
  wireEvents();
  recalc();
}

function pickCover(b){
  // PRIORITÉ AUX IMAGES UPLOADÉES - CORRECTION DES URLs
  if (Array.isArray(b?.images) && b.images.length > 0) {
    const main = b.images.find(i => i?.isMain);
    if (main && main.url) {
      return `https://sailingloc.onrender.com${main.url}`;
    }
    const first = b.images[0];
    if (first && first.url) {
      return `https://sailingloc.onrender.com${first.url}`;
    }
  }
  
  // FALLBACK : imageUrls (comme avant)
  if (Array.isArray(b?.imageUrls) && b.imageUrls.length > 0) {
    const imageUrl = b.imageUrls[0];
    if (imageUrl.fullUrl) {
      return imageUrl.fullUrl.replace('http://localhost:3000', 'https://sailingloc.onrender.com');
    } else if (imageUrl.url) {
      return `https://sailingloc.onrender.com${imageUrl.url}`;
    } else {
      return `https://sailingloc.onrender.com${imageUrl}`;
    }
  }
  
  // FALLBACK : image par défaut
  console.log('⚠️ Aucune image trouvée, utilisation image par défaut');
  return window.getBoatImageByType(b.type, b.category);
}

function hydrateBoat(b){
  document.title = `Réserver ${b.name || 'Bateau'} — SailingLoc`;
  
  // Mettre à jour le breadcrumb
  const breadcrumbBoatName = document.getElementById('breadcrumb-boat-name');
  if (breadcrumbBoatName) {
    breadcrumbBoatName.textContent = b.name || 'Bateau';
  }
  
  console.log('🔍 [RESERVE] Données du bateau reçues:', b);
  console.log('🔍 [RESERVE] boat.coverImageUrl:', b.coverImageUrl);
  console.log('🔍 [RESERVE] boat.images:', b.images);
  console.log('🔍 [RESERVE] boat.imageUrls:', b.imageUrls);

  const cover = pickCover(b);
  const img = document.getElementById('boat-image');

  if (cover) {
    console.log('✅ Image de couverture trouvée:', cover);
    img.src = cover;        // le backend renvoie déjà une URL absolue
    img.alt = b.name || 'Bateau';
    img.style.display = 'block';
  } else {
    console.log('⚠️ Aucune image de couverture trouvée');
    // Pas d'image : afficher un message/contextuel (pas de fallback image)
    img.style.display = 'none';
    const sum = document.querySelector('.summary-card');
    const warn = document.createElement('div');
    warn.className = 'notice error';
    warn.textContent = "Image principale manquante pour cette annonce.";
    warn.style.marginBottom = '10px';
    sum.insertBefore(warn, sum.firstChild);
  }

  qs('#boat-name').textContent = b.name || 'Bateau';
  qs('#boat-type').textContent = b.type || '';
  qs('#boat-category').textContent = b.category || '';
  qs('#boat-port').textContent = [b?.location?.marina, b?.location?.city, b?.location?.country].filter(Boolean).join(', ') || '—';

  const cap = b?.capacity?.maxPeople || b?.capacity || 1;
  qs('#boat-capacity').textContent = `${cap} pers.`;

  // Remplir le select passagers
  const sel = qs('#guests');
  sel.innerHTML = Array.from({length: cap}, (_,i)=> `<option value="${i+1}">${i+1}</option>`).join('');

  // Taux
  const rate = b?.pricing?.dailyRate || 0;
  qs('#rate').textContent = rate;
  qs('#sidebar-rate').textContent = `${rate}€`;

  // Specs (si dispo)
  const specs = b?.specifications || {};
  const ul = qs('#summary-specs');
  ul.innerHTML = '';
  const items = [
    specs.length ? `Longueur : ${specs.length} m` : null,
    specs.width  ? `Largeur : ${specs.width} m`   : null,
    specs.fuelType ? `Motorisation : ${specs.fuelType}` : null,
    b?.status ? `Statut : ${b.status}` : null
  ].filter(Boolean);
  items.forEach(txt => { const li = document.createElement('li'); li.textContent = txt; ul.appendChild(li); });
}

async function loadMonth(year, month){
  const ym = `${year}-${String(month).padStart(2,'0')}`;
  qs('#calendar-title').textContent = new Date(`${ym}-01T00:00:00`).toLocaleString('fr-FR', {month:'long', year:'numeric'});

  // Appel des indispo
  let days = [];
  try{
    const res = await fetch(`${API}/boats/${encodeURIComponent(boatId)}/availability?month=${ym}`, { cache:'no-store' });
    if (res.ok){
      const data = await res.json();
      if (Array.isArray(data.unavailable)) days = data.unavailable;
      // sinon, si backend retourne bookings, on pourrait éclater ici (non nécessaire si tu respectes le format)
    } else {
      console.warn('availability request failed', res.status);
    }
  }catch(e){ console.warn('availability fetch error', e); }

  unavailableSet = new Set(days);
  renderCalendar(year, month, unavailableSet);
  currentYearMonth = new Date(`${ym}-01T00:00:00`);
}

function renderCalendar(year, month, unavail){
  const root = qs('#calendar');
  root.innerHTML = '';

  const first = new Date(year, month-1, 1);
  const startDay = (first.getDay() + 6) % 7; // Lundi=0
  const daysCount = new Date(year, month, 0).getDate();

  // Cases vides avant le 1er
  for (let i=0;i<startDay;i++){
    const btn = document.createElement('button');
    btn.type='button'; btn.className='cal-cell empty'; btn.tabIndex=-1; btn.disabled=true;
    root.appendChild(btn);
  }

  // Jours
  for (let d=1; d<=daysCount; d++){
    const iso = toISO(year,month,d);
    const disabled = unavail.has(iso);
    const btn = document.createElement('button');
    btn.type='button';
    btn.className = `cal-cell${disabled?' disabled':''}`;
    btn.textContent = d;
    if (!disabled){
      btn.dataset.date = iso;
      btn.addEventListener('click', ()=> onPickDate(iso));
    }else{
      btn.disabled = true;
      btn.tabIndex = -1;
    }
    root.appendChild(btn);
  }

  paintSelection();
}

function onPickDate(iso){
  if (!selectedStart || (selectedStart && selectedEnd)){
    selectedStart = iso;
    selectedEnd = null;
  } else {
    if (iso < selectedStart){
      selectedEnd = selectedStart;
      selectedStart = iso;
    } else {
      selectedEnd = iso;
    }
    if (!isRangeAvailable(selectedStart, selectedEnd)){
      showFormError("Cette plage de dates contient des jours indisponibles.");
      selectedStart = selectedEnd = null;
    } else {
      hideFormError();
    }
  }
  syncInputs();
  paintSelection();
  recalc();
}

function isRangeAvailable(sIso, eIso){
  if (!sIso || !eIso) return true;
  const s = new Date(`${sIso}T00:00:00`);
  const e = new Date(`${eIso}T00:00:00`);
  for (let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){
    const day = d.toISOString().slice(0,10);
    if (unavailableSet.has(day)) return false;
  }
  return true;
}

function paintSelection(){
  document.querySelectorAll('.cal-cell').forEach(el=>{
    el.classList.remove('selected','between','start','end');
    const date = el.dataset?.date;
    if (!date) return;
    if (selectedStart && date===selectedStart) el.classList.add('selected','start');
    if (selectedEnd && date===selectedEnd) el.classList.add('selected','end');
    if (selectedStart && selectedEnd && date>selectedStart && date<selectedEnd) el.classList.add('between');
  });
}

function syncInputs(){
  const s = qs('#start-date');
  const e = qs('#end-date');
  s.value = selectedStart || '';
  e.value = selectedEnd || '';
  e.min = selectedStart || '';
}

function recalc(){
  const start = qs('#start-date').value;
  const end   = qs('#end-date').value;
  const guests = parseInt(qs('#guests').value || '1', 10);
  const cap = boat?.capacity?.maxPeople || boat?.capacity || 1;
  const nightly = boat?.pricing?.dailyRate || 0;

  let nights = 0;
  if (start && end){
    const sd = new Date(`${start}T00:00:00`);
    const ed = new Date(`${end}T00:00:00`);
    nights = Math.max(0, Math.round((ed - sd) / 86400000));
  }

  qs('#nights').textContent = nights;
  qs('#rate').textContent   = nightly;
  qs('#sidebar-rate').textContent = `${nightly}€`;
  qs('#total').textContent  = (nights * nightly).toLocaleString('fr-FR') + ' €';

  const valid = (nights>0) && (guests>=1 && guests<=cap) && isRangeAvailable(start,end);
  qs('#checkout-btn').disabled = !valid;
}

function wireEvents(){
  qs('#start-date').addEventListener('change', e=>{
    selectedStart = e.target.value || null;
    if (selectedEnd && selectedEnd < selectedStart) selectedEnd = null;
    syncInputs(); paintSelection(); recalc();
  });
  qs('#end-date').addEventListener('change', e=>{
    selectedEnd = e.target.value || null;
    syncInputs(); paintSelection(); recalc();
  });
  qs('#guests').addEventListener('change', recalc);

  qs('#prev-month').addEventListener('click', async ()=>{
    const d = new Date(currentYearMonth); d.setMonth(d.getMonth()-1);
    await loadMonth(d.getFullYear(), d.getMonth()+1);
  });
  qs('#next-month').addEventListener('click', async ()=>{
    const d = new Date(currentYearMonth); d.setMonth(d.getMonth()+1);
    await loadMonth(d.getFullYear(), d.getMonth()+1);
  });

  qs('#checkout-btn').addEventListener('click', onCheckout);
}

async function onCheckout(){
  hideFormError();
  const payload = {
    boatId,
    startDate: qs('#start-date').value,
    endDate:   qs('#end-date').value,
    passengers: parseInt(qs('#guests').value,10)
  };
  if (!payload.startDate || !payload.endDate) return;

  try{
    // Vérifier que le nombre de passagers est valide
    if (payload.passengers < 1 || payload.passengers > boat.capacity.maxPeople) {
      return showFormError(`Le nombre de passagers doit être entre 1 et ${boat.capacity.maxPeople}.`);
    }
    
    // Rediriger vers la page de récapitulatif de paiement
    const params = new URLSearchParams({
      boatId: payload.boatId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      passengers: payload.passengers
    });
    
    window.location.href = `/payment-summary.html?${params.toString()}`;
    
  }catch(err){
    console.error(err);
    showFormError("Erreur pendant la création du paiement.");
  }
}

function showNotFound(){
  const grid = document.querySelector('.booking-grid');
  if (grid) grid.style.display = 'none';
  const nf = qs('#not-found'); if (nf) nf.style.display = 'block';
}

function showFormError(msg){ const el = qs('#form-error'); el.textContent = msg; el.style.display='block'; }
function hideFormError(){ const el = qs('#form-error'); el.textContent=''; el.style.display='none'; }

function qs(sel){ return document.querySelector(sel); }
function toISO(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
