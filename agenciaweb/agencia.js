'use strict';

/* ============================================================
   FIREBASE CONFIG
   Reemplazá con los datos de tu proyecto:
   https://console.firebase.google.com → Configuración
============================================================ */
const FIREBASE_CONFIG = {
  apiKey:            'TU_API_KEY',
  authDomain:        'TU_PROJECT.firebaseapp.com',
  projectId:         'TU_PROJECT_ID',
  storageBucket:     'TU_PROJECT.appspot.com',
  messagingSenderId: 'TU_SENDER_ID',
  appId:             'TU_APP_ID',
};


/* ============================================================
   NavController
============================================================ */
class NavController {
  constructor(navSelector, threshold) {
    this._nav = document.querySelector(navSelector);
    this._threshold = threshold || 40;
    if (!this._nav) return;
    window.addEventListener('scroll', () => {
      this._nav.classList.toggle('nav--scrolled', window.scrollY > this._threshold);
    }, { passive: true });
  }
}


/* ============================================================
   ScrollReveal
============================================================ */
class ScrollReveal {
  constructor(selector, threshold) {
    this._observer = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: threshold || 0.1 });
  }
  observe() {
    document.querySelectorAll('[data-reveal]').forEach(el => this._observer.observe(el));
  }
}


/* ============================================================
   PaquetesManager
   Colección Firebase: 'packages'
   Campos: title, cat, catLabel, desc, dur, people, date,
           price, image, emoji, includes[], featured, _createdAt
============================================================ */
class PaquetesManager {
  constructor(gridId, emptyId, noResultId, filtroSelector, modal) {
    this._grid     = document.getElementById(gridId);
    this._emptyEl  = document.getElementById(emptyId);
    this._noResult = document.getElementById(noResultId);
    this._filtros  = document.querySelectorAll(filtroSelector);
    this._modal    = modal;
    this._todos    = [];
  }

  async init() {
    if (typeof firebase === 'undefined') {
      this._mostrarDemo();
      return;
    }
    try {
      var db   = firebase.firestore();
      var snap = await db.collection('packages').orderBy('_createdAt', 'desc').get();
      this._todos = snap.docs.map(d => this._norm({ id: d.id, ...d.data() }));
      this._renderGrid(this._todos);
      this._bindFiltros();
      this._bindLimpiar();
    } catch(err) {
      console.error('PaquetesManager:', err);
      this._mostrarError();
    }
  }

  _norm(d) {
    return {
      id:          d.id,
      titulo:      d.title       || d.titulo      || d.id,
      categoria:   d.cat         || d.categoria   || '',
      catLabel:    d.catLabel    || d.cat          || d.categoria || '',
      descripcion: d.desc        || d.descripcion || '',
      duracion:    d.dur         || d.duracion    || '',
      personas:    d.people      || d.personas    || '',
      salida:      d.date        || d.salida      || '',
      precio:      d.price       || d.precio      || null,
      imagen:      d.image       || d.imagen      || '',
      emoji:       d.emoji       || '',
      includes:    Array.isArray(d.includes) ? d.includes : [],
      destacado:   d.featured    || d.destacado   || false,
    };
  }

  _renderGrid(lista) {
    this._grid.innerHTML = '';
    var emptyEl = document.getElementById('js-paquetes-empty');
    if (emptyEl) emptyEl.hidden = true;

    if (!lista.length) {
      if (this._noResult) this._noResult.hidden = false;
      return;
    }
    if (this._noResult) this._noResult.hidden = true;
    lista.forEach((p, i) => this._grid.appendChild(this._tarjeta(p, i)));
  }

  _tarjeta(p, i) {
    var card = document.createElement('article');
    card.className = 'paquete-card';
    card.style.animationDelay = (i * 80) + 'ms';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Ver detalle de ' + p.titulo);

    var fallback = p.emoji || this._emoji(p.categoria);
    var imgHTML  = p.imagen
      ? '<img class="paquete-card__img" src="' + this._esc(p.imagen) + '" alt="' + this._esc(p.titulo) + '" loading="lazy">'
      : '<div class="paquete-card__img-placeholder">' + fallback + '</div>';

    var precioHTML = p.precio
      ? '<span class="paquete-card__precio-badge">$ ' + this._fmt(p.precio) + '</span>'
      : '';

    var metaItems = [];
    if (p.duracion) metaItems.push('<span class="paquete-card__meta-item">&#128336; ' + this._esc(p.duracion) + '</span>');
    if (p.personas) metaItems.push('<span class="paquete-card__meta-item">&#128101; ' + this._esc(p.personas) + '</span>');
    if (p.salida)   metaItems.push('<span class="paquete-card__meta-item">&#128197; ' + this._esc(p.salida)   + '</span>');
    var metaHTML = metaItems.length ? '<div class="paquete-card__meta">' + metaItems.join('') + '</div>' : '';

    card.innerHTML =
      '<div class="paquete-card__img-wrap">' +
        imgHTML +
        '<span class="paquete-card__badge">' + this._esc(p.catLabel || p.categoria || 'Paquete') + '</span>' +
        precioHTML +
      '</div>' +
      '<div class="paquete-card__body">' +
        '<h3 class="paquete-card__titulo">' + this._esc(p.titulo) + '</h3>' +
        '<p class="paquete-card__desc">'  + this._esc(p.descripcion || '') + '</p>' +
        metaHTML +
        '<div class="paquete-card__footer"><span class="paquete-card__cta">Ver detalle &#8594;</span></div>' +
      '</div>';

    card.addEventListener('click',   () => this._modal.abrir(p));
    card.addEventListener('keydown', e  => { if (e.key === 'Enter' || e.key === ' ') this._modal.abrir(p); });
    return card;
  }

  _bindFiltros() {
    this._filtros.forEach(btn => {
      btn.addEventListener('click', () => {
        var f = btn.dataset.filtro;
        this._filtros.forEach(b => b.classList.remove('filtro-btn--active'));
        btn.classList.add('filtro-btn--active');
        var lista = f === 'todos' ? this._todos : this._todos.filter(p => p.categoria.toLowerCase() === f);
        this._renderGrid(lista);
      });
    });
  }

  _bindLimpiar() {
    var btn = document.getElementById('js-limpiar-filtro');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this._filtros.forEach(b => b.classList.toggle('filtro-btn--active', b.dataset.filtro === 'todos'));
      this._renderGrid(this._todos);
    });
  }

  _mostrarDemo() {
    var demos = [
      { id:'d1', titulo:'Bariloche 7 días', categoria:'nacional', catLabel:'Nacional · Patagonia',
        descripcion:'Esquí, senderismo y gastronomía en la Patagonia.', precio:320000,
        duracion:'7 días / 6 noches', personas:'Desde 2 personas', salida:'Julio 2026', emoji:'🏔',
        imagen:'https://images.unsplash.com/photo-1594401934295-b0b37e6cf0a0?w=600&q=80', includes:[] },
      { id:'d2', titulo:'Cancún Todo Incluido', categoria:'internacional', catLabel:'Internacional',
        descripcion:'Hotel 5 estrellas con todo incluido en el Caribe.', precio:850000,
        duracion:'10 días / 9 noches', personas:'Por persona', salida:'Diciembre 2026', emoji:'✈️',
        imagen:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80', includes:[] },
      { id:'d3', titulo:'Mendoza & Bodegas', categoria:'nacional', catLabel:'Nacional · Cuyo',
        descripcion:'Tour enológico por las mejores bodegas.', precio:180000,
        duracion:'4 días / 3 noches', personas:'Mín. 4 personas', salida:'Octubre 2026', emoji:'🍷',
        imagen:'https://images.unsplash.com/photo-1515268064940-5150b7c29f35?w=600&q=80', includes:[] },
      { id:'d4', titulo:'Europa Clásica', categoria:'internacional', catLabel:'Internacional',
        descripcion:'Madrid, París, Roma y Barcelona con guía en español.', precio:2400000,
        duracion:'15 días / 14 noches', personas:'Desde 2 personas', salida:'Marzo 2027', emoji:'🗺',
        imagen:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', includes:[] },
      { id:'d5', titulo:'Iguazú Grupal', categoria:'grupal', catLabel:'Grupal',
        descripcion:'Cataratas del Iguazú, lado argentino y brasileño.', precio:145000,
        duracion:'5 días / 4 noches', personas:'Grupo de 10+', salida:'Agosto 2026', emoji:'💧',
        imagen:'https://images.unsplash.com/photo-1575832051742-3fa1f7a0ff9d?w=600&q=80', includes:[] },
      { id:'d6', titulo:'Caribe Colombiano', categoria:'internacional', catLabel:'Internacional',
        descripcion:'Cartagena de Indias y las Islas del Rosario.', precio:680000,
        duracion:'7 días / 6 noches', personas:'Por persona', salida:'Enero 2027', emoji:'🌊',
        imagen:'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=80', includes:[] },
    ];
    this._todos = demos;
    this._renderGrid(demos);
    this._bindFiltros();
    this._bindLimpiar();
  }

  _mostrarError() {
    if (!this._emptyEl) return;
    var txt = this._emptyEl.querySelector('.paquetes-empty__text');
    if (txt) txt.textContent = 'No se pudieron cargar los paquetes.';
  }

  _esc(s) {
    if (typeof s !== 'string') return String(s == null ? '' : s);
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  _fmt(n) { return new Intl.NumberFormat('es-AR').format(Number(n)); }
  _emoji(cat) {
    var m = { nacional:'🏔', internacional:'✈️', grupal:'👥' };
    return m[(cat || '').toLowerCase()] || '🗺';
  }
}


/* ============================================================
   ModalController
============================================================ */
class ModalController {
  constructor(overlayId, closeId, bodyId) {
    this._overlay = document.getElementById(overlayId);
    this._close   = document.getElementById(closeId);
    this._body    = document.getElementById(bodyId);
    if (!this._overlay) return;

    this._close && this._close.addEventListener('click', () => this.cerrar());
    this._overlay.addEventListener('click', e => { if (e.target === this._overlay) this.cerrar(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this._overlay.hidden) this.cerrar();
    });
  }

  abrir(p) {
    this._body.innerHTML = this._html(p);
    this._overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    this._close && this._close.focus();
  }

  cerrar() {
    this._overlay.hidden = true;
    document.body.style.overflow = '';
  }

  _html(p) {
    var esc = function(s) {
      if (typeof s !== 'string') return String(s == null ? '' : s);
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };
    var m = { nacional:'🏔', internacional:'✈️', grupal:'👥' };
    var fallback = p.emoji || m[(p.categoria||'').toLowerCase()] || '🗺';

    var imgHTML = p.imagen
      ? '<img class="modal__img" src="' + esc(p.imagen) + '" alt="' + esc(p.titulo) + '">'
      : '<div class="modal__img-placeholder">' + fallback + '</div>';

    var metaItems = [];
    if (p.duracion) metaItems.push('<span class="modal__meta-item">🕐 ' + esc(p.duracion) + '</span>');
    if (p.personas) metaItems.push('<span class="modal__meta-item">👥 ' + esc(p.personas) + '</span>');
    if (p.salida)   metaItems.push('<span class="modal__meta-item">📅 ' + esc(p.salida)   + '</span>');
    var metaHTML = metaItems.length ? '<div class="modal__meta">' + metaItems.join('') + '</div>' : '';

    var includesHTML = '';
    if (p.includes && p.includes.length) {
      includesHTML = '<div class="modal__includes"><p class="modal__includes-title">&#10003; Incluye</p><ul class="modal__includes-list">' +
        p.includes.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join('') +
        '</ul></div>';
    }

    var precioHTML = p.precio
      ? '<div class="modal__precio"><span class="modal__precio-label">Precio desde</span> $ ' + new Intl.NumberFormat('es-AR').format(Number(p.precio)) + '</div>'
      : '';

    var wpText = encodeURIComponent('Hola! Me interesa el paquete "' + p.titulo + '". ¿Pueden darme más información?');

    return imgHTML +
      '<div class="modal__content">' +
        '<span class="modal__badge">' + esc(p.catLabel || p.categoria || 'Paquete') + '</span>' +
        '<h2 class="modal__title" id="modal-title">' + esc(p.titulo) + '</h2>' +
        metaHTML +
        '<p class="modal__desc">' + esc(p.descripcion || '') + '</p>' +
        includesHTML +
        precioHTML +
        '<div class="modal__actions">' +
          '<a href="https://wa.me/5493413341317?text=' + wpText + '" class="btn btn--wsp" target="_blank" rel="noopener noreferrer"><span>Consultar por WhatsApp</span></a>' +
          '<a href="index.html#contacto" class="btn btn--ghost-dark"><span>Formulario de contacto</span><span class="btn__arrow">&#8594;</span></a>' +
        '</div>' +
      '</div>';
  }
}


/* ============================================================
   LanguageToggle
============================================================ */
class LanguageToggle {
  constructor(btnId, flagId, labelId) {
    this._btn   = document.getElementById(btnId);
    this._flag  = document.getElementById(flagId);
    this._label = document.getElementById(labelId);
    this._lang  = 'es';

    this._dict = {
      es: {
        'nav.nosotros':'Nosotros', 'nav.traslados':'Traslados', 'nav.agencia':'Agencia',
        'nav.contacto':'Contacto', 'nav.cta':'Consultar', 'nav.admin':'Admin',
        'hero.eyebrow':'Agencia habilitada · Turismo nacional e internacional',
        'hero.title1':'Viajá con', 'hero.title2':'quienes saben', 'hero.title3':'hacerlo.',
        'hero.desc':'Paquetes nacionales e internacionales y viajes grupales. Armamos cada itinerario a medida, con el respaldo de más de 15 años de experiencia.',
        'hero.btn1':'Ver paquetes', 'hero.btn2':'Consultar un viaje',
        'chip.internacional':'Internacional', 'chip.nacional':'Nacional', 'chip.grupal':'Grupal',
        'marquee.1':'Paquetes Nacionales', 'marquee.2':'Turismo Internacional',
        'marquee.3':'Turismo Grupal', 'marquee.4':'Agencia Habilitada',
        'marquee.5':'Itinerarios a Medida', 'marquee.6':'Soporte 24/7',
        'paquetes.tag':'Nuestros paquetes', 'paquetes.heading1':'Encontrá tu próximo',
        'paquetes.heading2':' destino',
        'paquetes.sub':'Filtrá por categoría y explorá todas las opciones disponibles.',
        'paquetes.cargando':'Cargando paquetes...', 'paquetes.sinResultados':'No hay paquetes en esta categoría.',
        'paquetes.verTodos':'Ver todos',
        'filtro.todos':'Todos', 'filtro.nacional':'Nacional', 'filtro.internacional':'Internacional', 'filtro.grupal':'Grupal',
        'cta.tag':'¿No encontrás lo que buscás?', 'cta.heading1':'Armamos tu viaje', 'cta.heading2':' a medida',
        'cta.sub':'Contanos el destino, las fechas y la cantidad de personas. Un asesor te responde a la brevedad.',
        'cta.btn':'Consultar por WhatsApp', 'wsp.tooltip':'Escribinos',
      },
      en: {
        'nav.nosotros':'About Us', 'nav.traslados':'Transfers', 'nav.agencia':'Agency',
        'nav.contacto':'Contact', 'nav.cta':'Enquire', 'nav.admin':'Admin',
        'hero.eyebrow':'Licensed agency · Domestic & international tourism',
        'hero.title1':'Travel with', 'hero.title2':'those who know', 'hero.title3':'how.',
        'hero.desc':'Domestic and international packages and group travel. We craft every itinerary to suit you, backed by over 15 years of experience.',
        'hero.btn1':'View packages', 'hero.btn2':'Ask about a trip',
        'chip.internacional':'International', 'chip.nacional':'Domestic', 'chip.grupal':'Group',
        'marquee.1':'Domestic Packages', 'marquee.2':'International Tourism',
        'marquee.3':'Group Travel', 'marquee.4':'Licensed Agency',
        'marquee.5':'Custom Itineraries', 'marquee.6':'24/7 Support',
        'paquetes.tag':'Our packages', 'paquetes.heading1':'Find your next',
        'paquetes.heading2':' destination',
        'paquetes.sub':'Filter by category and explore all available options.',
        'paquetes.cargando':'Loading packages...', 'paquetes.sinResultados':'No packages in this category.',
        'paquetes.verTodos':'View all',
        'filtro.todos':'All', 'filtro.nacional':'Domestic', 'filtro.internacional':'International', 'filtro.grupal':'Group',
        'cta.tag':"Can't find what you're looking for?", 'cta.heading1':'We tailor your trip', 'cta.heading2':' just for you',
        'cta.sub':'Tell us the destination, dates and number of people. An advisor will respond shortly with a personalised proposal.',
        'cta.btn':'Ask on WhatsApp', 'wsp.tooltip':'Message us',
      },
    };

    if (!this._btn) return;
    this._btn.addEventListener('click', () => this._toggle());
  }

  _toggle() {
    this._lang = this._lang === 'es' ? 'en' : 'es';
    var dict   = this._dict[this._lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      var v = dict[el.getAttribute('data-i18n')];
      if (v !== undefined) el.textContent = v;
    });
    document.documentElement.lang = this._lang;
    if (this._lang === 'en') {
      this._flag.textContent  = '🇦🇷';
      this._label.textContent = 'ES';
    } else {
      this._flag.textContent  = '🇬🇧';
      this._label.textContent = 'EN';
    }
  }
}


/* ============================================================
   AdminAuth  — Login con Firebase Authentication
============================================================ */
class AdminAuth {
  constructor(sidebar) {
    this._sidebar    = sidebar;
    this._overlay    = document.getElementById('js-admin-login-overlay');
    this._form       = document.getElementById('js-admin-login-form');
    this._emailInput = document.getElementById('admin-email');
    this._passInput  = document.getElementById('admin-password');
    this._errorEl    = document.getElementById('js-admin-login-error');
    this._submitBtn  = document.getElementById('js-admin-login-submit');
    this._submitTxt  = document.getElementById('js-admin-login-submit-text');
    this._spinner    = document.getElementById('js-admin-login-spinner');
    this._closeBtn   = document.getElementById('js-admin-login-close');
    this._adminBtn   = document.getElementById('js-admin-btn');
    this._togglePass = document.getElementById('js-toggle-pass');

    this._bind();
    this._watchAuth();
  }

  _bind() {
    if (this._adminBtn)   this._adminBtn.addEventListener('click',   () => this._abrirOSidebar());
    if (this._closeBtn)   this._closeBtn.addEventListener('click',   () => this._cerrar());
    if (this._form)       this._form.addEventListener('submit',      e  => this._submit(e));
    if (this._togglePass) this._togglePass.addEventListener('click', () => this._togglePwd());
    if (this._overlay)    this._overlay.addEventListener('click',    e  => { if (e.target === this._overlay) this._cerrar(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._overlay && !this._overlay.hidden) this._cerrar();
    });
  }

  _watchAuth() {
    if (typeof firebase === 'undefined') return;
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this._cerrar();
        this._sidebar.abrir(user);
      } else {
        this._sidebar.cerrar();
      }
    });
  }

  _abrirOSidebar() {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      this._sidebar.abrir(firebase.auth().currentUser);
      return;
    }
    if (this._overlay) {
      this._overlay.hidden = false;
      setTimeout(() => { if (this._emailInput) this._emailInput.focus(); }, 80);
    }
  }

  _cerrar() {
    if (this._overlay) this._overlay.hidden = true;
    if (this._form)    this._form.reset();
    this._ocultarError();
    this._setLoading(false);
  }

  async _submit(e) {
    e.preventDefault();
    this._ocultarError();

    if (typeof firebase === 'undefined') {
      this._mostrarError('Firebase no configurado. Completá FIREBASE_CONFIG en agencia.js.');
      return;
    }

    var email = this._emailInput ? this._emailInput.value.trim() : '';
    var pass  = this._passInput  ? this._passInput.value         : '';

    if (!email || !pass) {
      this._mostrarError('Ingresá tu correo y contraseña.');
      return;
    }

    this._setLoading(true);
    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged abre el sidebar automáticamente
    } catch(err) {
      this._mostrarError(this._msgError(err.code));
      this._setLoading(false);
    }
  }

  _setLoading(on) {
    if (this._submitBtn) this._submitBtn.disabled = on;
    if (this._submitTxt) this._submitTxt.textContent = on ? 'Verificando...' : 'Ingresar';
    if (this._spinner)   this._spinner.hidden = !on;
  }

  _mostrarError(msg) {
    if (!this._errorEl) return;
    this._errorEl.textContent = msg;
    this._errorEl.hidden = false;
  }
  _ocultarError() {
    if (this._errorEl) this._errorEl.hidden = true;
  }

  _togglePwd() {
    var isPass = this._passInput.type === 'password';
    this._passInput.type = isPass ? 'text' : 'password';
    var show = this._togglePass.querySelector('.eye-icon--show');
    var hide = this._togglePass.querySelector('.eye-icon--hide');
    if (show) show.style.display = isPass ? 'none' : '';
    if (hide) hide.style.display = isPass ? ''     : 'none';
  }

  _msgError(code) {
    var msgs = {
      'auth/invalid-email':          'El correo no es válido.',
      'auth/user-not-found':         'No existe cuenta con ese correo.',
      'auth/wrong-password':         'Contraseña incorrecta.',
      'auth/invalid-credential':     'Correo o contraseña incorrectos.',
      'auth/too-many-requests':      'Demasiados intentos. Esperá unos minutos.',
      'auth/network-request-failed': 'Sin conexión. Verificá tu red.',
    };
    return msgs[code] || 'Error de autenticación (' + code + ').';
  }
}


/* ============================================================
   AdminSidebar  — panel para gestionar paquetes
============================================================ */
class AdminSidebar {
  constructor() {
    this._sidebar    = document.getElementById('js-admin-sidebar');
    this._backdrop   = document.getElementById('js-admin-sidebar-backdrop');
    this._closeBtn   = document.getElementById('js-admin-sidebar-close');
    this._logoutBtn  = document.getElementById('js-admin-logout');
    this._navItems   = document.querySelectorAll('.admin-sidebar__nav-item');
    this._panels     = document.querySelectorAll('.admin-panel');
    this._refreshBtn = document.getElementById('js-admin-refresh');
    this._listEl     = document.getElementById('js-admin-paquetes-list');
    this._avatarEl   = document.getElementById('js-admin-avatar');
    this._usernameEl = document.getElementById('js-admin-username');

    this._form        = document.getElementById('js-admin-form');
    this._resetBtn    = document.getElementById('js-admin-form-reset');
    this._submitBtn   = document.getElementById('js-admin-form-submit');
    this._submitTxt   = document.getElementById('js-admin-form-submit-text');
    this._formSpinner = document.getElementById('js-admin-form-spinner');
    this._feedback    = document.getElementById('js-admin-form-feedback');

    this._imgTabs    = document.querySelectorAll('.admin-form__img-tab');
    this._panelUrl   = document.getElementById('img-panel-url');
    this._panelUp    = document.getElementById('img-panel-upload');
    this._fileInput  = document.getElementById('pkg-imagen-file');
    this._uploadZone = document.getElementById('js-upload-zone');
    this._uploadPrev = document.getElementById('js-upload-preview');
    this._uploadImg  = document.getElementById('js-upload-preview-img');
    this._removeFile = document.getElementById('js-upload-remove');

    this._imgMode = 'url';
    this._file    = null;

    this._bind();
  }

  abrir(user) {
    if (!this._sidebar) return;
    this._sidebar.hidden  = false;
    if (this._backdrop) this._backdrop.hidden = false;
    setTimeout(() => this._sidebar.classList.add('is-open'), 10);
    var email = (user && user.email) ? user.email : 'Admin';
    if (this._avatarEl)    this._avatarEl.textContent   = email[0].toUpperCase();
    if (this._usernameEl)  this._usernameEl.textContent = email;
  }

  cerrar() {
    if (!this._sidebar) return;
    this._sidebar.classList.remove('is-open');
    var self = this;
    setTimeout(function() {
      self._sidebar.hidden = true;
      if (self._backdrop) self._backdrop.hidden = true;
    }, 380);
  }

  _bind() {
    if (this._closeBtn)   this._closeBtn.addEventListener('click',   () => this.cerrar());
    if (this._backdrop)   this._backdrop.addEventListener('click',   () => this.cerrar());
    if (this._logoutBtn)  this._logoutBtn.addEventListener('click',  () => this._logout());
    if (this._refreshBtn) this._refreshBtn.addEventListener('click', () => this._cargarLista());
    if (this._resetBtn)   this._resetBtn.addEventListener('click',   () => this._resetForm());
    if (this._form)       this._form.addEventListener('submit',      e  => this._guardar(e));

    this._navItems.forEach(btn => btn.addEventListener('click', () => this._cambiarPanel(btn.dataset.panel)));
    this._imgTabs.forEach(tab  => tab.addEventListener('click', () => this._cambiarImgTab(tab.dataset.imgTab)));

    if (this._fileInput) {
      this._fileInput.addEventListener('change', e => {
        var f = e.target.files[0];
        if (f) this._procesarFile(f);
      });
    }
    if (this._removeFile) this._removeFile.addEventListener('click', () => this._quitarFile());

    if (this._uploadZone) {
      this._uploadZone.addEventListener('dragover',  e => { e.preventDefault(); this._uploadZone.style.borderColor = 'var(--color-yellow)'; });
      this._uploadZone.addEventListener('dragleave', () => { this._uploadZone.style.borderColor = ''; });
      this._uploadZone.addEventListener('drop',      e => {
        e.preventDefault();
        this._uploadZone.style.borderColor = '';
        var f = e.dataTransfer.files[0];
        if (f) this._procesarFile(f);
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._sidebar && !this._sidebar.hidden) this.cerrar();
    });
  }

  _cambiarPanel(id) {
    this._navItems.forEach(b => b.classList.toggle('admin-sidebar__nav-item--active', b.dataset.panel === id));
    this._panels.forEach(p => { p.hidden = p.id !== ('admin-panel-' + id); });
    if (id === 'gestionar-paquetes') this._cargarLista();
  }

  _cambiarImgTab(tab) {
    this._imgMode = tab;
    this._imgTabs.forEach(t => t.classList.toggle('admin-form__img-tab--active', t.dataset.imgTab === tab));
    if (this._panelUrl) this._panelUrl.hidden = tab !== 'url';
    if (this._panelUp)  this._panelUp.hidden  = tab !== 'upload';
  }

  _procesarFile(file) {
    if (!file.type.startsWith('image/')) { alert('Solo imágenes (JPG, PNG, WebP).'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Máximo 5 MB.'); return; }
    this._file = file;
    var self   = this;
    var reader = new FileReader();
    reader.onload = function(e) {
      if (self._uploadImg)  self._uploadImg.src     = e.target.result;
      if (self._uploadPrev) self._uploadPrev.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  _quitarFile() {
    this._file = null;
    if (this._fileInput)  this._fileInput.value   = '';
    if (this._uploadImg)  this._uploadImg.src      = '';
    if (this._uploadPrev) this._uploadPrev.hidden  = true;
  }

  async _guardar(e) {
    e.preventDefault();
    this._ocultarFeedback();

    if (typeof firebase === 'undefined') {
      this._mostrarFeedback('Firebase no configurado.', 'error');
      return;
    }

    var titulo    = (document.getElementById('pkg-titulo')    || {}).value;
    var categoria = (document.getElementById('pkg-categoria') || {}).value;
    titulo    = titulo    ? titulo.trim()    : '';
    categoria = categoria ? categoria.trim() : '';

    if (!titulo || !categoria) {
      this._mostrarFeedback('Completá al menos el título y la categoría.', 'error');
      return;
    }

    this._setLoadingForm(true);

    try {
      var imageUrl = '';
      if (this._imgMode === 'url') {
        var urlEl = document.getElementById('pkg-imagen-url');
        imageUrl  = urlEl ? urlEl.value.trim() : '';
      } else if (this._file) {
        imageUrl = await this._subirImagen(this._file);
      }

      var includesTxt = '';
      var inclEl = document.getElementById('pkg-includes');
      if (inclEl) includesTxt = inclEl.value.trim();
      var includes = includesTxt
        ? includesTxt.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      var get = function(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      var doc = {
        title:      titulo,
        cat:        categoria,
        catLabel:   get('pkg-catlabel')    || categoria,
        desc:       get('pkg-descripcion'),
        dur:        get('pkg-duracion'),
        people:     get('pkg-personas'),
        date:       get('pkg-salida'),
        price:      Number(get('pkg-precio')) || null,
        image:      imageUrl,
        emoji:      get('pkg-emoji'),
        includes:   includes,
        featured:   !!(document.getElementById('pkg-destacado') || {}).checked,
        _createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      var db  = firebase.firestore();
      var ref = await db.collection('packages').add(doc);
      await ref.update({ id: ref.id });

      this._mostrarFeedback('✓ Paquete guardado correctamente.', 'ok');
      this._resetForm();
      if (window.__paquetesManager) window.__paquetesManager.init();

    } catch(err) {
      console.error(err);
      this._mostrarFeedback('Error: ' + err.message, 'error');
    } finally {
      this._setLoadingForm(false);
    }
  }

  async _subirImagen(file) {
    if (!firebase.storage) throw new Error('Firebase Storage no disponible.');
    var nombre = 'packages/' + Date.now() + '_' + file.name.replace(/\s+/g, '_');
    var ref    = firebase.storage().ref(nombre);
    var snap   = await ref.put(file);
    return await snap.ref.getDownloadURL();
  }

  _resetForm() {
    if (this._form) this._form.reset();
    this._quitarFile();
    this._cambiarImgTab('url');
    this._ocultarFeedback();
  }

  async _cargarLista() {
    if (!this._listEl) return;
    this._listEl.innerHTML = '<p class="admin-paquetes-list__empty">Cargando…</p>';

    if (typeof firebase === 'undefined') {
      this._listEl.innerHTML = '<p class="admin-paquetes-list__empty">Firebase no configurado.</p>';
      return;
    }

    try {
      var db   = firebase.firestore();
      var snap = await db.collection('packages').orderBy('_createdAt', 'desc').get();

      if (snap.empty) {
        this._listEl.innerHTML = '<p class="admin-paquetes-list__empty">No hay paquetes cargados.</p>';
        return;
      }
      this._listEl.innerHTML = '';
      snap.docs.forEach(d => this._listEl.appendChild(this._itemPaquete({ id: d.id, ...d.data() })));
    } catch(err) {
      this._listEl.innerHTML = '<p class="admin-paquetes-list__empty">Error: ' + err.message + '</p>';
    }
  }

  _itemPaquete(d) {
    var titulo   = d.title    || d.titulo   || d.id;
    var imagen   = d.image    || d.imagen   || '';
    var catLabel = d.catLabel || d.cat      || d.categoria || '';
    var duracion = d.dur      || d.duracion || '';
    var precio   = d.price    || d.precio   || null;
    var emoji    = d.emoji    || '🗺';

    var imgHTML = imagen
      ? '<img class="admin-pkg-item__img" src="' + imagen + '" alt="' + titulo + '" loading="lazy">'
      : '<div class="admin-pkg-item__placeholder">' + emoji + '</div>';

    var div = document.createElement('div');
    div.className = 'admin-pkg-item';
    div.innerHTML =
      imgHTML +
      '<div class="admin-pkg-item__info">' +
        '<p class="admin-pkg-item__titulo">' + titulo + '</p>' +
        '<p class="admin-pkg-item__meta">' + duracion + (precio ? ' · $' + new Intl.NumberFormat('es-AR').format(precio) : '') + '</p>' +
      '</div>' +
      '<span class="admin-pkg-item__badge">' + catLabel + '</span>' +
      '<button class="admin-pkg-item__delete" title="Eliminar">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
          '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>' +
        '</svg>' +
      '</button>';

    div.querySelector('.admin-pkg-item__delete').addEventListener('click', () => this._eliminar(d.id, titulo, div));
    return div;
  }

  async _eliminar(id, titulo, el) {
    if (!confirm('¿Eliminar "' + titulo + '"?')) return;
    try {
      await firebase.firestore().collection('packages').doc(id).delete();
      el.style.transition = 'all 0.25s ease';
      el.style.opacity    = '0';
      el.style.transform  = 'scale(0.95)';
      setTimeout(() => el.remove(), 260);
      if (window.__paquetesManager) window.__paquetesManager.init();
    } catch(err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  async _logout() {
    if (typeof firebase !== 'undefined') {
      try { await firebase.auth().signOut(); } catch(e) { console.error(e); }
    }
    this.cerrar();
  }

  _setLoadingForm(on) {
    if (this._submitBtn)   this._submitBtn.disabled   = on;
    if (this._submitTxt)   this._submitTxt.textContent = on ? 'Guardando...' : 'Guardar paquete';
    if (this._formSpinner) this._formSpinner.hidden    = !on;
  }

  _mostrarFeedback(msg, tipo) {
    if (!this._feedback) return;
    this._feedback.textContent = msg;
    this._feedback.className   = 'admin-form__feedback admin-form__feedback--' + tipo;
    this._feedback.hidden      = false;
    if (tipo === 'ok') {
      var self = this;
      setTimeout(function() { self._ocultarFeedback(); }, 4000);
    }
  }
  _ocultarFeedback() {
    if (this._feedback) this._feedback.hidden = true;
  }
}


/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener('DOMContentLoaded', function() {

  /* Firebase: inicializar una sola vez */
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try { firebase.initializeApp(FIREBASE_CONFIG); }
    catch(e) { console.warn('Firebase init:', e); }
  }

  new NavController('#js-nav', 40);

  var sr = new ScrollReveal('[data-reveal]', 0.1);
  sr.observe();

  var modal = new ModalController('js-modal-overlay', 'js-modal-close', 'js-modal-body');

  var paquetesManager = new PaquetesManager(
    'js-paquetes-grid', 'js-paquetes-empty', 'js-no-result', '.filtro-btn', modal
  );
  paquetesManager.init();
  window.__paquetesManager = paquetesManager;

  new LanguageToggle('js-lang-toggle', 'js-lang-flag', 'js-lang-label');

  var sidebar = new AdminSidebar();
  new AdminAuth(sidebar);

});
