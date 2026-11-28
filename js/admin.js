const ADMIN_SESSION_KEY = 'epc_admin_auth_v1';
const LOCAL_REPORTS_KEY = 'epc_carabobo_reports_v2';

const ADMIN_CREDENTIALS = {
  user: 'admin',
  pass: 'epc2026'
};

let allReports = [];
let filteredReports = [];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function getSupabaseConfig() {
  const cfg = window.EPC_CLOUD_CONFIG || {};
  const url = (cfg.supabaseUrl || '').trim().replace(/\/$/, '');
  const key = (cfg.supabaseAnonKey || '').trim();
  const table = (cfg.supabaseTable || 'reportes_semanales').trim();
  if (!url || !key) return null;
  return { url, key, table };
}

function loadLocalReports() {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLocalReports(list) {
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function mergeReports(cloudList, localList) {
  const map = new Map();
  [...localList, ...cloudList].forEach(item => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

window.syncFromCloud = async function (notify = false) {
  const sb = getSupabaseConfig();
  const dot = document.getElementById('sync-dot');
  const label = document.getElementById('sync-status-label');
  const localList = loadLocalReports();

  if (!sb) {
    allReports = localList;
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
    if (label) label.textContent = 'Modo local (sin configuración en la nube)';
    populateFilterOptions();
    applyFilters();
    return;
  }

  try {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
    if (label) label.textContent = 'Sincronizando con Supabase...';

    const res = await fetch(`${sb.url}/rest/v1/${sb.table}?select=id,payload,created_at&order=created_at.desc&limit=5000`, {
      headers: {
        'apikey': sb.key,
        'Authorization': `Bearer ${sb.key}`
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const cloudReports = (Array.isArray(rows) ? rows : [])
      .map(r => r && r.payload ? r.payload : null)
      .filter(Boolean);

    allReports = mergeReports(cloudReports, localList);
    saveLocalReports(allReports);

    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
    if (label) label.textContent = `Sincronizado con la nube (${allReports.length} reportes)`;
    if (notify) showToast(`Datos actualizados: ${allReports.length} reportes.`, 'success');
  } catch (e) {
    console.warn('Error sincronizando desde Supabase:', e);
    allReports = localList;
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
    if (label) label.textContent = `Sin conexión a la nube • Mostrando datos locales (${allReports.length})`;
    if (notify) showToast('No se pudo conectar con la nube; mostrando respaldo local.', 'warning');
  }

  populateFilterOptions();
  applyFilters();
};

function populateFilterOptions() {
  const semSelect = document.getElementById('filter-semana');
  const munSelect = document.getElementById('filter-municipio');

  if (semSelect) {
    const prevSem = semSelect.value;
    const semanas = Array.from(new Set(allReports.map(r => r.reportWeek).filter(Boolean)));
    semSelect.innerHTML = '<option value="">Todas las semanas</option>';
    semanas.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      semSelect.appendChild(opt);
    });
    if (semanas.includes(prevSem)) semSelect.value = prevSem;
  }

  if (munSelect && munSelect.options.length <= 1 && typeof MUNICIPIOS_DATA !== 'undefined') {
    MUNICIPIOS_DATA.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.nombre;
      opt.textContent = `${m.mun}. ${m.nombre}`;
      munSelect.appendChild(opt);
    });
  }
}

function applyFilters() {
  const sem = document.getElementById('filter-semana')?.value || '';
  const mun = document.getElementById('filter-municipio')?.value || '';
  const reu = document.getElementById('filter-reunion')?.value || '';
  const q = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();

  filteredReports = allReports.filter(r => {
    if (sem && r.reportWeek !== sem) return false;
    if (mun && r.municipio !== mun) return false;
    if (reu && r.realizoReunion !== reu) return false;
    if (q) {
      const haystack = `${r.codigo || ''} ${r.circuitoNombre || ''} ${r.municipio || ''} ${r.reporterName || ''} ${r.reporterCedula || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  renderKPIs(filteredReports);
  renderTable(filteredReports);
}

function renderKPIs(list) {
  const total = list.length;
  const uniqueCircuitos = new Set(list.map(r => r.codigo).filter(Boolean)).size;
  const reunionesSi = list.filter(r => r.realizoReunion === 'Si').length;
  const pctReuniones = total > 0 ? Math.round((reunionesSi / total) * 100) : 0;
  const totalParticipacion = list.reduce((acc, r) => acc + (Number(r.participacion) || 0), 0);
  const totalEsequibo = list.filter(r => r.cargoEsequibo === 'Si').length;
  const totalActividades = list.reduce((acc, r) => acc + (Number(r.cantidadActividades) || 0), 0);
  const totalEnlaces = list.filter(r => r.asistioEnlace === 'Si').length;

  document.getElementById('kpi-total-reportes').textContent = total;
  document.getElementById('kpi-cobertura').textContent = `${uniqueCircuitos} / 173 circuitos`;
  document.getElementById('kpi-reuniones-si').textContent = reunionesSi;
  document.getElementById('kpi-reuniones-pct').textContent = `${pctReuniones}% de efectividad`;
  document.getElementById('kpi-participacion').textContent = totalParticipacion.toLocaleString('es-VE');
  document.getElementById('kpi-esequibo').textContent = totalEsequibo;
  document.getElementById('kpi-actividades').textContent = totalActividades.toLocaleString('es-VE');
  document.getElementById('kpi-enlaces').textContent = `Enlaces asistentes: ${totalEnlaces}`;
}

function badgeSiNo(val) {
  if (val === 'Si') {
    return '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Si</span>';
  }
  return '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">No</span>';
}

function renderTable(list) {
  const tbody = document.getElementById('reports-table-body');
  const countLabel = document.getElementById('table-count-label');
  if (countLabel) countLabel.textContent = `${list.length} ${list.length === 1 ? 'registro' : 'registros'}`;
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="px-6 py-10 text-center text-slate-500 text-sm">
          No hay reportes que coincidan con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const totalComPers = typeof window.countComisionesAsistentes === 'function'
      ? window.countComisionesAsistentes(r.comisiones)
      : 0;
    const comActivas = Array.isArray(r.comisiones)
      ? r.comisiones.filter(c => (parseInt(c.asistio, 10) || 0) > 0).length
      : 0;

    return `
      <tr class="hover:bg-slate-50/90 transition">
        <td class="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">${escapeHtml(r.reportWeek)}</td>
        <td class="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">${escapeHtml(r.municipio)}</td>
        <td class="px-4 py-3">
          <div class="font-mono text-[11px] font-bold text-brand-700">${escapeHtml(r.codigo)}</div>
          <div class="text-xs font-semibold text-slate-900 line-clamp-1">${escapeHtml(r.circuitoNombre)}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-xs font-bold text-slate-900">${escapeHtml(r.reporterName)}</div>
          <div class="text-[11px] font-mono text-slate-500">${escapeHtml(r.reporterCedula)} • ${escapeHtml(r.reporterTelefono)}</div>
        </td>
        <td class="px-4 py-3 text-center">${badgeSiNo(r.realizoReunion)}</td>
        <td class="px-4 py-3 text-center font-bold text-slate-900">${Number(r.participacion) || 0}</td>
        <td class="px-4 py-3 text-center">${badgeSiNo(r.cargoEsequibo)}</td>
        <td class="px-4 py-3 text-center font-bold text-slate-900">${Number(r.cantidadActividades) || 0}</td>
        <td class="px-4 py-3 text-center">${badgeSiNo(r.asistioEnlace)}</td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
            ${comActivas}/11 (${totalComPers} pers.)
          </span>
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            <button type="button" onclick="openDetailModal('${escapeHtml(r.id)}')"
              class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-bold transition">
              Ver
            </button>
            <button type="button" onclick="deleteReport('${escapeHtml(r.id)}')"
              class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition">
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openDetailModal = function (id) {
  const r = allReports.find(item => item.id === id);
  if (!r) return;

  document.getElementById('modal-code').textContent = r.codigo || '';
  document.getElementById('modal-title').textContent = r.circuitoNombre || '';
  document.getElementById('modal-subtitle').textContent = `${r.municipio} • Semana ${r.reportWeek} • Reportado por ${r.reporterName} (${r.reporterCedula} / ${r.reporterTelefono})`;

  const comHtml = (Array.isArray(r.comisiones) ? r.comisiones : []).map((c, idx) => `
    <div class="p-3 rounded-xl border ${Number(c.asistio) > 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <span class="text-xs font-bold text-slate-900">${idx + 1}. ${escapeHtml(c.nombre)}</span>
        ${c.propuesta ? `<p class="text-xs text-slate-700 mt-1"><strong>Propuesta:</strong> ${escapeHtml(c.propuesta)}</p>` : '<p class="text-[11px] text-slate-400 mt-0.5">Sin propuesta registrada</p>'}
      </div>
      <span class="px-3 py-1 rounded-lg text-xs font-extrabold shrink-0 ${Number(c.asistio) > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">
        ${Number(c.asistio) || 0} pers.
      </span>
    </div>
  `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="text-[11px] text-slate-500">Reunión EPC</div>
        <div class="font-extrabold text-slate-900 mt-0.5">${escapeHtml(r.realizoReunion)}</div>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="text-[11px] text-slate-500">Participación</div>
        <div class="font-extrabold text-slate-900 mt-0.5">${Number(r.participacion) || 0}</div>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="text-[11px] text-slate-500">Esequibo</div>
        <div class="font-extrabold text-slate-900 mt-0.5">${escapeHtml(r.cargoEsequibo)}</div>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="text-[11px] text-slate-500">Actividades</div>
        <div class="font-extrabold text-slate-900 mt-0.5">${Number(r.cantidadActividades) || 0}</div>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
        <div class="text-[11px] text-slate-500">Enlace Mun.</div>
        <div class="font-extrabold text-slate-900 mt-0.5">${escapeHtml(r.asistioEnlace)}</div>
      </div>
    </div>
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600">Asistencia y Propuestas por Comisión</h4>
      <div class="space-y-2">${comHtml}</div>
    </div>
  `;

  document.getElementById('detail-modal').classList.remove('hidden');
};

window.closeDetailModal = function () {
  document.getElementById('detail-modal').classList.add('hidden');
};

window.deleteReport = async function (id) {
  if (!confirm('¿Desea eliminar este reporte semanal?')) return;

  allReports = allReports.filter(r => r.id !== id);
  saveLocalReports(allReports);
  applyFilters();

  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/${sb.table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'apikey': sb.key,
          'Authorization': `Bearer ${sb.key}`
        }
      });
    } catch (e) {
      console.warn('No se pudo eliminar en la nube:', e);
    }
  }
  showToast('Reporte eliminado correctamente.', 'info');
};

window.exportExcelConsolidado = function () {
  if (typeof XLSX === 'undefined') {
    showToast('La librería de Excel aún está cargando.', 'error');
    return;
  }
  if (!filteredReports.length) {
    showToast('No hay registros para exportar.', 'warning');
    return;
  }

  const rows = filteredReports.map((r, i) => {
    const baseRow = {
      'N°': i + 1,
      'Semana': r.reportWeek || '',
      'Municipio': r.municipio || '',
      'Código Circuito': r.codigo || '',
      'Circuito Comunal': r.circuitoNombre || '',
      'Reportante': r.reporterName || '',
      'Cédula': r.reporterCedula || '',
      'Teléfono': r.reporterTelefono || '',
      '¿Realizó Reunión EPC?': r.realizoReunion || '',
      'Participación': Number(r.participacion) || 0,
      '¿Cargada en Esequibo?': r.cargoEsequibo || '',
      'Actividades Semanales': Number(r.cantidadActividades) || 0,
      '¿Asistió Enlace Municipal?': r.asistioEnlace || ''
    };

    const comList = Array.isArray(r.comisiones) ? r.comisiones : [];
    comList.forEach(c => {
      baseRow[`Asist. ${c.nombre}`] = Number(c.asistio) || 0;
      baseRow[`Propuesta ${c.nombre}`] = c.propuesta || '';
    });

    return baseRow;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidado_EPC');
  XLSX.writeFile(wb, `Reporte_Semanal_EPC_Carabobo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast('Archivo Excel generado correctamente.', 'success');
};

function setAuthenticatedUI(isAuth) {
  const loginBox = document.getElementById('admin-login-box');
  const dashboard = document.getElementById('admin-dashboard');
  const logoutBtn = document.getElementById('logout-btn');

  if (isAuth) {
    loginBox.classList.add('hidden');
    dashboard.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    syncFromCloud(false);
  } else {
    loginBox.classList.remove('hidden');
    dashboard.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

window.logoutAdmin = function () {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  setAuthenticatedUI(false);
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('admin-user').value.trim();
      const p = document.getElementById('admin-pass').value;
      if (u === ADMIN_CREDENTIALS.user && p === ADMIN_CREDENTIALS.pass) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        setAuthenticatedUI(true);
        showToast('Bienvenido al Panel Administrador.', 'success');
      } else {
        showToast('Usuario o contraseña incorrectos.', 'error');
      }
    });
  }

  ['filter-semana', 'filter-municipio', 'filter-reunion'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  document.getElementById('filter-search')?.addEventListener('input', applyFilters);

  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  setAuthenticatedUI(isAuth);
});
