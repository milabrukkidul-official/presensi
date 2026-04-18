// ============================================================
// APP.JS - Logika Utama Presensi Mobile
// ============================================================

// ============================================================
// KONFIGURASI - GANTI URL INI SETELAH DEPLOY WEB APP
// ============================================================
const CONFIG = {
  API_URL: localStorage.getItem('presensi_api_url') || '',
  // Contoh: 'https://script.google.com/macros/s/XXXX/exec'
};

// ============================================================
// UTILITAS WAKTU INDONESIA
// ============================================================
const WaktuID = {
  HARI: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  BULAN: ['Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember'],

  now() { return new Date(); },

  formatTanggal(date = new Date()) {
    const d = String(date.getDate()).padStart(2,'0');
    const m = String(date.getMonth()+1).padStart(2,'0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  },

  formatJam(date = new Date()) {
    const h  = String(date.getHours()).padStart(2,'0');
    const mn = String(date.getMinutes()).padStart(2,'0');
    return `${h}:${mn}`;
  },

  formatTanggalPanjang(date = new Date()) {
    const hari  = this.HARI[date.getDay()];
    const tgl   = date.getDate();
    const bulan = this.BULAN[date.getMonth()];
    const tahun = date.getFullYear();
    return `${hari}, ${tgl} ${bulan} ${tahun}`;
  },

  formatDetik(date = new Date()) {
    const h  = String(date.getHours()).padStart(2,'0');
    const mn = String(date.getMinutes()).padStart(2,'0');
    const s  = String(date.getSeconds()).padStart(2,'0');
    return `${h}:${mn}:${s}`;
  }
};

// ============================================================
// API HELPER
// ============================================================
async function apiCall(action, params = {}) {
  const url = CONFIG.API_URL;
  if (!url) throw new Error('URL API belum dikonfigurasi. Buka Pengaturan untuk mengisi URL Web App.');

  const body = JSON.stringify({ action, ...params });
  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success:'✅', error:'❌', warning:'⚠️', default:'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||icons.default}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fadeout');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// LOADING SCREEN
// ============================================================
function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (el) {
    setTimeout(() => el.classList.add('hide'), 800);
  }
}

// ============================================================
// JAM REAL-TIME
// ============================================================
function startClock() {
  const elJam     = document.getElementById('clock-jam');
  const elTanggal = document.getElementById('clock-tanggal');
  const elHari    = document.getElementById('clock-hari');

  function tick() {
    const now = WaktuID.now();
    if (elJam)     elJam.textContent     = WaktuID.formatDetik(now);
    if (elTanggal) elTanggal.textContent = WaktuID.formatTanggal(now);
    if (elHari)    elHari.textContent    = WaktuID.formatTanggalPanjang(now);
  }
  tick();
  setInterval(tick, 1000);
}

// ============================================================
// NAVIGASI HALAMAN
// ============================================================
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const navItem = document.querySelector(`[data-nav="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  // Aksi khusus per halaman
  if (pageId === 'home')   loadPresensiHariIni();
  if (pageId === 'manual') loadDataGuruDropdown();
  if (pageId === 'pulang') loadDataGuruDropdownPulang();
}

// ============================================================
// HALAMAN HOME - DAFTAR KEHADIRAN
// ============================================================
async function loadPresensiHariIni() {
  const container = document.getElementById('guru-list-container');
  const statsEl   = document.getElementById('stats-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="spinner spinner-dark" style="margin:0 auto 12px;"></div>
      <p>Memuat data presensi...</p>
    </div>`;

  try {
    const data = await apiCall('getPresensiHariIni');
    if (!data.success) throw new Error(data.message);

    // Update logo & nama sekolah di header
    updateHeaderInfo(data.namaSekolah, data.logoUrl);

    // Hitung statistik
    let hadir=0, terlambat=0, absen=0, pulang=0;
    data.guru.forEach(g => {
      if (!g.presensi) { absen++; return; }
      const s = (g.presensi.statusMasuk||'').toUpperCase();
      if (s === 'HADIR')     hadir++;
      if (s === 'TERLAMBAT') terlambat++;
      if (['IJIN','SAKIT','ALPA'].includes(s)) absen++;
      if (g.presensi.jamPulang && g.presensi.jamPulang !== '-') pulang++;
    });

    // Render statistik
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card stat-hadir">
          <div class="stat-num">${hadir}</div>
          <div class="stat-label">Hadir</div>
        </div>
        <div class="stat-card stat-telat">
          <div class="stat-num">${terlambat}</div>
          <div class="stat-label">Terlambat</div>
        </div>
        <div class="stat-card stat-absen">
          <div class="stat-num">${absen}</div>
          <div class="stat-label">Belum/Absen</div>
        </div>
        <div class="stat-card stat-total">
          <div class="stat-num">${data.guru.length}</div>
          <div class="stat-label">Total</div>
        </div>`;
    }

    // Render daftar guru
    if (!data.guru.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Belum ada data guru.<br>Tambahkan data di spreadsheet.</p>
        </div>`;
      return;
    }

    container.innerHTML = '';
    data.guru.forEach(g => {
      const pres   = g.presensi;
      const status = pres ? (pres.statusMasuk||'').toUpperCase() : 'BELUM';
      const badgeClass = {
        'HADIR':'badge-hadir','TERLAMBAT':'badge-terlambat',
        'IJIN':'badge-ijin','SAKIT':'badge-sakit',
        'ALPA':'badge-alpa','BELUM':'badge-belum'
      }[status] || 'badge-belum';

      const fotoHtml = g.urlFoto
        ? `<img class="guru-foto" src="${g.urlFoto}" alt="${g.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="guru-foto-placeholder" style="display:none">👤</div>`
        : `<div class="guru-foto-placeholder">👤</div>`;

      const chipMasuk  = pres && pres.jamMasuk  !== '-' ? `<span class="chip chip-masuk">🕐 ${pres.jamMasuk}</span>` : '';
      const chipPulang = pres && pres.jamPulang !== '-' ? `<span class="chip chip-pulang">🏠 ${pres.jamPulang}</span>` : '';

      container.innerHTML += `
        <div class="guru-card">
          ${fotoHtml}
          <div class="guru-info">
            <div class="guru-nama">${g.nama}</div>
            <div class="guru-detail">ID: ${g.idBarcode}</div>
            <div class="chip-row">${chipMasuk}${chipPulang}</div>
          </div>
          <span class="badge ${badgeClass}">${status}</span>
        </div>`;
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>${err.message}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;width:auto;padding:8px 20px" onclick="loadPresensiHariIni()">Coba Lagi</button>
      </div>`;
  }
}

function updateHeaderInfo(namaSekolah, logoUrl) {
  const titleEl = document.getElementById('header-title');
  const logoEl  = document.getElementById('header-logo');
  const logoPhEl= document.getElementById('header-logo-placeholder');

  if (titleEl && namaSekolah) titleEl.textContent = namaSekolah;

  if (logoUrl) {
    if (logoEl) {
      logoEl.src = logoUrl;
      logoEl.style.display = 'block';
    }
    if (logoPhEl) logoPhEl.style.display = 'none';

    // Update loading screen logo juga
    const loadLogo = document.getElementById('loading-logo');
    const loadPh   = document.getElementById('loading-logo-placeholder');
    if (loadLogo) { loadLogo.src = logoUrl; loadLogo.style.display = 'block'; }
    if (loadPh)   loadPh.style.display = 'none';
  }

  // Update nama sekolah di loading screen
  const loadTitle = document.getElementById('loading-title');
  if (loadTitle && namaSekolah) loadTitle.textContent = namaSekolah;
}

// ============================================================
// SCAN BARCODE - HTML5-QRCode
// ============================================================
let html5QrCode = null;
let scanMode    = 'masuk'; // 'masuk' | 'pulang'
let isScanning  = false;

function initScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Library scanner belum dimuat', 'error');
    return;
  }
  if (html5QrCode) return;

  html5QrCode = new Html5Qrcode('reader');
  startScanner();
}

function startScanner() {
  if (isScanning || !html5QrCode) return;

  const config = {
    fps: 10,
    qrbox: { width: 220, height: 220 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    { facingMode: 'environment' },
    config,
    onScanSuccess,
    () => {}
  ).then(() => {
    isScanning = true;
  }).catch(err => {
    showToast('Tidak dapat mengakses kamera: ' + err, 'error');
  });
}

function stopScanner() {
  if (!isScanning || !html5QrCode) return;
  html5QrCode.stop().then(() => { isScanning = false; }).catch(() => {});
}

async function onScanSuccess(decodedText) {
  if (!decodedText) return;
  stopScanner();

  const resultCard = document.getElementById('scan-result-card');
  if (resultCard) {
    resultCard.classList.remove('show');
    resultCard.innerHTML = `
      <div style="text-align:center;padding:20px">
        <div class="spinner spinner-dark" style="margin:0 auto 12px;"></div>
        <p>Memproses absen...</p>
      </div>`;
    resultCard.classList.add('show');
  }

  try {
    const action = scanMode === 'masuk' ? 'absenMasuk' : 'absenPulang';
    const data   = await apiCall(action, { idBarcode: decodedText });

    renderScanResult(data, decodedText);
  } catch (err) {
    renderScanResult({ success: false, message: err.message }, decodedText);
  }
}

function renderScanResult(data, idBarcode) {
  const resultCard = document.getElementById('scan-result-card');
  if (!resultCard) return;

  const isSuccess = data.success;
  const fotoHtml  = data.urlFoto
    ? `<img class="result-foto" src="${data.urlFoto}" alt="${data.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="result-foto-placeholder" style="display:none">👤</div>`
    : `<div class="result-foto-placeholder">👤</div>`;

  const statusColor = isSuccess ? 'var(--success)' : 'var(--danger)';
  const statusIcon  = isSuccess ? '✅' : '❌';

  resultCard.innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:2.5rem;margin-bottom:8px">${statusIcon}</div>
      <div style="font-size:1rem;font-weight:700;color:${statusColor}">${data.message || (isSuccess ? 'Berhasil!' : 'Gagal!')}</div>
    </div>
    ${data.nama ? `
    <div class="result-guru">
      ${fotoHtml}
      <div>
        <div class="result-nama">${data.nama}</div>
        <div class="result-info">ID: ${idBarcode}</div>
      </div>
    </div>
    <div class="result-detail">
      <div class="result-row">
        <span class="label">Tanggal</span>
        <span class="value">${data.tanggal || WaktuID.formatTanggal()}</span>
      </div>
      <div class="result-row">
        <span class="label">Jam</span>
        <span class="value">${data.jam || WaktuID.formatJam()}</span>
      </div>
      <div class="result-row">
        <span class="label">Status</span>
        <span class="value">${data.status || '-'}</span>
      </div>
    </div>` : ''}
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline" style="flex:1" onclick="resetScanner()">
        📷 Scan Lagi
      </button>
      <button class="btn btn-primary" style="flex:1" onclick="navigateTo('home')">
        🏠 Beranda
      </button>
    </div>`;

  resultCard.classList.add('show');
}

function resetScanner() {
  const resultCard = document.getElementById('scan-result-card');
  if (resultCard) resultCard.classList.remove('show');
  startScanner();
}

function setScanMode(mode) {
  scanMode = mode;
  document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-scan-mode="${mode}"]`);
  if (tab) tab.classList.add('active');
}

// ============================================================
// ABSEN MANUAL
// ============================================================
let selectedKeterangan = '';
let dataGuruList       = [];

async function loadDataGuruDropdown() {
  const select = document.getElementById('select-guru-manual');
  if (!select) return;

  select.innerHTML = '<option value="">-- Memuat data guru... --</option>';
  select.disabled  = true;

  try {
    const data = await apiCall('getDataGuru');
    if (!data.success) throw new Error(data.message);

    dataGuruList = data.data;
    select.innerHTML = '<option value="">-- Pilih Guru --</option>';
    data.data.forEach(g => {
      select.innerHTML += `<option value="${g.idBarcode}">${g.nama}</option>`;
    });
    select.disabled = false;
  } catch (err) {
    select.innerHTML = '<option value="">-- Gagal memuat --</option>';
    showToast(err.message, 'error');
  }
}

async function loadDataGuruDropdownPulang() {
  const select = document.getElementById('select-guru-pulang');
  if (!select) return;

  select.innerHTML = '<option value="">-- Memuat data guru... --</option>';
  select.disabled  = true;

  try {
    const data = await apiCall('getDataGuru');
    if (!data.success) throw new Error(data.message);

    select.innerHTML = '<option value="">-- Pilih Guru --</option>';
    data.data.forEach(g => {
      select.innerHTML += `<option value="${g.idBarcode}">${g.nama}</option>`;
    });
    select.disabled = false;
  } catch (err) {
    select.innerHTML = '<option value="">-- Gagal memuat --</option>';
    showToast(err.message, 'error');
  }
}

function selectKeterangan(ket) {
  selectedKeterangan = ket;
  document.querySelectorAll('.ket-btn').forEach(b => {
    b.className = 'ket-btn';
  });
  const btn = document.querySelector(`[data-ket="${ket}"]`);
  if (btn) btn.classList.add(`selected-${ket.toLowerCase()}`);
}

async function submitAbsenManual() {
  const select = document.getElementById('select-guru-manual');
  const btn    = document.getElementById('btn-submit-manual');
  if (!select) return;

  const idBarcode = select.value;
  if (!idBarcode) { showToast('Pilih guru terlebih dahulu', 'warning'); return; }
  if (!selectedKeterangan) { showToast('Pilih keterangan (Ijin/Sakit/Alpa)', 'warning'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

  try {
    const data = await apiCall('absenManual', { idBarcode, keterangan: selectedKeterangan });
    if (data.success) {
      showToast(data.message, 'success');
      renderManualResult(data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Absen';
  }
}

function renderManualResult(data) {
  const resultEl = document.getElementById('manual-result');
  if (!resultEl) return;

  const fotoHtml = data.urlFoto
    ? `<img class="result-foto" src="${data.urlFoto}" alt="${data.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="result-foto-placeholder" style="display:none">👤</div>`
    : `<div class="result-foto-placeholder">👤</div>`;

  resultEl.innerHTML = `
    <div class="result-guru">
      ${fotoHtml}
      <div>
        <div class="result-nama">${data.nama}</div>
        <div class="result-info">Status: <strong>${data.status}</strong></div>
      </div>
    </div>
    <div class="result-detail">
      <div class="result-row">
        <span class="label">Tanggal</span>
        <span class="value">${data.tanggal}</span>
      </div>
      <div class="result-row">
        <span class="label">Jam Dicatat</span>
        <span class="value">${data.jam}</span>
      </div>
    </div>`;
  resultEl.style.display = 'block';
  resultEl.style.animation = 'slideUp .3s ease';
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
    const data = await apiCall('absenPulang', { idBarcode });
    if (data.success) {
      showToast(data.message, 'success');
      renderPulangResult(data);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🏠 Catat Kepulangan';
  }
}

function renderPulangResult(data) {
  const resultEl = document.getElementById('pulang-result');
  if (!resultEl) return;

  const fotoHtml = data.urlFoto
    ? `<img class="result-foto" src="${data.urlFoto}" alt="${data.nama}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="result-foto-placeholder" style="display:none">👤</div>`
    : `<div class="result-foto-placeholder">👤</div>`;

  resultEl.innerHTML = `
    <div class="result-guru">
      ${fotoHtml}
      <div>
        <div class="result-nama">${data.nama}</div>
        <div class="result-info">Status: <strong>${data.status}</strong></div>
      </div>
    </div>
    <div class="result-detail">
      <div class="result-row">
        <span class="label">Tanggal</span>
        <span class="value">${data.tanggal}</span>
      </div>
      <div class="result-row">
        <span class="label">Jam Pulang</span>
        <span class="value">${data.jam}</span>
      </div>
    </div>`;
  resultEl.style.display = 'block';
  resultEl.style.animation = 'slideUp .3s ease';
}

// ============================================================
// MODAL PENGATURAN API
// ============================================================
function openSettingModal() {
  const modal = document.getElementById('modal-setting');
  if (!modal) return;
  const input = document.getElementById('input-api-url');
  if (input) input.value = CONFIG.API_URL;
  modal.classList.add('show');
}

function closeSettingModal() {
  const modal = document.getElementById('modal-setting');
  if (modal) modal.classList.remove('show');
}

function saveApiUrl() {
  const input = document.getElementById('input-api-url');
  if (!input) return;
  const url = input.value.trim();
  if (!url) { showToast('URL tidak boleh kosong', 'warning'); return; }
  CONFIG.API_URL = url;
  localStorage.setItem('presensi_api_url', url);
  showToast('URL API berhasil disimpan!', 'success');
  closeSettingModal();
  loadPresensiHariIni();
}

// ============================================================
// INISIALISASI APLIKASI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Mulai jam
  startClock();

  // Navigasi default
  navigateTo('home');

  // Event listener navigasi
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
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
  document.querySelectorAll('.scan-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setScanMode(tab.getAttribute('data-scan-mode'));
    });
  });

  // Keterangan manual
  document.querySelectorAll('.ket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectKeterangan(btn.getAttribute('data-ket'));
    });
  });

  // Sembunyikan loading setelah data dimuat
  hideLoadingScreen();
});
