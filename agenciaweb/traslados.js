/**
 * traslados.js — Nuevo Destino Traslados
 *
 * Arquitectura orientada a objetos ES6+.
 * Cada clase tiene una única responsabilidad (SRP).
 *
 * Clases:
 *  - NavController     : comportamiento del navbar al hacer scroll
 *  - HeroBgReveal      : expande el panel bg del hero al hacer scroll
 *  - HeroAnimator      : animaciones de entrada del hero
 *  - ScrollReveal      : reveal de elementos con IntersectionObserver
 *  - QuoteForm         : manejo del formulario de cotización
 *  - LanguageToggle    : traducción ES/EN de toda la página
 */

'use strict';

/* ============================================================
   CLASS: NavController
============================================================ */
class NavController {
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
   CLASS: HeroBgReveal
============================================================ */
class HeroBgReveal {
  constructor(bgElementId, scrollRange = 300, initialClip = 55) {
    this._bg          = document.getElementById(bgElementId);
    this._scrollRange = scrollRange;
    this._initialClip = initialClip;
    if (!this._bg) return;
    this._bindScroll();
  }
  _bindScroll() {
    window.addEventListener('scroll', () => {
      const progress = Math.min(window.scrollY / this._scrollRange, 1);
      const clip     = this._initialClip - progress * this._initialClip;
      this._bg.style.clipPath = `inset(0 0 0 ${clip}%)`;
    }, { passive: true });
  }
}


/* ============================================================
   CLASS: HeroAnimator
============================================================ */
class HeroAnimator {
  constructor(config) {
    this._tagId      = config.tagId;
    this._titleClass = config.titleLineClass;
    this._descId     = config.descId;
    this._featuresId = config.featuresId;
  }
  run() {
    window.addEventListener('load', () => {
      this._revealTag();
      this._revealTitleLines();
      this._revealElement(this._descId,     650);
      this._revealElement(this._featuresId, 800);
    });
  }
  _revealTag() {
    const el = document.getElementById(this._tagId);
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, 120);
  }
  _revealTitleLines() {
    document.querySelectorAll(this._titleClass).forEach((line, index) => {
      setTimeout(() => { line.style.clipPath = 'inset(0 0 0% 0)'; }, 200 + index * 140);
    });
  }
  _revealElement(id, delay) {
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, delay);
  }
}


/* ============================================================
   CLASS: ScrollReveal
============================================================ */
class ScrollReveal {
  constructor(selector = '[data-reveal]', threshold = 0.1, staggerMs = 80) {
    this._selector = selector;
    this._stagger  = staggerMs;
    this._observer = new IntersectionObserver(this._onIntersect.bind(this), { threshold });
  }
  observe() {
    document.querySelectorAll(this._selector).forEach(el => this._observer.observe(el));
  }
  _onIntersect(entries) {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), index * this._stagger);
        this._observer.unobserve(entry.target);
      }
    });
  }
}


/* ============================================================
   CLASS: QuoteForm
============================================================ */
class QuoteForm {
  constructor(formSelector) {
    this._form = document.querySelector(formSelector);
    if (!this._form) return;
    this._originalLabel = 'Solicitar cotización →';
    this._bindSubmit();
  }
  _bindSubmit() {
    this._form.addEventListener('submit', e => this._handleSubmit(e));
  }
  _handleSubmit(e) {
    e.preventDefault();
    const btn  = this._form.querySelector('.btn--submit');
    const span = btn?.querySelector('span');
    if (!btn || !span) return;
    span.textContent     = '✓ Solicitud enviada — te contactamos pronto';
    btn.style.background = '#25D366';
    setTimeout(() => {
      span.textContent     = this._originalLabel;
      btn.style.background = '';
    }, 3500);
  }
}


/* ============================================================
   CLASS: LanguageToggle
   Responsabilidad: alternar el idioma de la página entre
   español (ES) e inglés (EN) usando atributos data-i18n.
============================================================ */
class LanguageToggle {
  constructor(btnId, flagId, labelId) {
    this._btn   = document.getElementById(btnId);
    this._flag  = document.getElementById(flagId);
    this._label = document.getElementById(labelId);
    this._lang  = 'es';

    this._strings = {
      es: {
        'nav.inicio':    'Inicio',
        'nav.traslados': 'Traslados',
        'nav.agencia':   'Agencia',
        'nav.cotizar':   'Cotizar',

        'hero.tag':    'Área de movilidad',
        'hero.title1': 'Nuevo Destino',
        'hero.title2': 'Traslados.',
        'hero.desc':   'Soluciones profesionales de transporte para empresas, grupos y eventos. Flota propia 0km, conductores habilitados y soporte operativo las 24 horas del día.',
        'hero.feat1':  'Soporte 24/7',
        'hero.feat2':  'Monitoreo satelital',
        'hero.feat3':  'Flota propia 0km',
        'hero.feat4':  'Choferes profesionales',

        'fleet.sedan':  'Sedán ejecutivo',
        'fleet.van':    'Van / Combi',
        'fleet.minibus':'Minibús',
        'fleet.micro':  'Micro interurbano',
        'fleet.double': 'Doble piso',
        'fleet.gps':    'Monitoreo GPS',

        'services.tag':     'Qué ofrecemos',
        'services.heading': 'Nuestros <em>servicios.</em>',
        'services.sub':     'Cubrimos todas las necesidades de traslado con vehículos adecuados para cada caso y conductores con habilitaciones vigentes.',

        'srv.corp.title': 'Corporativo',
        'srv.corp.1': 'Servicios regulares con convenio',
        'srv.corp.2': 'Traslados ejecutivos',
        'srv.corp.3': 'Movilidad para eventos empresariales',
        'srv.corp.4': 'Soluciones de transporte a medida',

        'srv.rental.title': 'Alquiler de unidades',
        'srv.rental.1': 'Alquiler de vans / combis',
        'srv.rental.2': 'Minibuses 15 a 28 pasajeros',
        'srv.rental.3': 'Micros interurbanos',
        'srv.rental.4': 'Larga distancia piso elevado / doble piso',

        'srv.group.title': 'Grandes contingentes',
        'srv.group.1': 'Gestión de múltiples unidades',
        'srv.group.2': 'Coordinación de horarios y rutas',
        'srv.group.3': 'Servicios de tercerización',
        'srv.group.4': 'Logística de transporte integral',

        'premium.tag':     'Servicio exclusivo',
        'premium.heading': 'Nuevo Destino <em>Premium.</em>',
        'premium.desc':    'Experiencia de traslado de nivel internacional para ejecutivos, celebridades y eventos de alto perfil. Discreción, confort y puntualidad sin compromisos.',
        'premium.btn':     'Consultar Premium →',
        'premium.vip.title':    'Servicios VIP Personalizados',
        'premium.vip.desc':     'Unidades 0km de gama alta con atención exclusiva y protocolo premium.',
        'premium.routes.title': 'Asesoramiento y armado de rutas',
        'premium.routes.desc':  'Planificación logística a medida para cada traslado, sin importar la complejidad.',
        'premium.celeb.title':  'Traslado de celebridades',
        'premium.celeb.desc':   'Experiencia en traslados con o sin custodia privada o policial en ruta.',
        'premium.coord.title':  'Coordinación VIP en ruta',
        'premium.coord.desc':   'Protocolos de seguridad, discreción total y comunicación constante.',

        'corp.tag':     'Soluciones empresariales',
        'corp.heading': 'Diferenciales <em>corporativos.</em>',
        'corp.sub':     'Diseñamos soluciones a medida para optimizar la movilidad de tu capital humano con la máxima eficiencia operativa.',
        'corp.staff.title':     'Traslado de personal',
        'corp.staff.desc':      'Servicios diseñados para garantizar seguridad, puntualidad y eficiencia en el traslado diario de colaboradores, con rutas y horarios personalizados.',
        'corp.logistics.title': 'Logística integral',
        'corp.logistics.desc':  'Análisis, diseño e implementación de recorridos empresariales con mejora continua de procesos y rendición periódica de indicadores.',
        'corp.routes.title':    'Optimización de rutas',
        'corp.routes.desc':     'Diagnóstico personalizado para reducir tiempos de traslado, minimizar costos y optimizar el uso de recursos críticos.',
        'corp.satellite.title': 'Monitoreo satelital',
        'corp.satellite.desc':  'Seguimiento en tiempo real de todas las unidades para ajustes inmediatos ante cualquier contingencia. Reportes disponibles 24/7.',
        'corp.support.title':   'Soporte operativo 24/7',
        'corp.support.sub':     'Centro de atención disponible los 365 días del año',

        'special.tag':     'Servicios especializados',
        'special.heading': 'Servicios <em>especiales.</em>',
        'special.sub':     'Soluciones integrales de transporte que se adaptan a la logística de cada encuentro, cada grupo, cada evento.',
        'sp.tourism.title': 'Turismo a medida',
        'sp.tourism.desc':  'Traslados receptivos y viajes personalizados para grupos con confort y flexibilidad horaria total.',
        'sp.events.title':  'Eventos sociales & corporativos',
        'sp.events.desc':   'Logística para casamientos, congresos y fiestas. Coordinación integral de invitados y personal.',
        'sp.school.title':  'Excursiones escolares',
        'sp.school.desc':   'Transporte seguro para instituciones educativas. Unidades habilitadas y choferes con antecedentes verificados.',
        'sp.sports.title':  'Clubes & deportes',
        'sp.sports.desc':   'Traslados para delegaciones deportivas con amplio espacio para equipaje y flexibilidad horaria.',

        'ops.tag':     'Centro operativo',
        'ops.heading': 'Nuevo Destino <em>Servicios.</em>',
        'ops.sub':     '+5000 m² propios para mecánica pesada, preventiva, asistencia en ruta, lavadero y guarda de unidades con vigilancia 24hs.',
        'ops.mec.title':    'Mecánica',
        'ops.mec.1':        'Asistencia 24hs en ruta',
        'ops.mec.2':        'Mecánica preventiva propia',
        'ops.mec.3':        'Repuestos y cristales',
        'ops.mec.4':        'Taller de chapa y pintura',
        'ops.crane.title':  'Grúas & auxilio',
        'ops.crane.1':      'Servicio de grúas',
        'ops.crane.2':      'Asistencia mecánica pesada',
        'ops.crane.3':      'Cobertura en ruta nacional',
        'ops.crane.4':      'Respuesta inmediata',
        'ops.center.title': 'Centro operativo',
        'ops.center.1':     'Lavadero de unidades',
        'ops.center.2':     'Mantenimiento de flota',
        'ops.center.3':     'Guarda de unidades',
        'ops.center.4':     'Servicios a terceros',

        'quote.tag':     'Cotizá tu servicio',
        'quote.heading': 'Pedí tu <em>cotización.</em>',
        'quote.sub':     'Completá el formulario y te respondemos en menos de 24 horas hábiles.',

        'qform.name.label':    'Nombre y apellido',
        'qform.name.ph':       'Tu nombre completo',
        'qform.company.label': 'Empresa (opcional)',
        'qform.company.ph':    'Nombre de empresa',
        'qform.email.label':   'Email',
        'qform.phone.label':   'Teléfono / WhatsApp',
        'qform.service.label': 'Tipo de servicio',
        'qform.service.opt0':  'Seleccioná…',
        'qform.service.opt1':  'Traslado corporativo regular',
        'qform.service.opt2':  'Traslado ejecutivo',
        'qform.service.opt3':  'Servicio Premium / VIP',
        'qform.service.opt4':  'Alquiler de micro / van',
        'qform.service.opt5':  'Evento social / corporativo',
        'qform.service.opt6':  'Excursión escolar',
        'qform.service.opt7':  'Club / deporte',
        'qform.service.opt8':  'Servicio mecánica / grúa',
        'qform.service.opt9':  'Otro',
        'qform.pax.label': 'Cantidad de pasajeros',
        'qform.pax.opt0':  'Estimado…',
        'qform.pax.opt1':  '1 – 4 personas',
        'qform.pax.opt2':  '5 – 15 personas',
        'qform.pax.opt3':  '16 – 30 personas',
        'qform.pax.opt4':  '31 – 50 personas',
        'qform.pax.opt5':  'Más de 50 personas',
        'qform.detail.label': 'Detalle del traslado',
        'qform.detail.ph':    'Origen, destino, fecha, horario y cualquier detalle que nos ayude a cotizar mejor…',
        'qform.submit':       'Solicitar cotización →',

        'footer.brand': 'Nuevo Destino Traslados',
        'wsp.tooltip':  'Cotizar por WhatsApp',
      },
      en: {
        'nav.inicio':    'Home',
        'nav.traslados': 'Transfers',
        'nav.agencia':   'Agency',
        'nav.cotizar':   'Get a quote',

        'hero.tag':    'Mobility area',
        'hero.title1': 'Nuevo Destino',
        'hero.title2': 'Transfers.',
        'hero.desc':   'Professional transport solutions for businesses, groups and events. Brand-new own fleet, licensed drivers and 24/7 operational support.',
        'hero.feat1':  '24/7 Support',
        'hero.feat2':  'Satellite monitoring',
        'hero.feat3':  'Own 0km fleet',
        'hero.feat4':  'Professional drivers',

        'fleet.sedan':  'Executive sedan',
        'fleet.van':    'Van / Minivan',
        'fleet.minibus':'Minibus',
        'fleet.micro':  'Intercity coach',
        'fleet.double': 'Double-decker',
        'fleet.gps':    'GPS monitoring',

        'services.tag':     'What we offer',
        'services.heading': 'Our <em>services.</em>',
        'services.sub':     'We cover all transport needs with the right vehicle for every case and drivers with current licences.',

        'srv.corp.title': 'Corporate',
        'srv.corp.1': 'Regular contracted services',
        'srv.corp.2': 'Executive transfers',
        'srv.corp.3': 'Mobility for corporate events',
        'srv.corp.4': 'Tailored transport solutions',

        'srv.rental.title': 'Vehicle rental',
        'srv.rental.1': 'Van / minivan rental',
        'srv.rental.2': 'Minibuses 15 to 28 passengers',
        'srv.rental.3': 'Intercity coaches',
        'srv.rental.4': 'Long-distance raised floor / double-decker',

        'srv.group.title': 'Large groups',
        'srv.group.1': 'Multi-vehicle management',
        'srv.group.2': 'Schedule and route coordination',
        'srv.group.3': 'Outsourcing services',
        'srv.group.4': 'Comprehensive transport logistics',

        'premium.tag':     'Exclusive service',
        'premium.heading': 'Nuevo Destino <em>Premium.</em>',
        'premium.desc':    'International-standard transfer experience for executives, celebrities and high-profile events. Discretion, comfort and punctuality — no compromises.',
        'premium.btn':     'Enquire about Premium →',
        'premium.vip.title':    'Personalised VIP Services',
        'premium.vip.desc':     'Top-range 0km vehicles with exclusive attention and premium protocol.',
        'premium.routes.title': 'Route planning & advice',
        'premium.routes.desc':  'Custom logistics planning for every transfer, regardless of complexity.',
        'premium.celeb.title':  'Celebrity transfers',
        'premium.celeb.desc':   'Experience in transfers with or without private or police escort on route.',
        'premium.coord.title':  'VIP route coordination',
        'premium.coord.desc':   'Security protocols, total discretion and constant communication.',

        'corp.tag':     'Business solutions',
        'corp.heading': 'Corporate <em>differentials.</em>',
        'corp.sub':     'We design tailored solutions to optimise your workforce mobility with maximum operational efficiency.',
        'corp.staff.title':     'Staff transfers',
        'corp.staff.desc':      'Services designed to guarantee safety, punctuality and efficiency in the daily commute of employees, with personalised routes and schedules.',
        'corp.logistics.title': 'Comprehensive logistics',
        'corp.logistics.desc':  'Analysis, design and implementation of corporate routes with continuous process improvement and regular performance reporting.',
        'corp.routes.title':    'Route optimisation',
        'corp.routes.desc':     'Personalised diagnosis to reduce travel times, minimise costs and optimise the use of critical resources.',
        'corp.satellite.title': 'Satellite monitoring',
        'corp.satellite.desc':  'Real-time tracking of all vehicles for immediate adjustments to any contingency. Reports available 24/7.',
        'corp.support.title':   '24/7 operational support',
        'corp.support.sub':     'Support centre available 365 days a year',

        'special.tag':     'Specialised services',
        'special.heading': '<em>Special</em> services.',
        'special.sub':     'Comprehensive transport solutions that adapt to the logistics of every event, every group, every gathering.',
        'sp.tourism.title': 'Custom tourism',
        'sp.tourism.desc':  'Receptive transfers and personalised trips for groups with full comfort and schedule flexibility.',
        'sp.events.title':  'Social & corporate events',
        'sp.events.desc':   'Logistics for weddings, conferences and parties. Complete coordination of guests and staff.',
        'sp.school.title':  'School excursions',
        'sp.school.desc':   'Safe transport for educational institutions. Licensed vehicles and drivers with verified backgrounds.',
        'sp.sports.title':  'Clubs & sports',
        'sp.sports.desc':   'Transfers for sports delegations with ample luggage space and schedule flexibility.',

        'ops.tag':     'Operational centre',
        'ops.heading': 'Nuevo Destino <em>Services.</em>',
        'ops.sub':     '+5000 m² of own space for heavy mechanics, preventive maintenance, roadside assistance, vehicle washing and 24hs guarded parking.',
        'ops.mec.title':    'Mechanics',
        'ops.mec.1':        '24hs roadside assistance',
        'ops.mec.2':        'Own preventive mechanics',
        'ops.mec.3':        'Parts and glass',
        'ops.mec.4':        'Body and paint shop',
        'ops.crane.title':  'Towing & assistance',
        'ops.crane.1':      'Towing service',
        'ops.crane.2':      'Heavy mechanical assistance',
        'ops.crane.3':      'National route coverage',
        'ops.crane.4':      'Immediate response',
        'ops.center.title': 'Operational centre',
        'ops.center.1':     'Vehicle washing',
        'ops.center.2':     'Fleet maintenance',
        'ops.center.3':     'Guarded vehicle storage',
        'ops.center.4':     'Third-party services',

        'quote.tag':     'Get a quote',
        'quote.heading': 'Request your <em>quote.</em>',
        'quote.sub':     'Fill in the form and we will respond within 24 business hours.',

        'qform.name.label':    'Full name',
        'qform.name.ph':       'Your full name',
        'qform.company.label': 'Company (optional)',
        'qform.company.ph':    'Company name',
        'qform.email.label':   'Email',
        'qform.phone.label':   'Phone / WhatsApp',
        'qform.service.label': 'Service type',
        'qform.service.opt0':  'Select…',
        'qform.service.opt1':  'Regular corporate transfer',
        'qform.service.opt2':  'Executive transfer',
        'qform.service.opt3':  'Premium / VIP service',
        'qform.service.opt4':  'Coach / van rental',
        'qform.service.opt5':  'Social / corporate event',
        'qform.service.opt6':  'School excursion',
        'qform.service.opt7':  'Club / sport',
        'qform.service.opt8':  'Mechanical / towing service',
        'qform.service.opt9':  'Other',
        'qform.pax.label': 'Number of passengers',
        'qform.pax.opt0':  'Estimate…',
        'qform.pax.opt1':  '1 – 4 people',
        'qform.pax.opt2':  '5 – 15 people',
        'qform.pax.opt3':  '16 – 30 people',
        'qform.pax.opt4':  '31 – 50 people',
        'qform.pax.opt5':  'More than 50 people',
        'qform.detail.label': 'Transfer details',
        'qform.detail.ph':    'Origin, destination, date, time and any details that help us quote accurately…',
        'qform.submit':       'Request quote →',

        'footer.brand': 'Nuevo Destino Transfers',
        'wsp.tooltip':  'Quote via WhatsApp',
      },
    };

    if (!this._btn) return;
    this._btn.addEventListener('click', () => this._toggle());
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
      if (dict[key].includes('<')) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    document.documentElement.lang = this._lang;
  }

  _updateBtn() {
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
   BOOTSTRAP
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1 · Navbar */
  new NavController('#js-nav', 40);

  /* 2 · Hero background reveal on scroll */
  new HeroBgReveal('js-hero-bg', 300, 55);

  /* 3 · Hero entrance animations */
  const heroAnimator = new HeroAnimator({
    tagId:          'js-hero-tag',
    titleLineClass: '.hero__title-line',
    descId:         'js-hero-desc',
    featuresId:     'js-hero-features',
  });
  heroAnimator.run();

  /* 4 · Scroll reveal */
  const scrollReveal = new ScrollReveal('[data-reveal]', 0.1, 80);
  scrollReveal.observe();

  /* 5 · Quote form */
  new QuoteForm('#js-quote-form');

  /* 6 · Language toggle */
  new LanguageToggle('js-lang-toggle', 'js-lang-flag', 'js-lang-label');

});
