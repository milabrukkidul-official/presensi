// ============================================================
// APP.JS - Presensi Guru Mobile (Lengkap)
// ============================================================

// ============================================================
// KONFIGURASI URL API
// Hardcode URL di sini agar tidak perlu copypaste setiap saat.
// URL disimpan juga di localStorage sebagai fallback/override.
// ============================================================
const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbxWQ-Q9TKP7TJs_BZw27HUrcUodMwoXedAq-fGQek_v6A88xx6n4eQeVQ9leDgskYTlDw/exec';
// Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'

const CONFIG = {
  get API_URL() {
    // Prioritas: localStorage (bisa diubah via pengaturan admin) > hardcode
    return localStorage.getItem('presensi_api_url') || HARDCODED_URL;
  },
  set API_URL(val) {
    localStorage.setItem('presensi_api_url', val);
  }
};

// ============================================================
// STATE ADMIN
// ============================================================
let isAdminLoggedIn = false;
let cachedSetting   = {};  // cache setting dari spreadsheet

// ============================================================
// UTILITAS WAKTU INDONESIA
// ============================================================
const WaktuID = {
  HARI:  ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  BULAN: ['Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember'],

  now() { return new Date(); },

  formatTanggal(date) {
    date = date || new Date();
    const d = String(date.getDate()).padStart(2,'0');
    const m = String(date.getMonth()+1).padStart(2,'0');
    const y = date.getFullYear();
    return d + '-' + m + '-' + y;
  },

  formatJam(date) {
    date = date || new Date();
    return String(date.getHours()).padStart(2,'0') + ':' +
           String(date.getMinutes()).padStart(2,'0');
  },

  formatDetik(date) {
    date = date || new Date();
    return String(date.getHours()).padStart(2,'0') + ':' +
           String(date.getMinutes()).padStart(2,'0') + ':' +
           String(date.getSeconds()).padStart(2,'0');
  },

  formatTanggalPanjang(date) {
    date = date || new Date();
    return this.HARI[date.getDay()] + ', ' +
           date.getDate() + ' ' +
           this.BULAN[date.getMonth()] + ' ' +
           date.getFullYear();
  },

  // Konversi YYYY-MM-DD (input[type=date]) ke DD-MM-YYYY
  inputToID(str) {
    if (!str) return '';
    const [y,m,d] = str.split('-');
    return d + '-' + m + '-' + y;
  },

  // Konversi DD-MM-YYYY ke YYYY-MM-DD
  idToInput(str) {
    if (!str) return '';
    const [d,m,y] = str.split('-');
    return y + '-' + m + '-' + d;
  },

  namaBulan(n) { return this.BULAN[n-1] || ''; }
};

// ============================================================
// API HELPER — GET + query string (tidak ada CORS preflight)
// ============================================================
async function apiCall(action, params) {
  params = params || {};
  const url = CONFIG.API_URL;

  if (!url || url === 'GANTI_DENGAN_URL_WEB_APP_ANDA') {
    throw new Error('__NO_URL__');
  }

  const qp = new URLSearchParams(Object.assign({ action: action }, params));
  const fullUrl = url + '?' + qp.toString();

  let res;
  try {
    res = await fetch(fullUrl, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    if (!navigator.onLine) {
      throw new Error('Tidak ada koneksi internet.');
    }
    throw new Error('Tidak dapat terhubung ke server. Pastikan URL Web App sudah benar dan di-deploy dengan akses "Anyone".');
  }

  if (!res.ok) throw new Error('Server error: HTTP ' + res.status);

  let json;
  try {
    const text = await res.text();
    json = JSON.parse(text);
  } catch(e) {
    throw new Error('Respons server tidak valid. Cek URL Web App.');
  }
  return json;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type, duration) {
  type     = type     || 'default';
  duration = duration || 3000;
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success:'✅', error:'❌', warning:'⚠️', default:'ℹ️' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + (icons[type]||icons.default) + '</span><span>' + msg + '</span>';
  container.appendChild(el);
  setTimeout(function() {
    el.classList.add('fadeout');
    setTimeout(function() { el.remove(); }, 300);
  }, duration);
}

// ============================================================
// LOADING SCREEN
// ============================================================
function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (el) setTimeout(function() { el.classList.add('hide'); }, 900);
}

// ============================================================
// JAM REAL-TIME
// ============================================================
function startClock() {
  function tick() {
    const now = WaktuID.now();
    const elJam  = document.getElementById('clock-jam');
    const elTgl  = document.getElementById('clock-tanggal');
    const elHari = document.getElementById('clock-hari');
    if (elJam)  elJam.textContent  = WaktuID.formatDetik(now);
    if (elTgl)  elTgl.textContent  = WaktuID.formatTanggal(now);
    if (elHari) elHari.textContent = WaktuID.formatTanggalPanjang(now);
  }
  tick();
  setInterval(tick, 1000);
}

// ============================================================
// NAVIGASI
// ============================================================
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const nav = document.querySelector('[data-nav="' + pageId + '"]');
  if (nav) nav.classList.add('active');

  if (pageId === 'home')   loadPresensiHariIni();
  if (pageId === 'manual') loadGuruDropdown('select-guru-manual');
  if (pageId === 'pulang') loadGuruDropdown('select-guru-pulang');
}

// ============================================================
// UPDATE HEADER (nama sekolah + logo)
// ============================================================
function updateHeaderInfo(namaSekolah, logoUrl) {
  const titleEl  = document.getElementById('header-title');
  const logoEl   = document.getElementById('header-logo');
  const logoPh   = document.getElementById('header-logo-placeholder');
  const loadLogo = document.getElementById('loading-logo');
  const loadPh   = document.getElementById('loading-logo-placeholder');
  const loadTitle= document.getElementById('loading-title');

  if (titleEl && namaSekolah)  titleEl.textContent  = namaSekolah;
  if (loadTitle && namaSekolah) loadTitle.textContent = namaSekolah;

  if (logoUrl) {
    if (logoEl)   { logoEl.src = logoUrl; logoEl.style.display = 'block'; }
    if (logoPh)   logoPh.style.display = 'none';
    if (loadLogo) { loadLogo.src = logoUrl; loadLogo.style.display = 'block'; }
    if (loadPh)   loadPh.style.display = 'none';
  }
}

// ============================================================
// HALAMAN HOME — DAFTAR KEHADIRAN
// ============================================================
async function loadPresensiHariIni() {
  const container = document.getElementById('guru-list-container');
  const statsEl   = document.getElementById('stats-container');
  if (!container) return;

  if (!CONFIG.API_URL || CONFIG.API_URL === 'GANTI_DENGAN_URL_WEB_APP_ANDA') {
    container.innerHTML = noUrlHtml();
    return;
  }

  container.innerHTML = loadingHtml('Memuat data presensi...');

  try {
    const data = await apiCall('getPresensiHariIni');
    if (!data.success) throw new Error(data.message);

    // Cache setting untuk cetak laporan
    cachedSetting.namaSekolah = data.namaSekolah;
    cachedSetting.logoUrl     = data.logoUrl;
    cachedSetting.namaKepsek  = data.namaKepsek || '';

    updateHeaderInfo(data.namaSekolah, data.logoUrl);

    // Isi field kepsek di modal cetak jika kosong
    const elKepsek = document.getElementById('cetak-nama-kepsek');
    if (elKepsek && !elKepsek.value && data.namaKepsek) {
      elKepsek.value = data.namaKepsek;
    }

    // Statistik
    let hadir=0, terlambat=0, absen=0;
    data.guru.forEach(function(g) {
      if (!g.presensi) { absen++; return; }
      const s = (g.presensi.statusMasuk||'').toUpperCase();
      if (s === 'HADIR')     hadir++;
      else if (s === 'TERLAMBAT') terlambat++;
      else absen++;
    });

    if (statsEl) {
      statsEl.innerHTML =
        statCard('stat-hadir',  hadir,          'Hadir') +
        statCard('stat-telat',  terlambat,       'Terlambat') +
        statCard('stat-absen',  absen,           'Belum/Absen') +
        statCard('stat-total',  data.guru.length,'Total');
    }

    if (!data.guru.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Belum ada data guru.</p></div>';
      return;
    }

    container.innerHTML = '';
    data.guru.forEach(function(g) {
      const pres   = g.presensi;
      const status = pres ? (pres.statusMasuk||'').toUpperCase() : 'BELUM';
      const badgeMap = {
        'HADIR':'badge-hadir','TERLAMBAT':'badge-terlambat',
        'IJIN':'badge-ijin','SAKIT':'badge-sakit',
        'ALPA':'badge-alpa','BELUM':'badge-belum'
      };
      const badgeClass = badgeMap[status] || 'badge-belum';

      const fotoHtml = g.urlFoto
        ? '<img class="guru-foto" src="'+g.urlFoto+'" alt="'+g.nama+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="guru-foto-placeholder" style="display:none">👤</div>'
        : '<div class="guru-foto-placeholder">👤</div>';

      const chipMasuk  = pres && pres.jamMasuk  && pres.jamMasuk  !== '-' ? '<span class="chip chip-masuk">🕐 '+pres.jamMasuk+'</span>'  : '';
      const chipPulang = pres && pres.jamPulang && pres.jamPulang !== '-' ? '<span class="chip chip-pulang">🏠 '+pres.jamPulang+'</span>' : '';

      container.innerHTML +=
        '<div class="guru-card">' +
          fotoHtml +
          '<div class="guru-info">' +
            '<div class="guru-nama">'+g.nama+'</div>' +
            '<div class="guru-detail">ID: '+g.idBarcode+'</div>' +
            '<div class="chip-row">'+chipMasuk+chipPulang+'</div>' +
          '</div>' +
          '<span class="badge '+badgeClass+'">'+status+'</span>' +
        '</div>';
    });

  } catch (err) {
    if (err.message === '__NO_URL__') {
      container.innerHTML = noUrlHtml();
      return;
    }
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">⚠️</div>' +
        '<p style="font-weight:700;color:var(--danger);margin-bottom:8px">Gagal memuat data</p>' +
        '<p style="font-size:.82rem;margin-bottom:16px">'+err.message+'</p>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" onclick="loadPresensiHariIni()">🔄 Coba Lagi</button>' +
          '<button class="btn btn-outline btn-sm" onclick="requireAdmin(openSettingModal)">⚙️ Pengaturan</button>' +
        '</div>' +
      '</div>';
  }
}

function statCard(cls, num, label) {
  return '<div class="stat-card '+cls+'"><div class="stat-num">'+num+'</div><div class="stat-label">'+label+'</div></div>';
}
function loadingHtml(msg) {
  return '<div class="empty-state"><div class="spinner spinner-dark" style="margin:0 auto 12px;"></div><p>'+msg+'</p></div>';
}
function noUrlHtml() {
  return '<div class="empty-state">' +
    '<div class="empty-icon" style="font-size:2.5rem">⚙️</div>' +
    '<p style="font-weight:700;color:var(--text);margin-bottom:8px">URL API belum dikonfigurasi</p>' +
    '<p style="font-size:.82rem;margin-bottom:16px">Login sebagai admin lalu buka Pengaturan API.</p>' +
    '<button class="btn btn-primary" style="width:auto;padding:10px 24px" onclick="requireAdmin(openSettingModal)">⚙️ Buka Pengaturan</button>' +
  '</div>';
}

// ============================================================
// DROPDOWN GURU
// ============================================================
async function loadGuruDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">-- Memuat... --</option>';
  select.disabled = true;
  try {
    const data = await apiCall('getDataGuru');
    if (!data.success) throw new Error(data.message);
    select.innerHTML = '<option value="">-- Pilih Guru --</option>';
    data.data.forEach(function(g) {
      select.innerHTML += '<option value="'+g.idBarcode+'">'+g.nama+'</option>';
    });
    select.disabled = false;
  } catch(e) {
    select.innerHTML = '<option value="">-- Gagal memuat --</option>';
    if (e.message !== '__NO_URL__') showToast(e.message, 'error');
  }
}

// ============================================================
// SCAN BARCODE
// ============================================================
var html5QrCode = null;
var scanMode    = 'masuk';
var isScanning  = false;

function initScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Library scanner belum dimuat', 'error');
    return;
  }
  if (html5QrCode) { startScanner(); return; }
  html5QrCode = new Html5Qrcode('reader');
  startScanner();
}

function startScanner() {
  if (isScanning || !html5QrCode) return;
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    onScanSuccess,
    function() {}
  ).then(function() { isScanning = true; })
   .catch(function(err) { showToast('Kamera: ' + err, 'error'); });
}

function stopScanner() {
  if (!isScanning || !html5QrCode) return;
  html5QrCode.stop().then(function() { isScanning = false; }).catch(function(){});
}

async function onScanSuccess(decodedText) {
  if (!decodedText) return;
  stopScanner();
  const rc = document.getElementById('scan-result-card');
  if (rc) {
    rc.classList.remove('show');
    rc.innerHTML = loadingHtml('Memproses absen...');
    rc.classList.add('show');
  }
  try {
    const action = scanMode === 'masuk' ? 'absenMasuk' : 'absenPulang';
    const data   = await apiCall(action, { idBarcode: decodedText });
    renderScanResult(data, decodedText);
  } catch(e) {
    renderScanResult({ success: false, message: e.message }, decodedText);
  }
}

function renderScanResult(data, idBarcode) {
  const rc = document.getElementById('scan-result-card');
  if (!rc) return;
  const ok   = data.success;
  const icon = ok ? '✅' : '❌';
  const color= ok ? 'var(--success)' : 'var(--danger)';
  const foto = data.urlFoto
    ? '<img class="result-foto" src="'+data.urlFoto+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="result-foto-placeholder" style="display:none">👤</div>'
    : '<div class="result-foto-placeholder">👤</div>';

  rc.innerHTML =
    '<div style="text-align:center;margin-bottom:16px">' +
      '<div style="font-size:2.5rem;margin-bottom:8px">'+icon+'</div>' +
      '<div style="font-size:1rem;font-weight:700;color:'+color+'">'+( data.message||(ok?'Berhasil!':'Gagal!'))+'</div>' +
    '</div>' +
    (data.nama ?
      '<div class="result-guru">'+foto+'<div><div class="result-nama">'+data.nama+'</div><div class="result-info">ID: '+idBarcode+'</div></div></div>' +
      '<div class="result-detail">' +
        '<div class="result-row"><span class="label">Tanggal</span><span class="value">'+(data.tanggal||WaktuID.formatTanggal())+'</span></div>' +
        '<div class="result-row"><span class="label">Jam</span><span class="value">'+(data.jam||WaktuID.formatJam())+'</span></div>' +
        '<div class="result-row"><span class="label">Status</span><span class="value">'+(data.status||'-')+'</span></div>' +
      '</div>'
    : '') +
    '<div style="display:flex;gap:10px">' +
      '<button class="btn btn-outline" style="flex:1" onclick="resetScanner()">📷 Scan Lagi</button>' +
      '<button class="btn btn-primary" style="flex:1" onclick="navigateTo(\'home\')">🏠 Beranda</button>' +
    '</div>';
  rc.classList.add('show');
}

function resetScanner() {
  const rc = document.getElementById('scan-result-card');
  if (rc) rc.classList.remove('show');
  startScanner();
}

function setScanMode(mode) {
  scanMode = mode;
  document.querySelectorAll('.scan-tab').forEach(function(t) { t.classList.remove('active'); });
  const tab = document.querySelector('[data-scan-mode="'+mode+'"]');
  if (tab) tab.classList.add('active');
}

// ============================================================
// ABSEN MANUAL
// ============================================================
var selectedKeterangan = '';

function selectKeterangan(ket) {
  selectedKeterangan = ket;
  document.querySelectorAll('.ket-btn').forEach(function(b) { b.className = 'ket-btn'; });
  const btn = document.querySelector('[data-ket="'+ket+'"]');
  if (btn) btn.classList.add('selected-' + ket.toLowerCase());
}

async function submitAbsenManual() {
  const select = document.getElementById('select-guru-manual');
  const btn    = document.getElementById('btn-submit-manual');
  if (!select) return;
  const idBarcode = select.value;
  if (!idBarcode)          { showToast('Pilih guru terlebih dahulu', 'warning'); return; }
  if (!selectedKeterangan) { showToast('Pilih keterangan (Ijin/Sakit/Alpa)', 'warning'); return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
  try {
    const data = await apiCall('absenManual', { idBarcode: idBarcode, keterangan: selectedKeterangan });
    if (data.success) {
      showToast(data.message, 'success');
      renderHasilAbsen('manual-result', data);
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) { showToast(e.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '💾 Simpan Absen'; }
}

// ============================================================
// ABSEN PULANG MANUAL
// ============================================================
async function submitAbsenPulang() {
  const select = document.getElementById('select-guru-pulang');
  const btn    = document.getElementById('btn-submit-pulang');
  if (!select) return;
  const idBarcode = select.value;
  if (!idBarcode) { showToast('Pilih guru terlebih dahulu', 'warning'); return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
  try {
    const data = await apiCall('absenPulang', { idBarcode: idBarcode });
    if (data.success) {
      showToast(data.message, 'success');
      renderHasilAbsen('pulang-result', data);
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) { showToast(e.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '🏠 Catat Kepulangan'; }
}

function renderHasilAbsen(elId, data) {
  const el = document.getElementById(elId);
  if (!el) return;
  const foto = data.urlFoto
    ? '<img class="result-foto" src="'+data.urlFoto+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="result-foto-placeholder" style="display:none">👤</div>'
    : '<div class="result-foto-placeholder">👤</div>';
  el.innerHTML =
    '<div class="result-guru">'+foto+'<div><div class="result-nama">'+data.nama+'</div><div class="result-info">Status: <strong>'+data.status+'</strong></div></div></div>' +
    '<div class="result-detail">' +
      '<div class="result-row"><span class="label">Tanggal</span><span class="value">'+data.tanggal+'</span></div>' +
      '<div class="result-row"><span class="label">Jam</span><span class="value">'+data.jam+'</span></div>' +
    '</div>';
  el.style.display = 'block';
  el.style.animation = 'slideUp .3s ease';
}

// ============================================================
// LOGIN ADMIN
// ============================================================
function requireAdmin(callback) {
  if (isAdminLoggedIn) { if (callback) callback(); return; }
  // Simpan callback untuk dijalankan setelah login
  window._pendingAdminCallback = callback || null;
  openLoginModal();
}

function handleAdminHeaderClick() {
  if (isAdminLoggedIn) {
    openAdminMenu();
  } else {
    window._pendingAdminCallback = openAdminMenu;
    openLoginModal();
  }
}

function openLoginModal() {
  const m = document.getElementById('modal-login');
  if (!m) return;
  const inp = document.getElementById('input-admin-password');
  if (inp) inp.value = '';
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
  m.classList.add('show');
  setTimeout(function() { if (inp) inp.focus(); }, 300);
}

function closeLoginModal() {
  const m = document.getElementById('modal-login');
  if (m) m.classList.remove('show');
  window._pendingAdminCallback = null;
}

async function submitLogin() {
  const inp = document.getElementById('input-admin-password');
  const btn = document.getElementById('btn-submit-login');
  const err = document.getElementById('login-error');
  if (!inp) return;
  const pw = inp.value.trim();
  if (!pw) { showToast('Masukkan password', 'warning'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memeriksa...';

  try {
    const data = await apiCall('loginAdmin', { password: pw });
    if (data.success) {
      isAdminLoggedIn = true;
      if (err) err.style.display = 'none';
      closeLoginModal();
      updateAdminUI();
      showToast('Login admin berhasil!', 'success');
      if (window._pendingAdminCallback) {
        const cb = window._pendingAdminCallback;
        window._pendingAdminCallback = null;
        setTimeout(cb, 200);
      }
    } else {
      if (err) err.style.display = 'block';
      inp.value = '';
      inp.focus();
    }
  } catch(e) {
    showToast(e.message === '__NO_URL__'
      ? 'URL API belum dikonfigurasi. Edit file app.js dan isi HARDCODED_URL.'
      : e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔑 Masuk';
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  closeAdminMenu();
  updateAdminUI();
  showToast('Berhasil keluar dari mode admin', 'default');
}

function updateAdminUI() {
  const icon    = document.getElementById('admin-header-icon');
  const cetakBar= document.getElementById('cetak-bar');
  if (icon)     icon.textContent    = isAdminLoggedIn ? '👤' : '🔒';
  if (cetakBar) cetakBar.style.display = isAdminLoggedIn ? 'block' : 'none';
}

function togglePasswordVisibility(inputId, btnId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ============================================================
// MENU ADMIN
// ============================================================
function openAdminMenu() {
  const m = document.getElementById('modal-admin-menu');
  if (m) m.classList.add('show');
}
function closeAdminMenu() {
  const m = document.getElementById('modal-admin-menu');
  if (m) m.classList.remove('show');
}

// ============================================================
// PENGATURAN API (hanya admin)
// ============================================================
function openSettingModal() {
  if (!isAdminLoggedIn) { requireAdmin(openSettingModal); return; }
  const m = document.getElementById('modal-setting');
  if (!m) return;
  const inp = document.getElementById('input-api-url');
  if (inp) inp.value = localStorage.getItem('presensi_api_url') || '';
  m.classList.add('show');
}
function closeSettingModal() {
  const m = document.getElementById('modal-setting');
  if (m) m.classList.remove('show');
}
function saveApiUrl() {
  const inp = document.getElementById('input-api-url');
  if (!inp) return;
  const url = inp.value.trim();
  if (!url) { showToast('URL tidak boleh kosong', 'warning'); return; }
  CONFIG.API_URL = url;
  showToast('URL API berhasil disimpan!', 'success');
  closeSettingModal();
  loadPresensiHariIni();
}

// ============================================================
// CETAK LAPORAN
// ============================================================
var currentCetakMode = 'harian';

function openCetakModal(mode) {
  if (!isAdminLoggedIn) { requireAdmin(function() { openCetakModal(mode); }); return; }
  currentCetakMode = mode;

  // Sembunyikan semua form periode
  ['harian','mingguan','bulanan'].forEach(function(m) {
    const el = document.getElementById('cetak-form-' + m);
    if (el) el.style.display = 'none';
  });

  // Tampilkan form yang sesuai
  const formEl = document.getElementById('cetak-form-' + mode);
  if (formEl) formEl.style.display = 'block';

  // Set judul modal
  const titles = { harian:'📅 Laporan Harian', mingguan:'📆 Laporan Mingguan', bulanan:'📋 Laporan Bulanan' };
  const titleEl = document.getElementById('cetak-modal-title');
  if (titleEl) titleEl.textContent = titles[mode] || 'Cetak Laporan';

  // Default tanggal hari ini
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
                   String(today.getMonth()+1).padStart(2,'0') + '-' +
                   String(today.getDate()).padStart(2,'0');

  if (mode === 'harian') {
    const el = document.getElementById('cetak-tgl-harian');
    if (el && !el.value) el.value = todayStr;
  }
  if (mode === 'mingguan') {
    // Senin minggu ini
    const day  = today.getDay() || 7;
    const mon  = new Date(today); mon.setDate(today.getDate() - day + 1);
    const sun  = new Date(mon);   sun.setDate(mon.getDate() + 6);
    const fmt  = function(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
    const dari = document.getElementById('cetak-tgl-dari');
    const smp  = document.getElementById('cetak-tgl-sampai');
    if (dari && !dari.value) dari.value = fmt(mon);
    if (smp  && !smp.value)  smp.value  = fmt(sun);
  }
  if (mode === 'bulanan') {
    const bl = document.getElementById('cetak-bulan');
    const th = document.getElementById('cetak-tahun');
    if (bl && !bl.value) bl.value = today.getMonth() + 1;
    if (th && !th.value) th.value = today.getFullYear();
  }

  // Default tanggal TTD = hari ini
  const ttdTgl = document.getElementById('cetak-tgl-ttd');
  if (ttdTgl && !ttdTgl.value) ttdTgl.value = todayStr;

  // Isi nama kepsek dari cache
  const kepsekEl = document.getElementById('cetak-nama-kepsek');
  if (kepsekEl && !kepsekEl.value && cachedSetting.namaKepsek) {
    kepsekEl.value = cachedSetting.namaKepsek;
  }

  const m = document.getElementById('modal-cetak');
  if (m) m.classList.add('show');
}

function closeCetakModal() {
  const m = document.getElementById('modal-cetak');
  if (m) m.classList.remove('show');
}

async function doCetakLaporan() {
  const btn = document.getElementById('btn-do-cetak');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memuat data...';

  try {
    // Kumpulkan parameter periode
    let params = { tipe: currentCetakMode };

    if (currentCetakMode === 'harian') {
      const tgl = document.getElementById('cetak-tgl-harian').value;
      if (!tgl) { showToast('Pilih tanggal', 'warning'); return; }
      params.tanggal = WaktuID.inputToID(tgl);
    }
    if (currentCetakMode === 'mingguan') {
      const dari = document.getElementById('cetak-tgl-dari').value;
      const smp  = document.getElementById('cetak-tgl-sampai').value;
      if (!dari || !smp) { showToast('Isi rentang tanggal', 'warning'); return; }
      params.dari   = WaktuID.inputToID(dari);
      params.sampai = WaktuID.inputToID(smp);
    }
    if (currentCetakMode === 'bulanan') {
      const bl = document.getElementById('cetak-bulan').value;
      const th = document.getElementById('cetak-tahun').value;
      if (!bl || !th) { showToast('Pilih bulan dan tahun', 'warning'); return; }
      params.bulan = bl;
      params.tahun = th;
    }

    // Ambil data laporan dari API
    const data = await apiCall('getLaporan', params);
    if (!data.success) throw new Error(data.message);

    // Kumpulkan info TTD
    const namaKepsek = document.getElementById('cetak-nama-kepsek').value || '-';
    const tempatTtd  = document.getElementById('cetak-tempat-ttd').value  || '-';
    const tglTtdRaw  = document.getElementById('cetak-tgl-ttd').value;
    const tglTtd     = tglTtdRaw ? WaktuID.inputToID(tglTtdRaw) : WaktuID.formatTanggal();

    closeCetakModal();
    cetakWindow(data, namaKepsek, tempatTtd, tglTtd);

  } catch(e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🖨️ Cetak';
  }
}

// ============================================================
// RENDER HALAMAN CETAK (window.print)
// ============================================================
function cetakWindow(data, namaKepsek, tempatTtd, tglTtd) {
  const namaSekolah = cachedSetting.namaSekolah || 'Sistem Presensi';
  const logoUrl     = cachedSetting.logoUrl     || '';

  // Buat judul periode
  let judulPeriode = '';
  if (data.tipe === 'harian')   judulPeriode = 'Tanggal: ' + data.tanggal;
  if (data.tipe === 'mingguan') judulPeriode = 'Periode: ' + data.dari + ' s/d ' + data.sampai;
  if (data.tipe === 'bulanan')  judulPeriode = 'Bulan: ' + WaktuID.namaBulan(parseInt(data.bulan)) + ' ' + data.tahun;

  // Baris tabel
  let rows = '';
  (data.rows || []).forEach(function(r, i) {
    rows +=
      '<tr>' +
        '<td style="text-align:center">'+(i+1)+'</td>' +
        '<td>'+r.nama+'</td>' +
        '<td style="text-align:center">'+r.tanggal+'</td>' +
        '<td style="text-align:center">'+(r.jamMasuk||'-')+'</td>' +
        '<td style="text-align:center">'+(r.statusMasuk||'-')+'</td>' +
        '<td style="text-align:center">'+(r.jamPulang||'-')+'</td>' +
        '<td style="text-align:center">'+(r.statusPulang||'-')+'</td>' +
        '<td style="text-align:center">'+(r.keterangan||'-')+'</td>' +
      '</tr>';
  });
  if (!rows) rows = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999">Tidak ada data pada periode ini</td></tr>';

  const logoHtml = logoUrl
    ? '<img src="'+logoUrl+'" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #1a73e8" onerror="this.style.display=\'none\'">'
    : '<div style="width:70px;height:70px;border-radius:50%;background:#e8f0fe;display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid #1a73e8">🏫</div>';

  const html =
    '<!DOCTYPE html><html lang="id"><head>' +
    '<meta charset="UTF-8">' +
    '<title>Laporan Presensi - '+namaSekolah+'</title>' +
    '<style>' +
      'body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#202124;margin:0;padding:20px}' +
      '.kop{display:flex;align-items:center;gap:16px;border-bottom:3px solid #1a73e8;padding-bottom:12px;margin-bottom:16px}' +
      '.kop-info h1{font-size:14pt;margin:0 0 2px;color:#1a73e8}' +
      '.kop-info p{margin:0;font-size:9pt;color:#5f6368}' +
      'h2{font-size:12pt;text-align:center;margin:0 0 4px}' +
      '.periode{text-align:center;font-size:9pt;color:#5f6368;margin-bottom:16px}' +
      'table{width:100%;border-collapse:collapse;font-size:9.5pt}' +
      'th{background:#1a73e8;color:#fff;padding:7px 6px;text-align:center;font-weight:600}' +
      'td{padding:6px;border:1px solid #dadce0}' +
      'tr:nth-child(even) td{background:#f8f9fa}' +
      '.ttd-area{display:flex;justify-content:flex-end;margin-top:32px}' +
      '.ttd-box{text-align:center;min-width:200px}' +
      '.ttd-box .ttd-line{border-bottom:1px solid #202124;margin:48px 0 4px;width:180px}' +
      '.ttd-box p{margin:0;font-size:9.5pt}' +
      '.ttd-box .nama{font-weight:700;text-decoration:underline}' +
      '@media print{body{padding:10px}button{display:none}}' +
    '</style></head><body>' +
    '<div class="kop">' +
      logoHtml +
      '<div class="kop-info"><h1>'+namaSekolah+'</h1><p>Laporan Presensi Guru</p></div>' +
    '</div>' +
    '<h2>LAPORAN PRESENSI GURU</h2>' +
    '<div class="periode">'+judulPeriode+'</div>' +
    '<table>' +
      '<thead><tr>' +
        '<th style="width:30px">No</th>' +
        '<th>Nama Guru</th>' +
        '<th style="width:90px">Tanggal</th>' +
        '<th style="width:70px">Jam Masuk</th>' +
        '<th style="width:80px">Status Masuk</th>' +
        '<th style="width:70px">Jam Pulang</th>' +
        '<th style="width:80px">Status Pulang</th>' +
        '<th style="width:70px">Ket.</th>' +
      '</tr></thead>' +
      '<tbody>'+rows+'</tbody>' +
    '</table>' +
    '<div class="ttd-area">' +
      '<div class="ttd-box">' +
        '<p>'+tempatTtd+', '+tglTtd+'</p>' +
        '<p>Kepala Sekolah,</p>' +
        '<div class="ttd-line"></div>' +
        '<p class="nama">'+namaKepsek+'</p>' +
      '</div>' +
    '</div>' +
    '<script>window.onload=function(){window.print();}<\/script>' +
    '</body></html>';

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    showToast('Popup diblokir browser. Izinkan popup untuk mencetak.', 'warning', 5000);
  }
}

// ============================================================
// INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  startClock();
  navigateTo('home');

  // Navigasi bottom bar
  document.querySelectorAll('[data-nav]').forEach(function(el) {
    el.addEventListener('click', function() {
      const target = el.getAttribute('data-nav');
      if (target === 'scan') {
        navigateTo('scan');
        setTimeout(initScanner, 300);
      } else {
        if (isScanning) stopScanner();
        navigateTo(target);
      }
    });
  });

  // Scan mode tabs
  document.querySelectorAll('.scan-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      setScanMode(tab.getAttribute('data-scan-mode'));
    });
  });

  // Keterangan manual
  document.querySelectorAll('.ket-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectKeterangan(btn.getAttribute('data-ket'));
    });
  });

  // Update jam di halaman manual & pulang
  setInterval(function() {
    const now = WaktuID.now();
    const tgl = WaktuID.formatTanggal(now);
    const jam = WaktuID.formatJam(now);
    ['manual-tanggal','pulang-tanggal'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.textContent = tgl;
    });
    ['manual-jam','pulang-jam'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.textContent = jam;
    });
    const cb = document.getElementById('clock-tanggal-banner');
    if (cb) cb.textContent = tgl;
  }, 1000);

  hideLoadingScreen();
});
