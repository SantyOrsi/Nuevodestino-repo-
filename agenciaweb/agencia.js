/**
 * agencia.js — Nuevo Destino Viajes · Página de agencia
 *
 * Arquitectura orientada a objetos ES6+.
 * SIN type="module" para compatibilidad con archivos locales.
 * Firebase se carga via CDN con la SDK de compatibilidad (compat).
 *
 * Clases:
 *  - NavController     : scroll del navbar
 *  - ScrollReveal      : reveal de elementos con IntersectionObserver
 *  - PaquetesManager   : carga, filtra y renderiza paquetes desde Firestore
 *  - ModalController   : modal de detalle de paquete
 *  - LanguageToggle    : traducción ES ↔ EN de toda la página
 */

'use strict';

/* ============================================================
   CONFIGURACIÓN DE FIREBASE
   Reemplazá los valores con los de tu proyecto en
   https://console.firebase.google.com → Configuración del proyecto
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
   CLASS: NavController
   Responsabilidad: agregar/quitar la clase scrolled al nav
   cuando el usuario hace scroll más allá del umbral definido.
============================================================ */
class NavController {
  /**
   * @param {string} navSelector     - selector del elemento nav
   * @param {number} scrollThreshold - px para activar la clase scrolled
   */
  constructor(navSelector, scrollThreshold = 40) {
    this._nav       = document.querySelector(navSelector);
    this._threshold = scrollThreshold;

    if (!this._nav) return;
    this._bindScroll();
  }

  _bindScroll() {
    window.addEventListener('scroll', () => {
      this._nav.classList.toggle('nav--scrolled', window.scrollY > this._threshold);
    }, { passive: true });
  }
}


/* ============================================================
   CLASS: ScrollReveal
   Responsabilidad: observar elementos [data-reveal] y agregar
   la clase .is-visible cuando entran al viewport.
============================================================ */
class ScrollReveal {
  /**
   * @param {string} selector  - selector de atributo
   * @param {number} threshold - fracción visible para activar
   */
  constructor(selector = '[data-reveal]', threshold = 0.1) {
    this._observer = new IntersectionObserver(
      this._onIntersect.bind(this),
      { threshold }
    );
  }

  observe() {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      this._observer.observe(el);
    });
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      this._observer.unobserve(entry.target);
    });
  }
}


/* ============================================================
   CLASS: PaquetesManager
   Responsabilidad: cargar paquetes desde Firestore, renderizar
   tarjetas y gestionar filtros por categoría.
   Nota: Se inicializa SOLO si Firebase está disponible.
============================================================ */
class PaquetesManager {
  /**
   * @param {string}          gridId         - ID del grid
   * @param {string}          emptyId        - ID del estado vacío
   * @param {string}          noResultId     - ID del mensaje sin resultados
   * @param {string}          filtroSelector - selector de botones de filtro
   * @param {ModalController} modal
   */
  constructor(gridId, emptyId, noResultId, filtroSelector, modal) {
    this._grid     = document.getElementById(gridId);
    this._emptyEl  = document.getElementById(emptyId);
    this._noResult = document.getElementById(noResultId);
    this._filtros  = document.querySelectorAll(filtroSelector);
    this._modal    = modal;
    this._paquetes = [];
    this._filtroActual = 'todos';
  }

  /** Carga paquetes desde Firestore y renderiza la grilla */
  async init() {
    /* Verificar si Firebase está cargado */
    if (typeof firebase === 'undefined') {
      this._mostrarDemo();
      return;
    }

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      const db = firebase.firestore();

      const snap = await db.collection('paquetes')
        .orderBy('createdAt', 'desc')
        .get();

      this._paquetes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this._renderGrid(this._paquetes);
      this._bindFiltros();
      this._bindLimpiarFiltro();
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      this._mostrarError();
    }
  }

  /* ── Renderizado ─────────────────────────────────────────── */

  _renderGrid(paquetes) {
    this._grid.innerHTML = '';

    if (paquetes.length === 0) {
      if (this._noResult) this._noResult.hidden = false;
      return;
    }

    if (this._noResult) this._noResult.hidden = true;

    paquetes.forEach((paquete, index) => {
      const card = this._crearTarjeta(paquete, index);
      this._grid.appendChild(card);
    });
  }

  _crearTarjeta(paquete, index) {
    const card = document.createElement('article');
    card.className = 'paquete-card';
    card.style.animationDelay = `${index * 80}ms`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Ver detalle de ${paquete.titulo}`);

    const imgHTML = paquete.imagen
      ? `<img class="paquete-card__img" src="${this._esc(paquete.imagen)}" alt="${this._esc(paquete.titulo)}" loading="lazy" />`
      : `<div class="paquete-card__img-placeholder">${this._emojiCategoria(paquete.categoria)}</div>`;

    const precioHTML = paquete.precio
      ? `<span class="paquete-card__precio-badge">$ ${this._formatPrecio(paquete.precio)}</span>`
      : '';

    const metaHTML = this._buildMeta(paquete);

    card.innerHTML = `
      <div class="paquete-card__img-wrap">
        ${imgHTML}
        <span class="paquete-card__badge">${this._esc(paquete.categoria || 'Paquete')}</span>
        ${precioHTML}
      </div>
      <div class="paquete-card__body">
        <h3 class="paquete-card__titulo">${this._esc(paquete.titulo)}</h3>
        <p class="paquete-card__desc">${this._esc(paquete.descripcion || '')}</p>
        ${metaHTML}
        <div class="paquete-card__footer">
          <span class="paquete-card__cta">Ver detalle →</span>
        </div>
      </div>
    `;

    card.addEventListener('click',   () => this._modal.abrir(paquete));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this._modal.abrir(paquete);
    });

    return card;
  }

  _buildMeta(paquete) {
    const items = [];
    if (paquete.duracion) items.push(`<span class="paquete-card__meta-item">🕐 ${this._esc(paquete.duracion)}</span>`);
    if (paquete.personas) items.push(`<span class="paquete-card__meta-item">👥 ${this._esc(paquete.personas)}</span>`);
    if (paquete.salida)   items.push(`<span class="paquete-card__meta-item">📅 ${this._esc(paquete.salida)}</span>`);

    return items.length
      ? `<div class="paquete-card__meta">${items.join('')}</div>`
      : '';
  }

  /* ── Filtrado ─────────────────────────────────────────────── */

  _bindFiltros() {
    this._filtros.forEach(btn => {
      btn.addEventListener('click', () => {
        this._filtroActual = btn.dataset.filtro;

        this._filtros.forEach(b => b.classList.remove('filtro-btn--active'));
        btn.classList.add('filtro-btn--active');

        const filtrados = this._filtroActual === 'todos'
          ? this._paquetes
          : this._paquetes.filter(p =>
              p.categoria?.toLowerCase() === this._filtroActual
            );

        this._renderGrid(filtrados);
      });
    });
  }

  _bindLimpiarFiltro() {
    const btn = document.getElementById('js-limpiar-filtro');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this._filtros.forEach(b => {
        b.classList.toggle('filtro-btn--active', b.dataset.filtro === 'todos');
      });
      this._filtroActual = 'todos';
      this._renderGrid(this._paquetes);
    });
  }

  /* ── Estados especiales ──────────────────────────────────── */

  /** Muestra tarjetas de ejemplo cuando Firebase no está configurado */
  _mostrarDemo() {
    const demos = [
      {
        id: 'demo1', titulo: 'Bariloche 7 días',
        categoria: 'nacional', descripcion: 'Esquí, senderismo y gastronomía en la Patagonia. Incluye alojamiento y desayuno.',
        precio: 320000, duracion: '7 días / 6 noches', personas: 'Desde 2 personas', salida: 'Julio 2026',
        imagen: 'https://images.unsplash.com/photo-1594401934295-b0b37e6cf0a0?w=600&q=80',
      },
      {
        id: 'demo2', titulo: 'Cancún Todo Incluido',
        categoria: 'internacional', descripcion: 'Playas de arena blanca y aguas turquesas. Hotel 5 estrellas con todo incluido.',
        precio: 850000, duracion: '10 días / 9 noches', personas: 'Por persona', salida: 'Diciembre 2026',
        imagen: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',
      },
      {
        id: 'demo3', titulo: 'Mendoza & Bodegas',
        categoria: 'nacional', descripcion: 'Tour enológico por las mejores bodegas de Mendoza con cata de vinos premium.',
        precio: 180000, duracion: '4 días / 3 noches', personas: 'Mínimo 4 personas', salida: 'Octubre 2026',
        imagen: 'https://images.unsplash.com/photo-1515268064940-5150b7c29f35?w=600&q=80',
      },
      {
        id: 'demo4', titulo: 'Europa Clásica',
        categoria: 'internacional', descripcion: 'Recorrido por Madrid, París, Roma y Barcelona. Guía en español incluido.',
        precio: 2400000, duracion: '15 días / 14 noches', personas: 'Desde 2 personas', salida: 'Marzo 2027',
        imagen: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
      },
      {
        id: 'demo5', titulo: 'Iguazú Grupal',
        categoria: 'grupal', descripcion: 'Cataratas del Iguazú en grupo. Parque Nacional, lado argentino y brasileño.',
        precio: 145000, duracion: '5 días / 4 noches', personas: 'Grupo de 10+', salida: 'Agosto 2026',
        imagen: 'https://images.unsplash.com/photo-1575832051742-3fa1f7a0ff9d?w=600&q=80',
      },
      {
        id: 'demo6', titulo: 'Caribe Colombiano',
        categoria: 'internacional', descripcion: 'Cartagena de Indias y las Islas del Rosario. Sol, playa y cultura colonial.',
        precio: 680000, duracion: '7 días / 6 noches', personas: 'Por persona', salida: 'Enero 2027',
        imagen: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=80',
      },
    ];

    this._paquetes = demos;
    this._renderGrid(demos);
    this._bindFiltros();
    this._bindLimpiarFiltro();

    /* Actualizar el texto del estado vacío */
    const emptyText = document.getElementById('js-paquetes-empty');
    if (emptyText) emptyText.hidden = true;
  }

  _mostrarError() {
    if (!this._emptyEl) return;
    const txt = this._emptyEl.querySelector('.paquetes-empty__text');
    if (txt) txt.textContent = 'No se pudieron cargar los paquetes. Intentá de nuevo más tarde.';
  }

  /* ── Utilidades ──────────────────────────────────────────── */

  _esc(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _emojiCategoria(categoria) {
    const mapa = { nacional: '🏔', internacional: '✈️', grupal: '👥' };
    return mapa[categoria?.toLowerCase()] ?? '🗺';
  }

  _formatPrecio(precio) {
    const n = Number(precio);
    return isNaN(n) ? String(precio) : new Intl.NumberFormat('es-AR').format(n);
  }
}


/* ============================================================
   CLASS: ModalController
   Responsabilidad: mostrar / ocultar el modal de detalle
   de un paquete e inyectar su contenido.
============================================================ */
class ModalController {
  /**
   * @param {string} overlayId - ID del overlay
   * @param {string} closeId   - ID del botón de cierre
   * @param {string} bodyId    - ID del cuerpo del modal
   */
  constructor(overlayId, closeId, bodyId) {
    this._overlay = document.getElementById(overlayId);
    this._close   = document.getElementById(closeId);
    this._body    = document.getElementById(bodyId);

    if (!this._overlay) return;
    this._bindClose();
  }

  abrir(paquete) {
    this._body.innerHTML = this._buildContent(paquete);
    this._overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    this._close?.focus();
  }

  cerrar() {
    this._overlay.hidden = true;
    document.body.style.overflow = '';
  }

  _bindClose() {
    this._close?.addEventListener('click', () => this.cerrar());

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.cerrar();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._overlay.hidden) this.cerrar();
    });
  }

  _buildContent(paquete) {
    const esc = (s) => {
      if (typeof s !== 'string') return String(s ?? '');
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
              .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    const imgHTML = paquete.imagen
      ? `<img class="modal__img" src="${esc(paquete.imagen)}" alt="${esc(paquete.titulo)}" />`
      : `<div class="modal__img-placeholder">${this._emojiCategoria(paquete.categoria)}</div>`;

    const metaItems = [];
    if (paquete.duracion) metaItems.push(`<span class="modal__meta-item">🕐 ${esc(paquete.duracion)}</span>`);
    if (paquete.personas) metaItems.push(`<span class="modal__meta-item">👥 ${esc(paquete.personas)}</span>`);
    if (paquete.salida)   metaItems.push(`<span class="modal__meta-item">📅 ${esc(paquete.salida)}</span>`);

    const metaHTML   = metaItems.length ? `<div class="modal__meta">${metaItems.join('')}</div>` : '';
    const precioHTML = paquete.precio
      ? `<div class="modal__precio">
           <span class="modal__precio-label">Precio desde</span>
           $ ${new Intl.NumberFormat('es-AR').format(Number(paquete.precio))}
         </div>`
      : '';

    const wpText = encodeURIComponent(
      `Hola! Me interesa el paquete "${paquete.titulo}". ¿Pueden darme más información?`
    );

    return `
      ${imgHTML}
      <div class="modal__content">
        <span class="modal__badge">${esc(paquete.categoria || 'Paquete')}</span>
        <h2 class="modal__title" id="modal-title">${esc(paquete.titulo)}</h2>
        ${metaHTML}
        <p class="modal__desc">${esc(paquete.descripcion || '')}</p>
        ${precioHTML}
        <div class="modal__actions">
          <a
            href="https://wa.me/5493413341317?text=${wpText}"
            class="btn btn--wsp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Consultar por WhatsApp</span>
          </a>
          <a href="index.html#contacto" class="btn btn--ghost-dark">
            <span>Formulario de contacto</span>
            <span class="btn__arrow">→</span>
          </a>
        </div>
      </div>
    `;
  }

  _emojiCategoria(categoria) {
    const mapa = { nacional: '🏔', internacional: '✈️', grupal: '👥' };
    return mapa[categoria?.toLowerCase()] ?? '🗺';
  }
}


/* ============================================================
   CLASS: LanguageToggle
   Responsabilidad: traducción ES ↔ EN de toda la página
   usando atributos data-i18n en el HTML.
============================================================ */
class LanguageToggle {
  /**
   * @param {string} btnId   - ID del botón toggle
   * @param {string} flagId  - ID del span de bandera
   * @param {string} labelId - ID del span de label
   */
  constructor(btnId, flagId, labelId) {
    this._btn   = document.getElementById(btnId);
    this._flag  = document.getElementById(flagId);
    this._label = document.getElementById(labelId);
    this._lang  = 'es';

    this._strings = {
      es: {
        /* Nav */
        'nav.nosotros':   'Nosotros',
        'nav.traslados':  'Traslados',
        'nav.agencia':    'Agencia',
        'nav.contacto':   'Contacto',
        'nav.cta':        'Consultar',
        'nav.admin':      'Admin',
        /* Hero */
        'hero.eyebrow':   'Agencia habilitada · Turismo nacional e internacional',
        'hero.title1':    'Viajá con',
        'hero.title2':    'quienes saben',
        'hero.title3':    'hacerlo.',
        'hero.desc':      'Paquetes nacionales e internacionales y viajes grupales. Armamos cada itinerario a medida, con el respaldo de más de 15 años de experiencia.',
        'hero.btn1':      'Ver paquetes',
        'hero.btn2':      'Consultar un viaje',
        /* Chips */
        'chip.internacional': 'Internacional',
        'chip.nacional':      'Nacional',
        'chip.grupal':        'Grupal',
        /* Marquee */
        'marquee.1': 'Paquetes Nacionales',
        'marquee.2': 'Turismo Internacional',
        'marquee.3': 'Turismo Grupal',
        'marquee.4': 'Agencia Habilitada',
        'marquee.5': 'Itinerarios a Medida',
        'marquee.6': 'Soporte 24/7',
        /* Sección paquetes */
        'paquetes.tag':          'Nuestros paquetes',
        'paquetes.heading1':     'Encontrá tu próximo',
        'paquetes.heading2':     ' destino',
        'paquetes.sub':          'Filtrá por categoría y explorá todas las opciones disponibles.',
        'paquetes.cargando':     'Cargando paquetes...',
        'paquetes.sinResultados':'No hay paquetes en esta categoría por el momento.',
        'paquetes.verTodos':     'Ver todos',
        /* Filtros */
        'filtro.todos':          'Todos',
        'filtro.nacional':       'Nacional',
        'filtro.internacional':  'Internacional',
        'filtro.grupal':         'Grupal',
        /* CTA banner */
        'cta.tag':      '¿No encontrás lo que buscás?',
        'cta.heading1': 'Armamos tu viaje',
        'cta.heading2': ' a medida',
        'cta.sub':      'Contanos el destino, las fechas y la cantidad de personas. Un asesor te responde a la brevedad con una propuesta personalizada.',
        'cta.btn':      'Consultar por WhatsApp',
        /* WhatsApp */
        'wsp.tooltip':  'Escribinos',
      },

      en: {
        /* Nav */
        'nav.nosotros':   'About Us',
        'nav.traslados':  'Transfers',
        'nav.agencia':    'Agency',
        'nav.contacto':   'Contact',
        'nav.cta':        'Enquire',
        'nav.admin':      'Admin',
        /* Hero */
        'hero.eyebrow':   'Licensed agency · Domestic & international tourism',
        'hero.title1':    'Travel with',
        'hero.title2':    'those who know',
        'hero.title3':    'how.',
        'hero.desc':      'Domestic and international packages and group travel. We craft every itinerary to suit you, backed by over 15 years of experience.',
        'hero.btn1':      'View packages',
        'hero.btn2':      'Ask about a trip',
        /* Chips */
        'chip.internacional': 'International',
        'chip.nacional':      'Domestic',
        'chip.grupal':        'Group',
        /* Marquee */
        'marquee.1': 'Domestic Packages',
        'marquee.2': 'International Tourism',
        'marquee.3': 'Group Travel',
        'marquee.4': 'Licensed Agency',
        'marquee.5': 'Custom Itineraries',
        'marquee.6': '24/7 Support',
        /* Sección paquetes */
        'paquetes.tag':          'Our packages',
        'paquetes.heading1':     'Find your next',
        'paquetes.heading2':     ' destination',
        'paquetes.sub':          'Filter by category and explore all available options.',
        'paquetes.cargando':     'Loading packages...',
        'paquetes.sinResultados':'No packages in this category at the moment.',
        'paquetes.verTodos':     'View all',
        /* Filtros */
        'filtro.todos':          'All',
        'filtro.nacional':       'Domestic',
        'filtro.internacional':  'International',
        'filtro.grupal':         'Group',
        /* CTA banner */
        'cta.tag':      "Can't find what you're looking for?",
        'cta.heading1': 'We tailor your trip',
        'cta.heading2': ' just for you',
        'cta.sub':      'Tell us the destination, dates and number of people. An advisor will get back to you shortly with a personalised proposal.',
        'cta.btn':      'Ask on WhatsApp',
        /* WhatsApp */
        'wsp.tooltip':  'Message us',
      },
    };

    if (!this._btn) return;
    this._btn.addEventListener('click',    () => this._toggle());
    this._btn.addEventListener('touchend', (e) => { e.preventDefault(); this._toggle(); });
  }

  _toggle() {
    this._lang = this._lang === 'es' ? 'en' : 'es';
    this._aplicarIdioma();
    this._actualizarBtn();
  }

  _aplicarIdioma() {
    const dict = this._strings[this._lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] === undefined) return;
      el.textContent = dict[key];
    });

    document.documentElement.lang = this._lang;
  }

  _actualizarBtn() {
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
   BOOTSTRAP — instancia y conecta todas las clases
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1 · Navbar */
  new NavController('#js-nav', 40);

  /* 2 · Scroll reveal */
  const scrollReveal = new ScrollReveal('[data-reveal]', 0.1);
  scrollReveal.observe();

  /* 3 · Modal */
  const modal = new ModalController(
    'js-modal-overlay',
    'js-modal-close',
    'js-modal-body'
  );

  /* 4 · Paquetes */
  const paquetesManager = new PaquetesManager(
    'js-paquetes-grid',
    'js-paquetes-empty',
    'js-no-result',
    '.filtro-btn',
    modal
  );
  paquetesManager.init();

  /* 5 · Language toggle */
  new LanguageToggle('js-lang-toggle', 'js-lang-flag', 'js-lang-label');

});
