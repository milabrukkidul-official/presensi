// ============================================================
// SETUP.GS - Google Apps Script untuk Sistem Presensi
// ============================================================
// CARA PENGGUNAAN:
// 1. Buka Google Spreadsheet baru
// 2. Klik Extensions > Apps Script
// 3. Paste seluruh kode ini
// 4. Jalankan fungsi setupSpreadsheet() untuk inisialisasi
// 5. Deploy sebagai Web App (Execute as: Me, Access: Anyone)
// 6. Salin URL Web App ke file config di index.html
// ============================================================

// ============================================================
// KONFIGURASI
// ============================================================
const SHEET_GURU     = 'DATA_GURU';
const SHEET_PRESENSI = 'PRESENSI';
const SHEET_SETTING  = 'SETTING';

// ============================================================
// SETUP AWAL SPREADSHEET
// ============================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Sheet DATA_GURU ---
  let sheetGuru = ss.getSheetByName(SHEET_GURU);
  if (!sheetGuru) sheetGuru = ss.insertSheet(SHEET_GURU);
  sheetGuru.clearContents();

  const headerGuru = [['NO', 'NAMA', 'ID BARCODE', 'URL FOTO']];
  sheetGuru.getRange(1, 1, 1, 4).setValues(headerGuru);
  sheetGuru.getRange(1, 1, 1, 4)
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetGuru.setColumnWidth(1, 60);
  sheetGuru.setColumnWidth(2, 200);
  sheetGuru.setColumnWidth(3, 150);
  sheetGuru.setColumnWidth(4, 300);

  // Contoh data guru
  const contohGuru = [
    [1, 'Ahmad Fauzi, S.Pd',    'GURU001', 'https://i.pravatar.cc/150?img=1'],
    [2, 'Siti Rahayu, M.Pd',    'GURU002', 'https://i.pravatar.cc/150?img=5'],
    [3, 'Budi Santoso, S.Pd',   'GURU003', 'https://i.pravatar.cc/150?img=3'],
    [4, 'Dewi Lestari, S.Pd',   'GURU004', 'https://i.pravatar.cc/150?img=9'],
    [5, 'Eko Prasetyo, M.Pd',   'GURU005', 'https://i.pravatar.cc/150?img=7'],
  ];
  sheetGuru.getRange(2, 1, contohGuru.length, 4).setValues(contohGuru);

  // --- Sheet PRESENSI ---
  let sheetPresensi = ss.getSheetByName(SHEET_PRESENSI);
  if (!sheetPresensi) sheetPresensi = ss.insertSheet(SHEET_PRESENSI);
  sheetPresensi.clearContents();

  const headerPresensi = [[
    'NO', 'TANGGAL', 'ID BARCODE', 'NAMA', 'JAM MASUK',
    'STATUS MASUK', 'JAM PULANG', 'STATUS PULANG', 'KETERANGAN'
  ]];
  sheetPresensi.getRange(1, 1, 1, 9).setValues(headerPresensi);
  sheetPresensi.getRange(1, 1, 1, 9)
    .setBackground('#0f9d58')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetPresensi.setColumnWidth(1, 50);
  sheetPresensi.setColumnWidth(2, 120);
  sheetPresensi.setColumnWidth(3, 120);
  sheetPresensi.setColumnWidth(4, 200);
  sheetPresensi.setColumnWidth(5, 100);
  sheetPresensi.setColumnWidth(6, 120);
  sheetPresensi.setColumnWidth(7, 100);
  sheetPresensi.setColumnWidth(8, 120);
  sheetPresensi.setColumnWidth(9, 150);

  // --- Sheet SETTING ---
  let sheetSetting = ss.getSheetByName(SHEET_SETTING);
  if (!sheetSetting) sheetSetting = ss.insertSheet(SHEET_SETTING);
  sheetSetting.clearContents();

  const settingData = [
    ['KEY',              'VALUE',                          'KETERANGAN'],
    ['NAMA_SEKOLAH',     'SMA Negeri 1 Contoh',            'Nama sekolah/instansi'],
    ['LOGO_URL',         '',                               'URL logo sekolah (kosongkan jika tidak ada)'],
    ['JAM_MASUK',        '07:00',                          'Batas jam masuk (HH:mm)'],
    ['JAM_PULANG',       '14:00',                          'Jam pulang normal (HH:mm)'],
    ['TERLAMBAT_MENIT',  '15',                             'Toleransi keterlambatan (menit)'],
    ['PASSWORD_ADMIN',   'admin123',                       'Password login admin'],
    ['TAHUN_AJARAN',     '2025/2026',                      'Tahun ajaran aktif'],
  ];
  sheetSetting.getRange(1, 1, settingData.length, 3).setValues(settingData);
  sheetSetting.getRange(1, 1, 1, 3)
    .setBackground('#f4b400')
    .setFontColor('#000000')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetSetting.setColumnWidth(1, 180);
  sheetSetting.setColumnWidth(2, 250);
  sheetSetting.setColumnWidth(3, 300);

  // Freeze header semua sheet
  sheetGuru.setFrozenRows(1);
  sheetPresensi.setFrozenRows(1);
  sheetSetting.setFrozenRows(1);

  // Aktifkan sheet pertama
  ss.setActiveSheet(sheetGuru);

  SpreadsheetApp.getUi().alert(
    '✅ Setup Berhasil!\n\n' +
    'Sheet yang dibuat:\n' +
    '• DATA_GURU - Data master guru\n' +
    '• PRESENSI  - Rekap presensi harian\n' +
    '• SETTING   - Konfigurasi sistem\n\n' +
    'Langkah selanjutnya:\n' +
    '1. Isi data guru di sheet DATA_GURU\n' +
    '2. Sesuaikan pengaturan di sheet SETTING\n' +
    '3. Deploy sebagai Web App\n' +
    '4. Salin URL Web App ke aplikasi'
  );
}

// ============================================================
// HELPER: FORMAT TANGGAL INDONESIA (DD-MM-YYYY)
// ============================================================
function formatTanggalIndonesia(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return d + '-' + m + '-' + y;
}

// ============================================================
// HELPER: FORMAT JAM INDONESIA (HH:mm)
// ============================================================
function formatJamIndonesia(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const mn = String(date.getMinutes()).padStart(2, '0');
  return h + ':' + mn;
}

// ============================================================
// HELPER: AMBIL SETTING
// ============================================================
function getSetting(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTING);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

// ============================================================
// HELPER: CARI GURU BERDASARKAN ID BARCODE
// ============================================================
function cariGuru(idBarcode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_GURU);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(idBarcode).trim()) {
      return {
        no:       data[i][0],
        nama:     data[i][1],
        idBarcode: data[i][2],
        urlFoto:  data[i][3]
      };
    }
  }
  return null;
}

// ============================================================
// HELPER: CEK PRESENSI HARI INI
// ============================================================
function cekPresensiHariIni(idBarcode, tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PRESENSI);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(idBarcode).trim() &&
        String(data[i][1]).trim() === String(tanggal).trim()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

// ============================================================
// HELPER: NOMOR URUT PRESENSI
// ============================================================
function getNomorPresensi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PRESENSI);
  const lastRow = sheet.getLastRow();
  return lastRow; // baris 1 = header, jadi lastRow = jumlah data
}

// ============================================================
// ABSEN MASUK (SCAN BARCODE)
// ============================================================
function absenMasuk(idBarcode) {
  try {
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);
    const jam     = formatJamIndonesia(now);

    // Cari data guru
    const guru = cariGuru(idBarcode);
    if (!guru) {
      return { success: false, message: 'ID Barcode tidak ditemukan: ' + idBarcode };
    }

    // Cek sudah absen masuk hari ini?
    const existing = cekPresensiHariIni(idBarcode, tanggal);
    if (existing && existing.data[4]) {
      return {
        success: false,
        message: guru.nama + ' sudah absen masuk hari ini pukul ' + existing.data[4],
        guru: guru,
        sudahAbsen: true
      };
    }

    // Tentukan status (tepat waktu / terlambat)
    const jamMasukBatas  = getSetting('JAM_MASUK') || '07:00';
    const toleransiMenit = parseInt(getSetting('TERLAMBAT_MENIT') || '15');
    const [bH, bM]       = jamMasukBatas.split(':').map(Number);
    const batasMenit      = bH * 60 + bM + toleransiMenit;
    const jamSekarangMnt  = now.getHours() * 60 + now.getMinutes();
    const status          = jamSekarangMnt <= batasMenit ? 'HADIR' : 'TERLAMBAT';

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);

    if (existing) {
      // Update baris yang sudah ada (absen manual sebelumnya)
      sheet.getRange(existing.row, 5).setValue(jam);
      sheet.getRange(existing.row, 6).setValue(status);
    } else {
      // Tambah baris baru
      const no = getNomorPresensi();
      sheet.appendRow([no, tanggal, idBarcode, guru.nama, jam, status, '', '', '']);
    }

    return {
      success:  true,
      message:  'Absen masuk berhasil!',
      nama:     guru.nama,
      urlFoto:  guru.urlFoto,
      tanggal:  tanggal,
      jam:      jam,
      status:   status
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// ABSEN PULANG (SCAN BARCODE)
// ============================================================
function absenPulang(idBarcode) {
  try {
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);
    const jam     = formatJamIndonesia(now);

    const guru = cariGuru(idBarcode);
    if (!guru) {
      return { success: false, message: 'ID Barcode tidak ditemukan: ' + idBarcode };
    }

    const existing = cekPresensiHariIni(idBarcode, tanggal);
    if (!existing) {
      return { success: false, message: guru.nama + ' belum absen masuk hari ini.' };
    }
    if (existing.data[6]) {
      return {
        success: false,
        message: guru.nama + ' sudah absen pulang hari ini pukul ' + existing.data[6],
        sudahAbsen: true
      };
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    sheet.getRange(existing.row, 7).setValue(jam);
    sheet.getRange(existing.row, 8).setValue('PULANG');

    return {
      success:  true,
      message:  'Absen pulang berhasil!',
      nama:     guru.nama,
      urlFoto:  guru.urlFoto,
      tanggal:  tanggal,
      jam:      jam,
      status:   'PULANG'
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// ABSEN MANUAL (IJIN / SAKIT / ALPA)
// ============================================================
function absenManual(idBarcode, keterangan) {
  try {
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);
    const jam     = formatJamIndonesia(now);

    const statusMap = { 'IJIN': 'IJIN', 'SAKIT': 'SAKIT', 'ALPA': 'ALPA' };
    const status    = statusMap[keterangan.toUpperCase()] || 'ALPA';

    const guru = cariGuru(idBarcode);
    if (!guru) {
      return { success: false, message: 'ID Barcode tidak ditemukan.' };
    }

    const existing = cekPresensiHariIni(idBarcode, tanggal);
    if (existing) {
      return {
        success: false,
        message: guru.nama + ' sudah memiliki data presensi hari ini.',
        sudahAbsen: true
      };
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    const no    = getNomorPresensi();
    sheet.appendRow([no, tanggal, idBarcode, guru.nama, jam, status, '', '', keterangan]);

    return {
      success:  true,
      message:  'Absen ' + status + ' berhasil dicatat!',
      nama:     guru.nama,
      urlFoto:  guru.urlFoto,
      tanggal:  tanggal,
      jam:      jam,
      status:   status
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// AMBIL DATA PRESENSI HARI INI (untuk tampilan utama)
// ============================================================
function getPresensiHariIni() {
  try {
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);

    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetGuru = ss.getSheetByName(SHEET_GURU);
    const sheetPres = ss.getSheetByName(SHEET_PRESENSI);

    const dataGuru = sheetGuru.getDataRange().getValues();
    const dataPres = sheetPres.getDataRange().getValues();

    // Buat map presensi hari ini
    const mapPresensi = {};
    for (let i = 1; i < dataPres.length; i++) {
      if (String(dataPres[i][1]).trim() === tanggal) {
        mapPresensi[String(dataPres[i][2]).trim()] = {
          jamMasuk:    dataPres[i][4] || '-',
          statusMasuk: dataPres[i][5] || '-',
          jamPulang:   dataPres[i][6] || '-',
          statusPulang: dataPres[i][7] || '-',
          keterangan:  dataPres[i][8] || ''
        };
      }
    }

    // Gabungkan dengan data guru
    const result = [];
    for (let i = 1; i < dataGuru.length; i++) {
      const id   = String(dataGuru[i][2]).trim();
      const pres = mapPresensi[id] || null;
      result.push({
        no:       dataGuru[i][0],
        nama:     dataGuru[i][1],
        idBarcode: id,
        urlFoto:  dataGuru[i][3],
        presensi: pres
      });
    }

    // Ambil setting
    const namaSekolah = getSetting('NAMA_SEKOLAH') || 'Sistem Presensi';
    const logoUrl     = getSetting('LOGO_URL') || '';
    const jamMasuk    = getSetting('JAM_MASUK') || '07:00';
    const jamPulang   = getSetting('JAM_PULANG') || '14:00';

    return {
      success:     true,
      tanggal:     tanggal,
      jam:         formatJamIndonesia(now),
      namaSekolah: namaSekolah,
      logoUrl:     logoUrl,
      jamMasuk:    jamMasuk,
      jamPulang:   jamPulang,
      guru:        result
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// AMBIL SEMUA DATA GURU (untuk dropdown absen manual)
// ============================================================
function getDataGuru() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_GURU);
    const data  = sheet.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          no:       data[i][0],
          nama:     data[i][1],
          idBarcode: String(data[i][2]).trim(),
          urlFoto:  data[i][3]
        });
      }
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// LOGIN ADMIN
// ============================================================
function loginAdmin(password) {
  const savedPass = getSetting('PASSWORD_ADMIN') || 'admin123';
  if (password === savedPass) {
    return { success: true, message: 'Login berhasil' };
  }
  return { success: false, message: 'Password salah' };
}

// ============================================================
// WEB APP ENTRY POINT - doGet
// Semua request dikirim via GET + query parameter
// untuk menghindari masalah CORS preflight
// ============================================================
function doGet(e) {
  // Jika tidak ada parameter action, tampilkan halaman info
  if (!e || !e.parameter || !e.parameter.action) {
    return HtmlService.createHtmlOutput(
      '<h2 style="font-family:sans-serif;color:#1a73e8">&#x2705; Presensi API Aktif</h2>' +
      '<p style="font-family:sans-serif">Web App berjalan dengan baik. Salin URL ini ke pengaturan aplikasi.</p>'
    ).setTitle('Presensi API');
  }

  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'absenMasuk':
        result = absenMasuk(e.parameter.idBarcode);
        break;
      case 'absenPulang':
        result = absenPulang(e.parameter.idBarcode);
        break;
      case 'absenManual':
        result = absenManual(e.parameter.idBarcode, e.parameter.keterangan);
        break;
      case 'getPresensiHariIni':
        result = getPresensiHariIni();
        break;
      case 'getDataGuru':
        result = getDataGuru();
        break;
      case 'loginAdmin':
        result = loginAdmin(e.parameter.password);
        break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// WEB APP ENTRY POINT - doPost (opsional, fallback)
// ============================================================
function doPost(e) {
  // Catatan: CORS ditangani otomatis oleh Google saat deploy
  // sebagai Web App dengan akses "Anyone"
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result;

    switch (action) {
      case 'absenMasuk':
        result = absenMasuk(params.idBarcode);
        break;
      case 'absenPulang':
        result = absenPulang(params.idBarcode);
        break;
      case 'absenManual':
        result = absenManual(params.idBarcode, params.keterangan);
        break;
      case 'getPresensiHariIni':
        result = getPresensiHariIni();
        break;
      case 'getDataGuru':
        result = getDataGuru();
        break;
      case 'loginAdmin':
        result = loginAdmin(params.password);
        break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
