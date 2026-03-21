/**
 * index.js — Grupo Nuevo Destino · Página principal
 *
 * Arquitectura orientada a objetos ES6+.
 * Cada clase tiene una única responsabilidad (SRP).
 *
 * Clases:
 *  - NavController       : comportamiento del navbar al hacer scroll
 *  - HeroAnimator        : animaciones de entrada del hero
 *  - CounterAnimator     : contadores numéricos con easing cúbico
 *  - StatCardParallax    : efecto parallax suave en las stat cards
 *  - ScrollReveal        : reveal de elementos con IntersectionObserver
 *  - ContactForm         : manejo del formulario de consulta
 *  - LanguageToggle      : traducción ES/EN de toda la página
 */

'use strict';

/* ============================================================
   CLASS: NavController
   Responsabilidad: agregar/quitar la clase scrolled al nav
   cuando el usuario hace scroll más allá del umbral definido.
============================================================ */
class NavController {
  /**
   * @param {string} navSelector  - selector del elemento nav
   * @param {number} scrollThreshold - px de scroll para activar clase
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
   CLASS: HeroAnimator
   Responsabilidad: ejecutar las animaciones de entrada del hero
   en una secuencia cronometrada al cargar la página.
============================================================ */
class HeroAnimator {
  /**
   * @param {object} config - IDs de los elementos del hero
   */
  constructor(config) {
    this._eyebrowId    = config.eyebrowId;
    this._titleClass   = config.titleLineClass;
    this._descId       = config.descId;
    this._actionsId    = config.actionsId;
    this._statsId      = config.statsId;
  }

  /** Lanza todas las animaciones con sus delays */
  run() {
    window.addEventListener('load', () => {
      this._revealEyebrow();
      this._revealTitleLines();
      this._revealElement(this._descId,    640);
      this._revealElement(this._actionsId, 780);
      this._revealStats();
    });
  }

  _revealEyebrow() {
    const el = document.getElementById(this._eyebrowId);
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, 100);
  }

  _revealTitleLines() {
    document.querySelectorAll(this._titleClass).forEach((line, index) => {
      setTimeout(() => {
        line.style.clipPath = 'inset(0 0 0% 0)';
      }, 200 + index * 130);
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

  _revealStats() {
    const el = document.getElementById(this._statsId);
    if (!el) return;
    setTimeout(() => {
      el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, 500);
  }
}


/* ============================================================
   CLASS: CounterAnimator
   Responsabilidad: animar contadores numéricos desde 0
   hasta su valor objetivo usando easing cúbico.
============================================================ */
class CounterAnimator {
  /**
   * @param {Array<object>} counters - array de configuraciones
   * cada objeto: { elementId, target, suffix, formatter }
   */
  constructor(counters) {
    this._counters = counters;
    this._duration = 1800; // ms
    this._delay    = 700;  // ms antes de arrancar
  }

  /** Inicia todos los contadores */
  run() {
    window.addEventListener('load', () => {
      this._counters.forEach(counter => {
        const el = document.getElementById(counter.elementId);
        if (!el) return;
        setTimeout(() => this._animate(el, counter), this._delay);
      });
    });
  }

  /**
   * Anima un único contador con requestAnimationFrame.
   * @param {HTMLElement} el
   * @param {object}      counter
   */
  _animate(el, counter) {
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / this._duration, 1);

      // Easing cúbico (ease-out)
      const eased   = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * counter.target);

      el.textContent = counter.formatter(current) + (progress < 1 ? '' : counter.suffix);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}


/* ============================================================
   CLASS: StatCardParallax
   Responsabilidad: aplicar un desplazamiento vertical suave
   a las stat cards en función del scroll de la página.
============================================================ */
class StatCardParallax {
  /**
   * @param {string} cardSelector - selector de las tarjetas
   * @param {number} factor       - intensidad del parallax
   */
  constructor(cardSelector, factor = 0.03) {
    this._cards  = document.querySelectorAll(cardSelector);
    this._factor = factor;

    if (this._cards.length === 0) return;
    this._bindScroll();
  }

  _bindScroll() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      this._cards.forEach((card, index) => {
        const offset = scrollY * this._factor * (index + 1);
        card.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
  }
}


/* ============================================================
   CLASS: ScrollReveal
   Responsabilidad: observar elementos con [data-reveal] y
   añadir la clase .is-visible cuando entran en el viewport.
============================================================ */
class ScrollReveal {
  /**
   * @param {string} selector    - atributo selector de elementos
   * @param {number} threshold   - fracción visible para activar
   * @param {number} staggerMs   - delay escalonado entre elementos
   */
  constructor(selector = '[data-reveal]', threshold = 0.1, staggerMs = 80) {
    this._selector  = selector;
    this._stagger   = staggerMs;
    this._observer  = new IntersectionObserver(
      this._onIntersect.bind(this),
      { threshold }
    );
  }

  /** Empieza a observar todos los elementos del selector */
  observe() {
    document.querySelectorAll(this._selector).forEach(el => {
      this._observer.observe(el);
    });
  }

  _onIntersect(entries) {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(
          () => entry.target.classList.add('is-visible'),
          index * this._stagger
        );
        this._observer.unobserve(entry.target);
      }
    });
  }
}


/* ============================================================
   CLASS: ContactForm
   Responsabilidad: manejar el envío del formulario de consulta
   y mostrar feedback visual al usuario.
============================================================ */
class ContactForm {
  /**
   * @param {string} formSelector - selector del formulario
   */
  constructor(formSelector) {
    this._form = document.querySelector(formSelector);
    if (!this._form) return;
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

    span.textContent    = '✓ Enviado — te contactamos pronto';
    btn.style.background = '#25D366';

    setTimeout(() => {
      span.textContent    = 'Enviar consulta →';
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
  /**
   * @param {string} btnId     - id del botón toggle
   * @param {string} flagId    - id del span con la bandera
   * @param {string} labelId   - id del span con el texto del idioma
   */
  constructor(btnId, flagId, labelId) {
    this._btn    = document.getElementById(btnId);
    this._flag   = document.getElementById(flagId);
    this._label  = document.getElementById(labelId);
    this._lang   = 'es'; // idioma actual

    this._strings = {
      es: {
        'nav.nosotros':        'Nosotros',
        'nav.traslados':       'Traslados',
        'nav.agencia':         'Agencia',
        'nav.contacto':        'Contacto',
        'nav.cta':             'Consultar',

        'hero.eyebrow':        'Rosario, Argentina · Desde 2011',
        'hero.title1':         'Turismo',
        'hero.title2':         '& traslados',
        'hero.title3':         'con propósito.',
        'hero.desc':           'Empresa familiar con más de 15 años conectando personas con destinos. Flota propia, soporte 24/7 y el compromiso de quien cuida cada viaje como si fuera el suyo.',
        'hero.btn1':           'Ver traslados',
        'hero.btn2':           'Ver paquetes',
        'hero.stat1':          'Viajes realizados',
        'hero.stat2':          'Unidades 0km',
        'hero.stat3':          'Clientes atendidos',

        'marquee.1':           'Traslados Corporativos',
        'marquee.2':           'Premium VIP',
        'marquee.3':           'Turismo Nacional',
        'marquee.4':           'Turismo Internacional',
        'marquee.5':           'Traslado Empresarial',
        'marquee.6':           'Eventos & Sociales',
        'marquee.7':           'Logística Empresarial',
        'marquee.8':           'Flota Propia 0KM',
        'marquee.9':           'Monitoreo Satelital 24/7',

        'about.tag':           'Quiénes somos',
        'about.heading':       'Una empresa <em>familiar</em> que creció sin perder sus valores.',
        'about.body1':         'Grupo Nuevo Destino nació en Rosario como una idea familiar y hoy es una organización profesional con infraestructura propia, tecnología de monitoreo y un equipo comprometido con cada servicio.',
        'about.body2':         'Dos áreas especializadas —traslados y turismo— que comparten la misma filosofía: hacer bien lo que hacemos, con la persona en el centro de cada decisión.',
        'about.quote':         '"Lo que comenzó como una idea, hoy es una realidad construida con trabajo, compromiso y la confianza de todas las personas que acompañaron este camino."',
        'about.sigRole':       'Presidente · Grupo Nuevo Destino',

        'values.1.title':      'Compromiso con el servicio',
        'values.1.desc':       'Cada traslado es una responsabilidad. Experiencias seguras y puntuales en cada viaje, sin excepciones.',
        'values.2.title':      'Seguridad y confiabilidad',
        'values.2.desc':       'Operamos bajo altos estándares, priorizando la seguridad en cada servicio que brindamos.',
        'values.3.title':      'Cercanía y trato humano',
        'values.3.desc':       'Espíritu familiar, vínculos genuinos y atención personalizada. Nos importa quién viaja.',
        'values.4.title':      'Profesionalismo operativo',
        'values.4.desc':       'Infraestructura propia, tecnología y experiencia para soluciones eficientes y escalables.',

        'metrics.1':           'Años de trayectoria',
        'metrics.2':           'Viajes realizados',
        'metrics.3':           'Clientes atendidos',
        'metrics.4':           'Unidades 0km',

        'card1.area':          'Área 01 · Movilidad',
        'card1.heading':       'Nuevo Destino Traslados',
        'card1.subtitle':      'Traslado Corporativo',
        'card1.desc':          'Transporte corporativo, ejecutivo y grupal. Flota propia, monitoreo satelital y soporte 24/7.',
        'card1.chip1':         'Corporativo',
        'card1.chip2':         'VIP Premium',
        'card1.chip3':         'Grupos',
        'card1.chip4':         'Eventos',
        'card1.tooltip':       'Ver todos los traslados →',

        'card2.superLabel':    'Agencia',
        'card2.area':          'Área 02 · Turismo',
        'card2.heading':       'Nuevo Destino Viajes',
        'card2.desc':          'Agencia habilitada. Paquetes nacionales e internacionales, egresados y viajes grupales.',
        'card2.chip1':         'Nacional',
        'card2.chip2':         'Internacional',
        'card2.chip3':         'Egresados',
        'card2.chip4':         'Grupal',
        'card2.tooltip':       'Ver paquetes de viaje →',

        'contact.tag':         'Hablemos',
        'contact.heading':     '¿Empezamos a <em>planificar</em> tu viaje?',
        'contact.sub':         'Completá el formulario y un asesor te contacta a la brevedad con toda la información que necesitás.',
        'contact.addr.label':  'Dirección',
        'contact.wa.label':    'WhatsApp',

        'form.name.label':     'Nombre',
        'form.name.ph':        'Tu nombre',
        'form.phone.label':    'Teléfono',
        'form.email.label':    'Email',
        'form.service.label':  'Servicio de interés',
        'form.service.opt0':   'Seleccioná…',
        'form.service.opt1':   'Traslados corporativos',
        'form.service.opt2':   'Traslados ejecutivos / VIP',
        'form.service.opt3':   'Alquiler de unidad',
        'form.service.opt4':   'Turismo nacional',
        'form.service.opt5':   'Turismo internacional',
        'form.service.opt6':   'Eventos',
        'form.service.opt7':   'Otro',
        'form.msg.label':      'Mensaje',
        'form.msg.ph':         'Contanos de tu viaje: fecha, cantidad de personas, origen y destino…',
        'form.submit':         'Enviar consulta →',

        'wsp.tooltip':         'Escribinos',
      },
      en: {
        'nav.nosotros':        'About Us',
        'nav.traslados':       'Transfers',
        'nav.agencia':         'Agency',
        'nav.contacto':        'Contact',
        'nav.cta':             'Enquire',

        'hero.eyebrow':        'Rosario, Argentina · Since 2011',
        'hero.title1':         'Tourism',
        'hero.title2':         '& transfers',
        'hero.title3':         'with purpose.',
        'hero.desc':           'A family business with over 15 years connecting people with destinations. Own fleet, 24/7 support and the commitment of those who care for every journey as if it were their own.',
        'hero.btn1':           'View transfers',
        'hero.btn2':           'View packages',
        'hero.stat1':          'Trips completed',
        'hero.stat2':          'Brand-new vehicles',
        'hero.stat3':          'Clients served',

        'marquee.1':           'Corporate Transfers',
        'marquee.2':           'Premium VIP',
        'marquee.3':           'Domestic Tourism',
        'marquee.4':           'International Tourism',
        'marquee.5':           'Business Transfer',
        'marquee.6':           'Events & Social',
        'marquee.7':           'Business Logistics',
        'marquee.8':           'Own Fleet 0KM',
        'marquee.9':           'Satellite Monitoring 24/7',

        'about.tag':           'Who we are',
        'about.heading':       'A <em>family</em> business that grew without losing its values.',
        'about.body1':         'Grupo Nuevo Destino was born in Rosario as a family idea and today is a professional organisation with its own infrastructure, monitoring technology and a team committed to every service.',
        'about.body2':         'Two specialised areas — transfers and tourism — that share the same philosophy: doing what we do well, with the person at the centre of every decision.',
        'about.quote':         '"What started as an idea is today a reality built through hard work, commitment and the trust of every person who has been part of this journey."',
        'about.sigRole':       'President · Grupo Nuevo Destino',

        'values.1.title':      'Commitment to service',
        'values.1.desc':       'Every transfer is a responsibility. Safe and punctual experiences on every trip, no exceptions.',
        'values.2.title':      'Safety and reliability',
        'values.2.desc':       'We operate to the highest standards, prioritising safety in every service we provide.',
        'values.3.title':      'Closeness and human touch',
        'values.3.desc':       'Family spirit, genuine connections and personalised attention. We care about who travels.',
        'values.4.title':      'Operational professionalism',
        'values.4.desc':       'Own infrastructure, technology and experience for efficient, scalable solutions.',

        'metrics.1':           'Years of experience',
        'metrics.2':           'Trips completed',
        'metrics.3':           'Clients served',
        'metrics.4':           'Brand-new vehicles',

        'card1.area':          'Area 01 · Mobility',
        'card1.heading':       'Nuevo Destino Transfers',
        'card1.subtitle':      'Corporate Transfer',
        'card1.desc':          'Corporate, executive and group transport. Own fleet, satellite monitoring and 24/7 support.',
        'card1.chip1':         'Corporate',
        'card1.chip2':         'VIP Premium',
        'card1.chip3':         'Groups',
        'card1.chip4':         'Events',
        'card1.tooltip':       'View all transfers →',

        'card2.superLabel':    'Agency',
        'card2.area':          'Area 02 · Tourism',
        'card2.heading':       'Nuevo Destino Travel',
        'card2.desc':          'Registered travel agency. Domestic and international packages, school trips and group travel.',
        'card2.chip1':         'Domestic',
        'card2.chip2':         'International',
        'card2.chip3':         'School trips',
        'card2.chip4':         'Group',
        'card2.tooltip':       'View travel packages →',

        'contact.tag':         'Let\'s talk',
        'contact.heading':     'Ready to <em>plan</em> your trip?',
        'contact.sub':         'Fill in the form and an adviser will contact you shortly with all the information you need.',
        'contact.addr.label':  'Address',
        'contact.wa.label':    'WhatsApp',

        'form.name.label':     'Name',
        'form.name.ph':        'Your name',
        'form.phone.label':    'Phone',
        'form.email.label':    'Email',
        'form.service.label':  'Service of interest',
        'form.service.opt0':   'Select…',
        'form.service.opt1':   'Corporate transfers',
        'form.service.opt2':   'Executive / VIP transfers',
        'form.service.opt3':   'Vehicle rental',
        'form.service.opt4':   'Domestic tourism',
        'form.service.opt5':   'International tourism',
        'form.service.opt6':   'Events',
        'form.service.opt7':   'Other',
        'form.msg.label':      'Message',
        'form.msg.ph':         'Tell us about your trip: date, number of people, origin and destination…',
        'form.submit':         'Send enquiry →',

        'wsp.tooltip':         'Message us',
      },
    };

    if (!this._btn) return;
    this._btn.addEventListener('click', () => this._toggle());
    // Touch support: also listen for touchend to help mobile users
    this._btn.addEventListener('touchend', (e) => { e.preventDefault(); this._toggle(); });
  }

  _toggle() {
    this._lang = this._lang === 'es' ? 'en' : 'es';
    this._applyLanguage();
    this._updateBtn();
  }

  _applyLanguage() {
    const dict = this._strings[this._lang];

    // Update all [data-i18n] elements (textContent or innerHTML for rich text)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] === undefined) return;

      // Use innerHTML for keys that contain HTML tags (em, etc.)
      if (dict[key].includes('<')) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // Update <html lang> attribute
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
   BOOTSTRAP — instancia y conecta todas las clases al cargar
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1 · Navbar */
  new NavController('#js-nav', 40);

  /* 2 · Hero animations */
  const heroAnimator = new HeroAnimator({
    eyebrowId:      'js-eyebrow',
    titleLineClass: '.hero__title-line',
    descId:         'js-hero-desc',
    actionsId:      'js-hero-actions',
    statsId:        'js-hero-stats',
  });
  heroAnimator.run();

  /* 3 · Counter animations */
  const counterAnimator = new CounterAnimator([
    {
      elementId: 'js-count-1',
      target:    56500,
      suffix:    '+',
      formatter: n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n),
    },
    {
      elementId: 'js-count-2',
      target:    25,
      suffix:    '+',
      formatter: n => String(n),
    },
    {
      elementId: 'js-count-3',
      target:    2600,
      suffix:    '+',
      formatter: n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n),
    },
  ]);
  counterAnimator.run();

  /* 4 · Stat card parallax */
  new StatCardParallax('.stat-card', 0.03);

  /* 5 · Scroll reveal */
  const scrollReveal = new ScrollReveal('[data-reveal]', 0.1, 80);
  scrollReveal.observe();

  /* 6 · Contact form */
  new ContactForm('#js-contact-form');

  /* 7 · Language toggle */
  new LanguageToggle('js-lang-toggle', 'js-lang-flag', 'js-lang-label');

});
