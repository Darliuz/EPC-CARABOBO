const STORAGE_KEYS = {
  OWNER: 'epc_carabobo_owner_v2',
  SESSION: 'epc_carabobo_creator_logged_in_v2',
  SESSION_ID: 'epc_carabobo_active_session_id_v2',
  DEVICE_ID: 'epc_carabobo_device_fingerprint_v2',
  REPORTS: 'epc_carabobo_reports_v2'
};

const DEFAULT_MASTER_KEY = 'EPC2026';

function getOrCreateLocalDeviceId() {
  try {
    let did = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!did) {
      did = 'DEV_' + Math.random().toString(36).slice(2, 10).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, did);
    }
    return did;
  } catch (e) {
    return 'DEV_TEMP_' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}

function getDeviceLabel() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone/iPad';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Navegador';
}

const CURRENT_DEVICE_ID = getOrCreateLocalDeviceId();
const CURRENT_DEVICE_LABEL = `${getDeviceLabel()} (${CURRENT_DEVICE_ID.slice(0, 12)})`;

let creatorConfig = loadCreatorConfigFromStorage();
let localSessionId = loadLocalSessionId();
let isCreatorAuthenticated = evaluateExclusiveSession();
let allReports = loadReportsFromStorage();

let comisionesState = COMISIONES_OFICIALES.map(nombre => ({
  nombre,
  asistio: '',
  propuesta: ''
}));

let fbAuth = null;
let fbDb = null;
let fbAppId = 'epc-carabobo-semanal';

function generateSessionToken() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

function loadLocalSessionId() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_ID) || localStorage.getItem(STORAGE_KEYS.SESSION_ID) || '';
  } catch (e) {
    return '';
  }
}

function persistLocalSessionId(sid) {
  localSessionId = sid || '';
  try {
    if (sid) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sid);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sid);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    }
  } catch (e) {
    console.warn('No se pudo persistir el ID de sesión:', e);
  }
}

function isCurrentDeviceAuthorized() {
  if (!creatorConfig || !creatorConfig.authorizedDeviceId) return true;
  return creatorConfig.authorizedDeviceId === CURRENT_DEVICE_ID;
}

function evaluateExclusiveSession() {
  try {
    if (!isCurrentDeviceAuthorized()) return false;
    const loggedFlag = localStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
    const activeSid = (creatorConfig && creatorConfig.activeSessionId) || '';
    const currentSid = loadLocalSessionId();
    if (!loggedFlag || !activeSid || !currentSid) return false;
    return activeSid === currentSid;
  } catch (e) {
    return false;
  }
}

function loadCreatorConfigFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveCreatorConfigToStorage(cfg) {
  creatorConfig = cfg ? { ...cfg } : null;
  try {
    if (creatorConfig) {
      localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(creatorConfig));
    } else {
      localStorage.removeItem(STORAGE_KEYS.OWNER);
    }
  } catch (e) {
    console.warn('No se pudo persistir configuración de creador en localStorage:', e);
  }
}

function activateExclusiveSession(cfg) {
  const newSessionId = generateSessionToken();
  const updatedCfg = {
    ...cfg,
    authorizedDeviceId: CURRENT_DEVICE_ID,
    authorizedDeviceLabel: CURRENT_DEVICE_LABEL,
    activeSessionId: newSessionId,
    sessionStartedAt: new Date().toISOString()
  };
  persistLocalSessionId(newSessionId);
  saveCreatorConfigToStorage(updatedCfg);
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
  } catch (e) {
    console.warn('No se pudo marcar sesión activa:', e);
  }
  isCreatorAuthenticated = true;
  syncOwnerToFirebaseIfPossible(updatedCfg);
  refreshCreatorUI();
  return updatedCfg;
}

function revokeCreatorSession(clearOwnerSessionId = true) {
  isCreatorAuthenticated = false;
  persistLocalSessionId('');
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.warn('No se pudo limpiar bandera de sesión:', e);
  }
  if (clearOwnerSessionId && creatorConfig) {
    const clearedCfg = {
      ...creatorConfig,
      activeSessionId: '',
      sessionEndedAt: new Date().toISOString()
    };
    saveCreatorConfigToStorage(clearedCfg);
    syncOwnerToFirebaseIfPossible(clearedCfg);
  }
  refreshCreatorUI();
}

function loadReportsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveReportsToStorage(list) {
  allReports = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(allReports));
  } catch (e) {
    console.warn('No se pudieron guardar los reportes en localStorage:', e);
  }
}

window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const styles = {
    success: 'bg-emerald-900 text-white border-emerald-700',
    error: 'bg-rose-900 text-white border-rose-700',
    warning: 'bg-amber-900 text-white border-amber-700',
    info: 'bg-slate-900 text-white border-slate-700'
  };
  toast.className = `pointer-events-auto px-4 py-3 rounded-2xl border shadow-xl text-sm font-medium flex items-center justify-between gap-3 fade-in ${styles[type] || styles.info}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="text-white/75 hover:text-white font-bold text-xs" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4200);
};

window.switchTab = function (tab) {
  const formView = document.getElementById('view-form');
  const adminView = document.getElementById('view-admin');
  const formBtn = document.getElementById('tab-form-btn');
  const adminBtn = document.getElementById('tab-admin-btn');

  if (tab === 'form') {
    formView.classList.remove('hidden');
    adminView.classList.add('hidden');
    formBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white text-slate-900 shadow-sm';
    adminBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white/90 hover:text-white';
  } else {
    formView.classList.add('hidden');
    adminView.classList.remove('hidden');
    adminBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white text-slate-900 shadow-sm';
    formBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white/90 hover:text-white';
    refreshCreatorUI();
  }
};

window.openCreatorAccess = function () {
  switchTab('admin');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function refreshCreatorUI() {
  const badge = document.getElementById('admin-badge-status');
  const headerBtnLabel = document.getElementById('header-creator-btn-label');
  const gateCard = document.getElementById('admin-gate-card');
  const dashboard = document.getElementById('admin-dashboard');
  const claimBlock = document.getElementById('gate-claim-block');
  const deviceLockBanner = document.getElementById('gate-device-lock-banner');
  const lockedDeviceLabel = document.getElementById('gate-locked-device-label');
  const gatePill = document.getElementById('gate-status-pill');
  const gateTitle = document.getElementById('gate-main-title');
  const gateSubtitle = document.getElementById('gate-main-subtitle');

  const hasOwner = Boolean(creatorConfig && (creatorConfig.email || creatorConfig.pin));
  const deviceAllowed = isCurrentDeviceAuthorized();
  isCreatorAuthenticated = hasOwner && deviceAllowed && evaluateExclusiveSession();

  if (!hasOwner) {
    claimBlock.classList.remove('hidden');
    deviceLockBanner.classList.add('hidden');
    gatePill.textContent = 'Registro Único de Creador';
    gatePill.className = 'inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900';
    gateTitle.textContent = 'Acceso Exclusivo del Creador Principal';
    gateSubtitle.innerHTML = 'Solo el creador del formulario puede registrar su correo y clave maestra para habilitar la descarga de Excel en este equipo.';
    badge.textContent = 'Privado';
  } else if (!deviceAllowed) {
    claimBlock.classList.add('hidden');
    deviceLockBanner.classList.remove('hidden');
    lockedDeviceLabel.textContent = creatorConfig.authorizedDeviceLabel || 'Dispositivo Principal Registrado';
    gatePill.textContent = 'Acceso Denegado • Solo Creador';
    gatePill.className = 'inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900';
    gateTitle.textContent = 'Descarga de Excel Restringida al Creador';
    gateSubtitle.innerHTML = 'Este formulario pertenece a un único creador principal. Ninguna otra persona o dispositivo puede acceder a los registros ni descargar el Excel.';
    badge.textContent = 'Bloqueado';
  } else {
    claimBlock.classList.add('hidden');
    deviceLockBanner.classList.add('hidden');
    gatePill.textContent = 'Solo Creador Principal';
    gatePill.className = 'inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900';
    gateTitle.textContent = 'Acceso del Creador Principal';
    gateSubtitle.innerHTML = 'Ingrese las credenciales privadas del creador principal para administrar y descargar el archivo Excel.';
    badge.textContent = isCreatorAuthenticated ? 'Activo' : 'Privado';
  }

  if (isCreatorAuthenticated) {
    gateCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
    headerBtnLabel.textContent = 'Panel Admin (Activo)';
    const summaryEl = document.getElementById('active-creator-summary');
    if (summaryEl && creatorConfig) {
      summaryEl.textContent = `${creatorConfig.name || 'Creador Principal EPC'} • ${creatorConfig.email} • ${creatorConfig.authorizedDeviceLabel || CURRENT_DEVICE_LABEL}`;
    }
    updateAdminStats();
    renderAdminTable();
  } else {
    gateCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
    headerBtnLabel.textContent = 'Acceso Admin';
  }
}

window.loginAsCreator = function (event) {
  if (event) event.preventDefault();

  if (creatorConfig && creatorConfig.authorizedDeviceId && !isCurrentDeviceAuthorized()) {
    showToast('Acceso denegado: solo el creador principal desde su dispositivo autorizado puede descargar el Excel.', 'error');
    return;
  }

  const emailInput = document.getElementById('login-creator-email').value.trim().toLowerCase();
  const pinInput = document.getElementById('login-creator-pin').value.trim();

  if (!emailInput || !emailInput.includes('@')) {
    showToast('Ingrese el correo electrónico del creador principal.', 'error');
    document.getElementById('login-creator-email').focus();
    return;
  }

  if (!pinInput) {
    showToast('Ingrese la clave secreta del creador principal.', 'error');
    document.getElementById('login-creator-pin').focus();
    return;
  }

  if (!creatorConfig || !creatorConfig.email) {
    if (pinInput !== DEFAULT_MASTER_KEY) {
      showToast('Acceso denegado: solo el creador del formulario con la Clave Maestra puede habilitar este panel.', 'error');
      return;
    }
    const newCfg = {
      name: 'Creador Principal EPC',
      email: emailInput,
      pin: pinInput,
      masterKey: DEFAULT_MASTER_KEY,
      updatedAt: new Date().toISOString()
    };
    activateExclusiveSession(newCfg);
    showToast(`¡Creador principal verificado! Solo ${emailInput} en este dispositivo podrá descargar el Excel.`, 'success');
    return;
  }

  const expectedPin = creatorConfig.pin || DEFAULT_MASTER_KEY;
  const expectedEmail = creatorConfig.email.trim().toLowerCase();

  if (emailInput !== expectedEmail) {
    showToast('Acceso denegado: este correo no corresponde al creador principal del formulario.', 'error');
    return;
  }

  if (pinInput !== expectedPin) {
    showToast('Clave incorrecta. Solo el creador principal tiene acceso.', 'error');
    return;
  }

  activateExclusiveSession({ ...creatorConfig, email: expectedEmail });
  showToast(`Bienvenido, Creador Principal (${expectedEmail}). Descarga de Excel habilitada.`, 'success');
};

window.signInWithGoogleCreator = async function () {
  if (creatorConfig && creatorConfig.authorizedDeviceId && !isCurrentDeviceAuthorized()) {
    showToast('Acceso denegado: solo el creador principal desde su dispositivo autorizado puede descargar el Excel.', 'error');
    return;
  }

  try {
    if (fbAuth) {
      const { GoogleAuthProvider, signInWithPopup, signOut } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(fbAuth, provider);
      const googleEmail = (res.user && res.user.email ? res.user.email : '').trim().toLowerCase();
      const googleName = (res.user && res.user.displayName) || 'Creador Principal EPC';

      if (!googleEmail) {
        showToast('No se pudo obtener el correo de la cuenta de Google.', 'error');
        return;
      }

      if (!creatorConfig || !creatorConfig.email) {
        await signOut(fbAuth);
        showToast('Primero registre al creador principal usando la Clave Maestra.', 'warning');
        return;
      }

      const expectedEmail = creatorConfig.email.trim().toLowerCase();
      if (googleEmail === expectedEmail && isCurrentDeviceAuthorized()) {
        const updated = { ...creatorConfig, name: creatorConfig.name || googleName };
        activateExclusiveSession(updated);
        showToast(`Sesión exclusiva iniciada con Google (${googleEmail}).`, 'success');
        return;
      }

      await signOut(fbAuth);
      showToast(`Acceso denegado: ${googleEmail} o dispositivo no autorizado.`, 'error');
      return;
    }
  } catch (err) {
    console.warn('Google popup no disponible o cancelado:', err);
  }

  showToast('Use el formulario con el correo único registrado desde el dispositivo autorizado.', 'info');
};

window.logoutCreatorSession = function () {
  revokeCreatorSession(true);
  document.getElementById('login-creator-pin').value = '';
  showToast('Sesión de Creador Principal cerrada y acceso revocado de inmediato.', 'info');
};

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.OWNER || event.key === STORAGE_KEYS.SESSION) {
    creatorConfig = loadCreatorConfigFromStorage();
    const stillValid = evaluateExclusiveSession();
    if (isCreatorAuthenticated && !stillValid) {
      isCreatorAuthenticated = false;
      persistLocalSessionId('');
      refreshCreatorUI();
      showToast('Su sesión fue cerrada porque se inició sesión o se cambió de Creador Principal en otra ventana.', 'warning');
    } else {
      refreshCreatorUI();
    }
  } else if (event.key === STORAGE_KEYS.REPORTS) {
    allReports = loadReportsFromStorage();
    if (isCreatorAuthenticated) {
      updateAdminStats();
      renderAdminTable();
    }
  }
});

function formatCedulaInput(val) {
  if (!val) return '';
  let clean = val.toUpperCase().replace(/[^VE0-9]/g, '');
  let prefix = 'V';
  if (clean.startsWith('E')) {
    prefix = 'E';
    clean = clean.slice(1);
  } else if (clean.startsWith('V')) {
    prefix = 'V';
    clean = clean.slice(1);
  }
  const digits = clean.replace(/\D/g, '').slice(0, 9);
  if (!digits) return val.toUpperCase().startsWith('E') ? 'E-' : (val.toUpperCase().startsWith('V') ? 'V-' : '');
  return `${prefix}-${digits}`;
}

function isValidCedula(val) {
  return /^[VE]-\d{6,9}$/.test((val || '').trim().toUpperCase());
}

function validateCedulaField(showMsg) {
  const input = document.getElementById('reporter-cedula');
  const fb = document.getElementById('cedula-feedback');
  const val = input.value.trim();
  if (!val) {
    input.classList.remove('border-emerald-500', 'border-rose-500');
    fb.textContent = 'Formato: V-12345678 o E-12345678';
    fb.className = 'text-[11px] text-slate-500 mt-1';
    return false;
  }
  if (isValidCedula(val)) {
    input.classList.remove('border-rose-500');
    input.classList.add('border-emerald-500');
    fb.textContent = '✓ Cédula válida';
    fb.className = 'text-[11px] text-emerald-700 font-semibold mt-1';
    return true;
  } else {
    input.classList.remove('border-emerald-500');
    if (showMsg) input.classList.add('border-rose-500');
    fb.textContent = showMsg ? 'Ingrese entre 6 y 9 dígitos (ej. V-12345678)' : 'Formato: V-12345678 o E-12345678';
    fb.className = showMsg ? 'text-[11px] text-rose-600 font-semibold mt-1' : 'text-[11px] text-slate-500 mt-1';
    return false;
  }
}

function formatTelefonoInput(val) {
  const digits = (val || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function isValidTelefono(val) {
  return /^0\d{3}-\d{7}$/.test((val || '').trim());
}

function validateTelefonoField(showMsg) {
  const input = document.getElementById('reporter-telefono');
  const fb = document.getElementById('telefono-feedback');
  const val = input.value.trim();
  if (!val) {
    input.classList.remove('border-emerald-500', 'border-rose-500');
    fb.textContent = 'Ej. 0412-1234567, 0414, 0416, 0424, 0426';
    fb.className = 'text-[11px] text-slate-500 mt-1';
    return false;
  }
  if (isValidTelefono(val)) {
    input.classList.remove('border-rose-500');
    input.classList.add('border-emerald-500');
    fb.textContent = '✓ Teléfono válido';
    fb.className = 'text-[11px] text-emerald-700 font-semibold mt-1';
    return true;
  } else {
    input.classList.remove('border-emerald-500');
    if (showMsg) input.classList.add('border-rose-500');
    fb.textContent = showMsg ? 'Debe tener 11 dígitos (ej. 0412-1234567)' : 'Ej. 0412-1234567, 0414, 0416, 0424, 0426';
    fb.className = showMsg ? 'text-[11px] text-rose-600 font-semibold mt-1' : 'text-[11px] text-slate-500 mt-1';
    return false;
  }
}

function initFormUI() {
  const munSelect = document.getElementById('municipio-select');
  const adminFilterMun = document.getElementById('admin-filter-mun');

  MUNICIPIOS_DATA.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.mun;
    opt.textContent = `${m.mun}. ${m.nombre} (${m.circuitos.length} circuitos)`;
    munSelect.appendChild(opt);

    const adminOpt = document.createElement('option');
    adminOpt.value = m.nombre;
    adminOpt.textContent = `${m.mun}. ${m.nombre}`;
    adminFilterMun.appendChild(adminOpt);
  });

  munSelect.addEventListener('change', () => {
    populateCircuitosSelect();
    updateSelectedCircuitBanner();
    updateProgress();
  });

  document.getElementById('circuito-search').addEventListener('input', () => {
    populateCircuitosSelect();
    updateSelectedCircuitBanner();
    updateProgress();
  });

  document.getElementById('circuito-select').addEventListener('change', () => {
    updateSelectedCircuitBanner();
    updateProgress();
  });

  document.querySelectorAll('.toggle-yn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setYesNoValue(btn.getAttribute('data-field'), btn.getAttribute('data-value'));
      updateProgress();
    });
  });

  ['reporter-name', 'report-week', 'field-participacion', 'field-actividades'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateProgress);
  });

  const cedulaInput = document.getElementById('reporter-cedula');
  cedulaInput.addEventListener('input', () => {
    cedulaInput.value = formatCedulaInput(cedulaInput.value);
    validateCedulaField(false);
    updateProgress();
  });
  cedulaInput.addEventListener('blur', () => validateCedulaField(true));

  const telefonoInput = document.getElementById('reporter-telefono');
  telefonoInput.addEventListener('input', () => {
    telefonoInput.value = formatTelefonoInput(telefonoInput.value);
    validateTelefonoField(false);
    updateProgress();
  });
  telefonoInput.addEventListener('blur', () => validateTelefonoField(true));

  renderComisionesRows();
  updateProgress();
}

function setYesNoValue(field, value) {
  document.getElementById(`field-${field}`).value = value;
  document.querySelectorAll(`.toggle-yn-btn[data-field="${field}"]`).forEach(b => {
    const bVal = b.getAttribute('data-value');
    const dot = b.querySelector('.indicator-dot');
    b.classList.remove(
      'border-emerald-600', 'bg-emerald-50', 'text-emerald-900',
      'border-rose-600', 'bg-rose-50', 'text-rose-900',
      'border-slate-200', 'text-slate-700'
    );
    dot.classList.remove('bg-emerald-600', 'bg-rose-600', 'bg-slate-300');

    if (bVal === value) {
      if (value === 'Si') {
        b.classList.add('border-emerald-600', 'bg-emerald-50', 'text-emerald-900');
        dot.classList.add('bg-emerald-600');
      } else {
        b.classList.add('border-rose-600', 'bg-rose-50', 'text-rose-900');
        dot.classList.add('bg-rose-600');
      }
    } else {
      b.classList.add('border-slate-200', 'text-slate-700');
      dot.classList.add('bg-slate-300');
    }
  });
}

function populateCircuitosSelect() {
  const munVal = parseInt(document.getElementById('municipio-select').value, 10);
  const searchVal = document.getElementById('circuito-search').value.trim().toLowerCase();
  const circSelect = document.getElementById('circuito-select');

  circSelect.innerHTML = '';

  if (!munVal && !searchVal) {
    circSelect.disabled = true;
    circSelect.classList.add('bg-slate-100');
    circSelect.innerHTML = '<option value="">-- Primero seleccione un municipio --</option>';
    return;
  }

  circSelect.disabled = false;
  circSelect.classList.remove('bg-slate-100');

  let matches = [];
  if (munVal) {
    const munObj = MUNICIPIOS_DATA.find(m => m.mun === munVal);
    if (munObj) {
      matches = munObj.circuitos.map(c => ({ ...c, mun: munObj.mun, munNombre: munObj.nombre }));
    }
  } else {
    MUNICIPIOS_DATA.forEach(m => {
      m.circuitos.forEach(c => matches.push({ ...c, mun: m.mun, munNombre: m.nombre }));
    });
  }

  if (searchVal) {
    matches = matches.filter(c =>
      c.codigo.toLowerCase().includes(searchVal) ||
      c.nombre.toLowerCase().includes(searchVal)
    );
  }

  if (matches.length === 0) {
    circSelect.innerHTML = '<option value="">-- Sin coincidencias --</option>';
    return;
  }

  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = `-- Seleccione Circuito (${matches.length}) --`;
  circSelect.appendChild(ph);

  matches.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.codigo;
    opt.dataset.mun = c.mun;
    opt.dataset.munNombre = c.munNombre;
    opt.dataset.circuitoNombre = c.nombre;
    opt.textContent = munVal
      ? `${c.codigo} — ${c.nombre}`
      : `[${c.munNombre}] ${c.codigo} — ${c.nombre}`;
    circSelect.appendChild(opt);
  });

  if (matches.length === 1) {
    circSelect.value = matches[0].codigo;
  }
}

function updateSelectedCircuitBanner() {
  const circSelect = document.getElementById('circuito-select');
  const selectedOpt = circSelect.options[circSelect.selectedIndex];
  const banner = document.getElementById('selected-circuit-banner');

  if (!selectedOpt || !selectedOpt.value) {
    banner.classList.add('hidden');
    return;
  }

  const munSelect = document.getElementById('municipio-select');
  if (!munSelect.value && selectedOpt.dataset.mun) {
    munSelect.value = selectedOpt.dataset.mun;
  }

  document.getElementById('banner-code').textContent = selectedOpt.value;
  document.getElementById('banner-mun').textContent = `${selectedOpt.dataset.mun}. ${selectedOpt.dataset.munNombre}`;
  document.getElementById('banner-name').textContent = selectedOpt.dataset.circuitoNombre;
  banner.classList.remove('hidden');
}

function renderComisionesRows() {
  const container = document.getElementById('comisiones-list');
  container.innerHTML = '';

  comisionesState.forEach((item, idx) => {
    const isChecked = item.asistio === 'X';
    const row = document.createElement('div');
    row.className = `p-4 md:px-5 md:py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center transition ${isChecked ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50/70'}`;

    row.innerHTML = `
      <div class="md:col-span-5 flex items-center gap-3">
        <span class="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}">
          ${idx + 1}
        </span>
        <span class="text-xs sm:text-sm font-bold text-slate-800 leading-snug">${escapeHtml(item.nombre)}</span>
      </div>

      <div class="md:col-span-2 flex items-center md:justify-center">
        <button type="button" onclick="toggleComisionAsistencia(${idx})"
          class="w-full md:w-36 py-2 px-3 rounded-xl border-2 font-bold text-xs transition flex items-center justify-center gap-2 ${
            isChecked
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
          }">
          <span class="w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs ${
            isChecked ? 'bg-white text-emerald-700 font-extrabold' : 'bg-slate-100 text-slate-400 border border-slate-300'
          }">
            ${isChecked ? 'X' : '&nbsp;'}
          </span>
          <span>${isChecked ? 'Asistió (X)' : 'En blanco'}</span>
        </button>
      </div>

      <div class="md:col-span-5">
        <input type="text"
          value="${escapeHtml(item.propuesta)}"
          oninput="updateComisionPropuesta(${idx}, this.value)"
          placeholder="Escriba la propuesta de esta comisión..."
          class="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
      </div>
    `;
    container.appendChild(row);
  });

  const countX = comisionesState.filter(c => c.asistio === 'X').length;
  document.getElementById('comisiones-count-badge').textContent = `${countX} de ${comisionesState.length} con "X"`;
}

window.toggleComisionAsistencia = function (idx) {
  comisionesState[idx].asistio = comisionesState[idx].asistio === 'X' ? '' : 'X';
  renderComisionesRows();
};

window.updateComisionPropuesta = function (idx, val) {
  comisionesState[idx].propuesta = val;
};

window.clearAllComisiones = function () {
  comisionesState = comisionesState.map(c => ({ ...c, asistio: '' }));
  renderComisionesRows();
  showToast('Asistencia de las 11 comisiones dejada en blanco.', 'info');
};

function updateProgress() {
  const checks = [
    document.getElementById('reporter-name').value.trim() !== '',
    isValidCedula(document.getElementById('reporter-cedula').value.trim()),
    isValidTelefono(document.getElementById('reporter-telefono').value.trim()),
    document.getElementById('report-week').value.trim() !== '',
    document.getElementById('circuito-select').value !== '',
    document.getElementById('field-realizoReunion').value !== '',
    document.getElementById('field-participacion').value !== '',
    document.getElementById('field-cargoEsequibo').value !== '',
    document.getElementById('field-actividades').value !== '',
    document.getElementById('field-asistioEnlace').value !== ''
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  document.getElementById('progress-text').textContent = `${pct}%`;
  document.getElementById('progress-bar').style.width = `${pct}%`;
}

window.resetForm = function () {
  document.getElementById('epc-report-form').reset();
  document.getElementById('report-week').value = 'Semana del 16 al 22 de Noviembre 2026';
  ['reporter-cedula', 'reporter-telefono'].forEach(id => {
    document.getElementById(id).classList.remove('border-emerald-500', 'border-rose-500');
  });
  document.getElementById('cedula-feedback').textContent = 'Formato: V-12345678 o E-12345678';
  document.getElementById('cedula-feedback').className = 'text-[11px] text-slate-500 mt-1';
  document.getElementById('telefono-feedback').textContent = 'Ej. 0412-1234567, 0414, 0416, 0424, 0426';
  document.getElementById('telefono-feedback').className = 'text-[11px] text-slate-500 mt-1';

  ['realizoReunion', 'cargoEsequibo', 'asistioEnlace'].forEach(f => {
    document.getElementById(`field-${f}`).value = '';
    document.querySelectorAll(`.toggle-yn-btn[data-field="${f}"]`).forEach(b => {
      b.classList.remove('border-emerald-600', 'bg-emerald-50', 'text-emerald-900', 'border-rose-600', 'bg-rose-50', 'text-rose-900');
      b.classList.add('border-slate-200', 'text-slate-700');
      const dot = b.querySelector('.indicator-dot');
      dot.classList.remove('bg-emerald-600', 'bg-rose-600');
      dot.classList.add('bg-slate-300');
    });
  });

  populateCircuitosSelect();
  updateSelectedCircuitBanner();
  comisionesState = COMISIONES_OFICIALES.map(nombre => ({ nombre, asistio: '', propuesta: '' }));
  renderComisionesRows();
  updateProgress();
};

window.prepareAnotherReport = function () {
  document.getElementById('submission-success-box').classList.add('hidden');
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('epc-report-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const reporterName = document.getElementById('reporter-name').value.trim();
  const reporterCedula = formatCedulaInput(document.getElementById('reporter-cedula').value.trim());
  const reporterTelefono = formatTelefonoInput(document.getElementById('reporter-telefono').value.trim());
  const reportWeek = document.getElementById('report-week').value.trim();
  const circSelect = document.getElementById('circuito-select');
  const selectedOpt = circSelect.options[circSelect.selectedIndex];

  const realizoReunion = document.getElementById('field-realizoReunion').value;
  const participacionRaw = document.getElementById('field-participacion').value;
  const cargoEsequibo = document.getElementById('field-cargoEsequibo').value;
  const actividadesRaw = document.getElementById('field-actividades').value;
  const asistioEnlace = document.getElementById('field-asistioEnlace').value;

  if (!reporterName) {
    showToast('Ingrese el nombre y apellido del reportante.', 'error');
    document.getElementById('reporter-name').focus();
    return;
  }
  if (!isValidCedula(reporterCedula)) {
    validateCedulaField(true);
    showToast('Ingrese una Cédula válida (ej. V-12345678).', 'error');
    document.getElementById('reporter-cedula').focus();
    return;
  }
  if (!isValidTelefono(reporterTelefono)) {
    validateTelefonoField(true);
    showToast('Ingrese un Teléfono válido de 11 dígitos (ej. 0412-1234567).', 'error');
    document.getElementById('reporter-telefono').focus();
    return;
  }
  if (!selectedOpt || !selectedOpt.value) {
    showToast('Seleccione el Municipio y el Circuito Comunal.', 'error');
    circSelect.focus();
    return;
  }
  if (!realizoReunion) {
    showToast('Indique Si o No se realizó la reunión del EPC.', 'error');
    return;
  }
  if (participacionRaw === '' || isNaN(parseInt(participacionRaw, 10)) || parseInt(participacionRaw, 10) < 0) {
    showToast('Ingrese la cantidad de personas que asistieron.', 'error');
    document.getElementById('field-participacion').focus();
    return;
  }
  if (!cargoEsequibo) {
    showToast('Indique Si o No la reunión fue cargada en el Sistema Esequibo.', 'error');
    return;
  }
  if (actividadesRaw === '' || isNaN(parseInt(actividadesRaw, 10)) || parseInt(actividadesRaw, 10) < 0) {
    showToast('Ingrese la cantidad de actividades realizadas en la semana.', 'error');
    document.getElementById('field-actividades').focus();
    return;
  }
  if (!asistioEnlace) {
    showToast('Indique Si o No asistió el enlace municipal a la reunión del EPC.', 'error');
    return;
  }

  const record = {
    id: 'rep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    mun: parseInt(selectedOpt.dataset.mun, 10),
    municipio: selectedOpt.dataset.munNombre,
    codigo: selectedOpt.value,
    circuitoNombre: selectedOpt.dataset.circuitoNombre,
    reporterName,
    reporterCedula,
    reporterTelefono,
    reportWeek,
    realizoReunion,
    participacion: parseInt(participacionRaw, 10),
    cargoEsequibo,
    cantidadActividades: parseInt(actividadesRaw, 10),
    asistioEnlace,
    comisiones: comisionesState.map(c => ({
      nombre: c.nombre,
      asistio: c.asistio === 'X' ? 'X' : '',
      propuesta: c.propuesta.trim()
    })),
    createdAt: new Date().toISOString()
  };

  const nextList = [record, ...allReports];
  saveReportsToStorage(nextList);
  syncReportToFirebaseIfPossible(record);

  if (isCreatorAuthenticated) {
    updateAdminStats();
    renderAdminTable();
  }

  document.getElementById('submission-summary-text').textContent =
    `Circuito ${record.codigo} (${record.circuitoNombre}) • ${record.municipio} • Reportado por ${record.reporterName}.`;
  document.getElementById('submission-success-box').classList.remove('hidden');
  showToast('¡Reporte semanal guardado correctamente!', 'success');
});

function updateAdminStats() {
  const totalReports = allReports.length;
  const totalParticipants = allReports.reduce((acc, r) => acc + (Number(r.participacion) || 0), 0);
  const reunionesSi = allReports.filter(r => r.realizoReunion === 'Si').length;
  const totalActivities = allReports.reduce((acc, r) => acc + (Number(r.cantidadActividades) || 0), 0);

  document.getElementById('stat-total-reports').textContent = totalReports;
  document.getElementById('stat-total-participants').textContent = totalParticipants.toLocaleString('es-VE');
  document.getElementById('stat-reuniones-si').textContent = reunionesSi;
  document.getElementById('stat-total-activities').textContent = totalActivities.toLocaleString('es-VE');
}

window.renderAdminTable = function () {
  if (!isCreatorAuthenticated) return;
  const tbody = document.getElementById('admin-table-body');
  const filterMun = document.getElementById('admin-filter-mun').value;
  const search = document.getElementById('admin-search-input').value.trim().toLowerCase();

  let filtered = allReports;
  if (filterMun) {
    filtered = filtered.filter(r => r.municipio === filterMun);
  }
  if (search) {
    filtered = filtered.filter(r =>
      (r.codigo || '').toLowerCase().includes(search) ||
      (r.circuitoNombre || '').toLowerCase().includes(search) ||
      (r.reporterName || '').toLowerCase().includes(search) ||
      (r.reporterCedula || '').toLowerCase().includes(search) ||
      (r.reporterTelefono || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-10 text-center text-slate-500">
          No hay reportes registrados que coincidan con el filtro actual.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const comX = Array.isArray(r.comisiones) ? r.comisiones.filter(c => c.asistio === 'X').length : 0;
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">${r.mun}. ${escapeHtml(r.municipio)}</td>
        <td class="py-3.5 px-4">
          <div class="font-mono text-xs font-bold text-brand-700">${escapeHtml(r.codigo)}</div>
          <div class="text-xs font-medium text-slate-700 line-clamp-1">${escapeHtml(r.circuitoNombre)}</div>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-semibold text-slate-900 text-xs">${escapeHtml(r.reporterName)}</div>
          <div class="text-[11px] font-mono text-slate-600">${escapeHtml(r.reporterCedula || '')} • ${escapeHtml(r.reporterTelefono || '')}</div>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${r.realizoReunion === 'Si' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${escapeHtml(r.realizoReunion)}
          </span>
        </td>
        <td class="py-3.5 px-4 text-center font-bold text-slate-900">${r.participacion ?? 0}</td>
        <td class="py-3.5 px-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${r.cargoEsequibo === 'Si' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
            ${escapeHtml(r.cargoEsequibo)}
          </span>
        </td>
        <td class="py-3.5 px-4 text-center font-bold text-slate-900">${r.cantidadActividades ?? 0}</td>
        <td class="py-3.5 px-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${r.asistioEnlace === 'Si' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
            ${escapeHtml(r.asistioEnlace)}
          </span>
        </td>
        <td class="py-3.5 px-4 text-center">
          <span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">${comX} / 11</span>
        </td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <button type="button" onclick="openDetailModal('${r.id}')"
            class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition">
            Detalle
          </button>
          <button type="button" onclick="deleteReportRecord('${r.id}')"
            class="ml-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition" title="Eliminar">
            ✕
          </button>
        </td>
      </tr>
    `;
  }).join('');
};

window.openDetailModal = function (reportId) {
  if (!isCreatorAuthenticated) return;
  const r = allReports.find(item => item.id === reportId);
  if (!r) return;

  document.getElementById('modal-code').textContent = `${r.codigo} • ${r.municipio}`;
  document.getElementById('modal-title').textContent = r.circuitoNombre;

  const comRows = (r.comisiones || []).map(c => `
    <tr class="${c.asistio === 'X' ? 'bg-emerald-50/50' : ''}">
      <td class="py-2 px-3 font-semibold text-slate-800 text-xs">${escapeHtml(c.nombre)}</td>
      <td class="py-2 px-3 text-center font-mono font-extrabold text-xs ${c.asistio === 'X' ? 'text-emerald-700' : 'text-slate-400'}">
        ${c.asistio === 'X' ? 'X' : ''}
      </td>
      <td class="py-2 px-3 text-slate-700 text-xs">${escapeHtml(c.propuesta || 'Sin propuesta')}</td>
    </tr>
  `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div><span class="text-xs text-slate-500 block">Reportante</span><strong>${escapeHtml(r.reporterName)}</strong></div>
      <div><span class="text-xs text-slate-500 block">Cédula</span><strong class="font-mono">${escapeHtml(r.reporterCedula || '')}</strong></div>
      <div><span class="text-xs text-slate-500 block">Teléfono</span><strong class="font-mono">${escapeHtml(r.reporterTelefono || '')}</strong></div>
      <div><span class="text-xs text-slate-500 block">Reunión EPC</span><strong>${escapeHtml(r.realizoReunion)}</strong></div>
      <div><span class="text-xs text-slate-500 block">Participación</span><strong>${r.participacion} personas</strong></div>
      <div><span class="text-xs text-slate-500 block">Sistema Esequibo</span><strong>${escapeHtml(r.cargoEsequibo)}</strong></div>
      <div><span class="text-xs text-slate-500 block">Actividades Semana</span><strong>${r.cantidadActividades}</strong></div>
      <div><span class="text-xs text-slate-500 block">Enlace Municipal</span><strong>${escapeHtml(r.asistioEnlace)}</strong></div>
      <div><span class="text-xs text-slate-500 block">Semana</span><strong>${escapeHtml(r.reportWeek || '')}</strong></div>
    </div>
    <div class="overflow-hidden rounded-2xl border border-slate-200">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-900 text-white text-[11px] uppercase">
            <th class="py-2.5 px-3">Comisión</th>
            <th class="py-2.5 px-3 text-center">Asistencia</th>
            <th class="py-2.5 px-3">Propuesta</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">${comRows}</tbody>
      </table>
    </div>
  `;
  document.getElementById('detail-modal').classList.remove('hidden');
};

window.closeDetailModal = function () {
  document.getElementById('detail-modal').classList.add('hidden');
};

window.deleteReportRecord = function (reportId) {
  if (!isCreatorAuthenticated) return;
  const updated = allReports.filter(item => item.id !== reportId);
  saveReportsToStorage(updated);
  updateAdminStats();
  renderAdminTable();
  showToast('Registro eliminado.', 'info');
};

window.exportToExcel = function () {
  if (!creatorConfig || !isCurrentDeviceAuthorized() || !evaluateExclusiveSession() || !isCreatorAuthenticated) {
    isCreatorAuthenticated = false;
    refreshCreatorUI();
    showToast('Acceso denegado: solo el administrador autorizado puede descargar el archivo Excel.', 'error');
    openCreatorAccess();
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast('La librería SheetJS (XLSX) no se cargó. Verifique su conexión a internet.', 'error');
    return;
  }

  if (allReports.length === 0) {
    showToast('Aún no hay registros para exportar.', 'warning');
    return;
  }

  try {
    const detailedRows = [];
    allReports.forEach(r => {
      const coms = Array.isArray(r.comisiones) && r.comisiones.length === 11
        ? r.comisiones
        : COMISIONES_OFICIALES.map(nombre => ({ nombre, asistio: '', propuesta: '' }));

      coms.forEach((c, idx) => {
        detailedRows.push({
          'MUN': idx === 0 ? r.mun : '',
          'MUNICIPIO': idx === 0 ? r.municipio : '',
          'CODIGO': idx === 0 ? r.codigo : '',
          'NOMBRE DE CIRCUITO COMUNAL': idx === 0 ? r.circuitoNombre : '',
          'REALIZO REUNION DEL EPC': idx === 0 ? r.realizoReunion : '',
          'PARTICIPACION': idx === 0 ? r.participacion : '',
          'CARGO EN EL SISTEMA ESEQUIBO': idx === 0 ? r.cargoEsequibo : '',
          'CANTIDAD DE ACTIVIDADES REALIZADAS EN LA SEMANA': idx === 0 ? r.cantidadActividades : '',
          'ASISTIO EL ENLACE MUNICIPAL': idx === 0 ? r.asistioEnlace : '',
          'COMISIONES ASISTENTES': c.nombre,
          'ASISTENCIA (X)': c.asistio === 'X' ? 'X' : '',
          'PROPUESTAS POR COMISION': c.propuesta || '',
          'REPORTANTE': idx === 0 ? (r.reporterName || '') : '',
          'CEDULA': idx === 0 ? (r.reporterCedula || '') : '',
          'TELEFONO': idx === 0 ? (r.reporterTelefono || '') : '',
          'SEMANA': idx === 0 ? (r.reportWeek || '') : ''
        });
      });
    });

    const summaryRows = allReports.map(r => {
      const comsAsistentes = (r.comisiones || []).filter(c => c.asistio === 'X').map(c => c.nombre).join(', ');
      const propuestasTexto = (r.comisiones || [])
        .filter(c => c.propuesta && c.propuesta.trim() !== '')
        .map(c => `[${c.nombre}]: ${c.propuesta.trim()}`)
        .join(' | ');

      return {
        'MUN': r.mun,
        'MUNICIPIO': r.municipio,
        'CODIGO': r.codigo,
        'NOMBRE DE CIRCUITO COMUNAL': r.circuitoNombre,
        'REPORTANTE': r.reporterName || '',
        'CEDULA': r.reporterCedula || '',
        'TELEFONO': r.reporterTelefono || '',
        'SEMANA': r.reportWeek || '',
        'REALIZO REUNION DEL EPC': r.realizoReunion,
        'PARTICIPACION': r.participacion,
        'CARGO EN EL SISTEMA ESEQUIBO': r.cargoEsequibo,
        'CANTIDAD DE ACTIVIDADES REALIZADAS EN LA SEMANA': r.cantidadActividades,
        'ASISTIO EL ENLACE MUNICIPAL': r.asistioEnlace,
        'TOTAL COMISIONES (X)': (r.comisiones || []).filter(c => c.asistio === 'X').length,
        'COMISIONES ASISTENTES': comsAsistentes,
        'PROPUESTAS POR COMISION': propuestasTexto,
        'FECHA REGISTRO': r.createdAt || ''
      };
    });

    const wb = XLSX.utils.book_new();
    const wsDetailed = XLSX.utils.json_to_sheet(detailedRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(wb, wsDetailed, 'REPORTE_DETALLADO_SEMANAL');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'RESUMEN_POR_REGISTRO');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `REPORTE_SEMANAL_EPC_CARABOBO_${dateStr}.xlsx`);
    showToast('Archivo Excel (.xlsx) descargado correctamente.', 'success');
  } catch (err) {
    console.error('Error exportando Excel:', err);
    showToast('Error al generar el archivo Excel.', 'error');
  }
};

async function initOptionalFirebase() {
  const noteEl = document.getElementById('firebase-status-note');
  try {
    if (typeof __firebase_config === 'undefined' || !__firebase_config) return;
    const cfg = JSON.parse(__firebase_config);
    if (!cfg || !cfg.apiKey) return;

    fbAppId = typeof __app_id !== 'undefined' ? __app_id : 'epc-carabobo-semanal';
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
    const { getAuth, signInAnonymously, signInWithCustomToken } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
    const { getFirestore, doc, getDoc, onSnapshot, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

    const app = initializeApp(cfg);
    fbAuth = getAuth(app);
    fbDb = getFirestore(app);

    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(fbAuth, __initial_auth_token);
    } else {
      await signInAnonymously(fbAuth);
    }

    const ownerRef = doc(fbDb, 'artifacts', fbAppId, 'public', 'data', 'config', 'owner');
    const ownerSnap = await getDoc(ownerRef);
    if (ownerSnap.exists()) {
      const cloudOwner = ownerSnap.data();
      if (!creatorConfig) {
        saveCreatorConfigToStorage(cloudOwner);
      } else {
        const lockedOwner = {
          ...cloudOwner,
          name: creatorConfig.name || cloudOwner.name,
          email: creatorConfig.email || cloudOwner.email,
          pin: creatorConfig.pin || cloudOwner.pin,
          masterKey: creatorConfig.masterKey || cloudOwner.masterKey,
          authorizedDeviceId: creatorConfig.authorizedDeviceId || cloudOwner.authorizedDeviceId,
          authorizedDeviceLabel: creatorConfig.authorizedDeviceLabel || cloudOwner.authorizedDeviceLabel
        };
        saveCreatorConfigToStorage(lockedOwner);
      }
    }

    onSnapshot(ownerRef, (snap) => {
      if (!snap.exists()) return;
      const liveOwner = snap.data();
      saveCreatorConfigToStorage(liveOwner);
      const valid = evaluateExclusiveSession();
      if (isCreatorAuthenticated && !valid) {
        isCreatorAuthenticated = false;
        persistLocalSessionId('');
        refreshCreatorUI();
        showToast('Sesión cerrada automáticamente porque se inició sesión o cambió el Creador Principal en otro dispositivo.', 'warning');
      } else {
        refreshCreatorUI();
      }
    });

    const repSnap = await getDocs(collection(fbDb, 'artifacts', fbAppId, 'public', 'data', 'reportes_semanales'));
    if (!repSnap.empty) {
      const cloudReports = repSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const mergedMap = new Map();
      [...cloudReports, ...allReports].forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });
      const mergedList = Array.from(mergedMap.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      saveReportsToStorage(mergedList);
    }

    if (noteEl) {
      noteEl.textContent = 'Respaldo local + sincronización en nube activa.';
    }
    refreshCreatorUI();
  } catch (err) {
    console.info('Ejecutando en modo autónomo local:', err);
  }
}

async function syncOwnerToFirebaseIfPossible(cfg) {
  if (!fbDb || !cfg) return;
  try {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    await setDoc(doc(fbDb, 'artifacts', fbAppId, 'public', 'data', 'config', 'owner'), cfg);
  } catch (e) {}
}

async function syncReportToFirebaseIfPossible(record) {
  if (!fbDb || !record) return;
  try {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    await setDoc(doc(fbDb, 'artifacts', fbAppId, 'public', 'data', 'reportes_semanales', record.id), record);
  } catch (e) {}
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', () => {
  initFormUI();
  refreshCreatorUI();
  initOptionalFirebase();
});
