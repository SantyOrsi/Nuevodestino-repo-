/**
 * agencia.js
 * Arquitectura basada en clases ES6+
 *
 * Clases:
 *  - PackageStore     : maneja persistencia en Firebase Firestore
 *  - PackageRenderer  : construye y renderiza las cards en el DOM
 *  - FilterController : controla los filtros por categoría
 *  - ModalController  : abre/cierra el modal de detalle de paquete
 *  - AdminAuth        : maneja login/logout del panel admin
 *  - AdminDrawer      : controla el drawer lateral del admin
 *  - PackageForm      : formulario CRUD de paquetes dentro del drawer
 *  - HeroAnimator     : animaciones de entrada del hero
 *  - ScrollReveal     : efecto reveal en scroll con IntersectionObserver
 *  - NavController    : comportamiento del navbar al hacer scroll
 *  - ContactForm      : maneja el formulario de consulta de clientes
 *  - LanguageToggle   : traducción ES/EN de toda la página
 */

'use strict';

/* ============================================================
   FIREBASE CONFIG
============================================================ */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA-rqJU8LIZyUajUKzzEkbo67ASlPmH-GQ",
  authDomain:        "nuevo-destino-web.firebaseapp.com",
  projectId:         "nuevo-destino-web",
  storageBucket:     "nuevo-destino-web.firebasestorage.app",
  messagingSenderId: "287208628191",
  appId:             "1:287208628191:web:cf99598c33cd1614766e6a",
  measurementId:     "G-TP19NYNE9N"
};

/* ============================================================
   CONSTANTS
============================================================ */
const WSP_NUMBER  = '5493413341317';
const COLLECTION  = 'packages';

const EMOJIS = [
  '✈️','🏔️','🍷','💧','🌴','🗼','🏖️','🎓',
  '🌵','🛍️','🏝️','🏕️','⛷️','🌊','🎭','🍾',
  '🚢','🗺️','🌍','🏜️',
];

const STATIC_PACKAGES = [
  {
    id: 'static-1', cat: 'nacional', catLabel: 'Nacional · Patagonia',
    emoji: '🏔️', title: 'Bariloche Clásico', image: '',
    short: 'Montañas, lagos y chocolate. La Patagonia te espera.',
    desc: 'Descubrí la magia de la Patagonia con este paquete completo. Lagos cristalinos, montañas nevadas, chocolate artesanal y aventura en cada rincón. Ideal para parejas, familias y grupos.',
    includes: ['Transporte ida y vuelta desde Rosario','Alojamiento 5 noches en hotel 3★','Desayuno todos los días','City tour por Bariloche','Excursión Circuito Chico','Seguro de viaje','Asistencia al viajero'],
    precio: '$280.000', dur: '6 días / 5 noches', pers: 'Mínimo 2 personas', sal: 'Salidas todos los viernes',
  },
  {
    id: 'static-2', cat: 'nacional', catLabel: 'Nacional · Cuyo',
    emoji: '🍷', title: 'Mendoza & Vinos', image: '',
    short: 'Bodegas, Malbec y el Aconcagua de fondo.',
    desc: 'Un viaje para los sentidos en la tierra del Malbec. Bodegas premium, degustaciones guiadas, el Aconcagua en el horizonte y la mejor gastronomía regional.',
    includes: ['Transporte ida y vuelta desde Rosario','Alojamiento 4 noches en lodge boutique','Desayuno y cena incluidos','Visita a 3 bodegas premium con degustación','Tour por Mendoza','Excursión a Luján de Cuyo','Seguro de viaje'],
    precio: '$245.000', dur: '5 días / 4 noches', pers: 'Mínimo 2 personas', sal: 'Salidas los jueves',
  },
  {
    id: 'static-3', cat: 'nacional', catLabel: 'Nacional · Misiones',
    emoji: '💧', title: 'Iguazú Mágico', image: '',
    short: 'Una de las 7 maravillas naturales del mundo.',
    desc: 'Las Cataratas del Iguazú, una de las maravillas naturales del mundo. Paseos en bote bajo las cataratas, pasarelas elevadas, flora y fauna únicos.',
    includes: ['Transporte aéreo ida y vuelta','Alojamiento 3 noches en hotel 4★','Desayuno buffet incluido','Entrada a Parque Nacional Iguazú','Paseo en Zodiac Gran Aventura','Transfer aeropuerto-hotel','Seguro de viaje completo'],
    precio: '$320.000', dur: '4 días / 3 noches', pers: 'Desde 1 persona', sal: 'Viernes y domingos',
  },
  {
    id: 'static-4', cat: 'internacional', catLabel: 'Internacional · Brasil',
    emoji: '🌴', title: 'Brasil – Río & Foz', image: '',
    short: 'Corcovado, Copacabana y las Cataratas en un viaje.',
    desc: 'El combo perfecto: Río de Janeiro con el Cristo Redentor y las playas de Copacabana, más las espectaculares Cataratas de Iguazú del lado brasileño.',
    includes: ['Transporte ida y vuelta','Vuelos internos Río–Foz','Alojamiento 7 noches','Desayuno todos los días','Excursión al Corcovado','Teleférico Pan de Azúcar','Entrada Parque Iguazú Brasil','Asistencia internacional'],
    precio: 'USD 1.400', dur: '8 días / 7 noches', pers: 'Mínimo 2 personas', sal: 'Salidas semanales',
  },
  {
    id: 'static-5', cat: 'internacional', catLabel: 'Internacional · Europa',
    emoji: '🗼', title: 'Europa Clásica', image: '',
    short: 'París, Roma, Barcelona y Ámsterdam en 14 días.',
    desc: 'Arte, historia, gastronomía y arquitectura en un recorrido diseñado para vivir Europa de verdad. Guía en español incluido durante todo el viaje.',
    includes: ['Vuelo internacional ida y vuelta','Alojamiento 13 noches hoteles 3★','Desayuno continental diario','Trenes de alta velocidad inter-ciudades','Guía en español todo el recorrido','Entradas a museos principales','Seguro de viaje completo'],
    precio: 'USD 3.800', dur: '14 días / 13 noches', pers: 'Mínimo 4 personas', sal: 'Salidas mensuales',
  },
  {
    id: 'static-6', cat: 'internacional', catLabel: 'Internacional · México',
    emoji: '🏖️', title: 'Cancún & Caribe', image: '',
    short: 'All-inclusive en el Caribe, cenotes y Chichén Itzá.',
    desc: 'Sol, arena blanca y mar turquesa. All-inclusive en resort 5 estrellas, cenotes, ruinas mayas de Chichén Itzá y la vibrante vida nocturna de Cancún.',
    includes: ['Vuelo internacional ida y vuelta','7 noches en resort 5★ all-inclusive','Bebidas y comidas 24hs','Excursión a Chichén Itzá','Nado en cenotes','Transfer aeropuerto','Seguro de viaje completo'],
    precio: 'USD 2.200', dur: '8 días / 7 noches', pers: 'Desde 1 persona', sal: 'Salidas viernes',
  },
  {
    id: 'static-7', cat: 'egresados', catLabel: 'Egresados · Patagonia',
    emoji: '🎓', title: 'Egresados – Bariloche', image: '',
    short: 'El viaje de tu vida con tu promoción. Inolvidable.',
    desc: 'El viaje de egresados más solicitado del país. Bariloche con actividades especiales para grupos de estudiantes: rafting, trekking, ski y mucho más.',
    includes: ['Micro ida y vuelta desde Rosario','Alojamiento 5 noches hostería grupal','Pensión completa','Coordinador de grupo todo el viaje','Actividades nocturnas programadas','Excursión Circuito Grande','Actividad de aventura a elección','Seguro para menores'],
    precio: '$310.000', dur: '6 días / 5 noches', pers: 'Grupos de 20 o más', sal: 'Programamos tu fecha',
  },
  {
    id: 'static-8', cat: 'grupal', catLabel: 'Grupal · Noroeste',
    emoji: '🌵', title: 'Salta & Jujuy', image: '',
    short: 'Cerros de colores, salinas y cultura andina.',
    desc: 'El noroeste argentino en su máximo esplendor. Cerro de los 7 Colores, Salinas Grandes, Quebrada de Humahuaca (Patrimonio UNESCO) y bodegas de altura.',
    includes: ['Transporte ida y vuelta','Alojamiento 6 noches hoteles boutique','Desayuno y cena incluidos','Excursión Purmamarca y Salinas','Tour Quebrada de Humahuaca','Visita a bodega de altura','Guía local especializado','Seguro de viaje'],
    precio: '$265.000', dur: '7 días / 6 noches', pers: 'Mínimo 10 personas', sal: 'Salidas mensuales',
  },
  {
    id: 'static-9', cat: 'grupal', catLabel: 'Grupal · Shopping',
    emoji: '🛍️', title: 'Tours de Compras', image: '',
    short: 'El tour favorito para grupos. Outlets y shoppings.',
    desc: 'El tour favorito para grupos. Outlets, shoppings y centros comerciales con transporte, coordinador y tiempo libre para comprar todo lo que necesitás.',
    includes: ['Micro ida y vuelta el mismo día','Coordinador de grupo durante el tour','Listado de tiendas y outlets','Parada para almuerzo libre','Bodega en el micro para compras','Seguro básico'],
    precio: '$45.000', dur: '1 día (ida y vuelta)', pers: 'Mínimo 15 personas', sal: 'Fines de semana y feriados',
  },
];


/* ============================================================
   CLASS: PackageStore
   Responsabilidad: leer/escribir paquetes en Firebase Firestore.
============================================================ */
class PackageStore {
  constructor() {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    this._db    = firebase.firestore();
    this._col   = this._db.collection(COLLECTION);
    this._cache = [];
  }

  /**
   * Suscribe un callback que se ejecuta cada vez que cambian los paquetes.
   * Se llama inmediatamente con el estado actual (tiempo real).
   */
  subscribe(cb) {
    return this._col
      .onSnapshot(snapshot => {
        this._cache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        cb(this._cache);
      }, err => {
        console.error('Firestore error:', err);
        cb(this._cache);
      });
  }

  /** Caché local síncrono para uso interno del drawer */
  getAll() { return this._cache; }

  async add(pkg) {
    const data = { ...pkg, _createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    await this._col.doc(pkg.id).set(data);
  }

  async update(pkg) {
    await this._col.doc(pkg.id).set(pkg, { merge: true });
  }

  async remove(id) {
    await this._col.doc(id).delete();
  }

  /** Carga los paquetes estáticos solo si la colección está vacía */
  async initWithDefaults(defaults) {
    const snap = await this._col.limit(1).get();
    if (!snap.empty) return;
    const batch = this._db.batch();
    defaults.forEach(pkg => {
      batch.set(this._col.doc(pkg.id), {
        ...pkg,
        _createdAt: firebase.firestore.Timestamp.fromDate(new Date()),
      });
    });
    await batch.commit();
  }
}


/* ============================================================
   CLASS: PackageRenderer
============================================================ */
class PackageRenderer {
  constructor(gridEl, onCardClick) {
    this._grid        = gridEl;
    this._onCardClick = onCardClick;
  }

  render(packages) {
    this._grid.innerHTML = '';
    packages.forEach(pkg => this._grid.appendChild(this._buildCard(pkg)));
  }

  prepend(pkg) {
    const card = this._buildCard(pkg);
    card.style.opacity   = '0';
    card.style.transform = 'translateY(20px)';
    this._grid.insertBefore(card, this._grid.firstChild);
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'none';
    });
  }

  updateCard(pkg) {
    const existing = this._grid.querySelector(`[data-id="${pkg.id}"]`);
    if (!existing) return;
    this._grid.replaceChild(this._buildCard(pkg), existing);
  }

  removeCard(id) {
    const card = this._grid.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.95)';
    setTimeout(() => card.remove(), 320);
  }

  _buildCard(pkg) {
    const isIntl  = pkg.cat === 'internacional';
    const article = document.createElement('article');
    article.className = 'package-card';
    article.setAttribute('data-id',    pkg.id);
    article.setAttribute('data-cat',   pkg.cat);
    article.setAttribute('role',       'listitem');
    article.setAttribute('tabindex',   '0');
    article.setAttribute('aria-label', pkg.title);
    article.innerHTML = `
      <div class="package-card__thumb">
        ${pkg.image ? `<img class="package-card__thumb-img" src="${pkg.image}" alt="${pkg.title}" loading="lazy" />` : ''}
        <div class="package-card__thumb-overlay"></div>
        <span class="package-card__emoji" aria-hidden="true">${pkg.emoji}</span>
        <span class="package-card__badge ${isIntl ? 'package-card__badge--intl' : ''}">
          ${pkg.catLabel || pkg.cat}
        </span>
      </div>
      <div class="package-card__body">
        <p class="package-card__category">${pkg.catLabel || pkg.cat}</p>
        <h3 class="package-card__title">${pkg.title}</h3>
        <p class="package-card__desc">${pkg.short || ''}</p>
        <div class="package-card__meta">
          ${pkg.dur  ? `<span class="package-card__meta-item">🕐 ${pkg.dur}</span>`  : ''}
          ${pkg.pers ? `<span class="package-card__meta-item">👥 ${pkg.pers}</span>` : ''}
        </div>
        <div class="package-card__footer">
          <div>
            <p class="package-card__price-label">Desde</p>
            <p class="package-card__price">${pkg.precio}</p>
          </div>
          <span class="package-card__cta" aria-hidden="true">Ver detalles →</span>
        </div>
      </div>`;
    article.addEventListener('click',   ()  => this._onCardClick(pkg));
    article.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._onCardClick(pkg); });
    return article;
  }
}


/* ============================================================
   CLASS: FilterController
============================================================ */
class FilterController {
  constructor(tabEls, gridEl) {
    this._tabs   = tabEls;
    this._grid   = gridEl;
    this._active = 'all';
    this._bindTabs();
  }

  apply() { this._filter(this._active); }

  _bindTabs() {
    this._tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this._tabs.forEach(t => {
          t.classList.remove('filter-bar__tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('filter-bar__tab--active');
        tab.setAttribute('aria-selected', 'true');
        this._active = tab.dataset.filter;
        this._filter(this._active);
      });
    });
  }

  _filter(val) {
    this._grid.querySelectorAll('.package-card').forEach(card => {
      const matches = val === 'all' || card.dataset.cat === val;
      card.classList.toggle('package-card--hidden', !matches);
      matches ? card.removeAttribute('aria-hidden') : card.setAttribute('aria-hidden', 'true');
    });
  }
}


/* ============================================================
   CLASS: ModalController
============================================================ */
class ModalController {
  constructor() {
    this._overlay    = document.getElementById('js-modal');
    this._closeBtn   = document.getElementById('js-modal-close');
    this._consultBtn = document.getElementById('js-modal-consult');
    this._bindClose();
  }

  open(pkg) {
    document.getElementById('js-modal-emoji').textContent = pkg.emoji;
    document.getElementById('js-modal-cat').textContent   = pkg.catLabel || pkg.cat;
    document.getElementById('js-modal-title').textContent = pkg.title;
    document.getElementById('js-modal-desc').textContent  = pkg.desc;
    document.getElementById('js-modal-price').textContent = pkg.precio;

    const metaEl = document.getElementById('js-modal-meta');
    metaEl.innerHTML = '';
    [pkg.dur, pkg.pers, pkg.sal].filter(Boolean).forEach(text => {
      const span = document.createElement('span');
      span.textContent = text;
      metaEl.appendChild(span);
    });

    const inclEl = document.getElementById('js-modal-includes');
    inclEl.innerHTML = '';
    (pkg.includes || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      inclEl.appendChild(li);
    });

    const thumbEl = document.getElementById('js-modal-thumb');
    const emojiEl = document.getElementById('js-modal-emoji');
    thumbEl.querySelectorAll('.modal__thumb-img, .modal__thumb-overlay').forEach(el => el.remove());
    if (pkg.image) {
      const img = document.createElement('img');
      img.className = 'modal__thumb-img';
      img.src = pkg.image; img.alt = pkg.title;
      const overlay = document.createElement('div');
      overlay.className = 'modal__thumb-overlay';
      thumbEl.insertBefore(overlay, emojiEl);
      thumbEl.insertBefore(img, overlay);
    }

    const msg = encodeURIComponent(`Hola! Me interesa el paquete "${pkg.title}" (${pkg.precio}). ¿Me pueden dar más información?`);
    document.getElementById('js-modal-wsp').href = `https://wa.me/${WSP_NUMBER}?text=${msg}`;

    this._consultBtn.onclick = () => {
      this.close();
      setTimeout(() => document.getElementById('consulta').scrollIntoView({ behavior: 'smooth' }), 300);
    };

    this._overlay.hidden = false;
    requestAnimationFrame(() => this._overlay.classList.add('modal-overlay--visible'));
    document.body.style.overflow = 'hidden';
  }

  close() {
    this._overlay.classList.remove('modal-overlay--visible');
    document.body.style.overflow = '';
    setTimeout(() => { this._overlay.hidden = true; }, 310);
  }

  _bindClose() {
    this._closeBtn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', e => { if (e.target === this._overlay) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !this._overlay.hidden) this.close(); });
  }
}


/* ============================================================
   CLASS: AdminAuth
   Responsabilidad: autenticación real con Firebase Auth.
============================================================ */
class AdminAuth {
  constructor() {
    this._auth = firebase.auth();
  }

  currentUser() {
    return this._auth.currentUser;
  }

  onAuthStateChanged(cb) {
    return this._auth.onAuthStateChanged(cb);
  }

  async login(email, pass) {
    await this._auth.signInWithEmailAndPassword(email, pass);
  }

  async logout() {
    await this._auth.signOut();
  }
}


/* ============================================================
   CLASS: AdminDrawer
============================================================ */
class AdminDrawer {
  constructor() {
    this._drawer   = document.getElementById('js-admin-drawer');
    this._backdrop = document.getElementById('js-admin-backdrop');
    this._closeBtn = document.getElementById('js-drawer-close');
    this._closeBtn.addEventListener('click',  () => this.close());
    this._backdrop.addEventListener('click',  () => this.close());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this._drawer.hidden) this.close();
    });
  }
  open() {
    this._drawer.hidden   = false;
    this._backdrop.hidden = false;
    requestAnimationFrame(() => this._drawer.classList.add('admin-drawer--open'));
    document.body.style.overflow = 'hidden';
  }
  close() {
    this._drawer.classList.remove('admin-drawer--open');
    document.body.style.overflow = '';
    setTimeout(() => { this._backdrop.hidden = true; }, 350);
  }
  isOpen() { return this._drawer.classList.contains('admin-drawer--open'); }
}


/* ============================================================
   CLASS: PackageForm
============================================================ */
class PackageForm {
  constructor(store, renderer, filter, onSave) {
    this._store     = store;
    this._renderer  = renderer;
    this._filter    = filter;
    this._onSave    = onSave;
    this._editingId = null;

    this._form        = document.getElementById('js-pkg-form');
    this._saveBtn     = document.getElementById('js-save-btn');
    this._saveLabel   = document.getElementById('js-save-label');
    this._cancelBtn   = document.getElementById('js-cancel-edit');
    this._listEl      = document.getElementById('js-admin-list');
    this._emptyEl     = document.getElementById('js-admin-empty');
    this._addIncBtn   = document.getElementById('js-add-include');
    this._dropZone    = document.getElementById('js-img-drop-zone');
    this._imgPreview  = document.getElementById('js-img-preview');
    this._imgFile     = document.getElementById('pf-img-file');
    this._imgUrlInput = document.getElementById('pf-img-url');
    this._imgData     = document.getElementById('pf-img-data');

    this._buildEmojiPicker();
    this._addIncludeRow('');
    this._bindEvents();
  }

  renderList() {
    const pkgs = this._store.getAll();
    this._listEl.innerHTML = '';
    this._emptyEl.style.display = pkgs.length === 0 ? 'block' : 'none';
    pkgs.forEach(pkg => {
      const li = document.createElement('li');
      li.className = `admin-pkg-item ${this._editingId === pkg.id ? 'admin-pkg-item--editing' : ''}`;
      li.dataset.id = pkg.id;
      li.innerHTML = `
        <div class="admin-pkg-item__thumb">
          ${pkg.image ? `<img src="${pkg.image}" alt="${pkg.title}">` : `<span>${pkg.emoji}</span>`}
        </div>
        <div class="admin-pkg-item__info">
          <p class="admin-pkg-item__name">${pkg.title}</p>
          <p class="admin-pkg-item__price">${pkg.precio}</p>
        </div>
        <div class="admin-pkg-item__actions">
          <button class="admin-pkg-item__btn admin-pkg-item__btn--edit" data-action="edit" data-id="${pkg.id}">✏️</button>
          <button class="admin-pkg-item__btn admin-pkg-item__btn--del"  data-action="del"  data-id="${pkg.id}">🗑</button>
        </div>`;
      this._listEl.appendChild(li);
    });
  }

  loadForEdit(pkg) {
    this._editingId = pkg.id;
    document.getElementById('pf-id').value        = pkg.id;
    document.getElementById('pf-title').value     = pkg.title;
    document.getElementById('pf-cat').value       = pkg.cat;
    document.getElementById('pf-cat-label').value = pkg.catLabel || '';
    document.getElementById('pf-precio').value    = pkg.precio;
    document.getElementById('pf-dur').value       = pkg.dur || '';
    document.getElementById('pf-pers').value      = pkg.pers || '';
    document.getElementById('pf-sal').value       = pkg.sal || '';
    document.getElementById('pf-short').value     = pkg.short || '';
    document.getElementById('pf-desc').value      = pkg.desc || '';
    this._imgData.value     = pkg.image || '';
    this._imgUrlInput.value = '';
    this._setImagePreview(pkg.image || '');
    document.getElementById('pf-emoji').value = pkg.emoji;
    this._highlightEmoji(pkg.emoji);
    document.getElementById('js-includes-editor').innerHTML = '';
    (pkg.includes || ['']).forEach(v => this._addIncludeRow(v));
    this._saveLabel.textContent = 'Actualizar paquete →';
    this._cancelBtn.hidden      = false;
    document.getElementById('js-admin-drawer').scrollTo({ top: 0, behavior: 'smooth' });
    this.renderList();
  }

  reset() {
    this._editingId = null;
    this._form.reset();
    document.getElementById('pf-id').value = '';
    this._imgData.value = '';
    this._setImagePreview('');
    this._buildEmojiPicker();
    document.getElementById('js-includes-editor').innerHTML = '';
    this._addIncludeRow('');
    this._saveLabel.textContent = 'Guardar paquete →';
    this._cancelBtn.hidden      = true;
    this.renderList();
  }

  _bindEvents() {
    this._form.addEventListener('submit', e => { e.preventDefault(); this._handleSave(); });
    this._cancelBtn.addEventListener('click', () => this.reset());
    this._addIncBtn.addEventListener('click',  () => this._addIncludeRow(''));

    this._listEl.addEventListener('click', async e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id  = btn.dataset.id;
      const pkg = this._store.getAll().find(p => p.id === id);
      if (!pkg) return;
      if (btn.dataset.action === 'edit') {
        this.loadForEdit(pkg);
      } else if (btn.dataset.action === 'del') {
        if (confirm(`¿Eliminar "${pkg.title}"?`)) {
          btn.disabled = true;
          await this._store.remove(id);
          // El snapshot listener actualiza el renderer automáticamente
        }
      }
    });

    this._imgFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._readImageFile(file);
    });

    let urlTimer;
    this._imgUrlInput.addEventListener('input', e => {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        const url = e.target.value.trim();
        if (url.startsWith('http')) {
          this._imgData.value = url;
          this._setImagePreview(url);
        }
      }, 600);
    });

    this._dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      this._dropZone.classList.add('img-drop-zone--dragover');
    });
    this._dropZone.addEventListener('dragleave', () => {
      this._dropZone.classList.remove('img-drop-zone--dragover');
    });
    this._dropZone.addEventListener('drop', e => {
      e.preventDefault();
      this._dropZone.classList.remove('img-drop-zone--dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this._readImageFile(file);
    });
  }

  async _handleSave() {
    const pkg = {
      id:       this._editingId || `pkg-${Date.now()}`,
      cat:      document.getElementById('pf-cat').value,
      catLabel: document.getElementById('pf-cat-label').value.trim()
                || this._catLabelDefault(document.getElementById('pf-cat').value),
      emoji:    document.getElementById('pf-emoji').value,
      image:    this._imgData.value.trim(),
      title:    document.getElementById('pf-title').value.trim(),
      short:    document.getElementById('pf-short').value.trim(),
      desc:     document.getElementById('pf-desc').value.trim(),
      includes: this._getIncludes(),
      precio:   document.getElementById('pf-precio').value.trim(),
      dur:      document.getElementById('pf-dur').value.trim(),
      pers:     document.getElementById('pf-pers').value.trim(),
      sal:      document.getElementById('pf-sal').value.trim(),
    };

    this._saveBtn.disabled      = true;
    this._saveLabel.textContent = 'Guardando…';

    try {
      const isEdit = !!this._editingId;
      if (isEdit) {
        await this._store.update(pkg);
      } else {
        await this._store.add(pkg);
      }
      this._onSave(isEdit ? 'updated' : 'created');
      this.reset();
    } catch (err) {
      console.error('Error al guardar:', err);
      this._saveLabel.textContent = '⚠️ Error al guardar';
      setTimeout(() => { this._saveLabel.textContent = 'Guardar paquete →'; }, 2500);
    } finally {
      this._saveBtn.disabled = false;
    }
  }

  _addIncludeRow(value) {
    const editor = document.getElementById('js-includes-editor');
    const li = document.createElement('li');
    li.className = 'includes-editor__item';
    li.innerHTML = `
      <input class="form-field__input" type="text" placeholder="Ej: Alojamiento 3 noches en hotel 4★" value="${value}">
      <button type="button" class="includes-editor__remove" aria-label="Eliminar">✕</button>`;
    li.querySelector('button').addEventListener('click', () => li.remove());
    editor.appendChild(li);
    if (!value) li.querySelector('input').focus();
  }

  _getIncludes() {
    return [...document.querySelectorAll('.includes-editor__item input')]
      .map(i => i.value.trim()).filter(Boolean);
  }

  _buildEmojiPicker() {
    const picker = document.getElementById('js-emoji-picker');
    picker.innerHTML = '';
    EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-picker__option';
      btn.textContent = emoji;
      btn.setAttribute('aria-label', emoji);
      btn.addEventListener('click', () => {
        document.getElementById('pf-emoji').value = emoji;
        this._highlightEmoji(emoji);
      });
      picker.appendChild(btn);
    });
    this._highlightEmoji(EMOJIS[0]);
  }

  _highlightEmoji(emoji) {
    document.querySelectorAll('.emoji-picker__option').forEach(btn => {
      btn.classList.toggle('emoji-picker__option--selected', btn.textContent === emoji);
    });
  }

  _readImageFile(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      this._imgData.value     = ev.target.result;
      this._setImagePreview(ev.target.result);
      this._imgUrlInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  _setImagePreview(src) {
    this._imgPreview.innerHTML = src
      ? `<img src="${src}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`
      : `<span class="img-drop-zone__icon">🖼️</span><p class="img-drop-zone__hint">Arrastrá una imagen o hacé clic</p>`;
  }

  _catLabelDefault(cat) {
    return { nacional: 'Nacional', internacional: 'Internacional', egresados: 'Egresados', grupal: 'Grupal' }[cat] || cat;
  }
}


/* ============================================================
   CLASS: HeroAnimator
============================================================ */
class HeroAnimator {
  run() {
    const tag = document.getElementById('js-hero-tag');
    setTimeout(() => this._reveal(tag), 120);
    document.querySelectorAll('.hero__title-line').forEach((line, i) => {
      setTimeout(() => { line.style.clipPath = 'inset(0 0 0% 0)'; }, 200 + i * 140);
    });
    [['js-hero-desc', 640], ['js-hero-badges', 800]].forEach(([id, delay]) => {
      const el = document.getElementById(id);
      if (el) setTimeout(() => this._reveal(el), delay);
    });
  }
  _reveal(el) {
    if (!el) return;
    el.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
    el.style.opacity    = '1';
    el.style.transform  = 'none';
  }
}


/* ============================================================
   CLASS: ScrollReveal
============================================================ */
class ScrollReveal {
  constructor() {
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('is-visible'), i * 80);
          this._observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
  }
  observe() {
    document.querySelectorAll('[data-reveal]').forEach(el => this._observer.observe(el));
  }
}


/* ============================================================
   CLASS: NavController
============================================================ */
class NavController {
  constructor(navEl) {
    this._nav = navEl;
    window.addEventListener('scroll', () => {
      this._nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    }, { passive: true });
  }
}


/* ============================================================
   CLASS: ContactForm
============================================================ */
class ContactForm {
  constructor(formEl) {
    this._form = formEl;
    this._form.addEventListener('submit', e => this._handleSubmit(e));
  }
  _handleSubmit(e) {
    e.preventDefault();
    const btn  = this._form.querySelector('.btn--primary');
    const span = btn.querySelector('span');
    span.textContent     = '✓ Enviado — te contactamos pronto';
    btn.style.background = '#25D366';
    setTimeout(() => {
      span.textContent     = 'Consultar mi viaje →';
      btn.style.background = '';
    }, 3500);
  }
}


/* ============================================================
   CLASS: LanguageToggle
============================================================ */
class LanguageToggle {
  constructor(btnId, flagId, labelId) {
    this._btn   = document.getElementById(btnId);
    this._flag  = document.getElementById(flagId);
    this._label = document.getElementById(labelId);
    this._lang  = 'es';

    this._strings = {
      es: {
        'nav.inicio':    'Inicio',      'nav.traslados': 'Traslados',
        'nav.agencia':   'Agencia',     'nav.consultar': 'Consultar',
        'hero.watermark':'VIAJES',      'hero.breadcrumb':'Agencia de Viajes',
        'hero.tag':      'Agencia habilitada · Turismo',
        'hero.title1':   'Nuevo Destino', 'hero.title2': 'Viajes.',
        'hero.desc':     'Agencia de turismo nacional e internacional habilitada. Paquetes a medida, excursiones y viajes grupales para que solo te preocupes de disfrutar.',
        'hero.badge1':   'Turismo nacional', 'hero.badge2': 'Internacional',
        'hero.badge3':   'Viajes grupales',  'hero.badge4': 'Paquetes a medida',
        'filter.all':'Todos','filter.nacional':'Nacional','filter.internacional':'Internacional',
        'filter.egresados':'Egresados','filter.grupal':'Grupal',
        'packages.heading':'Paquetes <em>turísticos.</em>',
        'packages.sub':  'Hacé clic en cualquier paquete para ver detalles y consultar.',
        'srv.tag':'Qué ofrecemos','srv.heading':'Servicios de <em>agencia.</em>',
        'srv.sub':'Agencia habilitada para operar turismo nacional e internacional.',
        'srv.nacional.title':'Turismo nacional',
        'srv.nacional.1':'Transporte turístico nacional','srv.nacional.2':'Paquetes completos con alojamiento',
        'srv.nacional.3':'Viajes grupales y excursiones','srv.nacional.4':'Operación de viajes organizados',
        'srv.inter.title':'Turismo internacional',
        'srv.inter.1':'Paquetes internacionales completos','srv.inter.2':'Traslados aéreos y marítimos',
        'srv.inter.3':'Servicios receptivos en destino','srv.inter.4':'Asistencia al viajero internacional',
        'srv.receptivo.title':'Servicios receptivos',
        'srv.receptivo.1':'Transfer aeropuerto / hotel','srv.receptivo.2':'Excursiones en destino',
        'srv.receptivo.3':'Servicios para agencias de turismo','srv.receptivo.4':'City tours personalizados',
        'contact.tag':'Consultá tu viaje','contact.heading':'¿A dónde querés <em>viajar?</em>',
        'contact.sub':'Un asesor te contacta para armar el paquete ideal para vos.',
        'cform.name.label':'Nombre y apellido','cform.name.ph':'Tu nombre',
        'cform.phone.label':'Teléfono / WhatsApp','cform.email.label':'Email',
        'cform.type.label':'Tipo de viaje','cform.type.opt0':'Seleccioná…',
        'cform.type.opt1':'Nacional','cform.type.opt2':'Internacional',
        'cform.type.opt3':'Egresados','cform.type.opt4':'Tour de compras',
        'cform.type.opt5':'Grupal a medida','cform.type.opt6':'Otro',
        'cform.pax.label':'Cantidad de personas','cform.pax.opt0':'Estimado…',
        'cform.pax.opt1':'1 – 2 personas','cform.pax.opt2':'3 – 5 personas',
        'cform.pax.opt3':'6 – 15 personas','cform.pax.opt4':'16 – 30 personas','cform.pax.opt5':'Más de 30',
        'cform.dest.label':'Destino de interés','cform.dest.ph':'Ej: Bariloche, Europa…',
        'cform.date.label':'Fecha estimada','cform.date.ph':'Ej: Julio 2026',
        'cform.msg.label':'Contanos más','cform.msg.ph':'¿Qué tipo de experiencia buscás?',
        'cform.submit':'Consultar mi viaje →',
        'footer.brand':'Viajes','footer.copy':'© 2026 · Agencia habilitada · Rosario, Argentina',
        'modal.includes':'¿Qué incluye?','modal.priceLabel':'Precio desde',
        'modal.priceNote':'por persona','modal.disclaimer':'Precios sujetos a disponibilidad. Consultá con nuestro equipo.',
        'modal.consult':'Consultar este paquete','wsp.tooltip':'Escribinos',
      },
      en: {
        'nav.inicio':'Home','nav.traslados':'Transfers',
        'nav.agencia':'Agency','nav.consultar':'Enquire',
        'hero.watermark':'TRAVEL','hero.breadcrumb':'Travel Agency',
        'hero.tag':'Licensed agency · Tourism',
        'hero.title1':'Nuevo Destino','hero.title2':'Travel.',
        'hero.desc':'Licensed national and international travel agency. Tailor-made packages, excursions and group trips — you just focus on enjoying.',
        'hero.badge1':'Domestic tourism','hero.badge2':'International',
        'hero.badge3':'Group travel','hero.badge4':'Tailor-made packages',
        'filter.all':'All','filter.nacional':'Domestic','filter.internacional':'International',
        'filter.egresados':'School trips','filter.grupal':'Group',
        'packages.heading':'<em>Travel</em> packages.',
        'packages.sub':'Click on any package to see details and enquire.',
        'srv.tag':'What we offer','srv.heading':'<em>Agency</em> services.',
        'srv.sub':'Licensed to operate national and international tourism.',
        'srv.nacional.title':'Domestic tourism',
        'srv.nacional.1':'National tourist transport','srv.nacional.2':'Full packages with accommodation',
        'srv.nacional.3':'Group travel and excursions','srv.nacional.4':'Organised trip operations',
        'srv.inter.title':'International tourism',
        'srv.inter.1':'Full international packages','srv.inter.2':'Air and sea transfers',
        'srv.inter.3':'Receptive services at destination','srv.inter.4':'International traveller assistance',
        'srv.receptivo.title':'Receptive services',
        'srv.receptivo.1':'Airport / hotel transfer','srv.receptivo.2':'Excursions at destination',
        'srv.receptivo.3':'Services for travel agencies','srv.receptivo.4':'Personalised city tours',
        'contact.tag':'Enquire about your trip','contact.heading':'Where do you want to <em>travel?</em>',
        'contact.sub':'An adviser will contact you to put together the ideal package for you.',
        'cform.name.label':'Full name','cform.name.ph':'Your name',
        'cform.phone.label':'Phone / WhatsApp','cform.email.label':'Email',
        'cform.type.label':'Trip type','cform.type.opt0':'Select…',
        'cform.type.opt1':'Domestic','cform.type.opt2':'International',
        'cform.type.opt3':'School trip','cform.type.opt4':'Shopping tour',
        'cform.type.opt5':'Custom group','cform.type.opt6':'Other',
        'cform.pax.label':'Number of people','cform.pax.opt0':'Estimate…',
        'cform.pax.opt1':'1 – 2 people','cform.pax.opt2':'3 – 5 people',
        'cform.pax.opt3':'6 – 15 people','cform.pax.opt4':'16 – 30 people','cform.pax.opt5':'More than 30',
        'cform.dest.label':'Destination of interest','cform.dest.ph':'E.g.: Bariloche, Europe…',
        'cform.date.label':'Estimated date','cform.date.ph':'E.g.: July 2026',
        'cform.msg.label':'Tell us more','cform.msg.ph':'What kind of experience are you looking for?',
        'cform.submit':'Enquire about my trip →',
        'footer.brand':'Travel','footer.copy':'© 2026 · Licensed agency · Rosario, Argentina',
        'modal.includes':"What's included?",'modal.priceLabel':'Price from',
        'modal.priceNote':'per person','modal.disclaimer':'Prices subject to availability. Contact our team.',
        'modal.consult':'Enquire about this package','wsp.tooltip':'Message us',
      },
    };

    if (!this._btn) return;
    this._btn.addEventListener('click',    ()  => this._toggle());
    this._btn.addEventListener('touchend', (e) => { e.preventDefault(); this._toggle(); });
  }

  _toggle() {
    this._lang = this._lang === 'es' ? 'en' : 'es';
    this._applyLanguage();
    this._updateBtn();
  }

  _applyLanguage() {
    const dict = this._strings[this._lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] === undefined) return;
      dict[key].includes('<') ? (el.innerHTML = dict[key]) : (el.textContent = dict[key]);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    document.documentElement.lang = this._lang;
  }

  _updateBtn() {
    this._flag.textContent  = this._lang === 'en' ? '🇦🇷' : '🇬🇧';
    this._label.textContent = this._lang === 'en' ? 'ES'   : 'EN';
  }
}


/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {

  /* 1 · Store Firebase */
  const store = new PackageStore();
  await store.initWithDefaults(STATIC_PACKAGES);

  /* 2 · Modal */
  const modal = new ModalController();

  /* 3 · Renderer */
  const gridEl   = document.getElementById('js-package-grid');
  const renderer = new PackageRenderer(gridEl, (pkg) => modal.open(pkg));

  /* 4 · Filter */
  const filterTabs = document.querySelectorAll('.filter-bar__tab');
  const filter     = new FilterController(filterTabs, gridEl);

  /* 5 · Auth Firebase */
  const auth = new AdminAuth();

  /* 6 · Drawer */
  const drawer = new AdminDrawer();

  /* 7 · Package Form */
  const pkgForm = new PackageForm(store, renderer, filter, (action) => {
    const header   = document.querySelector('.admin-drawer__title');
    const original = header.innerHTML;
    header.innerHTML = action === 'created'
      ? 'Paquete <em>publicado ✓</em>'
      : 'Paquete <em>actualizado ✓</em>';
    setTimeout(() => { header.innerHTML = original; }, 2200);
  });

  /* 8 · Suscribir al store en tiempo real → actualiza renderer + lista admin */
  store.subscribe(pkgs => {
    renderer.render(pkgs);
    filter.apply();
    pkgForm.renderList();
  });

  /* 9 · Login modal */
  const loginModal = document.getElementById('js-login-modal');
  const loginClose = document.getElementById('js-login-close');
  const loginForm  = document.getElementById('js-login-form');
  const loginError = document.getElementById('js-login-error');
  const adminBtn   = document.getElementById('js-admin-login-btn');
  const logoutBtn  = document.getElementById('js-logout-btn');

  function openLoginModal() {
    loginModal.hidden = false;
    requestAnimationFrame(() => loginModal.classList.add('modal-overlay--visible'));
    document.body.style.overflow = 'hidden';
  }
  function closeLoginModal() {
    loginModal.classList.remove('modal-overlay--visible');
    document.body.style.overflow = '';
    setTimeout(() => { loginModal.hidden = true; }, 310);
  }

  // Escuchar cambios de sesión Firebase
  auth.onAuthStateChanged(user => {
    if (user) {
      // Usuario logueado: mostrar botón Admin activo
      adminBtn.textContent = 'Admin ✓';
    } else {
      adminBtn.textContent = 'Admin';
      drawer.close();
    }
  });

  adminBtn.addEventListener('click', () => {
    auth.currentUser() ? drawer.open() : openLoginModal();
  });
  loginClose.addEventListener('click', closeLoginModal);
  loginModal.addEventListener('click', e => { if (e.target === loginModal) closeLoginModal(); });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('l-user').value.trim();
    const pass  = document.getElementById('l-pass').value;
    const btn   = loginForm.querySelector('.btn--primary');
    const span  = btn.querySelector('span');
    span.textContent = 'Ingresando…';
    btn.disabled = true;
    try {
      await auth.login(email, pass);
      loginError.hidden = true;
      closeLoginModal();
      setTimeout(() => drawer.open(), 350);
      loginForm.reset();
    } catch (err) {
      loginError.hidden = false;
      loginError.textContent = 'Email o contraseña incorrectos.';
      document.getElementById('l-pass').value = '';
      document.getElementById('l-pass').focus();
    } finally {
      span.textContent = 'Ingresar →';
      btn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await auth.logout();
    drawer.close();
    pkgForm.reset();
  });

  /* 10 · Hero animations */
  new HeroAnimator().run();

  /* 11 · Scroll reveal */
  new ScrollReveal().observe();

  /* 12 · Nav */
  new NavController(document.getElementById('js-nav'));

  /* 13 · Contact form */
  new ContactForm(document.getElementById('js-contact-form'));

  /* 14 · Language toggle */
  new LanguageToggle('js-lang-toggle', 'js-lang-flag', 'js-lang-label');

});
