const STORAGE_KEYS = {
  REPORTS: 'epc_carabobo_reports_v2'
};

// ===================================================================
// CONTROL DE APERTURA Y CIERRE AUTOMÁTICO (HORA DE VENEZUELA UTC-4)
// Abre: Miércoles 11:59 PM (23:59:00)
// Cierra: Domingo 11:59 PM (23:59:00)
// ===================================================================
const VE_OFFSET_MS = -4 * 60 * 60 * 1000; // UTC-4 sin horario de verano

function getVenezuelaClockParts(nowUtcMs = Date.now()) {
  const veDate = new Date(nowUtcMs + VE_OFFSET_MS);
  return {
    year: veDate.getUTCFullYear(),
    month: veDate.getUTCMonth(),
    day: veDate.getUTCDate(),
    dayOfWeek: veDate.getUTCDay(), // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    hours: veDate.getUTCHours(),
    minutes: veDate.getUTCMinutes(),
    seconds: veDate.getUTCSeconds(),
    veAsUtcMs: veDate.getTime()
  };
}

function getScheduleWindowState(nowUtcMs = Date.now()) {
  const ve = getVenezuelaClockParts(nowUtcMs);

  // Lunes de la semana actual en hora de Venezuela (00:00:00 VET)
  const diffToMonday = ve.dayOfWeek === 0 ? -6 : 1 - ve.dayOfWeek;
  const mondayVeUtcMs = Date.UTC(ve.year, ve.month, ve.day + diffToMonday, 0, 0, 0, 0);

  // Miércoles 23:59:00 VET (Lunes + 2 días, 23h 59m)
  const wedOpenVeUtcMs = mondayVeUtcMs + (2 * 24 * 60 + 23 * 60 + 59) * 60 * 1000;

  // Domingo 23:59:00 VET (Lunes + 6 días, 23h 59m)
  const sunCloseVeUtcMs = mondayVeUtcMs + (6 * 24 * 60 + 23 * 60 + 59) * 60 * 1000;

  const isOpen = ve.veAsUtcMs >= wedOpenVeUtcMs && ve.veAsUtcMs < sunCloseVeUtcMs;

  let nextOpenVeUtcMs = wedOpenVeUtcMs;
  if (ve.veAsUtcMs >= sunCloseVeUtcMs) {
    // Si ya pasó el domingo 11:59 PM, la próxima apertura es el miércoles de la semana siguiente
    nextOpenVeUtcMs = wedOpenVeUtcMs + 7 * 24 * 60 * 60 * 1000;
  }

  return {
    isOpen,
    ve,
    wedOpenVeUtcMs,
    sunCloseVeUtcMs,
    nextOpenVeUtcMs,
    msUntilOpen: Math.max(0, nextOpenVeUtcMs - ve.veAsUtcMs),
    msUntilClose: Math.max(0, sunCloseVeUtcMs - ve.veAsUtcMs)
  };
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}

function formatVeTimestamp(veAsUtcMs) {
  const d = new Date(veAsUtcMs);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} VET`;
}

function formatVeShortDate(veAsUtcMs) {
  const d = new Date(veAsUtcMs);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

let lastOpenState = null;

function syncScheduleUI() {
  const state = getScheduleWindowState();
  const viewForm = document.getElementById('view-form');
  const viewClosed = document.getElementById('view-closed');
  const pill = document.getElementById('schedule-status-pill');
  const dot = document.getElementById('schedule-status-dot');
  const statusText = document.getElementById('schedule-status-text');

  if (state.isOpen) {
    if (viewForm) viewForm.classList.remove('hidden');
    if (viewClosed) viewClosed.classList.add('hidden');
    if (pill) {
      pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-300/40 self-start sm:self-auto';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
    if (statusText) statusText.textContent = 'Formulario Abierto (Mié 11:59 PM – Dom 11:59 PM)';

    const closeEl = document.getElementById('countdown-to-close');
    if (closeEl) closeEl.textContent = formatCountdown(state.msUntilClose);

    if (lastOpenState === false) {
      applyAutomaticWeekLabel();
      showToast('El formulario semanal se ha habilitado automáticamente.', 'success');
    }
  } else {
    if (viewForm) viewForm.classList.add('hidden');
    if (viewClosed) viewClosed.classList.remove('hidden');
    if (pill) {
      pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/25 text-rose-100 border border-rose-300/40 self-start sm:self-auto';
    }
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-400';
    if (statusText) statusText.textContent = 'Formulario Cerrado (Abre Mié 11:59 PM)';

    const openEl = document.getElementById('countdown-to-open');
    if (openEl) openEl.textContent = formatCountdown(state.msUntilOpen);

    const nextOpenEl = document.getElementById('next-open-label');
    if (nextOpenEl) {
      nextOpenEl.textContent = `Próxima apertura: Miércoles ${formatVeShortDate(state.nextOpenVeUtcMs)} • 11:59 PM`;
    }

    const clockEl = document.getElementById('ve-clock-closed');
    if (clockEl) {
      clockEl.textContent = `Hora actual Venezuela: ${formatVeTimestamp(state.ve.veAsUtcMs)}`;
    }

    if (lastOpenState === true) {
      showToast('El período semanal ha cerrado automáticamente (Domingo 11:59 PM).', 'warning');
    }
  }

  lastOpenState = state.isOpen;
  return state.isOpen;
}

function formatDateDDMMYYYY(dateObj) {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getCurrentWeekRangeLabel(nowUtcMs = Date.now()) {
  const ve = getVenezuelaClockParts(nowUtcMs);
  const diffToMonday = ve.dayOfWeek === 0 ? -6 : 1 - ve.dayOfWeek;
  const monday = new Date(Date.UTC(ve.year, ve.month, ve.day + diffToMonday));
  const sunday = new Date(Date.UTC(ve.year, ve.month, ve.day + diffToMonday + 6));
  const fmtUtc = (d) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  return `${fmtUtc(monday)} AL ${fmtUtc(sunday)}`;
}

function applyAutomaticWeekLabel() {
  const weekEl = document.getElementById('report-week');
  if (weekEl) {
    weekEl.value = getCurrentWeekRangeLabel();
  }
}

const FALLBACK_COMISIONES = [
  "ORGANIZACIÓN",
  "AGITACION,PROPAGANDA Y COMUNICACIÓN",
  "ASUNTOS INTERNACIONALES",
  "ASUNTOS PARLAMENTARIOS",
  "ECONOMIA PRODUCTIVA Y FINANZAS",
  "ESTRATEGIA Y CRECIMIENTO ELECTORAL",
  "FORMACION POLITICA INTEGRAL",
  "JUVENTUD",
  "MOVILIZACION DE CALLE",
  "MOV. SOCIALES, PODER POPULAR Y GPPSB",
  "SEGURIDAD Y DEFENSA"
];

function safeParseAsistencia(val) {
  if (typeof window.parseComisionAsistenciaNum === 'function') {
    return window.parseComisionAsistenciaNum(val);
  }
  if (val === 'X' || val === 'x') return 1;
  const n = parseInt(val, 10);
  return !isNaN(n) && n > 0 ? n : 0;
}

function safeCountAsistentes(comisiones) {
  if (typeof window.countComisionesAsistentes === 'function') {
    return window.countComisionesAsistentes(comisiones);
  }
  if (!Array.isArray(comisiones)) return 0;
  return comisiones.reduce((sum, c) => sum + safeParseAsistencia(c && c.asistio), 0);
}

function getSafeInitialComisiones() {
  if (typeof window.createInitialComisionesState === 'function') {
    const list = window.createInitialComisionesState();
    if (Array.isArray(list) && list.length > 0) return list;
  }
  const baseList = (typeof COMISIONES_OFICIALES !== 'undefined' && Array.isArray(COMISIONES_OFICIALES) && COMISIONES_OFICIALES.length > 0)
    ? COMISIONES_OFICIALES
    : FALLBACK_COMISIONES;
  return baseList.map(nombre => ({ nombre, asistio: 0, propuesta: '' }));
}

let allReports = loadReportsFromStorage();
let comisionesState = getSafeInitialComisiones();

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
    console.warn('No se pudieron guardar los reportes localmente:', e);
  }
}

window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
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
  if (!input || !fb) return false;
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
  if (!input || !fb) return false;
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

function setTextIfExists(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function initFormUI() {
  const munSelect = document.getElementById('municipio-select');

  if (typeof MUNICIPIOS_DATA !== 'undefined' && Array.isArray(MUNICIPIOS_DATA) && munSelect) {
    MUNICIPIOS_DATA.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.mun;
      opt.textContent = `${m.mun}. ${m.nombre} (${m.circuitos.length} circuitos)`;
      munSelect.appendChild(opt);
    });
  }

  if (munSelect) {
    munSelect.addEventListener('change', () => {
      populateCircuitosSelect();
      updateSelectedCircuitBanner();
      updateProgress();
    });
  }

  const circSearch = document.getElementById('circuito-search');
  if (circSearch) {
    circSearch.addEventListener('input', () => {
      populateCircuitosSelect();
      updateSelectedCircuitBanner();
      updateProgress();
    });
  }

  const circSelectEl = document.getElementById('circuito-select');
  if (circSelectEl) {
    circSelectEl.addEventListener('change', () => {
      updateSelectedCircuitBanner();
      updateProgress();
    });
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.toggle-yn-btn');
    if (!btn) return;
    const field = btn.getAttribute('data-field');
    const value = btn.getAttribute('data-value');
    if (!field || !value) return;
    setYesNoValue(field, value);
    updateProgress();
  });

  ['reporter-name', 'report-week', 'field-participacion', 'field-actividades'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateProgress);
  });

  const cedulaInput = document.getElementById('reporter-cedula');
  if (cedulaInput) {
    cedulaInput.addEventListener('input', () => {
      cedulaInput.value = formatCedulaInput(cedulaInput.value);
      validateCedulaField(false);
      updateProgress();
    });
    cedulaInput.addEventListener('blur', () => validateCedulaField(true));
  }

  const telefonoInput = document.getElementById('reporter-telefono');
  if (telefonoInput) {
    telefonoInput.addEventListener('input', () => {
      telefonoInput.value = formatTelefonoInput(telefonoInput.value);
      validateTelefonoField(false);
      updateProgress();
    });
    telefonoInput.addEventListener('blur', () => validateTelefonoField(true));
  }

  comisionesState = getSafeInitialComisiones();
  if (document.getElementById('comisiones-list')) {
    renderComisionesRows();
  }
  applyAutomaticWeekLabel();
  if (document.getElementById('progress-text')) {
    updateProgress();
  }

  syncScheduleUI();
  setInterval(syncScheduleUI, 1000);
}

window.selectYesNo = function (field, value) {
  setYesNoValue(field, value);
  updateProgress();
};

function setYesNoValue(field, value) {
  const hiddenInput = document.getElementById(`field-${field}`);
  if (hiddenInput) hiddenInput.value = value;
  document.querySelectorAll(`.toggle-yn-btn[data-field="${field}"]`).forEach(b => {
    const bVal = b.getAttribute('data-value');
    const dot = b.querySelector('.indicator-dot');
    b.classList.remove(
      'border-emerald-600', 'bg-emerald-50', 'text-emerald-900', 'ring-2', 'ring-emerald-300',
      'border-rose-600', 'bg-rose-50', 'text-rose-900', 'ring-2', 'ring-rose-300',
      'border-slate-200', 'text-slate-700'
    );
    if (dot) dot.classList.remove('bg-emerald-600', 'bg-rose-600', 'bg-slate-300');

    if (bVal === value) {
      if (value === 'Si') {
        b.classList.add('border-emerald-600', 'bg-emerald-50', 'text-emerald-900', 'ring-2', 'ring-emerald-300');
        if (dot) dot.classList.add('bg-emerald-600');
      } else {
        b.classList.add('border-rose-600', 'bg-rose-50', 'text-rose-900', 'ring-2', 'ring-rose-300');
        if (dot) dot.classList.add('bg-rose-600');
      }
    } else {
      b.classList.add('border-slate-200', 'text-slate-700');
      if (dot) dot.classList.add('bg-slate-300');
    }
  });
}

function populateCircuitosSelect() {
  const munEl = document.getElementById('municipio-select');
  const searchEl = document.getElementById('circuito-search');
  const circSelect = document.getElementById('circuito-select');
  if (!munEl || !circSelect) return;

  const munVal = parseInt(munEl.value, 10);
  const searchVal = (searchEl ? searchEl.value : '').trim().toLowerCase();

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
  const banner = document.getElementById('selected-circuit-banner');
  if (!circSelect || !banner) return;

  const selectedOpt = circSelect.options[circSelect.selectedIndex];

  if (!selectedOpt || !selectedOpt.value) {
    banner.classList.add('hidden');
    return;
  }

  const munSelect = document.getElementById('municipio-select');
  if (munSelect && !munSelect.value && selectedOpt.dataset.mun) {
    munSelect.value = selectedOpt.dataset.mun;
  }

  setTextIfExists('banner-code', selectedOpt.value);
  setTextIfExists('banner-mun', `${selectedOpt.dataset.mun}. ${selectedOpt.dataset.munNombre}`);
  setTextIfExists('banner-name', selectedOpt.dataset.circuitoNombre);
  banner.classList.remove('hidden');
}

function renderComisionesRows() {
  const container = document.getElementById('comisiones-list');
  if (!container) return;

  if (!Array.isArray(comisionesState) || comisionesState.length === 0) {
    comisionesState = getSafeInitialComisiones();
  }

  container.innerHTML = '';

  comisionesState.forEach((item, idx) => {
    const numAsist = safeParseAsistencia(item.asistio);
    const hasAttendees = numAsist > 0;
    const row = document.createElement('div');
    row.className = `p-4 md:px-5 md:py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center transition ${hasAttendees ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50/70'}`;

    row.innerHTML = `
      <div class="md:col-span-5 flex items-center gap-3">
        <span class="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${hasAttendees ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}">
          ${idx + 1}
        </span>
        <span class="text-xs sm:text-sm font-bold text-slate-800 leading-snug">${escapeHtml(item.nombre)}</span>
      </div>

      <div class="md:col-span-2 flex items-center md:justify-center">
        <div class="relative w-full md:w-32">
          <input type="number"
            min="0"
            step="1"
            inputmode="numeric"
            value="${numAsist > 0 ? numAsist : ''}"
            oninput="updateComisionAsistencia(${idx}, this.value)"
            placeholder="0"
            aria-label="Cantidad de participantes que asistieron en ${escapeHtml(item.nombre)}"
            class="w-full px-3 py-2 pr-12 rounded-xl border-2 text-center font-bold text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              hasAttendees
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                : 'border-slate-300 bg-white text-slate-900'
            }" />
          <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400 pointer-events-none">
            pers.
          </span>
        </div>
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

  const totalAsist = safeCountAsistentes(comisionesState);
  const badge = document.getElementById('comisiones-count-badge');
  if (badge) {
    badge.textContent = `${totalAsist} ${totalAsist === 1 ? 'persona' : 'personas'}`;
  }
}

window.updateComisionAsistencia = function (idx, val) {
  const parsed = parseInt(val, 10);
  const cleanNum = !isNaN(parsed) && parsed > 0 ? parsed : 0;
  comisionesState[idx].asistio = cleanNum;

  const totalAsist = safeCountAsistentes(comisionesState);
  const badge = document.getElementById('comisiones-count-badge');
  if (badge) {
    badge.textContent = `${totalAsist} ${totalAsist === 1 ? 'persona' : 'personas'}`;
  }
  const list = document.getElementById('comisiones-list');
  if (list && list.children[idx]) {
    const row = list.children[idx];
    const numBadge = row.querySelector('span');
    const numInput = row.querySelector('input[type="number"]');
    if (cleanNum > 0) {
      row.classList.remove('bg-white', 'hover:bg-slate-50/70');
      row.classList.add('bg-emerald-50/40');
      if (numBadge) {
        numBadge.classList.remove('bg-slate-100', 'text-slate-600');
        numBadge.classList.add('bg-emerald-600', 'text-white');
      }
      if (numInput) {
        numInput.classList.remove('border-slate-300', 'bg-white', 'text-slate-900');
        numInput.classList.add('border-emerald-600', 'bg-emerald-50', 'text-emerald-900');
      }
    } else {
      row.classList.remove('bg-emerald-50/40');
      row.classList.add('bg-white', 'hover:bg-slate-50/70');
      if (numBadge) {
        numBadge.classList.remove('bg-emerald-600', 'text-white');
        numBadge.classList.add('bg-slate-100', 'text-slate-600');
      }
      if (numInput) {
        numInput.classList.remove('border-emerald-600', 'bg-emerald-50', 'text-emerald-900');
        numInput.classList.add('border-slate-300', 'bg-white', 'text-slate-900');
      }
    }
  }
};

window.updateComisionPropuesta = function (idx, val) {
  comisionesState[idx].propuesta = val;
};

window.clearAllComisiones = function () {
  comisionesState = getSafeInitialComisiones().map((c, idx) => ({
    ...c,
    propuesta: (comisionesState[idx] && comisionesState[idx].propuesta) || ''
  }));
  renderComisionesRows();
  showToast('Asistencia de las 11 comisiones puesta en 0.', 'info');
};

function updateProgress() {
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  if (!progressText || !progressBar) return;

  const checks = [
    (document.getElementById('reporter-name')?.value || '').trim() !== '',
    isValidCedula((document.getElementById('reporter-cedula')?.value || '').trim()),
    isValidTelefono((document.getElementById('reporter-telefono')?.value || '').trim()),
    (document.getElementById('report-week')?.value || '').trim() !== '',
    (document.getElementById('circuito-select')?.value || '') !== '',
    (document.getElementById('field-realizoReunion')?.value || '') !== '',
    (document.getElementById('field-participacion')?.value || '') !== '',
    (document.getElementById('field-cargoEsequibo')?.value || '') !== '',
    (document.getElementById('field-actividades')?.value || '') !== '',
    (document.getElementById('field-asistioEnlace')?.value || '') !== ''
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  progressText.textContent = `${pct}%`;
  progressBar.style.width = `${pct}%`;
}

window.resetForm = function () {
  const formEl = document.getElementById('epc-report-form');
  if (formEl) formEl.reset();
  applyAutomaticWeekLabel();

  ['reporter-cedula', 'reporter-telefono'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('border-emerald-500', 'border-rose-500');
  });

  const cedFb = document.getElementById('cedula-feedback');
  if (cedFb) {
    cedFb.textContent = 'Formato: V-12345678 o E-12345678';
    cedFb.className = 'text-[11px] text-slate-500 mt-1';
  }
  const telFb = document.getElementById('telefono-feedback');
  if (telFb) {
    telFb.textContent = 'Ej. 0412-1234567, 0414, 0416, 0424, 0426';
    telFb.className = 'text-[11px] text-slate-500 mt-1';
  }

  ['realizoReunion', 'cargoEsequibo', 'asistioEnlace'].forEach(f => {
    const hidden = document.getElementById(`field-${f}`);
    if (hidden) hidden.value = '';
    document.querySelectorAll(`.toggle-yn-btn[data-field="${f}"]`).forEach(b => {
      b.classList.remove('border-emerald-600', 'bg-emerald-50', 'text-emerald-900', 'border-rose-600', 'bg-rose-50', 'text-rose-900');
      b.classList.add('border-slate-200', 'text-slate-700');
      const dot = b.querySelector('.indicator-dot');
      if (dot) {
        dot.classList.remove('bg-emerald-600', 'bg-rose-600');
        dot.classList.add('bg-slate-300');
      }
    });
  });

  populateCircuitosSelect();
  updateSelectedCircuitBanner();
  comisionesState = getSafeInitialComisiones();
  renderComisionesRows();
  updateProgress();
};

window.prepareAnotherReport = function () {
  const successBox = document.getElementById('submission-success-box');
  if (successBox) successBox.classList.add('hidden');
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function getSupabaseConfig() {
  const cfg = window.EPC_CLOUD_CONFIG || {};
  const url = (cfg.supabaseUrl || '').trim().replace(/\/$/, '');
  const key = (cfg.supabaseAnonKey || '').trim();
  const table = (cfg.supabaseTable || 'reportes_semanales').trim();
  if (!url || !key) return null;
  return { url, key, table };
}

async function pushReportToSupabase(record) {
  const sb = getSupabaseConfig();
  if (!sb || !record) return false;
  try {
    const res = await fetch(`${sb.url}/rest/v1/${sb.table}`, {
      method: 'POST',
      headers: {
        'apikey': sb.key,
        'Authorization': `Bearer ${sb.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        id: record.id,
        payload: record,
        created_at: record.createdAt || new Date().toISOString()
      })
    });
    return res.ok;
  } catch (e) {
    console.warn('Error enviando reporte a Supabase:', e);
    return false;
  }
}

const reportFormEl = document.getElementById('epc-report-form');
if (reportFormEl) {
  reportFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación estricta de ventana horaria al momento del envío
    if (!syncScheduleUI()) {
      showToast('El formulario se encuentra cerrado. Abre el miércoles a las 11:59 PM y cierra el domingo a las 11:59 PM.', 'error');
      return;
    }

    const reporterName = document.getElementById('reporter-name').value.trim();
    const reporterCedula = formatCedulaInput(document.getElementById('reporter-cedula').value.trim());
    const reporterTelefono = formatTelefonoInput(document.getElementById('reporter-telefono').value.trim());
    applyAutomaticWeekLabel();
    const reportWeek = getCurrentWeekRangeLabel();
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
        asistio: safeParseAsistencia(c.asistio),
        propuesta: (c.propuesta || '').trim()
      })),
      createdAt: new Date().toISOString()
    };

    const nextList = [record, ...allReports];
    saveReportsToStorage(nextList);
    const sentSb = await pushReportToSupabase(record);

    setTextIfExists(
      'submission-summary-text',
      `Circuito ${record.codigo} (${record.circuitoNombre}) • ${record.municipio} • Semana ${record.reportWeek} • Reportado por ${record.reporterName}.`
    );
    const successBox = document.getElementById('submission-success-box');
    if (successBox) successBox.classList.remove('hidden');

    showToast(
      sentSb
        ? '¡Reporte semanal enviado y guardado correctamente!'
        : '¡Reporte guardado en este dispositivo!',
      'success'
    );
  });
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

let __epcBooted = false;
function bootEpcApp() {
  if (__epcBooted) return;
  __epcBooted = true;
  initFormUI();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootEpcApp);
} else {
  bootEpcApp();
}
