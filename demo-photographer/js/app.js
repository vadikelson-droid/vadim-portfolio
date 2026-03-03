/* ============================================
   DEFAULT DATA
   ============================================ */
const DEFAULTS = {
  settings: {
    name: 'Марія Коваленко',
    tagline: 'Весільний та портретний фотограф',
    phone: '+380 67 123 45 67',
    email: 'maria.photo@gmail.com',
    telegram: '@maria_photo',
    instagram: '@maria_kovalenko_photo',
    tgBotToken: '',
    tgChatId: ''
  },
  services: [
    { id: 's1', icon: '&#10084;', name: 'Весільна зйомка', description: 'Повний день зйомки — від зборів до першого танцю. 300+ оброблених фото, онлайн-галерея, авторська обробка.', price: 8000, currency: 'грн', prefix: 'від' },
    { id: 's2', icon: '&#128100;', name: 'Портретна зйомка', description: '1.5 години зйомки в студії або на вулиці. 50+ оброблених фото, допомога з позуванням.', price: 2500, currency: 'грн', prefix: 'від' },
    { id: 's3', icon: '&#128106;', name: 'Сімейна зйомка', description: '2 години на природі або вдома. 80+ фото, тепла атмосфера та щирі емоції всієї родини.', price: 4000, currency: 'грн', prefix: 'від' },
    { id: 's4', icon: '&#128150;', name: 'Love Story', description: 'Романтична зйомка для пари. Ідеально для запрошень або просто на згадку. 60+ фото.', price: 3500, currency: 'грн', prefix: 'від' }
  ],
  about: {
    bio: 'Вже понад 8 років я фіксую найважливіші моменти у житті людей. Моя філософія — натуральне світло, щирі емоції та мінімум постановки.',
    bio2: 'Я вірю, що найкращі фотографії народжуються тоді, коли люди просто живуть своїм моментом. Моє завдання — зробити так, щоб ви забули про камеру і насолоджувались процесом.',
    features: 'Натуральне світло,Авторська обробка,Щирі емоції,Ніжні тони,Зйомки по Україні,Онлайн-галерея',
    statShoots: 200,
    statYears: 8,
    statClients: 150,
    statPhotos: 50000
  },
  testimonials: [
    { id: 't1', name: 'Олена та Дмитро', type: 'Весільна зйомка', text: 'Марія — це справжній талант! Вона зловила кожен щирий момент нашого весілля. Фотографії вийшли неймовірно теплими та емоційними.', rating: 5 },
    { id: 't2', name: 'Анна К.', type: 'Портретна зйомка', text: 'Дуже комфортно почувалася на зйомці. Марія створює таку атмосферу, що забуваєш про камеру. Результат перевершив очікування!', rating: 5 },
    { id: 't3', name: 'Родина Мельник', type: 'Сімейна зйомка', text: 'Замовляли сімейну зйомку з дітьми — це було неймовірно весело! Діти одразу полюбили Марію. Фото — просто казка.', rating: 5 }
  ],
  categories: ['Весілля', 'Портрет', "Сім'я", 'Love Story']
};

/* ============================================
   SERVER API
   ============================================ */
const API_BASE = '/photographer/api';
const API_KEY = 'photographer-admin-key-2026';

let cachedPhotos = [];
let cachedData = {};

async function apiFetch(path, options = {}) {
  const resp = await fetch(API_BASE + path, options);
  if (!resp.ok) throw new Error('API ' + resp.status);
  return resp.json();
}

async function loadPhotos() {
  try {
    cachedPhotos = await apiFetch('/photos');
  } catch (e) {
    console.warn('Failed to load photos:', e);
    cachedPhotos = [];
  }
  return cachedPhotos;
}

async function loadSiteData() {
  try {
    cachedData = await apiFetch('/data');
  } catch (e) {
    console.warn('Failed to load site data:', e);
    cachedData = {};
  }
  return cachedData;
}

function getData(key, fallback) {
  const val = cachedData[key] !== undefined ? cachedData[key] : fallback;
  try { return JSON.parse(JSON.stringify(val)); } catch { return val; }
}

async function saveToServer(dataObj) {
  try {
    await apiFetch('/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify(dataObj)
    });
    for (const [k, v] of Object.entries(dataObj)) {
      cachedData[k] = v;
    }
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

async function uploadPhotosToServer(files, category, isAbout) {
  const formData = new FormData();
  formData.append('category', category || '');
  if (isAbout) formData.append('is_about', 'true');
  for (const file of files) {
    formData.append('photos', file);
  }
  return apiFetch('/photos', {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData
  });
}

async function updatePhotoOnServer(id, data) {
  return apiFetch('/photos/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(data)
  });
}

async function deletePhotoOnServer(id) {
  return apiFetch('/photos/' + id, {
    method: 'DELETE',
    headers: { 'X-API-Key': API_KEY }
  });
}

/* ============================================
   HASHING
   ============================================ */
async function hashPassword(password) {
  if (window.crypto && crypto.subtle) {
    try {
      const data = new TextEncoder().encode(password);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {}
  }
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) - h + password.charCodeAt(i)) | 0;
  }
  return 'h_' + Math.abs(h).toString(16).padStart(8, '0');
}

/* ============================================
   RENDER: GALLERY
   ============================================ */
let allPhotos = [];
let currentFilter = 'all';

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  allPhotos = cachedPhotos.filter(p => !p.isAbout).sort((a, b) => (a.order || 0) - (b.order || 0));

  const categories = getData('categories', DEFAULTS.categories);
  renderGalleryFilters(categories);

  const filtered = currentFilter === 'all' ? allPhotos : allPhotos.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = renderGalleryPlaceholders();
    return;
  }

  grid.innerHTML = filtered.map((photo, i) => {
    const wideClass = (i === 1 || i === 5) && filtered.length > 3 ? ' wide' : '';
    return `<div class="gallery-item${wideClass}" onclick="openLightbox(${photo.id})">
      <img src="${photo.thumbUrl}" alt="${photo.title || ''}" loading="lazy">
      <div class="gallery-item-overlay">
        <div class="gallery-item-info">
          <h4>${photo.title || ''}</h4>
          <span>${photo.category || ''}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderGalleryPlaceholders() {
  const gradients = [
    'linear-gradient(135deg,#e8dfd4,#d6cbbe)','linear-gradient(135deg,#dce4e8,#c8d5dd)',
    'linear-gradient(135deg,#e0dbe8,#cec6da)','linear-gradient(135deg,#e8dbd8,#dac8c4)',
    'linear-gradient(135deg,#dbe8db,#c4d6c4)','linear-gradient(135deg,#e8e4d4,#dad3c0)'
  ];
  return gradients.map((g, i) => {
    const wide = i === 1 ? ' wide' : '';
    return `<div class="gallery-placeholder${wide}" style="background:${g}"></div>`;
  }).join('');
}

function renderGalleryFilters(categories) {
  const cont = document.getElementById('galleryFilters');
  cont.innerHTML = `<button class="filter-btn${currentFilter === 'all' ? ' active' : ''}" data-filter="all" onclick="filterGallery('all')">Усі</button>` +
    categories.map(c => `<button class="filter-btn${currentFilter === c ? ' active' : ''}" data-filter="${c}" onclick="filterGallery('${c}')">${c}</button>`).join('');
}

function filterGallery(cat) {
  currentFilter = cat;
  renderGallery();
}

/* ============================================
   RENDER: HERO
   ============================================ */
function renderHero() {
  const settings = getData('settings', DEFAULTS.settings);
  const parts = settings.name.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  document.title = settings.name + ' | ' + settings.tagline;
  document.getElementById('heroTitle').innerHTML = `${firstName} <em>${lastName}</em>`;
  document.getElementById('heroLabel').textContent = settings.tagline;
  document.getElementById('siteLogo').innerHTML = `${firstName} <em>${lastName}</em>`;
  document.getElementById('footerLogo').innerHTML = `${firstName} <em>${lastName}</em>`;

  const heroPhoto = cachedPhotos.find(p => p.isHero);
  if (heroPhoto) {
    document.getElementById('heroBg').innerHTML = `<img src="${heroPhoto.fullUrl}" alt="">`;
  }
}

/* ============================================
   RENDER: SERVICES
   ============================================ */
function renderServices() {
  const services = getData('services', DEFAULTS.services);
  const grid = document.getElementById('servicesGrid');
  const select = document.getElementById('bookingService');

  grid.innerHTML = services.map(s => `
    <div class="service-card fade-up">
      <div class="service-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p class="service-desc">${s.description}</p>
      <div class="service-price">${s.prefix || 'від'} ${s.price.toLocaleString()} <small>${s.currency}</small></div>
      <a href="#contact" class="btn btn-outline btn-sm" onclick="preselectService('${s.name}')">Забронювати</a>
    </div>
  `).join('');

  select.innerHTML = '<option value="">Оберіть тип зйомки</option>' +
    services.map(s => `<option value="${s.name}">${s.name} — ${s.prefix || 'від'} ${s.price.toLocaleString()} ${s.currency}</option>`).join('');

  initAnimations();
}

function preselectService(name) {
  document.getElementById('bookingService').value = name;
}

/* ============================================
   RENDER: ABOUT
   ============================================ */
function renderAbout() {
  const about = getData('about', DEFAULTS.about);
  const settings = getData('settings', DEFAULTS.settings);
  const name = about.aboutName || settings.name;
  const firstName = name.split(' ')[0] || 'Марія';

  document.getElementById('aboutTitle').innerHTML = `Привіт, я <em>${firstName}</em>`;
  document.getElementById('aboutBio').innerHTML =
    `<p>${about.bio}</p>` + (about.bio2 ? `<p style="margin-top:12px">${about.bio2}</p>` : '');

  const features = about.features.split(',').map(f => f.trim()).filter(Boolean);
  document.getElementById('aboutFeatures').innerHTML = features.map(f => `<div class="about-feature">${f}</div>`).join('');

  document.getElementById('statShoots').dataset.target = about.statShoots;
  document.getElementById('statYears').dataset.target = about.statYears;
  document.getElementById('statClients').dataset.target = about.statClients;
  document.getElementById('statPhotos').dataset.target = about.statPhotos;
  document.getElementById('aboutBadgeNum').textContent = about.statYears + '+';

  const imgEl = document.getElementById('aboutImage');
  const existingImg = imgEl.querySelector('img');
  if (existingImg) existingImg.remove();

  const aboutPhoto = cachedPhotos.find(p => p.isAbout);
  if (aboutPhoto) {
    const badge = imgEl.querySelector('.about-image-badge');
    imgEl.insertBefore(Object.assign(document.createElement('img'), { src: aboutPhoto.fullUrl, alt: name }), badge);
  }
}

/* ============================================
   RENDER: TESTIMONIALS
   ============================================ */
function renderTestimonials() {
  const testimonials = getData('testimonials', DEFAULTS.testimonials);
  const grid = document.getElementById('testimonialsGrid');

  if (testimonials.length === 0) {
    grid.innerHTML = '<div class="testimonials-empty">Відгуків поки немає</div>';
    return;
  }

  grid.innerHTML = testimonials.map(t => {
    const stars = '&#9733;'.repeat(t.rating) + '<span style="opacity:.3">' + '&#9733;'.repeat(5 - t.rating) + '</span>';
    const initial = t.name.charAt(0).toUpperCase();
    return `
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-text">${t.text}</p>
        <div class="testimonial-author">
          <div class="testimonial-author-avatar">${initial}</div>
          <div class="testimonial-author-info">
            <h5>${t.name}</h5>
            <span>${t.type}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  initAnimations();
}

/* ============================================
   RENDER: CONTACT
   ============================================ */
function renderContact() {
  const settings = getData('settings', DEFAULTS.settings);
  document.getElementById('contactPhone').textContent = settings.phone;
  document.getElementById('contactEmail').textContent = settings.email;
  document.getElementById('contactTelegram').textContent = settings.telegram;
  document.getElementById('contactInstagram').textContent = settings.instagram;
}

/* ============================================
   LIGHTBOX
   ============================================ */
let lightboxPhotos = [];
let lightboxIndex = 0;

function openLightbox(photoId) {
  const filtered = currentFilter === 'all' ? allPhotos : allPhotos.filter(p => p.category === currentFilter);
  lightboxPhotos = filtered;
  lightboxIndex = filtered.findIndex(p => p.id === photoId);
  if (lightboxIndex < 0) lightboxIndex = 0;

  showLightboxPhoto();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showLightboxPhoto() {
  const photo = lightboxPhotos[lightboxIndex];
  if (!photo) return;
  document.getElementById('lightboxImg').src = photo.fullUrl;
  document.getElementById('lightboxTitle').textContent = photo.title || '';
  document.getElementById('lightboxCaption').textContent = photo.category || '';
  document.getElementById('lightboxCounter').textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function navLightbox(dir) {
  lightboxIndex += dir;
  if (lightboxIndex < 0) lightboxIndex = lightboxPhotos.length - 1;
  if (lightboxIndex >= lightboxPhotos.length) lightboxIndex = 0;
  showLightboxPhoto();
}

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

/* ============================================
   TELEGRAM
   ============================================ */
async function sendToTelegram(text) {
  const settings = getData('settings', DEFAULTS.settings);
  if (!settings.tgBotToken || !settings.tgChatId) return false;
  try {
    const resp = await fetch(`https://api.telegram.org/bot${settings.tgBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: settings.tgChatId, text, parse_mode: 'HTML' })
    });
    return resp.ok;
  } catch { return false; }
}

/* ============================================
   BOOKING FORM
   ============================================ */
async function handleBooking(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('bookingBtn');
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const service = form.service.value;
  const date = form.date.value;
  const message = form.message.value.trim();
  const settings = getData('settings', DEFAULTS.settings);

  btn.textContent = 'Надсилаю...';
  btn.disabled = true;

  const msg = `<b>&#128248; НОВЕ БРОНЮВАННЯ</b>\n\n<b>Ім'я:</b> ${escapeHTML(name)}\n<b>Телефон:</b> ${escapeHTML(phone)}\n<b>Тип зйомки:</b> ${escapeHTML(service || 'Не обрано')}\n<b>Бажана дата:</b> ${date || 'Не вказано'}\n<b>Повідомлення:</b> ${escapeHTML(message || '—')}\n\n<i>Надіслано з сайту ${escapeHTML(settings.name)}</i>`;

  await sendToTelegram(msg);

  form.style.display = 'none';
  document.getElementById('bookingSuccess').style.display = 'block';

  setTimeout(() => {
    form.style.display = '';
    document.getElementById('bookingSuccess').style.display = 'none';
    form.reset();
    btn.textContent = 'Надіслати заявку';
    btn.disabled = false;
  }, 5000);
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ============================================
   ADMIN: AUTH (two roles: photographer + developer)
   ============================================ */
let isAdmin = false;
let adminRole = '';
const DEV_HASH = 'h_62598b08';

function showAdminLogin() {
  const hasPassword = localStorage.getItem('photographer_admin_hash');
  const overlay = document.getElementById('adminLogin');
  if (!hasPassword) {
    document.getElementById('adminLoginTitle').textContent = 'Створення паролю';
    document.getElementById('adminLoginDesc').textContent = 'Створіть пароль для адмін-панелі';
    document.getElementById('adminPassLabel').textContent = 'Новий пароль';
    document.getElementById('adminPassConfirmGroup').style.display = 'block';
  } else {
    document.getElementById('adminLoginTitle').textContent = 'Вхід в панель';
    document.getElementById('adminLoginDesc').textContent = 'Введіть пароль';
    document.getElementById('adminPassLabel').textContent = 'Пароль';
    document.getElementById('adminPassConfirmGroup').style.display = 'none';
  }
  document.getElementById('adminLoginError').style.display = 'none';
  document.getElementById('adminPassInput').value = '';
  document.getElementById('adminPassConfirm').value = '';
  overlay.classList.add('open');
  setTimeout(() => document.getElementById('adminPassInput').focus(), 100);
}

function closeAdminLogin() {
  document.getElementById('adminLogin').classList.remove('open');
}

async function adminLoginSubmit() {
  const pass = document.getElementById('adminPassInput').value;
  const errorEl = document.getElementById('adminLoginError');
  const storedHash = localStorage.getItem('photographer_admin_hash');
  const hash = await hashPassword(pass);

  if (hash === DEV_HASH) {
    activateAdmin('dev');
    return;
  }

  if (!storedHash) {
    const confirm = document.getElementById('adminPassConfirm').value;
    if (pass.length < 4) {
      errorEl.textContent = 'Мінімум 4 символи';
      errorEl.style.display = 'block';
      return;
    }
    if (pass !== confirm) {
      errorEl.textContent = 'Паролі не збігаються';
      errorEl.style.display = 'block';
      return;
    }
    localStorage.setItem('photographer_admin_hash', hash);
    activateAdmin('photographer');
  } else {
    if (hash !== storedHash) {
      errorEl.textContent = 'Невірний пароль';
      errorEl.style.display = 'block';
      return;
    }
    activateAdmin('photographer');
  }
}

function activateAdmin(role) {
  isAdmin = true;
  adminRole = role || 'photographer';
  sessionStorage.setItem('photographer_admin', 'true');
  sessionStorage.setItem('photographer_admin_role', adminRole);
  closeAdminLogin();
  document.getElementById('adminToolbar').classList.add('open');
  document.body.classList.add('admin-active');
  const badge = document.querySelector('.admin-toolbar-badge');
  if (adminRole === 'dev') {
    badge.textContent = 'DEV';
    badge.style.borderColor = '#2ecc71';
    badge.style.color = '#2ecc71';
  } else {
    badge.textContent = 'ADMIN';
    badge.style.borderColor = '';
    badge.style.color = '';
  }
  renderAdminGallery();
}

function adminLogout() {
  isAdmin = false;
  adminRole = '';
  sessionStorage.removeItem('photographer_admin');
  sessionStorage.removeItem('photographer_admin_role');
  document.getElementById('adminToolbar').classList.remove('open');
  document.body.classList.remove('admin-active');
  closeAdminPanel();
}

/* ============================================
   ADMIN: PANELS
   ============================================ */
let currentAdminPanel = null;

function openAdminPanel(panel) {
  closeAdminPanel();
  const el = document.getElementById('adminPanel' + panel.charAt(0).toUpperCase() + panel.slice(1));
  if (!el) return;
  el.classList.add('open');
  currentAdminPanel = panel;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));

  if (panel === 'gallery') renderAdminGallery();
  if (panel === 'services') renderAdminServices();
  if (panel === 'about') renderAdminAbout();
  if (panel === 'testimonials') renderAdminTestimonials();
  if (panel === 'settings') renderAdminSettings();
}

function closeAdminPanel() {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  currentAdminPanel = null;
}

/* ============================================
   ADMIN: GALLERY
   ============================================ */
function renderAdminGallery() {
  const photos = cachedPhotos.filter(p => !p.isAbout).sort((a, b) => (a.order || 0) - (b.order || 0));
  const grid = document.getElementById('adminPhotosGrid');

  const categories = getData('categories', DEFAULTS.categories);
  grid.innerHTML = photos.map(p => {
    const heroLabel = p.isHero ? '<span class="photo-label hero-label">Hero</span>' : '';
    const aboutLabel = p.isAbout ? '<span class="photo-label about-label">About</span>' : '';
    const catOptions = categories.map(c => `<option value="${c}"${c === p.category ? ' selected' : ''}>${c}</option>`).join('');
    return `<div class="admin-photo-card">
      ${heroLabel}${aboutLabel}
      <img src="${p.thumbUrl}" alt="${p.title || ''}">
      <div class="admin-photo-card-overlay">
        <button class="admin-photo-btn hero" title="Встановити як Hero" onclick="setPhotoAs(${p.id},'hero')">&#9733;</button>
        <button class="admin-photo-btn" title="Встановити як About" onclick="setPhotoAs(${p.id},'about')" style="color:var(--green)">&#9786;</button>
        <button class="admin-photo-btn delete" title="Видалити" onclick="deletePhoto(${p.id})">&#10005;</button>
      </div>
      <select class="admin-photo-cat-select" onchange="changePhotoCategory(${p.id}, this.value)">
        ${catOptions}
      </select>
    </div>`;
  }).join('');

  renderAdminCategories();
  renderUploadCategorySelect();
}

async function handleFileUpload(files) {
  if (!files.length) return;
  const select = document.getElementById('uploadCategory');
  const category = select ? select.value : (getData('categories', DEFAULTS.categories)[0] || '');

  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) return;

  try {
    await uploadPhotosToServer(imageFiles, category);
    await loadPhotos();
    renderAdminGallery();
    renderGallery();
    renderHero();
  } catch (e) {
    console.error('Upload failed:', e);
    alert('Помилка завантаження!');
  }
}

function renderUploadCategorySelect() {
  const select = document.getElementById('uploadCategory');
  if (!select) return;
  const categories = getData('categories', DEFAULTS.categories);
  select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function changePhotoCategory(id, newCategory) {
  try {
    await updatePhotoOnServer(id, { category: newCategory });
    await loadPhotos();
    renderGallery();
  } catch (e) {
    alert('Помилка оновлення!');
  }
}

async function deletePhoto(id) {
  if (!confirm('Видалити це фото?')) return;
  try {
    await deletePhotoOnServer(id);
    await loadPhotos();
    renderAdminGallery();
    renderGallery();
    renderHero();
    renderAbout();
  } catch (e) {
    alert('Помилка видалення!');
  }
}

async function setPhotoAs(id, role) {
  const photo = cachedPhotos.find(p => p.id === id);
  if (!photo) return;

  const data = {};
  if (role === 'hero') data.isHero = !photo.isHero;
  if (role === 'about') data.isAbout = !photo.isAbout;

  try {
    await updatePhotoOnServer(id, data);
    await loadPhotos();
    renderAdminGallery();
    renderHero();
    renderAbout();
  } catch (e) {
    alert('Помилка оновлення!');
  }
}

function renderAdminCategories() {
  const categories = getData('categories', DEFAULTS.categories);
  const cont = document.getElementById('adminCatManager');
  cont.innerHTML = '<span style="font-size:.85rem;color:var(--text2);margin-right:8px">Категорії:</span>' +
    categories.map((c, i) => `<span class="admin-cat-tag">${c} <button onclick="removeCategory(${i})">&#10005;</button></span>`).join('') +
    `<span class="admin-cat-input"><input type="text" id="newCatInput" placeholder="Нова..." onkeydown="if(event.key==='Enter')addCategory()"><button class="btn btn-sm btn-outline" onclick="addCategory()">+</button></span>`;
}

async function addCategory() {
  const input = document.getElementById('newCatInput');
  const val = input.value.trim();
  if (!val) return;
  const categories = getData('categories', DEFAULTS.categories);
  if (!categories.includes(val)) {
    categories.push(val);
    await saveToServer({ categories });
  }
  input.value = '';
  renderAdminCategories();
  renderUploadCategorySelect();
  renderGallery();
}

async function removeCategory(index) {
  const categories = getData('categories', DEFAULTS.categories);
  categories.splice(index, 1);
  await saveToServer({ categories });
  renderAdminCategories();
  renderUploadCategorySelect();
  renderGallery();
}

/* Drag & drop */
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFileUpload(e.dataTransfer.files);
});

/* ============================================
   ADMIN: SERVICES
   ============================================ */
let editServices = [];

function renderAdminServices() {
  editServices = JSON.parse(JSON.stringify(getData('services', DEFAULTS.services)));
  const cont = document.getElementById('adminServicesList');
  cont.innerHTML = editServices.map((s, i) => `
    <div class="admin-service-card">
      <div class="admin-service-card-header">
        <h4>Послуга ${i + 1}</h4>
        <button class="btn btn-sm btn-danger" onclick="removeService(${i})">Видалити</button>
      </div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group" style="margin:0"><label>Назва</label><input value="${s.name}" onchange="editServices[${i}].name=this.value"></div>
        <div class="form-group" style="margin:0"><label>Іконка (emoji/HTML)</label><input value="${s.icon.replace(/"/g, '&quot;')}" onchange="editServices[${i}].icon=this.value"></div>
      </div>
      <div class="form-group"><label>Опис</label><textarea onchange="editServices[${i}].description=this.value">${s.description}</textarea></div>
      <div class="form-row">
        <div class="form-group" style="margin:0"><label>Ціна</label><input type="number" value="${s.price}" onchange="editServices[${i}].price=Number(this.value)"></div>
        <div class="form-group" style="margin:0"><label>Валюта</label><input value="${s.currency}" onchange="editServices[${i}].currency=this.value"></div>
        <div class="form-group" style="margin:0"><label>Префікс</label><input value="${s.prefix || 'від'}" onchange="editServices[${i}].prefix=this.value"></div>
      </div>
    </div>
  `).join('');
}

function addService() {
  editServices.push({ id: 's' + Date.now(), icon: '&#128247;', name: 'Нова послуга', description: '', price: 0, currency: 'грн', prefix: 'від' });
  renderAdminServices();
}

function removeService(i) {
  if (!confirm('Видалити послугу?')) return;
  editServices.splice(i, 1);
  renderAdminServices();
}

async function saveServices() {
  if (await saveToServer({ services: editServices })) {
    renderServices();
    alert('Збережено!');
  } else {
    alert('Помилка збереження!');
  }
}

/* ============================================
   ADMIN: ABOUT
   ============================================ */
function renderAdminAbout() {
  const about = getData('about', DEFAULTS.about);
  const settings = getData('settings', DEFAULTS.settings);
  document.getElementById('adminAboutName').value = about.aboutName || settings.name;
  document.getElementById('adminAboutBio').value = about.bio;
  document.getElementById('adminAboutBio2').value = about.bio2 || '';
  document.getElementById('adminAboutFeatures').value = about.features;
  document.getElementById('adminStatShoots').value = about.statShoots;
  document.getElementById('adminStatYears').value = about.statYears;
  document.getElementById('adminStatClients').value = about.statClients;
  document.getElementById('adminStatPhotos').value = about.statPhotos;

  const preview = document.getElementById('aboutPhotoPreview');
  const existingImg = preview.querySelector('img');
  if (existingImg) existingImg.remove();
  const placeholder = preview.querySelector('.placeholder-text');

  const aboutPhoto = cachedPhotos.find(p => p.isAbout);
  if (aboutPhoto) {
    const img = document.createElement('img');
    img.src = aboutPhoto.thumbUrl;
    img.alt = 'About photo';
    preview.appendChild(img);
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (placeholder) placeholder.style.display = '';
  }
}

async function handleAboutPhoto(files) {
  if (!files || !files.length) return;
  const file = files[0];
  if (!file.type.startsWith('image/')) return;

  try {
    await uploadPhotosToServer([file], '', true);
    await loadPhotos();
    renderAdminAbout();
    renderAbout();
  } catch (e) {
    alert('Помилка завантаження фото!');
  }
}

async function removeAboutPhoto() {
  if (!confirm('Видалити фото "Про мене"?')) return;
  const aboutPhoto = cachedPhotos.find(p => p.isAbout);
  if (aboutPhoto) {
    try {
      await deletePhotoOnServer(aboutPhoto.id);
      await loadPhotos();
    } catch (e) {
      alert('Помилка видалення!');
      return;
    }
  }
  renderAdminAbout();
  renderAbout();
}

async function saveAbout() {
  const aboutName = document.getElementById('adminAboutName').value.trim();
  const about = {
    aboutName: aboutName,
    bio: document.getElementById('adminAboutBio').value,
    bio2: document.getElementById('adminAboutBio2').value,
    features: document.getElementById('adminAboutFeatures').value,
    statShoots: Number(document.getElementById('adminStatShoots').value),
    statYears: Number(document.getElementById('adminStatYears').value),
    statClients: Number(document.getElementById('adminStatClients').value),
    statPhotos: Number(document.getElementById('adminStatPhotos').value)
  };

  const dataToSave = { about };
  if (aboutName) {
    const settings = getData('settings', DEFAULTS.settings);
    settings.name = aboutName;
    dataToSave.settings = settings;
  }

  if (await saveToServer(dataToSave)) {
    renderAbout();
    renderHero();
    renderContact();
    animateCounters();
    alert('Збережено!');
  } else {
    alert('Помилка збереження!');
  }
}

/* ============================================
   ADMIN: TESTIMONIALS
   ============================================ */
let editTestimonials = [];

function renderAdminTestimonials() {
  editTestimonials = JSON.parse(JSON.stringify(getData('testimonials', DEFAULTS.testimonials)));
  const cont = document.getElementById('adminTestimonialsList');
  cont.innerHTML = editTestimonials.map((t, i) => `
    <div class="admin-testimonial-card">
      <div class="admin-service-card-header">
        <h4>Відгук ${i + 1}</h4>
        <button class="btn btn-sm btn-danger" onclick="removeTestimonial(${i})">Видалити</button>
      </div>
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group" style="margin:0"><label>Ім'я клієнта</label><input value="${t.name}" onchange="editTestimonials[${i}].name=this.value"></div>
        <div class="form-group" style="margin:0"><label>Тип зйомки</label><input value="${t.type}" onchange="editTestimonials[${i}].type=this.value"></div>
        <div class="form-group" style="margin:0"><label>Рейтинг (1-5)</label><input type="number" min="1" max="5" value="${t.rating}" onchange="editTestimonials[${i}].rating=Number(this.value)"></div>
      </div>
      <div class="form-group"><label>Текст відгуку</label><textarea onchange="editTestimonials[${i}].text=this.value">${t.text}</textarea></div>
    </div>
  `).join('');
}

function addTestimonial() {
  editTestimonials.push({ id: 't' + Date.now(), name: '', type: '', text: '', rating: 5 });
  renderAdminTestimonials();
}

function removeTestimonial(i) {
  editTestimonials.splice(i, 1);
  renderAdminTestimonials();
}

async function saveTestimonials() {
  if (await saveToServer({ testimonials: editTestimonials })) {
    renderTestimonials();
    alert('Збережено!');
  } else {
    alert('Помилка збереження!');
  }
}

/* ============================================
   ADMIN: SETTINGS
   ============================================ */
function renderAdminSettings() {
  const settings = getData('settings', DEFAULTS.settings);
  document.getElementById('settingName').value = settings.name;
  document.getElementById('settingTagline').value = settings.tagline;
  document.getElementById('settingPhone').value = settings.phone;
  document.getElementById('settingEmail').value = settings.email;
  document.getElementById('settingTelegram').value = settings.telegram;
  document.getElementById('settingInstagram').value = settings.instagram;
  document.getElementById('settingTgToken').value = settings.tgBotToken;
  document.getElementById('settingTgChatId').value = settings.tgChatId;
}

async function saveSettings() {
  const settings = {
    name: document.getElementById('settingName').value.trim(),
    tagline: document.getElementById('settingTagline').value.trim(),
    phone: document.getElementById('settingPhone').value.trim(),
    email: document.getElementById('settingEmail').value.trim(),
    telegram: document.getElementById('settingTelegram').value.trim(),
    instagram: document.getElementById('settingInstagram').value.trim(),
    tgBotToken: document.getElementById('settingTgToken').value.trim(),
    tgChatId: document.getElementById('settingTgChatId').value.trim()
  };
  if (await saveToServer({ settings })) {
    renderHero();
    renderContact();
    renderServices();
    alert('Збережено!');
  } else {
    alert('Помилка збереження!');
  }
}

async function testTelegram() {
  const token = document.getElementById('settingTgToken').value.trim();
  const chatId = document.getElementById('settingTgChatId').value.trim();
  const status = document.getElementById('tgTestStatus');
  if (!token || !chatId) {
    status.textContent = 'Введіть токен і Chat ID';
    status.style.color = 'var(--red)';
    return;
  }
  status.textContent = 'Надсилаю...';
  status.style.color = 'var(--text2)';
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ Telegram підключено! Сповіщення працюють.\nСайт: ' + getData('settings', DEFAULTS.settings).name, parse_mode: 'HTML' })
    });
    if (resp.ok) {
      status.textContent = 'Успішно!';
      status.style.color = 'var(--green)';
    } else {
      status.textContent = 'Помилка: перевірте токен і Chat ID';
      status.style.color = 'var(--red)';
    }
  } catch {
    status.textContent = "Помилка з'єднання";
    status.style.color = 'var(--red)';
  }
}

async function changePassword() {
  const pass = document.getElementById('settingNewPass').value;
  const confirm = document.getElementById('settingNewPassConfirm').value;
  if (pass.length < 4) { alert('Мінімум 4 символи'); return; }
  if (pass !== confirm) { alert('Паролі не збігаються'); return; }
  const hash = await hashPassword(pass);
  localStorage.setItem('photographer_admin_hash', hash);
  document.getElementById('settingNewPass').value = '';
  document.getElementById('settingNewPassConfirm').value = '';
  alert('Пароль змінено!');
}

/* ============================================
   NAVIGATION & UI
   ============================================ */
function toggleMenu() {
  document.getElementById('mainNav').classList.toggle('open');
  document.getElementById('burger').classList.toggle('active');
}

function closeMenu() {
  document.getElementById('mainNav').classList.remove('open');
  document.getElementById('burger').classList.remove('active');
}

document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = document.body.classList.contains('admin-active') ? 120 : 72;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      document.getElementById('header').classList.toggle('scrolled', y > 60);
      document.getElementById('scrollTop').classList.toggle('visible', y > 500);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

/* ============================================
   COUNTER ANIMATION
   ============================================ */
let countersAnimated = false;
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target) || 0;
    const duration = 2000;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
  countersAnimated = true;
}

/* ============================================
   INTERSECTION OBSERVER
   ============================================ */
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.closest('#statsSection') && !countersAnimated) {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}

/* ============================================
   INIT
   ============================================ */
async function init() {
  await Promise.all([loadPhotos(), loadSiteData()]);

  renderHero();
  renderGallery();
  renderServices();
  renderAbout();
  renderTestimonials();
  renderContact();
  initAnimations();

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  if (sessionStorage.getItem('photographer_admin') === 'true') {
    const savedRole = sessionStorage.getItem('photographer_admin_role') || 'photographer';
    activateAdmin(savedRole);
  }

  if (new URLSearchParams(window.location.search).has('admin')) {
    showAdminLogin();
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      if (isAdmin) adminLogout();
      else showAdminLogin();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
