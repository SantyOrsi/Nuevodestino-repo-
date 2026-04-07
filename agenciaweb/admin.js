/**
 * admin.js — Nuevo Destino Viajes · Panel de administración
 * Versión corregida: login funcional, cards visuales, subida de imágenes
 */

'use strict';

/* ── Configuración de Firebase ───────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyA-rqJU8LIZyUajUKzzEkbo67ASlPmH-GQ',
  authDomain:        'nuevo-destino-web.firebaseapp.com',
  projectId:         'nuevo-destino-web',
  storageBucket:     'nuevo-destino-web.firebasestorage.app',
  messagingSenderId: '287208628191',
  appId:             '1:287208628191:web:cf99598c33cd1614766e6a',
};

firebase.initializeApp(FIREBASE_CONFIG);
const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();

/* ── Toast global ────────────────────────────────────────── */
function showToast(msg, tipo = 'success') {
  const el = document.getElementById('js-toast');
  if (!el) return;
  el.textContent = (tipo === 'success' ? '✅ ' : '❌ ') + msg;
  el.className = `toast toast--${tipo}`;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3500);
}


/* ============================================================
   CLASS: AuthManager
============================================================ */
class AuthManager {
  constructor(config) {
    this._loginScreen = document.getElementById(config.loginScreenId);
    this._adminLayout = document.getElementById(config.adminLayoutId);
    this._loginForm   = document.getElementById(config.loginFormId);
    this._emailInput  = document.getElementById(config.emailInputId);
    this._passInput   = document.getElementById(config.passInputId);
    this._loginError  = document.getElementById(config.loginErrorId);
    this._loginBtn    = document.getElementById(config.loginBtnId);
    this._loginLabel  = document.getElementById('js-login-btn-label');
    this._logoutBtn   = document.getElementById(config.logoutBtnId);
    this._togglePass  = document.getElementById(config.togglePassId);
    this._adminEmail  = document.getElementById(config.adminEmailId);
    this._onLoginSuccess = null;
  }

  onLogin(fn) { this._onLoginSuccess = fn; }

  init() {
    this._bindLoginForm();
    this._bindLogout();
    this._bindTogglePass();
    this._watchAuthState();
  }

  _watchAuthState() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this._mostrarAdmin(user);
      } else {
        this._mostrarLogin();
      }
    });
  }

  _bindLoginForm() {
    if (!this._loginForm) return;
    this._loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this._emailInput?.value.trim();
      const pass  = this._passInput?.value;
      this._setLoginLoading(true);
      this._ocultarError();
      try {
        await auth.signInWithEmailAndPassword(email, pass);
        // onAuthStateChanged se encarga del resto
      } catch (error) {
        this._setLoginLoading(false);
        this._mostrarError(this._traducirError(error.code));
      }
    });
  }

  _bindLogout() {
    if (!this._logoutBtn) return;
    this._logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
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

  /* ── BUG CORREGIDO: loginScreen.hidden = TRUE ─────────── */
  _mostrarAdmin(user) {
    this._loginScreen.hidden = true;   // ← corregido (antes era false)
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
    this._setLoginLoading(false);
    this._ocultarError();
  }

  _setLoginLoading(loading) {
    if (this._loginBtn) this._loginBtn.disabled = loading;
    if (this._loginLabel) {
      this._loginLabel.textContent = loading ? 'Ingresando…' : 'Ingresar →';
    }
  }

  _ocultarError() {
    if (this._loginError) {
      this._loginError.hidden = true;
      this._loginError.textContent = '';
    }
  }

  _mostrarError(msg) {
    if (!this._loginError) return;
    this._loginError.textContent = msg;
    this._loginError.hidden = false;
  }

  _traducirError(code) {
    const errores = {
      'auth/user-not-found':         'No existe una cuenta con ese correo.',
      'auth/wrong-password':         'Contraseña incorrecta. Intentá de nuevo.',
      'auth/invalid-email':          'El formato del correo no es válido.',
      'auth/too-many-requests':      'Demasiados intentos fallidos. Esperá unos minutos.',
      'auth/network-request-failed': 'Error de conexión. Verificá tu internet.',
      'auth/invalid-credential':     'Credenciales incorrectas. Verificá email y contraseña.',
    };
    return errores[code] ?? `Error al iniciar sesión (${code}).`;
  }
}


/* ============================================================
   CLASS: SidebarController
============================================================ */
class SidebarController {
  constructor(navItemSelector) {
    this._items = document.querySelectorAll(navItemSelector);
  }

  init() {
    this._items.forEach(btn => {
      btn.addEventListener('click', () => this._navegar(btn.dataset.panel));
    });
  }

  _navegar(panelId) {
    this._items.forEach(btn => btn.classList.remove('sidebar__nav-item--active'));
    document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('sidebar__nav-item--active');
    document.querySelectorAll('.admin-panel').forEach(p => { p.hidden = true; });
    const target = document.getElementById(`panel-${panelId}`);
    if (target) target.hidden = false;
  }

  ir(panelId) { this._navegar(panelId); }
}


/* ============================================================
   CLASS: GridManager  (reemplaza TablaManager — muestra cards)
============================================================ */
class GridManager {
  constructor(config, confirmModal, sidebar, formManager) {
    this._grid     = document.getElementById(config.gridId);
    this._emptyEl  = document.getElementById(config.emptyId);
    this._loaderEl = document.getElementById(config.loaderId);
    this._confirm  = confirmModal;
    this._sidebar  = sidebar;
    this._form     = formManager;
  }

  async cargar() {
    this._setLoader(true);
    try {
      const snap = await db.collection('paquetes').orderBy('createdAt', 'desc').get();
      const paquetes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this._renderGrid(paquetes);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      showToast('Error al cargar los paquetes.', 'error');
    } finally {
      this._setLoader(false);
    }
  }

  _renderGrid(paquetes) {
    this._grid.innerHTML = '';
    if (paquetes.length === 0) {
      this._emptyEl.hidden = false;
      return;
    }
    this._emptyEl.hidden = true;
    paquetes.forEach(p => this._agregarCard(p));
  }

  _agregarCard(paquete) {
    const card = document.createElement('article');
    card.className = 'paquete-card';
    card.dataset.id = paquete.id;

    const cat = (paquete.categoria ?? '').toLowerCase();

    const imgHTML = paquete.imagen
      ? `<img class="paquete-card__img" src="${this._esc(paquete.imagen)}" alt="${this._esc(paquete.titulo)}" loading="lazy" />`
      : `<div class="paquete-card__img-placeholder">${this._emojiCategoria(cat)}</div>`;

    const precioHTML = paquete.precio
      ? `<p class="paquete-card__precio">$ ${new Intl.NumberFormat('es-AR').format(Number(paquete.precio))}</p>`
      : '';

    const metaItems = [];
    if (paquete.duracion)  metaItems.push(`<span class="paquete-card__meta-item">⏱ ${this._esc(paquete.duracion)}</span>`);
    if (paquete.personas)  metaItems.push(`<span class="paquete-card__meta-item">👥 ${this._esc(paquete.personas)}</span>`);
    if (paquete.salida)    metaItems.push(`<span class="paquete-card__meta-item">📅 ${this._esc(paquete.salida)}</span>`);

    card.innerHTML = `
      <div class="paquete-card__img-wrap">
        ${imgHTML}
        ${paquete.categoria ? `<span class="paquete-card__badge paquete-card__badge--${this._esc(cat)}">${this._esc(paquete.categoria)}</span>` : ''}
      </div>
      <div class="paquete-card__body">
        <h3 class="paquete-card__titulo">${this._esc(paquete.titulo ?? '—')}</h3>
        ${paquete.descripcion ? `<p class="paquete-card__desc">${this._esc(paquete.descripcion)}</p>` : ''}
        ${metaItems.length ? `<div class="paquete-card__meta">${metaItems.join('')}</div>` : ''}
        ${precioHTML}
        <div class="paquete-card__actions">
          <button class="btn btn--solid" data-action="editar"   aria-label="Editar ${this._esc(paquete.titulo)}">✏️ Editar</button>
          <button class="btn btn--danger" data-action="eliminar" aria-label="Eliminar ${this._esc(paquete.titulo)}">🗑 Eliminar</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="editar"]').addEventListener('click', () => {
      this._form.cargarParaEdicion(paquete);
      this._sidebar.ir('nuevo');
    });

    card.querySelector('[data-action="eliminar"]').addEventListener('click', () => {
      this._confirm.abrir(
        `¿Eliminar el paquete "${paquete.titulo}"?`,
        async () => { await this._eliminar(paquete.id); }
      );
    });

    this._grid.appendChild(card);
  }

  async _eliminar(id) {
    try {
      await db.collection('paquetes').doc(id).delete();
      const card = this._grid.querySelector(`[data-id="${id}"]`);
      card?.remove();
      if (this._grid.children.length === 0) {
        this._emptyEl.hidden = false;
      }
      showToast('Paquete eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar:', error);
      showToast('No se pudo eliminar el paquete.', 'error');
    }
  }

  _setLoader(visible) {
    if (this._loaderEl) this._loaderEl.hidden = !visible;
    if (this._grid) this._grid.style.visibility = visible ? 'hidden' : 'visible';
  }

  _esc(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  _emojiCategoria(cat) {
    return { nacional:'🏔', internacional:'✈️', egresados:'🎓', grupal:'👥' }[cat] ?? '🗺';
  }
}


/* ============================================================
   CLASS: ImageUploadManager  (subida a Firebase Storage)
============================================================ */
class ImageUploadManager {
  constructor() {
    this._tabBtns      = document.querySelectorAll('.img-upload-tab');
    this._tabUrl       = document.getElementById('js-tab-url');
    this._tabFile      = document.getElementById('js-tab-file');
    this._dropZone     = document.getElementById('js-drop-zone');
    this._fileInput    = document.getElementById('js-file-input');
    this._progressWrap = document.getElementById('js-upload-progress');
    this._progressBar  = document.getElementById('js-upload-bar');
    this._progressText = document.getElementById('js-upload-text');
    this._urlInput     = document.getElementById('p-imagen');
    this._preview      = document.getElementById('js-img-preview');
    this._previewImg   = document.getElementById('js-img-preview-img');
    this._removeBtn    = document.getElementById('js-img-remove');

    this._currentUrl = '';
  }

  init() {
    this._bindTabs();
    this._bindUrlInput();
    this._bindDrop();
    this._bindFileInput();
    this._bindRemove();
  }

  getImageUrl() { return this._currentUrl; }

  setImageUrl(url) {
    this._currentUrl = url || '';
    if (this._urlInput) this._urlInput.value = url || '';
    if (url) {
      this._mostrarPreview(url);
    } else {
      this._ocultarPreview();
    }
  }

  reset() {
    this._currentUrl = '';
    if (this._urlInput) this._urlInput.value = '';
    if (this._fileInput) this._fileInput.value = '';
    this._ocultarPreview();
    this._ocultarProgress();
    this._activarTab('url');
  }

  /* ── Tabs ────────────────────────────────────────────────── */
  _bindTabs() {
    this._tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this._activarTab(btn.dataset.tab));
    });
  }

  _activarTab(tabId) {
    this._tabBtns.forEach(b => b.classList.toggle('img-upload-tab--active', b.dataset.tab === tabId));
    if (this._tabUrl)  this._tabUrl.hidden  = (tabId !== 'url');
    if (this._tabFile) this._tabFile.hidden = (tabId !== 'file');
  }

  /* ── URL input ───────────────────────────────────────────── */
  _bindUrlInput() {
    if (!this._urlInput) return;
    this._urlInput.addEventListener('input', () => {
      const url = this._urlInput.value.trim();
      this._currentUrl = url;
      url ? this._mostrarPreview(url) : this._ocultarPreview();
    });
  }

  /* ── Drag & Drop + click ─────────────────────────────────── */
  _bindDrop() {
    if (!this._dropZone) return;
    this._dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this._dropZone.classList.add('file-drop-zone--over');
    });
    this._dropZone.addEventListener('dragleave', () => {
      this._dropZone.classList.remove('file-drop-zone--over');
    });
    this._dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this._dropZone.classList.remove('file-drop-zone--over');
      const file = e.dataTransfer.files[0];
      if (file) this._subirArchivo(file);
    });
  }

  _bindFileInput() {
    if (!this._fileInput) return;
    this._fileInput.addEventListener('change', () => {
      const file = this._fileInput.files[0];
      if (file) this._subirArchivo(file);
    });
  }

  /* ── Subida a Firebase Storage ───────────────────────────── */
  async _subirArchivo(file) {
    // Validaciones
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      showToast('Solo se permiten imágenes JPG, PNG o WEBP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no puede superar los 5 MB.', 'error');
      return;
    }

    this._mostrarProgress('Subiendo imagen…');

    try {
      const nombreArchivo = `paquetes/${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
      const ref = storage.ref(nombreArchivo);
      const uploadTask = ref.put(file);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            this._actualizarProgress(pct);
          },
          reject,
          resolve
        );
      });

      const url = await ref.getDownloadURL();
      this._currentUrl = url;
      this._ocultarProgress();
      this._mostrarPreview(url);
      showToast('Imagen subida correctamente.');

    } catch (error) {
      console.error('Error al subir imagen:', error);
      this._ocultarProgress();
      showToast('No se pudo subir la imagen. Intentá de nuevo.', 'error');
    }
  }

  /* ── Preview ─────────────────────────────────────────────── */
  _mostrarPreview(url) {
    if (!this._preview || !this._previewImg) return;
    this._previewImg.src = url;
    this._preview.hidden = false;
  }

  _ocultarPreview() {
    if (!this._preview) return;
    this._preview.hidden = true;
    if (this._previewImg) this._previewImg.src = '';
  }

  _bindRemove() {
    this._removeBtn?.addEventListener('click', () => {
      this.setImageUrl('');
    });
  }

  /* ── Progress ─────────────────────────────────────────────── */
  _mostrarProgress(texto) {
    if (!this._progressWrap) return;
    this._progressWrap.hidden = false;
    if (this._progressBar) this._progressBar.style.width = '0%';
    if (this._progressText) this._progressText.textContent = texto;
  }

  _actualizarProgress(pct) {
    if (this._progressBar) this._progressBar.style.width = `${pct}%`;
    if (this._progressText) this._progressText.textContent = `Subiendo… ${pct}%`;
  }

  _ocultarProgress() {
    if (this._progressWrap) this._progressWrap.hidden = true;
  }
}


/* ============================================================
   CLASS: FormManager
============================================================ */
class FormManager {
  constructor(config, tabla, sidebar, imageManager) {
    this._form        = document.getElementById(config.formId);
    this._idInput     = document.getElementById(config.idInputId);
    this._tituloInput = document.getElementById(config.tituloId);
    this._catInput    = document.getElementById(config.categoriaId);
    this._descInput   = document.getElementById(config.descripcionId);
    this._precioInput = document.getElementById(config.precioId);
    this._durInput    = document.getElementById(config.duracionId);
    this._persInput   = document.getElementById(config.personasId);
    this._salidaInput = document.getElementById(config.salidaId);
    this._errorEl     = document.getElementById(config.errorId);
    this._successEl   = document.getElementById(config.successId);
    this._submitBtn   = document.getElementById(config.submitBtnId);
    this._submitLabel = document.getElementById(config.submitLabelId);
    this._tagEl       = document.getElementById(config.tagId);

    this._tabla        = tabla;
    this._sidebar      = sidebar;
    this._imageManager = imageManager;
    this._modoEdicion  = false;
  }

  init() {
    this._bindForm();
    this._bindCancelar();
    this._bindNuevoPaqueteBtn();
    this._bindCrearPrimeroBtn();
  }

  resetearForm() {
    this._form?.reset();
    this._idInput.value = '';
    this._modoEdicion   = false;
    if (this._tagEl)       this._tagEl.textContent       = 'Nuevo paquete';
    if (this._submitLabel) this._submitLabel.textContent = 'Guardar paquete';
    this._ocultarMensajes();
    this._imageManager?.reset();
  }

  cargarParaEdicion(paquete) {
    this.resetearForm();
    this._modoEdicion = true;

    this._idInput.value       = paquete.id;
    this._tituloInput.value   = paquete.titulo      ?? '';
    this._catInput.value      = paquete.categoria   ?? '';
    this._descInput.value     = paquete.descripcion ?? '';
    this._precioInput.value   = paquete.precio      ?? '';
    this._durInput.value      = paquete.duracion    ?? '';
    this._persInput.value     = paquete.personas    ?? '';
    this._salidaInput.value   = paquete.salida      ?? '';

    if (paquete.imagen) {
      this._imageManager?.setImageUrl(paquete.imagen);
    }

    if (this._tagEl)       this._tagEl.textContent       = 'Editar paquete';
    if (this._submitLabel) this._submitLabel.textContent = 'Actualizar paquete';
  }

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
          await db.collection('paquetes').doc(this._idInput.value).update({
            ...datos,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          showToast('Paquete actualizado correctamente.');
          this._mostrarExito('¡Paquete actualizado correctamente!');
        } else {
          await db.collection('paquetes').add({
            ...datos,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          showToast('Paquete creado correctamente.');
          this._mostrarExito('¡Paquete creado correctamente!');
          this.resetearForm();
        }

        await this._tabla.cargar();
        // Volver al panel de paquetes después de un momento
        setTimeout(() => {
          this._sidebar.ir('paquetes');
        }, 1200);

      } catch (error) {
        console.error('Error al guardar paquete:', error);
        this._mostrarError('No se pudo guardar el paquete. Intentá de nuevo.');
        showToast('Error al guardar el paquete.', 'error');
      } finally {
        this._setLoading(false);
      }
    });
  }

  _bindCancelar() {
    const cancelar = () => { this.resetearForm(); this._sidebar.ir('paquetes'); };
    document.getElementById('js-cancelar-btn')?.addEventListener('click', cancelar);
    document.getElementById('js-cancelar-form-btn')?.addEventListener('click', cancelar);
  }

  _bindNuevoPaqueteBtn() {
    document.getElementById('js-nuevo-paquete-btn')?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('nuevo');
    });
    document.querySelector('[data-panel="nuevo"]')?.addEventListener('click', () => {
      this.resetearForm();
    });
  }

  _bindCrearPrimeroBtn() {
    document.getElementById('js-crear-primero-btn')?.addEventListener('click', () => {
      this.resetearForm();
      this._sidebar.ir('nuevo');
    });
  }

  _leerFormulario() {
    return {
      titulo:      this._tituloInput?.value.trim()  ?? '',
      categoria:   this._catInput?.value            ?? '',
      descripcion: this._descInput?.value.trim()    ?? '',
      precio:      Number(this._precioInput?.value) || null,
      duracion:    this._durInput?.value.trim()     ?? '',
      personas:    this._persInput?.value.trim()    ?? '',
      salida:      this._salidaInput?.value.trim()  ?? '',
      imagen:      this._imageManager?.getImageUrl() ?? '',
    };
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
============================================================ */
class ConfirmModal {
  constructor(overlayId, textId, okBtnId, cancelBtnId) {
    this._overlay   = document.getElementById(overlayId);
    this._textEl    = document.getElementById(textId);
    this._okBtn     = document.getElementById(okBtnId);
    this._cancelBtn = document.getElementById(cancelBtnId);
    this._callback  = null;
    this._bindClose();
  }

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
    this._okBtn?.addEventListener('click', async () => {
      if (typeof this._callback === 'function') {
        this._okBtn.disabled    = true;
        this._okBtn.textContent = 'Eliminando…';
        await this._callback();
        this._okBtn.disabled    = false;
        this._okBtn.textContent = 'Eliminar';
      }
      this.cerrar();
    });

    this._cancelBtn?.addEventListener('click', () => this.cerrar());

    this._overlay?.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.cerrar();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._overlay?.hidden) this.cerrar();
    });
  }
}


/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1 · Modal de confirmación */
  const confirmModal = new ConfirmModal(
    'js-confirm-overlay', 'js-confirm-text', 'js-confirm-ok', 'js-confirm-cancel'
  );

  /* 2 · Sidebar */
  const sidebar = new SidebarController('.sidebar__nav-item');
  sidebar.init();

  /* 3 · Image Manager */
  const imageManager = new ImageUploadManager();
  imageManager.init();

  /* 4 · Form Manager (tabla se inyecta después) */
  const formManager = new FormManager(
    {
      formId:        'js-paquete-form',
      idInputId:     'paquete-id',
      tituloId:      'p-titulo',
      categoriaId:   'p-categoria',
      descripcionId: 'p-descripcion',
      precioId:      'p-precio',
      duracionId:    'p-duracion',
      personasId:    'p-personas',
      salidaId:      'p-salida',
      errorId:       'js-form-error',
      successId:     'js-form-success',
      submitBtnId:   'js-form-submit-btn',
      submitLabelId: 'js-form-submit-label',
      tagId:         'js-form-tag',
    },
    null,
    sidebar,
    imageManager
  );

  /* 5 · Grid Manager */
  const gridManager = new GridManager(
    { gridId: 'js-paquetes-grid', emptyId: 'js-tabla-empty', loaderId: 'js-tabla-loader' },
    confirmModal, sidebar, formManager
  );

  /* 6 · Inyectar referencia de grid en el form */
  formManager._tabla = gridManager;

  /* 7 · Inicializar FormManager */
  formManager.init();

  /* 8 · Auth Manager */
  const authManager = new AuthManager({
    loginScreenId: 'js-login-screen',
    adminLayoutId: 'js-admin-layout',
    loginFormId:   'js-login-form',
    emailInputId:  'login-email',
    passInputId:   'login-pass',
    loginErrorId:  'js-login-error',
    loginBtnId:    'js-login-btn',
    logoutBtnId:   'js-logout-btn',
    togglePassId:  'js-toggle-pass',
    adminEmailId:  'js-admin-email',
  });

  authManager.onLogin(() => {
    gridManager.cargar();
  });

  authManager.init();

});
