/**
 * admin.js — Nuevo Destino Viajes · Panel de administración
 *
 * Arquitectura orientada a objetos ES6+ (módulo ESM).
 * Usa Firebase Auth para autenticación y Firestore para el CRUD
 * de paquetes de viaje.
 *
 * Clases:
 *  - AuthManager       : login, logout y estado de sesión
 *  - SidebarController : navegación entre paneles del sidebar
 *  - TablaManager      : carga y renderiza la tabla de paquetes
 *  - FormManager       : formulario para crear / editar paquetes
 *  - ConfirmModal      : modal de confirmación para eliminar
 */

'use strict';

/* ── Importaciones de Firebase ────────────────────────────── */
import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ── Configuración de Firebase  ── */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA-rqJU8LIZyUajUKzzEkbo67ASlPmH-GQ",
  authDomain:        'nuevo-destino-web.firebaseapp.com',
  projectId:          "nuevo-destino-web",
  storageBucket:     "nuevo-destino-web.firebasestorage.app",
  messagingSenderId: "287208628191" ,
  appId:             "1:287208628191:web:cf99598c33cd1614766e6a",
};

/* ── Correo autorizado para el admin ─────────────────────── */
const ADMIN_EMAIL = 'egarcia@nuevodestinoviajes.com';

/* ── Inicialización ───────────────────────────────────────── */
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ============================================================
   CLASS: AuthManager
   Responsabilidad: manejar login / logout con Firebase Auth y
   mostrar u ocultar la pantalla de login vs el panel admin.
============================================================ */
class AuthManager {
  /**
   * @param {object} config - IDs de los elementos relacionados
   */
  constructor(config) {
    this._loginScreen  = document.getElementById(config.loginScreenId);
    this._adminLayout  = document.getElementById(config.adminLayoutId);
    this._loginForm    = document.getElementById(config.loginFormId);
    this._emailInput   = document.getElementById(config.emailInputId);
    this._passInput    = document.getElementById(config.passInputId);
    this._loginError   = document.getElementById(config.loginErrorId);
    this._loginBtn     = document.getElementById(config.loginBtnId);
    this._logoutBtn    = document.getElementById(config.logoutBtnId);
    this._togglePass   = document.getElementById(config.togglePassId);
    this._adminEmail   = document.getElementById(config.adminEmailId);

    this._onLoginSuccess = null; // callback a ejecutar al autenticar
  }

  /**
   * Registra un callback que se llama cuando el admin inicia sesión.
   * @param {Function} fn
   */
  onLogin(fn) {
    this._onLoginSuccess = fn;
  }

  /** Inicializa listeners de Firebase Auth y botones */
  init() {
    this._bindLoginForm();
    this._bindLogout();
    this._bindTogglePass();
    this._watchAuthState();
  }

  /* ── Watchers ─────────────────────────────────────────────── */

  /** Observa el estado de autenticación y muestra el panel correcto */
  _watchAuthState() {
    onAuthStateChanged(auth, (user) => {
      if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        this._mostrarAdmin(user);
      } else {
        /* Si hay un usuario pero NO es el admin autorizado, lo desloguea */
        if (user) signOut(auth);
        this._mostrarLogin();
      }
    });
  }

  /* ── Bindings ─────────────────────────────────────────────── */

  _bindLoginForm() {
    if (!this._loginForm) return;

    this._loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = this._emailInput?.value.trim();
      const pass  = this._passInput?.value;

      /* Validar que sea el email autorizado antes de llamar a Firebase */
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        this._mostrarError('Este correo no tiene permisos de administrador.');
        return;
      }

      this._setLoginLoading(true);
      this._ocultarError();

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        /* onAuthStateChanged se encargará de mostrar el panel */
      } catch (error) {
        this._setLoginLoading(false);
        this._mostrarError(this._traducirError(error.code));
      }
    });
  }

  _bindLogout() {
    if (!this._logoutBtn) return;
    this._logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      /* onAuthStateChanged redirigirá a la pantalla de login */
    });
  }

  _bindTogglePass() {
    if (!this._togglePass || !this._passInput) return;
    this._togglePass.addEventListener('click', () => {
      const tipo = this._passInput.type === 'password' ? 'text' : 'password';
      this._passInput.type = tipo;
      this._togglePass.textContent = tipo === 'password' ? '👁' : '🙈';
    });
  }

  /* ── Helpers de UI ────────────────────────────────────────── */

  _mostrarAdmin(user) {
    this._loginScreen.hidden = true;
    this._adminLayout.hidden = false;

    if (this._adminEmail) {
      this._adminEmail.textContent = user.email;
    }

    if (typeof this._onLoginSuccess === 'function') {
      this._onLoginSuccess(user);
    }
  }

  _mostrarLogin() {
    this._loginScreen.hidden = false;
    this._adminLayout.hidden = true;
    this._loginForm?.reset();
    this._ocultarError();
    this._setLoginLoading(false);
  }

  _mostrarError(msg) {
    if (!this._loginError) return;
    this._loginError.textContent = msg;
    this._loginError.hidden = false;
  }

  _ocultarError() {
    if (!this._loginError) return;
    this._loginError.hidden = true;
    this._loginError.textContent = '';
  }

  _setLoginLoading(loading) {
    if (!this._loginBtn) return;
    this._loginBtn.disabled = loading;
    const span = this._loginBtn.querySelector('span');
    if (span) span.textContent = loading ? 'Ingresando…' : 'Ingresar →';
  }

  /**
   * Traduce los códigos de error de Firebase a mensajes legibles.
   * @param   {string} code - código de error de Firebase
   * @returns {string}
   */
  _traducirError(code) {
    const errores = {
      'auth/user-not-found':     'No existe una cuenta con ese correo.',
      'auth/wrong-password':     'Contraseña incorrecta. Intentá de nuevo.',
      'auth/invalid-email':      'El formato del correo no es válido.',
      'auth/too-many-requests':  'Demasiados intentos fallidos. Esperá unos minutos.',
      'auth/network-request-failed': 'Error de conexión. Verificá tu internet.',
      'auth/invalid-credential': 'Credenciales incorrectas. Verificá email y contraseña.',
    };
    return errores[code] ?? `Error al iniciar sesión (${code}).`;
  }
}


/* ============================================================
   CLASS: SidebarController
   Responsabilidad: manejar la navegación entre paneles del
   sidebar usando data-panel en los botones de la nav.
============================================================ */
class SidebarController {
  /**
   * @param {string} navItemSelector - selector de los botones del sidebar
   */
  constructor(navItemSelector) {
    this._items = document.querySelectorAll(navItemSelector);
  }

  init() {
    this._items.forEach(btn => {
      btn.addEventListener('click', () => this._navegar(btn.dataset.panel));
    });
  }

  /**
   * Navega a un panel específico.
   * @param {string} panelId - nombre del panel (sin prefijo "panel-")
   */
  _navegar(panelId) {
    /* Desactivar todos los items */
    this._items.forEach(btn => btn.classList.remove('sidebar__nav-item--active'));

    /* Activar el item clickeado */
    const itemActivo = document.querySelector(`[data-panel="${panelId}"]`);
    itemActivo?.classList.add('sidebar__nav-item--active');

    /* Ocultar todos los paneles */
    document.querySelectorAll('.admin-panel').forEach(panel => {
      panel.hidden = true;
    });

    /* Mostrar el panel objetivo */
    const panelTarget = document.getElementById(`panel-${panelId}`);
    if (panelTarget) panelTarget.hidden = false;
  }

  /** API pública para navegar desde otros controllers */
  ir(panelId) {
    this._navegar(panelId);
  }
}


/* ============================================================
   CLASS: TablaManager
   Responsabilidad: cargar los paquetes desde Firestore y
   renderizarlos en la tabla del panel de admin.
============================================================ */
class TablaManager {
  /**
   * @param {object}          config
   * @param {ConfirmModal}    confirmModal - instancia del modal de confirmación
   * @param {SidebarController} sidebar   - para navegar al form de edición
   * @param {FormManager}     formManager - para precargar datos al editar
   */
  constructor(config, confirmModal, sidebar, formManager) {
    this._tbody     = document.getElementById(config.tbodyId);
    this._emptyEl   = document.getElementById(config.emptyId);
    this._loaderEl  = document.getElementById(config.loaderId);
    this._confirm   = confirmModal;
    this._sidebar   = sidebar;
    this._form      = formManager;
  }

  /** Carga los paquetes y renderiza la tabla */
  async cargar() {
    this._setLoader(true);
    try {
      const q    = query(collection(db, 'paquetes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const paquetes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      this._renderTabla(paquetes);
    } catch (error) {
      console.error('Error al cargar tabla:', error);
    } finally {
      this._setLoader(false);
    }
  }

  /* ── Renderizado ─────────────────────────────────────────── */

  _renderTabla(paquetes) {
    this._tbody.innerHTML = '';

    if (paquetes.length === 0) {
      this._emptyEl.hidden = false;
      return;
    }

    this._emptyEl.hidden = true;
    paquetes.forEach(p => this._agregarFila(p));
  }

  _agregarFila(paquete) {
    const tr = document.createElement('tr');
    tr.className = 'tabla-paquetes__row';
    tr.dataset.id = paquete.id;

    /* Thumbnail */
    const thumbHTML = paquete.imagen
      ? `<img class="tabla-paquetes__thumb" src="${this._esc(paquete.imagen)}" alt="" loading="lazy" />`
      : `<div class="tabla-paquetes__thumb-placeholder">${this._emojiCategoria(paquete.categoria)}</div>`;

    /* Precio */
    const precioHTML = paquete.precio
      ? `$ ${new Intl.NumberFormat('es-AR').format(Number(paquete.precio))}`
      : '—';

    /* Badge de categoría */
    const cat      = paquete.categoria?.toLowerCase() ?? '';
    const badgeHTML = `<span class="tabla-badge tabla-badge--${this._esc(cat)}">${this._esc(paquete.categoria ?? '—')}</span>`;

    tr.innerHTML = `
      <td class="tabla-paquetes__td">
        <div class="tabla-paquetes__titulo-cell">
          ${thumbHTML}
          <span class="tabla-paquetes__nombre">${this._esc(paquete.titulo ?? '—')}</span>
        </div>
      </td>
      <td class="tabla-paquetes__td">${badgeHTML}</td>
      <td class="tabla-paquetes__td">${precioHTML}</td>
      <td class="tabla-paquetes__td">${this._esc(paquete.salida ?? '—')}</td>
      <td class="tabla-paquetes__td">
        <div class="tabla-paquetes__actions">
          <button class="tabla-btn tabla-btn--edit" data-action="editar" aria-label="Editar ${this._esc(paquete.titulo)}">Editar</button>
          <button class="tabla-btn tabla-btn--delete" data-action="eliminar" aria-label="Eliminar ${this._esc(paquete.titulo)}">Eliminar</button>
        </div>
      </td>
    `;

    /* Botón editar */
    tr.querySelector('[data-action="editar"]').addEventListener('click', () => {
      this._form.cargarParaEdicion(paquete);
      this._sidebar.ir('nuevo');
    });

    /* Botón eliminar */
    tr.querySelector('[data-action="eliminar"]').addEventListener('click', () => {
      this._confirm.abrir(
        `¿Eliminar el paquete "${paquete.titulo}"?`,
        async () => {
          await this._eliminar(paquete.id);
        }
      );
    });

    this._tbody.appendChild(tr);
  }

  /* ── CRUD: Eliminar ──────────────────────────────────────── */

  async _eliminar(id) {
    try {
      await deleteDoc(doc(db, 'paquetes', id));
      /* Remover la fila de la tabla sin recargar */
      const fila = this._tbody.querySelector(`[data-id="${id}"]`);
      fila?.remove();

      /* Si no quedan filas, mostrar el estado vacío */
      if (this._tbody.children.length === 0) {
        this._emptyEl.hidden = false;
      }
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
      alert('No se pudo eliminar el paquete. Intentá de nuevo.');
    }
  }

  /* ── Utilidades ──────────────────────────────────────────── */

  _setLoader(visible) {
    if (this._loaderEl) this._loaderEl.hidden = !visible;
    /* Ocultar la tabla mientras carga */
    const tabla = document.getElementById('js-tabla-paquetes');
    if (tabla) tabla.style.visibility = visible ? 'hidden' : 'visible';
  }

  _esc(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _emojiCategoria(categoria) {
    const mapa = { 'nacional': '🏔', 'internacional': '✈️', 'egresados': '🎓', 'grupal': '👥' };
    return mapa[categoria?.toLowerCase()] ?? '🗺';
  }
}


/* ============================================================
   CLASS: FormManager
   Responsabilidad: gestionar el formulario de creación y
   edición de paquetes, guardando en Firestore.
============================================================ */
class FormManager {
  /**
   * @param {object}          config
   * @param {TablaManager}    tabla   - para recargar la tabla tras guardar
   * @param {SidebarController} sidebar
   */
  constructor(config, tabla, sidebar) {
    this._form        = document.getElementById(config.formId);
    this._idInput     = document.getElementById(config.idInputId);
    this._tituloInput = document.getElementById(config.tituloId);
    this._catInput    = document.getElementById(config.categoriaId);
    this._descInput   = document.getElementById(config.descripcionId);
    this._precioInput = document.getElementById(config.precioId);
    this._durInput    = document.getElementById(config.duracionId);
    this._persInput   = document.getElementById(config.personasId);
    this._salidaInput = document.getElementById(config.salidaId);
    this._imgInput    = document.getElementById(config.imagenId);
    this._imgPreview  = document.getElementById(config.imgPreviewId);
    this._imgPreviewImg = document.getElementById(config.imgPreviewImgId);
    this._errorEl     = document.getElementById(config.errorId);
    this._successEl   = document.getElementById(config.successId);
    this._submitBtn   = document.getElementById(config.submitBtnId);
    this._submitLabel = document.getElementById(config.submitLabelId);
    this._tagEl       = document.getElementById(config.tagId);

    this._tabla   = tabla;
    this._sidebar = sidebar;

    this._modoEdicion = false;
  }

  init() {
    this._bindForm();
    this._bindImgPreview();
    this._bindCancelar();
    this._bindNuevoPaqueteBtn();
    this._bindCrearPrimeroBtn();
  }

  /* ── Modo creación / edición ─────────────────────────────── */

  /** Prepara el form en modo "nuevo paquete" */
  resetearForm() {
    this._form?.reset();
    this._idInput.value   = '';
    this._modoEdicion     = false;

    if (this._tagEl)   this._tagEl.textContent = 'Nuevo paquete';
    if (this._submitLabel) this._submitLabel.textContent = 'Guardar paquete';

    this._ocultarMensajes();
    this._ocultarPreviewImg();
  }

  /**
   * Precarga los datos de un paquete en el form para edición.
   * @param {object} paquete
   */
  cargarParaEdicion(paquete) {
    this.resetearForm();
    this._modoEdicion = true;

    this._idInput.value       = paquete.id;
    this._tituloInput.value   = paquete.titulo        ?? '';
    this._catInput.value      = paquete.categoria     ?? '';
    this._descInput.value     = paquete.descripcion   ?? '';
    this._precioInput.value   = paquete.precio        ?? '';
    this._durInput.value      = paquete.duracion      ?? '';
    this._persInput.value     = paquete.personas      ?? '';
    this._salidaInput.value   = paquete.salida        ?? '';
    this._imgInput.value      = paquete.imagen        ?? '';

    if (this._tagEl)   this._tagEl.textContent = 'Editar paquete';
    if (this._submitLabel) this._submitLabel.textContent = 'Actualizar paquete';

    /* Mostrar preview si hay imagen */
    if (paquete.imagen) this._mostrarPreviewImg(paquete.imagen);
  }

  /* ── Bindings ─────────────────────────────────────────────── */

  _bindForm() {
    if (!this._form) return;

    this._form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._ocultarMensajes();

      const datos = this._leerFormulario();

      if (!datos.titulo || !datos.categoria) {
        this._mostrarError('Completá al menos el título y la categoría.');
        return;
      }

      this._setLoading(true);

      try {
        if (this._modoEdicion && this._idInput.value) {
          /* Actualizar paquete existente */
          await updateDoc(doc(db, 'paquetes', this._idInput.value), {
            ...datos,
            updatedAt: serverTimestamp(),
          });
          this._mostrarExito('¡Paquete actualizado correctamente!');
        } else {
          /* Crear nuevo paquete */
          await addDoc(collection(db, 'paquetes'), {
            ...datos,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          this._mostrarExito('¡Paquete creado correctamente!');
          this.resetearForm();
        }

        /* Recargar la tabla con los datos actualizados */
        await this._tabla.cargar();

      } catch (error) {
        console.error('Error al guardar paquete:', error);
        this._mostrarError('No se pudo guardar el paquete. Intentá de nuevo.');
      } finally {
        this._setLoading(false);
      }
    });
  }

  _bindImgPreview() {
    if (!this._imgInput) return;

    this._imgInput.addEventListener('input', () => {
      const url = this._imgInput.value.trim();
      if (url) {
        this._mostrarPreviewImg(url);
      } else {
        this._ocultarPreviewImg();
      }
    });
  }

  _bindCancelar() {
    /* Botón en el header del panel */
    const btnHeader = document.getElementById('js-cancelar-btn');
    btnHeader?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('paquetes');
    });

    /* Botón dentro del form */
    const btnForm = document.getElementById('js-cancelar-form-btn');
    btnForm?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('paquetes');
    });
  }

  _bindNuevoPaqueteBtn() {
    /* Botón "Nuevo paquete" del header del panel-paquetes */
    const btn = document.getElementById('js-nuevo-paquete-btn');
    btn?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('nuevo');
    });

    /* Botón del nav del sidebar con data-panel="nuevo" */
    const sidebarBtn = document.querySelector('[data-panel="nuevo"]');
    sidebarBtn?.addEventListener('click', () => {
      this.resetearForm();
    });
  }

  _bindCrearPrimeroBtn() {
    const btn = document.getElementById('js-crear-primero-btn');
    btn?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('nuevo');
    });
  }

  /* ── Lectura del formulario ──────────────────────────────── */

  /**
   * Lee y sanitiza los valores del formulario.
   * @returns {object}
   */
  _leerFormulario() {
    return {
      titulo:      this._tituloInput?.value.trim()   ?? '',
      categoria:   this._catInput?.value             ?? '',
      descripcion: this._descInput?.value.trim()     ?? '',
      precio:      Number(this._precioInput?.value)  || null,
      duracion:    this._durInput?.value.trim()      ?? '',
      personas:    this._persInput?.value.trim()     ?? '',
      salida:      this._salidaInput?.value.trim()   ?? '',
      imagen:      this._imgInput?.value.trim()      ?? '',
    };
  }

  /* ── Helpers de UI ────────────────────────────────────────── */

  _mostrarPreviewImg(url) {
    if (!this._imgPreview || !this._imgPreviewImg) return;
    this._imgPreviewImg.src = url;
    this._imgPreview.hidden = false;
  }

  _ocultarPreviewImg() {
    if (!this._imgPreview) return;
    this._imgPreview.hidden = true;
    if (this._imgPreviewImg) this._imgPreviewImg.src = '';
  }

  _mostrarError(msg) {
    if (!this._errorEl) return;
    this._errorEl.textContent = msg;
    this._errorEl.hidden = false;
    this._errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _mostrarExito(msg) {
    if (!this._successEl) return;
    this._successEl.textContent = msg;
    this._successEl.hidden = false;
    this._successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  _ocultarMensajes() {
    if (this._errorEl)   { this._errorEl.hidden = true;   this._errorEl.textContent   = ''; }
    if (this._successEl) { this._successEl.hidden = true; this._successEl.textContent = ''; }
  }

  _setLoading(loading) {
    if (!this._submitBtn) return;
    this._submitBtn.disabled = loading;
    if (this._submitLabel) {
      this._submitLabel.textContent = loading
        ? 'Guardando…'
        : (this._modoEdicion ? 'Actualizar paquete' : 'Guardar paquete');
    }
  }
}


/* ============================================================
   CLASS: ConfirmModal
   Responsabilidad: mostrar un modal de confirmación antes de
   ejecutar acciones destructivas (eliminar paquete).
============================================================ */
class ConfirmModal {
  /**
   * @param {string} overlayId  - ID del overlay
   * @param {string} textId     - ID del párrafo de texto
   * @param {string} okBtnId    - ID del botón de confirmación
   * @param {string} cancelBtnId - ID del botón de cancelación
   */
  constructor(overlayId, textId, okBtnId, cancelBtnId) {
    this._overlay  = document.getElementById(overlayId);
    this._textEl   = document.getElementById(textId);
    this._okBtn    = document.getElementById(okBtnId);
    this._cancelBtn = document.getElementById(cancelBtnId);

    this._callback = null;

    this._bindClose();
  }

  /**
   * Abre el modal con un mensaje y un callback de confirmación.
   * @param {string}   msg - texto a mostrar
   * @param {Function} fn  - función a ejecutar al confirmar
   */
  abrir(msg, fn) {
    if (this._textEl) this._textEl.textContent = msg;
    this._callback = fn;
    this._overlay.hidden = false;
    this._okBtn?.focus();
  }

  cerrar() {
    this._overlay.hidden = true;
    this._callback = null;
  }

  _bindClose() {
    /* Confirmar */
    this._okBtn?.addEventListener('click', async () => {
      if (typeof this._callback === 'function') {
        this._okBtn.disabled = true;
        this._okBtn.textContent = 'Eliminando…';
        await this._callback();
        this._okBtn.disabled = false;
        this._okBtn.textContent = 'Eliminar';
      }
      this.cerrar();
    });

    /* Cancelar */
    this._cancelBtn?.addEventListener('click', () => this.cerrar());

    /* Click fuera del modal */
    this._overlay?.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.cerrar();
    });

    /* Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._overlay?.hidden) this.cerrar();
    });
  }
}


/* ============================================================
   BOOTSTRAP — instancia y conecta todas las clases al cargar
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1 · Modal de confirmación (necesario antes del TablaManager) */
  const confirmModal = new ConfirmModal(
    'js-confirm-overlay',
    'js-confirm-text',
    'js-confirm-ok',
    'js-confirm-cancel'
  );

  /* 2 · Sidebar */
  const sidebar = new SidebarController('.sidebar__nav-item');
  sidebar.init();

  /* 3 · Form Manager (necesario antes del TablaManager para la referencia cruzada) */
  const formManager = new FormManager(
    {
      formId:         'js-paquete-form',
      idInputId:      'paquete-id',
      tituloId:       'p-titulo',
      categoriaId:    'p-categoria',
      descripcionId:  'p-descripcion',
      precioId:       'p-precio',
      duracionId:     'p-duracion',
      personasId:     'p-personas',
      salidaId:       'p-salida',
      imagenId:       'p-imagen',
      imgPreviewId:   'js-img-preview',
      imgPreviewImgId:'js-img-preview-img',
      errorId:        'js-form-error',
      successId:      'js-form-success',
      submitBtnId:    'js-form-submit-btn',
      submitLabelId:  'js-form-submit-label',
      tagId:          'js-form-tag',
    },
    null,   // tabla se asigna después
    sidebar
  );

  /* 4 · Tabla Manager */
  const tablaManager = new TablaManager(
    {
      tbodyId:  'js-tabla-body',
      emptyId:  'js-tabla-empty',
      loaderId: 'js-tabla-loader',
    },
    confirmModal,
    sidebar,
    formManager
  );

  /* 5 · Inyectar referencia de tablaManager en formManager */
  formManager._tabla = tablaManager;

  /* 6 · Inicializar FormManager */
  formManager.init();

  /* 7 · Auth Manager */
  const authManager = new AuthManager({
    loginScreenId:  'js-login-screen',
    adminLayoutId:  'js-admin-layout',
    loginFormId:    'js-login-form',
    emailInputId:   'login-email',
    passInputId:    'login-pass',
    loginErrorId:   'js-login-error',
    loginBtnId:     'js-login-btn',
    logoutBtnId:    'js-logout-btn',
    togglePassId:   'js-toggle-pass',
    adminEmailId:   'js-admin-email',
  });

  /* Cuando el admin inicia sesión, cargar la tabla */
  authManager.onLogin(() => {
    tablaManager.cargar();
  });

  authManager.init();

});
