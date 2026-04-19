// ============================================================
// APP.JS — Presensi Guru Mobile
// ============================================================

// ============================================================
// KONFIGURASI — isi HARDCODED_URL setelah deploy GAS
// ============================================================
const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbxWQ-Q9TKP7TJs_BZw27HUrcUodMwoXedAq-fGQek_v6A88xx6n4eQeVQ9leDgskYTlDw/exec';

const CONFIG = {
  get API_URL() { return localStorage.getItem('presensi_api_url') || HARDCODED_URL; },
  set API_URL(v) { localStorage.setItem('presensi_api_url', v); }
};

// ============================================================
// STATE
// sessionStorage: bertahan selama tab terbuka, hilang saat tab ditutup
// ============================================================
let isAdminLoggedIn  = sessionStorage.getItem('admin_logged_in') === '1';
let cachedSetting    = {};
let currentLaporanMode = 'harian';   // harian | mingguan | bulanan
let currentStatTab   = 'global';     // global | individu
let lastLaporanData  = null;         // untuk cetak ulang

// ============================================================
// WAKTU INDONESIA
// ============================================================
const WaktuID = {
  HARI:  ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  BULAN: ['Januari','Februari','Maret','April','Mei','Juni',
          'Juli','Agustus','September','Oktober','November','Desember'],
  now() { return new Date(); },
  formatTanggal(d) {
    d = d||new Date();
    return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
  },
  formatJam(d) {
    d=d||new Date();
    return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  },
  formatDetik(d) {
    d=d||new Date();
    return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
  },
  formatTanggalPanjang(d) {
    d=d||new Date();
    return this.HARI[d.getDay()]+', '+d.getDate()+' '+this.BULAN[d.getMonth()]+' '+d.getFullYear();
  },
  inputToID(s) { if(!s)return''; const[y,m,dd]=s.split('-'); return dd+'-'+m+'-'+y; },
  idToInput(s) { if(!s)return''; const[dd,m,y]=s.split('-'); return y+'-'+m+'-'+dd; },
  namaBulan(n) { return this.BULAN[(n-1)]||''; }
};

// ============================================================
// API HELPER
// ============================================================
async function apiCall(action, params) {
  params = params||{};
  const url = CONFIG.API_URL;
  if (!url || url==='GANTI_DENGAN_URL_WEB_APP_ANDA') throw new Error('__NO_URL__');
  const qp = new URLSearchParams(Object.assign({action:action,_t:Date.now()},params));
  let res;
  try { res = await fetch(url+'?'+qp.toString(),{method:'GET',redirect:'follow'}); }
  catch(e) {
    if(!navigator.onLine) throw new Error('Tidak ada koneksi internet.');
    throw new Error('Tidak dapat terhubung ke server. Pastikan URL Web App sudah benar.');
  }
  if(!res.ok) throw new Error('Server error: HTTP '+res.status);
  try { return JSON.parse(await res.text()); }
  catch(e) { throw new Error('Respons server tidak valid. Cek URL Web App.'); }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg,type,dur) {
  type=type||'default'; dur=dur||3000;
  const c=document.getElementById('toast-container'); if(!c)return;
  const icons={success:'✅',error:'❌',warning:'⚠️',default:'ℹ️'};
  const el=document.createElement('div');
  el.className='toast '+type;
  el.innerHTML='<span>'+(icons[type]||icons.default)+'</span><span>'+msg+'</span>';
  c.appendChild(el);
  setTimeout(function(){el.classList.add('fadeout');setTimeout(function(){el.remove();},300);},dur);
}

// ============================================================
// LOADING SCREEN
// ============================================================
function hideLoadingScreen() {
  const el=document.getElementById('loading-screen');
  if(el) setTimeout(function(){el.classList.add('hide');},900);
}

// ============================================================
// JAM REAL-TIME
// ============================================================
function startClock() {
  function tick() {
    const now=WaktuID.now();
    const ej=document.getElementById('clock-jam');
    const et=document.getElementById('clock-tanggal');
    const eh=document.getElementById('clock-hari');
    if(ej) ej.textContent=WaktuID.formatDetik(now);
    if(et) et.textContent=WaktuID.formatTanggal(now);
    if(eh) eh.textContent=WaktuID.formatTanggalPanjang(now);
    // update jam di halaman manual & pulang
    ['manual-tanggal','pulang-tanggal'].forEach(function(id){
      const e=document.getElementById(id); if(e) e.textContent=WaktuID.formatTanggal(now);
    });
    ['manual-jam','pulang-jam'].forEach(function(id){
      const e=document.getElementById(id); if(e) e.textContent=WaktuID.formatJam(now);
    });
    const cb=document.getElementById('clock-tanggal-banner');
    if(cb) cb.textContent=WaktuID.formatTanggal(now);
  }
  tick(); setInterval(tick,1000);
}

// ============================================================
// NAVIGASI
// ============================================================
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  // update active state di kedua nav
  document.querySelectorAll('[data-nav]').forEach(function(n){n.classList.remove('active');});

  const page=document.getElementById('page-'+pageId);
  if(page) page.classList.add('active');

  document.querySelectorAll('[data-nav="'+pageId+'"]').forEach(function(n){n.classList.add('active');});

  if(pageId==='home')      loadPresensiHariIni();
  if(pageId==='manual')    loadGuruDropdown('select-guru-manual');
  if(pageId==='pulang')    loadGuruDropdown('select-guru-pulang');
  if(pageId==='laporan')   initLaporanPage();
  if(pageId==='statistik') initStatistikPage();
}

// ============================================================
// UPDATE HEADER
// ============================================================
function updateHeaderInfo(namaSekolah, logoUrl) {
  const te=document.getElementById('header-title');
  const le=document.getElementById('header-logo');
  const lp=document.getElementById('header-logo-placeholder');
  const ll=document.getElementById('loading-logo');
  const lph=document.getElementById('loading-logo-placeholder');
  const lt=document.getElementById('loading-title');
  if(te&&namaSekolah) te.textContent=namaSekolah;
  if(lt&&namaSekolah) lt.textContent=namaSekolah;
  if(logoUrl){
    if(le){le.src=logoUrl;le.style.display='block';}
    if(lp) lp.style.display='none';
    if(ll){ll.src=logoUrl;ll.style.display='block';}
    if(lph) lph.style.display='none';
  }
}

// ============================================================
// HALAMAN HOME
// ============================================================
async function loadPresensiHariIni() {
  const container=document.getElementById('guru-list-container');
  const statsEl=document.getElementById('stats-container');
  if(!container) return;
  if(!CONFIG.API_URL||CONFIG.API_URL==='GANTI_DENGAN_URL_WEB_APP_ANDA'){
    container.innerHTML=noUrlHtml(); return;
  }
  container.innerHTML=loadingHtml('Memuat data presensi...');
  try {
    const data=await apiCall('getPresensiHariIni');
    if(!data.success) throw new Error(data.message);
    cachedSetting.namaSekolah=data.namaSekolah;
    cachedSetting.logoUrl=data.logoUrl;
    cachedSetting.namaKepsek=data.namaKepsek||'';
    updateHeaderInfo(data.namaSekolah,data.logoUrl);
    const elK=document.getElementById('cetak-nama-kepsek');
    if(elK&&!elK.value&&data.namaKepsek) elK.value=data.namaKepsek;

    let hadir=0,terlambat=0,absen=0;
    data.guru.forEach(function(g){
      if(!g.presensi){absen++;return;}
      const s=(g.presensi.statusMasuk||'').toUpperCase();
      if(s==='HADIR') hadir++;
      else if(s==='TERLAMBAT') terlambat++;
      else absen++;
    });
    if(statsEl){
      statsEl.innerHTML=
        statCard('stat-hadir',hadir,'Hadir')+
        statCard('stat-telat',terlambat,'Terlambat')+
        statCard('stat-absen',absen,'Belum/Absen')+
        statCard('stat-total',data.guru.length,'Total');
    }
    if(!data.guru.length){
      container.innerHTML='<div class="empty-state"><div class="empty-icon">👥</div><p>Belum ada data guru.</p></div>';
      return;
    }
    container.innerHTML='';
    data.guru.forEach(function(g){
      const pres=g.presensi;
      const status=pres?(pres.statusMasuk||'').toUpperCase():'BELUM';
      const bm={'HADIR':'badge-hadir','TERLAMBAT':'badge-terlambat','IJIN':'badge-ijin','SAKIT':'badge-sakit','ALPA':'badge-alpa','BELUM':'badge-belum'};
      const bc=bm[status]||'badge-belum';
      const foto=g.urlFoto
        ?'<img class="guru-foto" src="'+g.urlFoto+'" alt="'+g.nama+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="guru-foto-placeholder" style="display:none">👤</div>'
        :'<div class="guru-foto-placeholder">👤</div>';
      const chipM=pres&&pres.jamMasuk&&pres.jamMasuk!=='-'?'<span class="chip chip-masuk">🕐 '+pres.jamMasuk+'</span>':'';
      const sp=pres?(pres.statusPulang||'').toUpperCase():'';
      const cpc=sp==='MENDAHULUI'?'chip chip-mendahului':'chip chip-pulang';
      const chipP=pres&&pres.jamPulang&&pres.jamPulang!=='-'
        ?'<span class="'+cpc+'">🏠 '+pres.jamPulang+(sp==='MENDAHULUI'?' ⚠️':'')+'</span>':'';
      container.innerHTML+=
        '<div class="guru-card">'+foto+
        '<div class="guru-info"><div class="guru-nama">'+g.nama+'</div>'+
        '<div class="guru-detail">ID: '+g.idBarcode+'</div>'+
        '<div class="chip-row">'+chipM+chipP+'</div></div>'+
        '<span class="badge '+bc+'">'+status+'</span></div>';
    });
  } catch(err) {
    if(err.message==='__NO_URL__'){container.innerHTML=noUrlHtml();return;}
    container.innerHTML=
      '<div class="empty-state"><div class="empty-icon">⚠️</div>'+
      '<p style="font-weight:700;color:var(--danger);margin-bottom:8px">Gagal memuat data</p>'+
      '<p style="font-size:.82rem;margin-bottom:16px">'+err.message+'</p>'+
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
      '<button class="btn btn-primary btn-sm" onclick="loadPresensiHariIni()">🔄 Coba Lagi</button>'+
      '<button class="btn btn-outline btn-sm" onclick="requireAdmin(openSettingModal)">⚙️ Pengaturan</button>'+
      '</div></div>';
  }
}

function statCard(cls,num,label){
  return '<div class="stat-card '+cls+'"><div class="stat-num">'+num+'</div><div class="stat-label">'+label+'</div></div>';
}
function loadingHtml(msg){
  return '<div class="empty-state"><div class="spinner spinner-dark" style="margin:0 auto 12px;"></div><p>'+msg+'</p></div>';
}
function noUrlHtml(){
  return '<div class="empty-state"><div class="empty-icon" style="font-size:2.5rem">⚙️</div>'+
    '<p style="font-weight:700;color:var(--text);margin-bottom:8px">URL API belum dikonfigurasi</p>'+
    '<p style="font-size:.82rem;margin-bottom:16px">Login sebagai admin lalu buka Pengaturan API.</p>'+
    '<button class="btn btn-primary" style="width:auto;padding:10px 24px" onclick="requireAdmin(openSettingModal)">⚙️ Buka Pengaturan</button></div>';
}

// ============================================================
// DROPDOWN GURU
// ============================================================
async function loadGuruDropdown(selectId) {
  const sel=document.getElementById(selectId); if(!sel)return;
  sel.innerHTML='<option value="">-- Memuat... --</option>'; sel.disabled=true;
  const isPulang=(selectId==='select-guru-pulang');
  const action=isPulang?'getDataGuruHadir':'getDataGuru';
  try {
    const data=await apiCall(action);
    if(!data.success) throw new Error(data.message);
    if(!data.data.length){
      sel.innerHTML='<option value="">'+(isPulang?'-- Belum ada guru yang perlu absen pulang --':'-- Semua guru sudah absen --')+'</option>';
      return;
    }
    sel.innerHTML='<option value="">-- Pilih Guru --</option>';
    data.data.forEach(function(g){sel.innerHTML+='<option value="'+g.idBarcode+'">'+g.nama+'</option>';});
    sel.disabled=false;
  } catch(e) {
    sel.innerHTML='<option value="">-- Gagal memuat --</option>';
    if(e.message!=='__NO_URL__') showToast(e.message,'error');
  }
}

// ============================================================
// SCAN BARCODE (halaman scan utama)
// ============================================================
var html5QrCode=null, scanMode='masuk', isScanning=false;

function initScanner() {
  if(typeof Html5Qrcode==='undefined'){showToast('Library scanner belum dimuat','error');return;}
  if(html5QrCode){startScanner();return;}
  html5QrCode=new Html5Qrcode('reader');
  startScanner();
}
function startScanner() {
  if(isScanning||!html5QrCode)return;
  html5QrCode.start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},onScanSuccess,function(){})
    .then(function(){isScanning=true;})
    .catch(function(e){showToast('Kamera: '+e,'error');});
}
function stopScanner() {
  if(!isScanning||!html5QrCode)return;
  html5QrCode.stop().then(function(){isScanning=false;}).catch(function(){});
}
function closeScanPage() {
  stopScanner();
  // Kembali ke home jika admin, atau ke beranda
  navigateTo('home');
}
async function onScanSuccess(decodedText) {
  if(!decodedText)return;
  stopScanner();
  const rc=document.getElementById('scan-result-card');
  if(rc){rc.classList.remove('show');rc.innerHTML=loadingHtml('Memproses absen...');rc.classList.add('show');}
  try {
    const action=scanMode==='masuk'?'absenMasuk':'absenPulang';
    const data=await apiCall(action,{idBarcode:decodedText});
    renderScanResult(data,decodedText);
  } catch(e){renderScanResult({success:false,message:e.message},decodedText);}
}
function renderScanResult(data,idBarcode) {
  const rc=document.getElementById('scan-result-card'); if(!rc)return;
  const ok=data.success, icon=ok?'✅':'❌', color=ok?'var(--success)':'var(--danger)';
  const foto=data.urlFoto
    ?'<img class="result-foto" src="'+data.urlFoto+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="result-foto-placeholder" style="display:none">👤</div>'
    :'<div class="result-foto-placeholder">👤</div>';
  rc.innerHTML=
    '<div style="text-align:center;margin-bottom:16px"><div style="font-size:2.5rem;margin-bottom:8px">'+icon+'</div>'+
    '<div style="font-size:1rem;font-weight:700;color:'+color+'">'+(data.message||(ok?'Berhasil!':'Gagal!'))+'</div></div>'+
    (data.nama?
      '<div class="result-guru">'+foto+'<div><div class="result-nama">'+data.nama+'</div><div class="result-info">ID: '+idBarcode+'</div></div></div>'+
      '<div class="result-detail">'+
        '<div class="result-row"><span class="label">Tanggal</span><span class="value">'+(data.tanggal||WaktuID.formatTanggal())+'</span></div>'+
        '<div class="result-row"><span class="label">Jam</span><span class="value">'+(data.jam||WaktuID.formatJam())+'</span></div>'+
        '<div class="result-row"><span class="label">Status</span><span class="value">'+(data.status||'-')+'</span></div>'+
      '</div>':'')+
    '<div style="display:flex;gap:10px">'+
      '<button class="btn btn-outline" style="flex:1" onclick="resetScanner()">📷 Scan Lagi</button>'+
      '<button class="btn btn-primary" style="flex:1" onclick="navigateTo(\'home\')">🏠 Beranda</button>'+
    '</div>';
  rc.classList.add('show');
}
function resetScanner(){
  const rc=document.getElementById('scan-result-card'); if(rc)rc.classList.remove('show');
  startScanner();
}
function setScanMode(mode){
  scanMode=mode;
  document.querySelectorAll('.scan-tab').forEach(function(t){t.classList.remove('active');});
  const tab=document.querySelector('[data-scan-mode="'+mode+'"]'); if(tab)tab.classList.add('active');
}

// ============================================================
// SCAN BARCODE PULANG (di halaman pulang)
// ============================================================
var html5QrCodePulang=null, isScanningPulang=false;

function initScannerPulang(){
  if(typeof Html5Qrcode==='undefined'){showToast('Library scanner belum dimuat','error');return;}
  const re=document.getElementById('reader-pulang'); if(!re)return;
  if(html5QrCodePulang){startScannerPulang();return;}
  html5QrCodePulang=new Html5Qrcode('reader-pulang');
  startScannerPulang();
}
function startScannerPulang(){
  if(isScanningPulang||!html5QrCodePulang)return;
  html5QrCodePulang.start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},onScanPulangSuccess,function(){})
    .then(function(){isScanningPulang=true;}).catch(function(e){showToast('Kamera: '+e,'error');});
}
function stopScannerPulang(){
  if(!isScanningPulang||!html5QrCodePulang)return;
  html5QrCodePulang.stop().then(function(){isScanningPulang=false;}).catch(function(){});
}
async function onScanPulangSuccess(decodedText){
  if(!decodedText)return; stopScannerPulang();
  const rc=document.getElementById('pulang-scan-result');
  if(rc){rc.classList.remove('show');rc.innerHTML=loadingHtml('Memproses...');rc.classList.add('show');}
  try {
    const data=await apiCall('absenPulang',{idBarcode:decodedText});
    renderScanPulangResult(data,decodedText);
    if(data.success) loadGuruDropdown('select-guru-pulang');
  } catch(e){renderScanPulangResult({success:false,message:e.message},decodedText);}
}
function renderScanPulangResult(data,idBarcode){
  const rc=document.getElementById('pulang-scan-result'); if(!rc)return;
  const ok=data.success,icon=ok?'✅':'❌',color=ok?'var(--success)':'var(--danger)';
  const foto=data.urlFoto
    ?'<img class="result-foto" src="'+data.urlFoto+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="result-foto-placeholder" style="display:none">👤</div>'
    :'<div class="result-foto-placeholder">👤</div>';
  rc.innerHTML=
    '<div style="text-align:center;margin-bottom:16px"><div style="font-size:2.5rem;margin-bottom:8px">'+icon+'</div>'+
    '<div style="font-size:1rem;font-weight:700;color:'+color+'">'+(data.message||(ok?'Berhasil!':'Gagal!'))+'</div></div>'+
    (data.nama?
      '<div class="result-guru">'+foto+'<div><div class="result-nama">'+data.nama+'</div><div class="result-info">ID: '+idBarcode+'</div></div></div>'+
      '<div class="result-detail">'+
        '<div class="result-row"><span class="label">Tanggal</span><span class="value">'+(data.tanggal||WaktuID.formatTanggal())+'</span></div>'+
        '<div class="result-row"><span class="label">Jam Pulang</span><span class="value">'+(data.jam||WaktuID.formatJam())+'</span></div>'+
        '<div class="result-row"><span class="label">Status</span><span class="value">'+(data.status||'-')+'</span></div>'+
      '</div>':'')+
    '<div style="display:flex;gap:10px">'+
      '<button class="btn btn-outline" style="flex:1" onclick="resetScannerPulang()">📷 Scan Lagi</button>'+
      '<button class="btn btn-primary" style="flex:1" onclick="navigateTo(\'home\')">🏠 Beranda</button>'+
    '</div>';
  rc.classList.add('show');
}
function resetScannerPulang(){
  const rc=document.getElementById('pulang-scan-result'); if(rc)rc.classList.remove('show');
  startScannerPulang();
}
function toggleScanPulang(){
  const sa=document.getElementById('pulang-scan-area');
  const btn=document.getElementById('btn-toggle-scan-pulang');
  if(!sa)return;
  const hidden=sa.style.display==='none'||sa.style.display==='';
  if(hidden){
    sa.style.display='block';
    if(btn)btn.innerHTML='⛔ Tutup Scanner';
    setTimeout(initScannerPulang,300);
  } else {
    sa.style.display='none';
    if(btn)btn.innerHTML='📷 Scan Barcode Pulang';
    stopScannerPulang();
    const rc=document.getElementById('pulang-scan-result'); if(rc)rc.classList.remove('show');
  }
}

// ============================================================
// ABSEN MANUAL & PULANG
// ============================================================
var selectedKeterangan='';

function selectKeterangan(ket){
  selectedKeterangan=ket;
  document.querySelectorAll('.ket-btn').forEach(function(b){b.className='ket-btn';});
  const btn=document.querySelector('[data-ket="'+ket+'"]');
  if(btn)btn.classList.add('selected-'+ket.toLowerCase());
}
async function submitAbsenManual(){
  const sel=document.getElementById('select-guru-manual');
  const btn=document.getElementById('btn-submit-manual');
  if(!sel)return;
  const id=sel.value;
  if(!id){showToast('Pilih guru terlebih dahulu','warning');return;}
  if(!selectedKeterangan){showToast('Pilih keterangan (Ijin/Sakit/Alpa)','warning');return;}
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Menyimpan...';
  try {
    const data=await apiCall('absenManual',{idBarcode:id,keterangan:selectedKeterangan});
    if(data.success){
      showToast(data.message,'success');
      renderHasilAbsen('manual-result',data);
      loadGuruDropdown('select-guru-manual');
      sel.value=''; selectedKeterangan='';
      document.querySelectorAll('.ket-btn').forEach(function(b){b.className='ket-btn';});
    } else showToast(data.message,'error');
  } catch(e){showToast(e.message,'error');}
  finally{btn.disabled=false;btn.innerHTML='💾 Simpan Absen';}
}
async function submitAbsenPulang(){
  const sel=document.getElementById('select-guru-pulang');
  const btn=document.getElementById('btn-submit-pulang');
  if(!sel)return;
  const id=sel.value;
  if(!id){showToast('Pilih guru terlebih dahulu','warning');return;}
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Menyimpan...';
  try {
    const data=await apiCall('absenPulang',{idBarcode:id});
    if(data.success){
      showToast(data.message,'success');
      renderHasilAbsen('pulang-result',data);
      loadGuruDropdown('select-guru-pulang');
      sel.value='';
    } else showToast(data.message,'error');
  } catch(e){showToast(e.message,'error');}
  finally{btn.disabled=false;btn.innerHTML='🏠 Catat Kepulangan';}
}
function renderHasilAbsen(elId,data){
  const el=document.getElementById(elId); if(!el)return;
  const foto=data.urlFoto
    ?'<img class="result-foto" src="'+data.urlFoto+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="result-foto-placeholder" style="display:none">👤</div>'
    :'<div class="result-foto-placeholder">👤</div>';
  el.innerHTML=
    '<div class="result-guru">'+foto+'<div><div class="result-nama">'+data.nama+'</div>'+
    '<div class="result-info">Status: <strong>'+data.status+'</strong></div></div></div>'+
    '<div class="result-detail">'+
      '<div class="result-row"><span class="label">Tanggal</span><span class="value">'+data.tanggal+'</span></div>'+
      '<div class="result-row"><span class="label">Jam</span><span class="value">'+data.jam+'</span></div>'+
    '</div>';
  el.style.display='block'; el.style.animation='slideUp .3s ease';
}

// ============================================================
// HALAMAN LAPORAN
// ============================================================
function initLaporanPage(){
  const now=new Date();
  const todayStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const el=document.getElementById('laporan-tgl-harian');
  if(el&&!el.value) el.value=todayStr;
  const bt=document.getElementById('laporan-tahun');
  if(bt&&!bt.value) bt.value=now.getFullYear();
  const bb=document.getElementById('laporan-bulan');
  if(bb&&!bb.value) bb.value=now.getMonth()+1;
  // Tombol cetak hanya untuk admin
  const cb=document.getElementById('laporan-cetak-bar');
  if(cb) cb.style.display=isAdminLoggedIn?'block':'none';
}

function switchLaporanTab(mode){
  currentLaporanMode=mode;
  document.querySelectorAll('[data-laporan-tab]').forEach(function(t){t.classList.remove('active');});
  const tab=document.querySelector('[data-laporan-tab="'+mode+'"]'); if(tab)tab.classList.add('active');
  ['harian','mingguan','bulanan'].forEach(function(m){
    const el=document.getElementById('laporan-filter-'+m);
    if(el) el.style.display=m===mode?'block':'none';
  });
  document.getElementById('laporan-result-container').innerHTML='';
  lastLaporanData=null;
}

async function loadLaporan(mode){
  const container=document.getElementById('laporan-result-container');
  container.innerHTML=loadingHtml('Memuat laporan...');
  let params={tipe:mode};
  if(mode==='harian'){
    const tgl=document.getElementById('laporan-tgl-harian').value;
    if(!tgl){showToast('Pilih tanggal','warning');container.innerHTML='';return;}
    params.tanggal=WaktuID.inputToID(tgl);
  }
  if(mode==='mingguan'){
    const dari=document.getElementById('laporan-tgl-dari').value;
    const smp=document.getElementById('laporan-tgl-sampai').value;
    if(!dari||!smp){showToast('Isi rentang tanggal','warning');container.innerHTML='';return;}
    params.dari=WaktuID.inputToID(dari); params.sampai=WaktuID.inputToID(smp);
  }
  if(mode==='bulanan'){
    const bl=document.getElementById('laporan-bulan').value;
    const th=document.getElementById('laporan-tahun').value;
    if(!bl||!th){showToast('Pilih bulan dan tahun','warning');container.innerHTML='';return;}
    params.bulan=bl; params.tahun=th;
  }
  try {
    const data=await apiCall('getLaporan',params);
    if(!data.success) throw new Error(data.message);
    lastLaporanData=data;
    renderLaporanTable(data,container);
    const cb=document.getElementById('laporan-cetak-bar');
    if(cb) cb.style.display=isAdminLoggedIn&&data.rows&&data.rows.length?'block':'none';
  } catch(e){
    container.innerHTML='<div class="empty-state"><div class="empty-icon">⚠️</div><p>'+e.message+'</p></div>';
  }
}

function renderLaporanTable(data,container){
  if(!data.rows||!data.rows.length){
    container.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div><p>Tidak ada data pada periode ini.</p></div>';
    return;
  }
  let judulPeriode='';
  if(data.tipe==='harian')   judulPeriode='Tanggal: '+data.tanggal;
  if(data.tipe==='mingguan') judulPeriode='Periode: '+data.dari+' s/d '+data.sampai;
  if(data.tipe==='bulanan')  judulPeriode='Bulan: '+WaktuID.namaBulan(parseInt(data.bulan))+' '+data.tahun;

  const statusColor={'HADIR':'#137333','TERLAMBAT':'#b06000','IJIN':'#1a73e8','SAKIT':'#c5221f','ALPA':'#5f6368','PULANG':'#137333','MENDAHULUI':'#b03228'};

  let rows='';
  data.rows.forEach(function(r,i){
    const sc=statusColor[r.statusMasuk]||'#5f6368';
    const spc=statusColor[r.statusPulang]||'#5f6368';
    rows+='<tr>'+
      '<td style="text-align:center;color:var(--text-muted);font-size:.75rem">'+(i+1)+'</td>'+
      '<td><div style="font-weight:600;font-size:.85rem">'+r.nama+'</div><div style="font-size:.72rem;color:var(--text-muted)">'+r.tanggal+'</div></td>'+
      '<td style="text-align:center"><span style="font-size:.78rem;font-weight:700;color:'+sc+'">'+r.statusMasuk+'</span><div style="font-size:.72rem;color:var(--text-muted)">'+(r.jamMasuk!=='-'?r.jamMasuk:'')+'</div></td>'+
      '<td style="text-align:center"><span style="font-size:.78rem;font-weight:700;color:'+spc+'">'+r.statusPulang+'</span><div style="font-size:.72rem;color:var(--text-muted)">'+(r.jamPulang!=='-'?r.jamPulang:'')+'</div></td>'+
      '<td style="text-align:center;font-size:.75rem;color:var(--text-muted)">'+r.keterangan+'</td>'+
    '</tr>';
  });

  container.innerHTML=
    '<div class="laporan-info-bar">'+judulPeriode+' &bull; '+data.rows.length+' data</div>'+
    '<div class="laporan-table-wrap">'+
    '<table class="laporan-table">'+
      '<thead><tr><th>#</th><th>Nama / Tanggal</th><th>Masuk</th><th>Pulang</th><th>Ket.</th></tr></thead>'+
      '<tbody>'+rows+'</tbody>'+
    '</table></div>';
}

function cetakLaporanDariHalaman(){
  if(!isAdminLoggedIn){requireAdmin(cetakLaporanDariHalaman);return;}
  if(!lastLaporanData){showToast('Tampilkan laporan terlebih dahulu','warning');return;}
  openCetakModal();
}

// ============================================================
// MODAL CETAK
// ============================================================
function openCetakModal(){
  if(!isAdminLoggedIn){requireAdmin(openCetakModal);return;}
  const m=document.getElementById('modal-cetak'); if(!m)return;
  const now=new Date();
  const todayStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const ttd=document.getElementById('cetak-tgl-ttd'); if(ttd&&!ttd.value) ttd.value=todayStr;
  const kepsek=document.getElementById('cetak-nama-kepsek');
  if(kepsek&&!kepsek.value&&cachedSetting.namaKepsek) kepsek.value=cachedSetting.namaKepsek;
  m.classList.add('show');
}
function closeCetakModal(){
  const m=document.getElementById('modal-cetak'); if(m)m.classList.remove('show');
}
async function doCetakLaporan(){
  if(!lastLaporanData){showToast('Tidak ada data laporan','warning');return;}
  const btn=document.getElementById('btn-do-cetak');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Menyiapkan...';
  const namaKepsek=document.getElementById('cetak-nama-kepsek').value||'-';
  const tempatTtd=document.getElementById('cetak-tempat-ttd').value||'-';
  const tglTtdRaw=document.getElementById('cetak-tgl-ttd').value;
  const tglTtd=tglTtdRaw?WaktuID.inputToID(tglTtdRaw):WaktuID.formatTanggal();
  closeCetakModal();
  cetakWindow(lastLaporanData,namaKepsek,tempatTtd,tglTtd);
  btn.disabled=false; btn.innerHTML='🖨️ Cetak';
}

function cetakWindow(data,namaKepsek,tempatTtd,tglTtd){
  const namaSekolah=cachedSetting.namaSekolah||'Sistem Presensi';
  const logoUrl=cachedSetting.logoUrl||'';
  let judulPeriode='';
  if(data.tipe==='harian')   judulPeriode='Tanggal: '+data.tanggal;
  if(data.tipe==='mingguan') judulPeriode='Periode: '+data.dari+' s/d '+data.sampai;
  if(data.tipe==='bulanan')  judulPeriode='Bulan: '+WaktuID.namaBulan(parseInt(data.bulan))+' '+data.tahun;
  let rows='';
  (data.rows||[]).forEach(function(r,i){
    rows+='<tr><td style="text-align:center">'+(i+1)+'</td><td>'+r.nama+'</td>'+
      '<td style="text-align:center">'+r.tanggal+'</td>'+
      '<td style="text-align:center">'+(r.jamMasuk||'-')+'</td>'+
      '<td style="text-align:center">'+(r.statusMasuk||'-')+'</td>'+
      '<td style="text-align:center">'+(r.jamPulang||'-')+'</td>'+
      '<td style="text-align:center">'+(r.statusPulang||'-')+'</td>'+
      '<td style="text-align:center">'+(r.keterangan||'-')+'</td></tr>';
  });
  if(!rows) rows='<tr><td colspan="8" style="text-align:center;padding:20px;color:#999">Tidak ada data</td></tr>';
  const logoHtml=logoUrl
    ?'<img src="'+logoUrl+'" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #1a73e8" onerror="this.style.display=\'none\'">'
    :'<div style="width:70px;height:70px;border-radius:50%;background:#e8f0fe;display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid #1a73e8">🏫</div>';
  const html='<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Presensi</title>'+
    '<style>body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#202124;margin:0;padding:20px}'+
    '.kop{display:flex;align-items:center;gap:16px;border-bottom:3px solid #1a73e8;padding-bottom:12px;margin-bottom:16px}'+
    '.kop-info h1{font-size:14pt;margin:0 0 2px;color:#1a73e8}.kop-info p{margin:0;font-size:9pt;color:#5f6368}'+
    'h2{font-size:12pt;text-align:center;margin:0 0 4px}.periode{text-align:center;font-size:9pt;color:#5f6368;margin-bottom:16px}'+
    'table{width:100%;border-collapse:collapse;font-size:9.5pt}th{background:#1a73e8;color:#fff;padding:7px 6px;text-align:center;font-weight:600}'+
    'td{padding:6px;border:1px solid #dadce0}tr:nth-child(even) td{background:#f8f9fa}'+
    '.ttd-area{display:flex;justify-content:flex-end;margin-top:32px}.ttd-box{text-align:center;min-width:200px}'+
    '.ttd-box .ttd-line{border-bottom:1px solid #202124;margin:48px 0 4px;width:180px}.ttd-box p{margin:0;font-size:9.5pt}'+
    '.ttd-box .nama{font-weight:700;text-decoration:underline}@media print{body{padding:10px}}</style></head><body>'+
    '<div class="kop">'+logoHtml+'<div class="kop-info"><h1>'+namaSekolah+'</h1><p>Laporan Presensi Guru</p></div></div>'+
    '<h2>LAPORAN PRESENSI GURU</h2><div class="periode">'+judulPeriode+'</div>'+
    '<table><thead><tr><th style="width:30px">No</th><th>Nama Guru</th><th style="width:90px">Tanggal</th>'+
    '<th style="width:70px">Jam Masuk</th><th style="width:80px">Status Masuk</th>'+
    '<th style="width:70px">Jam Pulang</th><th style="width:80px">Status Pulang</th><th style="width:70px">Ket.</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table>'+
    '<div class="ttd-area"><div class="ttd-box"><p>'+tempatTtd+', '+tglTtd+'</p><p>Kepala Sekolah,</p>'+
    '<div class="ttd-line"></div><p class="nama">'+namaKepsek+'</p></div></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  const win=window.open('','_blank');
  if(win){win.document.write(html);win.document.close();}
  else showToast('Popup diblokir browser. Izinkan popup untuk mencetak.','warning',5000);
}

// ============================================================
// HALAMAN STATISTIK
// ============================================================
function initStatistikPage(){
  const now=new Date();
  const sb=document.getElementById('stat-bulan'); if(sb&&!sb.value) sb.value=now.getMonth()+1;
  const st=document.getElementById('stat-tahun'); if(st&&!st.value) st.value=now.getFullYear();
  // Load guru untuk dropdown individu
  loadGuruDropdownStatistik();
}

async function loadGuruDropdownStatistik(){
  const sel=document.getElementById('stat-guru-select'); if(!sel)return;
  sel.innerHTML='<option value="">-- Memuat... --</option>'; sel.disabled=true;
  try {
    const data=await apiCall('getDataGuru');
    if(!data.success) throw new Error(data.message);
    sel.innerHTML='<option value="">-- Pilih Guru --</option>';
    data.data.forEach(function(g){sel.innerHTML+='<option value="'+g.idBarcode+'">'+g.nama+'</option>';});
    sel.disabled=false;
  } catch(e){
    sel.innerHTML='<option value="">-- Gagal memuat --</option>';
  }
}

function switchStatTab(tab){
  currentStatTab=tab;
  document.querySelectorAll('[data-stat-tab]').forEach(function(t){t.classList.remove('active');});
  const el=document.querySelector('[data-stat-tab="'+tab+'"]'); if(el)el.classList.add('active');
  const gw=document.getElementById('stat-guru-select-wrap');
  if(gw) gw.style.display=tab==='individu'?'block':'none';
  document.getElementById('statistik-result-container').innerHTML='';
}

async function loadStatistik(){
  const container=document.getElementById('statistik-result-container');
  container.innerHTML=loadingHtml('Memuat statistik...');
  const bl=document.getElementById('stat-bulan').value;
  const th=document.getElementById('stat-tahun').value;
  if(!bl||!th){showToast('Pilih bulan dan tahun','warning');container.innerHTML='';return;}

  const params={bulan:bl,tahun:th,tipe:currentStatTab};
  if(currentStatTab==='individu'){
    const id=document.getElementById('stat-guru-select').value;
    if(!id){showToast('Pilih guru terlebih dahulu','warning');container.innerHTML='';return;}
    params.idBarcode=id;
  }
  try {
    const data=await apiCall('getStatistik',params);
    if(!data.success) throw new Error(data.message);
    if(currentStatTab==='global') renderStatistikGlobal(data,container,bl,th);
    else renderStatistikIndividu(data,container,bl,th);
  } catch(e){
    container.innerHTML='<div class="empty-state"><div class="empty-icon">⚠️</div><p>'+e.message+'</p></div>';
  }
}

function renderStatistikGlobal(data,container,bl,th){
  const periode=WaktuID.namaBulan(parseInt(bl))+' '+th;
  const total=data.totalHariKerja||0;
  let html='<div class="laporan-info-bar">Statistik Global &bull; '+periode+'</div>';

  // Ringkasan keseluruhan
  html+='<div class="stat-summary-grid">';
  html+=statSummaryCard('📅','Hari Kerja',total,'var(--primary)');
  html+=statSummaryCard('✅','Rata-rata Hadir',data.rataHadir||0,'var(--success)');
  html+=statSummaryCard('⏰','Rata-rata Terlambat',data.rataTerlambat||0,'var(--warning)');
  html+=statSummaryCard('❌','Rata-rata Absen',data.rataAbsen||0,'var(--danger)');
  html+='</div>';

  // Tabel per guru
  if(data.perGuru&&data.perGuru.length){
    html+='<div class="section-title" style="padding:12px 0 8px">Rekap Per Guru</div>';
    html+='<div class="laporan-table-wrap"><table class="laporan-table">';
    html+='<thead><tr><th>#</th><th>Nama Guru</th><th>Hadir</th><th>Terlambat</th><th>Ijin</th><th>Sakit</th><th>Alpa</th></tr></thead><tbody>';
    data.perGuru.forEach(function(g,i){
      html+='<tr>'+
        '<td style="text-align:center;color:var(--text-muted);font-size:.75rem">'+(i+1)+'</td>'+
        '<td style="font-weight:600;font-size:.85rem">'+g.nama+'</td>'+
        '<td style="text-align:center;color:#137333;font-weight:700">'+g.hadir+'</td>'+
        '<td style="text-align:center;color:#b06000;font-weight:700">'+g.terlambat+'</td>'+
        '<td style="text-align:center;color:#1a73e8;font-weight:700">'+g.ijin+'</td>'+
        '<td style="text-align:center;color:#c5221f;font-weight:700">'+g.sakit+'</td>'+
        '<td style="text-align:center;color:#5f6368;font-weight:700">'+g.alpa+'</td>'+
      '</tr>';
    });
    html+='</tbody></table></div>';
  } else {
    html+='<div class="empty-state"><div class="empty-icon">📊</div><p>Tidak ada data pada periode ini.</p></div>';
  }
  container.innerHTML=html;
}

function renderStatistikIndividu(data,container,bl,th){
  const periode=WaktuID.namaBulan(parseInt(bl))+' '+th;
  const g=data.guru||{};
  let html='<div class="laporan-info-bar">Statistik Individu &bull; '+periode+'</div>';

  // Kartu guru
  const foto=g.urlFoto
    ?'<img class="guru-foto" src="'+g.urlFoto+'" alt="" style="width:56px;height:56px" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="guru-foto-placeholder" style="display:none;width:56px;height:56px">👤</div>'
    :'<div class="guru-foto-placeholder" style="width:56px;height:56px">👤</div>';
  html+='<div class="guru-card" style="margin-bottom:12px">'+foto+
    '<div class="guru-info"><div class="guru-nama">'+g.nama+'</div>'+
    '<div class="guru-detail">ID: '+g.idBarcode+'</div></div></div>';

  // Ringkasan
  html+='<div class="stat-summary-grid">';
  html+=statSummaryCard('✅','Hadir',data.hadir||0,'var(--success)');
  html+=statSummaryCard('⏰','Terlambat',data.terlambat||0,'var(--warning)');
  html+=statSummaryCard('📋','Ijin',data.ijin||0,'var(--info)');
  html+=statSummaryCard('🤒','Sakit',data.sakit||0,'var(--danger)');
  html+=statSummaryCard('❌','Alpa',data.alpa||0,'var(--text-muted)');
  html+=statSummaryCard('🏠','Mendahului',data.mendahului||0,'#b03228');
  html+='</div>';

  // Detail per hari
  if(data.detail&&data.detail.length){
    html+='<div class="section-title" style="padding:12px 0 8px">Detail Harian</div>';
    html+='<div class="laporan-table-wrap"><table class="laporan-table">';
    html+='<thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Ket.</th></tr></thead><tbody>';
    const sc={'HADIR':'#137333','TERLAMBAT':'#b06000','IJIN':'#1a73e8','SAKIT':'#c5221f','ALPA':'#5f6368','PULANG':'#137333','MENDAHULUI':'#b03228'};
    data.detail.forEach(function(r){
      html+='<tr>'+
        '<td style="font-size:.8rem">'+r.tanggal+'</td>'+
        '<td style="text-align:center"><span style="font-size:.78rem;font-weight:700;color:'+(sc[r.statusMasuk]||'#5f6368')+'">'+r.statusMasuk+'</span>'+
          '<div style="font-size:.7rem;color:var(--text-muted)">'+(r.jamMasuk!=='-'?r.jamMasuk:'')+'</div></td>'+
        '<td style="text-align:center"><span style="font-size:.78rem;font-weight:700;color:'+(sc[r.statusPulang]||'#5f6368')+'">'+r.statusPulang+'</span>'+
          '<div style="font-size:.7rem;color:var(--text-muted)">'+(r.jamPulang!=='-'?r.jamPulang:'')+'</div></td>'+
        '<td style="font-size:.75rem;color:var(--text-muted)">'+r.keterangan+'</td>'+
      '</tr>';
    });
    html+='</tbody></table></div>';
  }
  container.innerHTML=html;
}

function statSummaryCard(icon,label,val,color){
  return '<div class="stat-summary-card">'+
    '<div style="font-size:1.5rem">'+icon+'</div>'+
    '<div style="font-size:1.4rem;font-weight:800;color:'+color+'">'+val+'</div>'+
    '<div style="font-size:.72rem;color:var(--text-muted);font-weight:500">'+label+'</div>'+
  '</div>';
}

// ============================================================
// LOGIN ADMIN
// ============================================================
function requireAdmin(cb){
  if(isAdminLoggedIn){if(cb)cb();return;}
  window._pendingAdminCallback=cb||null;
  openLoginModal();
}
function handleAdminHeaderClick(){
  if(isAdminLoggedIn) openAdminMenu();
  else { window._pendingAdminCallback=openAdminMenu; openLoginModal(); }
}
function openLoginModal(){
  const m=document.getElementById('modal-login'); if(!m)return;
  const inp=document.getElementById('input-admin-password'); if(inp)inp.value='';
  const err=document.getElementById('login-error'); if(err)err.style.display='none';
  m.classList.add('show');
  setTimeout(function(){if(inp)inp.focus();},300);
}
function closeLoginModal(){
  const m=document.getElementById('modal-login'); if(m)m.classList.remove('show');
  window._pendingAdminCallback=null;
}
async function submitLogin(){
  const inp=document.getElementById('input-admin-password');
  const btn=document.getElementById('btn-submit-login');
  const err=document.getElementById('login-error');
  if(!inp)return;
  const pw=inp.value.trim();
  if(!pw){showToast('Masukkan password','warning');return;}
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Memeriksa...';
  try {
    const data=await apiCall('loginAdmin',{password:pw});
    if(data.success){
      isAdminLoggedIn=true;
      sessionStorage.setItem('admin_logged_in','1');
      if(err)err.style.display='none';
      closeLoginModal();
      updateAdminUI();
      showToast('Login admin berhasil!','success');
      if(window._pendingAdminCallback){
        const cb=window._pendingAdminCallback; window._pendingAdminCallback=null;
        setTimeout(cb,200);
      }
    } else {
      if(err)err.style.display='block';
      inp.value=''; inp.focus();
    }
  } catch(e){
    showToast(e.message==='__NO_URL__'?'URL API belum dikonfigurasi. Edit app.js dan isi HARDCODED_URL.':e.message,'error');
  } finally { btn.disabled=false; btn.innerHTML='🔑 Masuk'; }
}
function logoutAdmin(){
  isAdminLoggedIn=false;
  sessionStorage.removeItem('admin_logged_in');
  closeAdminMenu();
  updateAdminUI();
  // Kembali ke home dan tampilkan nav tamu
  navigateTo('home');
  showToast('Berhasil keluar dari mode admin','default');
}
function updateAdminUI(){
  const icon=document.getElementById('admin-header-icon');
  if(icon) icon.textContent=isAdminLoggedIn?'👤':'🔒';

  // Ganti bottom nav
  const navTamu=document.getElementById('nav-tamu');
  const navAdmin=document.getElementById('nav-admin');
  if(navTamu)  navTamu.style.display=isAdminLoggedIn?'none':'flex';
  if(navAdmin) navAdmin.style.display=isAdminLoggedIn?'flex':'none';

  // Tombol cetak di halaman laporan
  const cb=document.getElementById('laporan-cetak-bar');
  if(cb) cb.style.display=(isAdminLoggedIn&&lastLaporanData)?'block':'none';
}
function togglePasswordVisibility(inputId){
  const inp=document.getElementById(inputId); if(!inp)return;
  inp.type=inp.type==='password'?'text':'password';
}

// ============================================================
// MENU ADMIN
// ============================================================
function openAdminMenu(){
  const m=document.getElementById('modal-admin-menu'); if(m)m.classList.add('show');
}
function closeAdminMenu(){
  const m=document.getElementById('modal-admin-menu'); if(m)m.classList.remove('show');
}

// ============================================================
// PENGATURAN API
// ============================================================
function openSettingModal(){
  if(!isAdminLoggedIn){requireAdmin(openSettingModal);return;}
  const m=document.getElementById('modal-setting'); if(!m)return;
  const inp=document.getElementById('input-api-url');
  if(inp) inp.value=localStorage.getItem('presensi_api_url')||'';
  m.classList.add('show');
}
function closeSettingModal(){
  const m=document.getElementById('modal-setting'); if(m)m.classList.remove('show');
}
function saveApiUrl(){
  const inp=document.getElementById('input-api-url'); if(!inp)return;
  const url=inp.value.trim();
  if(!url){showToast('URL tidak boleh kosong','warning');return;}
  CONFIG.API_URL=url;
  showToast('URL API berhasil disimpan!','success');
  closeSettingModal();
  loadPresensiHariIni();
}

// ============================================================
// INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded',function(){
  startClock();
  updateAdminUI();   // restore tampilan nav sesuai status session
  navigateTo('home');

  // Nav tamu
  document.querySelectorAll('#nav-tamu [data-nav]').forEach(function(el){
    el.addEventListener('click',function(){
      const t=el.getAttribute('data-nav');
      if(isScanning) stopScanner();
      navigateTo(t);
    });
  });

  // Nav admin
  document.querySelectorAll('#nav-admin [data-nav]').forEach(function(el){
    el.addEventListener('click',function(){
      const t=el.getAttribute('data-nav');
      if(t==='scan'){
        navigateTo('scan');
        setTimeout(initScanner,300);
      } else {
        if(isScanning) stopScanner();
        navigateTo(t);
      }
    });
  });

  // Scan mode tabs
  document.querySelectorAll('.scan-tab').forEach(function(tab){
    tab.addEventListener('click',function(){setScanMode(tab.getAttribute('data-scan-mode'));});
  });

  // Keterangan manual
  document.querySelectorAll('.ket-btn').forEach(function(btn){
    btn.addEventListener('click',function(){selectKeterangan(btn.getAttribute('data-ket'));});
  });

  hideLoadingScreen();
});
