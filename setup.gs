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
    ['KEY',                        'VALUE',                          'KETERANGAN'],
    ['NAMA_SEKOLAH',               'SMA Negeri 1 Contoh',            'Nama sekolah/instansi'],
    ['NAMA_KEPSEK',                'Drs. Nama Kepala Sekolah, M.Pd', 'Nama kepala sekolah (untuk laporan)'],
    ['LOGO_URL',                   '',                               'URL logo sekolah (kosongkan jika tidak ada)'],
    ['JAM_MASUK_AWAL',             '05:30',                          'Jam paling awal boleh absen masuk (HH:mm)'],
    ['JAM_MASUK_NORMAL',           '07:00',                          'Batas jam masuk normal/tidak terlambat (HH:mm)'],
    ['JAM_PULANG_AWAL',            '09:00',                          'Jam paling awal boleh absen pulang — tercatat MENDAHULUI (HH:mm)'],
    ['JAM_PULANG_NORMAL',          '13:00',                          'Batas jam pulang normal (Senin-Kamis) — di bawah ini tercatat MENDAHULUI (HH:mm)'],
    ['JAM_PULANG_NORMAL_JUMAT',    '10:00',                          'Batas jam pulang normal hari Jumat (HH:mm)'],
    ['JAM_PULANG_NORMAL_SABTU',    '11:00',                          'Batas jam pulang normal hari Sabtu (HH:mm)'],
    ['JAM_PULANG_AKHIR',           '17:00',                          'Batas maksimal absen pulang (HH:mm)'],
    ['PASSWORD_ADMIN',             'admin123',                       'Password login admin'],
    ['TAHUN_AJARAN',               '2025/2026',                      'Tahun ajaran aktif'],
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
    'Pengaturan jam di sheet SETTING:\n' +
    '• JAM_MASUK_AWAL   = 05:30 (mulai bisa absen masuk)\n' +
    '• JAM_MASUK_NORMAL = 07:00 (batas tidak terlambat)\n' +
    '• JAM_PULANG_AWAL  = 13:00 (mulai bisa absen pulang)\n' +
    '• JAM_PULANG_AKHIR = 17:00 (batas maksimal pulang)\n\n' +
    'Langkah selanjutnya:\n' +
    '1. Isi data guru di sheet DATA_GURU\n' +
    '2. Sesuaikan pengaturan di sheet SETTING\n' +
    '3. Deploy sebagai Web App\n' +
    '4. Salin URL Web App ke aplikasi'
  );
}

// ============================================================
// HELPER: FORMAT TANGGAL INDONESIA (DD-MM-YYYY)
// Menggunakan Utilities.formatDate dengan timezone spreadsheet
// agar tidak ada double-offset atau selisih waktu
// ============================================================
function formatTanggalIndonesia(date) {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(date, tz, 'dd-MM-yyyy');
}

// ============================================================
// HELPER: FORMAT JAM INDONESIA (HH:mm)
// Menggunakan Utilities.formatDate dengan timezone spreadsheet
// ============================================================
function formatJamIndonesia(date) {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(date, tz, 'HH:mm');
}

// ============================================================
// HELPER: AMBIL SETTING
// Selalu kembalikan sebagai String agar aman dari masalah
// Google Sheets yang kadang mengkonversi nilai ke Date/Number
// ============================================================
function getSetting(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTING);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      const val = data[i][1];
      if (val === null || val === undefined || val === '') return null;

      // Google Sheets menyimpan nilai waktu (time-only) sebagai objek Date.
      // Gunakan Utilities.formatDate dengan timezone spreadsheet
      // agar tidak ada selisih akibat offset manual.
      if (val instanceof Date) {
        const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
        return Utilities.formatDate(val, tz, 'HH:mm');
      }
      return String(val);
    }
  }
  return null;
}

// ============================================================
// HELPER: KONVERSI STRING JAM "HH:mm" KE MENIT
// ============================================================
function jamKeMenit(jamStr) {
  if (!jamStr) return 0;
  const parts = String(jamStr).split(':');
  return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
}

// ============================================================
// HELPER: KONVERSI NILAI JAM DARI SPREADSHEET KE "HH:mm"
// Menangani 3 kemungkinan format yang dikembalikan Google Sheets:
//   1. String "HH:mm" atau "HH:mm:ss"  → potong ke HH:mm
//   2. Objek Date (time-only cell)      → format via Utilities
//   3. Angka desimal fraksi hari        → konversi langsung
// ============================================================
function nilaiJamKeString(val) {
  if (val === null || val === undefined || val === '') return '-';

  // Kasus 1: sudah berupa string jam
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '-') return '-';
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      return parts[0].padStart(2,'0') + ':' + parts[1].padStart(2,'0');
    }
    return trimmed;
  }

  // Kasus 2: objek Date — gunakan Utilities.formatDate (timezone-aware)
  if (val instanceof Date) {
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(val, tz, 'HH:mm');
  }

  // Kasus 3: angka desimal fraksi hari (misal 0.291666 = 07:00), tanpa offset
  if (typeof val === 'number') {
    const totalMenit = Math.round(val * 24 * 60);
    const h  = String(Math.floor(totalMenit / 60) % 24).padStart(2, '0');
    const mn = String(totalMenit % 60).padStart(2, '0');
    return h + ':' + mn;
  }

  return String(val);
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
    // Tangani kolom tanggal yang bisa berupa objek Date atau string
    let tglBaris = data[i][1];
    if (tglBaris instanceof Date) {
      tglBaris = formatTanggalIndonesia(tglBaris);
    } else {
      tglBaris = String(tglBaris).trim();
    }
    if (String(data[i][2]).trim() === String(idBarcode).trim() &&
        tglBaris === String(tanggal).trim()) {
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
// Aturan:
//   05:30 - 07:00 → HADIR (normal)
//   > 07:00       → TERLAMBAT (tetap bisa absen)
//   < 05:30       → ditolak (terlalu awal)
// ============================================================
function absenMasuk(idBarcode) {
  try {
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);
    const jam     = formatJamIndonesia(now);
    // Ambil jam & menit dari formatJamIndonesia (sudah timezone-aware)
    const jamParts = jam.split(':');
    const menitNow = parseInt(jamParts[0]) * 60 + parseInt(jamParts[1]);

    // Cari data guru
    const guru = cariGuru(idBarcode);
    if (!guru) {
      return { success: false, message: 'ID Barcode tidak ditemukan: ' + idBarcode };
    }

    // Cek sudah absen masuk hari ini?
    // Tolak jika sudah ada data presensi apapun (scan, manual IJIN/SAKIT/ALPA)
    const existing = cekPresensiHariIni(idBarcode, tanggal);
    if (existing) {
      const jamTercatat = existing.data[4];
      const statusTercatat = String(existing.data[5] || '').toUpperCase();
      const pesanSudah = jamTercatat
        ? guru.nama + ' sudah absen masuk hari ini pukul ' + nilaiJamKeString(jamTercatat)
        : guru.nama + ' sudah tercatat ' + statusTercatat + ' hari ini, tidak bisa absen masuk.';
      return {
        success:    false,
        message:    pesanSudah,
        sudahAbsen: true
      };
    }

    // Ambil batas jam dari setting (dengan fallback aman)
    const jamMasukAwal   = getSetting('JAM_MASUK_AWAL')   || '05:30';
    const jamMasukNormal = getSetting('JAM_MASUK_NORMAL') || '07:00';

    const menitAwal   = jamKeMenit(jamMasukAwal);
    const menitNormal = jamKeMenit(jamMasukNormal);

    // Tolak jika terlalu awal
    if (menitNow < menitAwal) {
      return {
        success: false,
        message: 'Absen masuk belum dibuka. Dibuka mulai pukul ' + jamMasukAwal + '.'
      };
    }

    // Tentukan status
    const status = menitNow <= menitNormal ? 'HADIR' : 'TERLAMBAT';

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    const no    = getNomorPresensi();
    sheet.appendRow([no, tanggal, idBarcode, guru.nama, jam, status, '', '', '']);
    SpreadsheetApp.flush(); // Pastikan data langsung tersimpan

    const pesanStatus = status === 'TERLAMBAT'
      ? 'Absen masuk berhasil (TERLAMBAT - ' + jam + ')'
      : 'Absen masuk berhasil!';

    return {
      success: true,
      message: pesanStatus,
      nama:    guru.nama,
      urlFoto: guru.urlFoto,
      tanggal: tanggal,
      jam:     jam,
      status:  status
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// ABSEN PULANG (SCAN BARCODE)
// Aturan:
//   < 11:00        → ditolak (terlalu awal)
//   11:00 - 12:59  → MENDAHULUI (boleh pulang, tercatat mendahului)
//   13:00 - 17:00  → PULANG (normal)
//   > 17:00        → ditolak (sudah lewat batas)
// ============================================================
function absenPulang(idBarcode) {
  try {
    const now      = new Date();
    const tanggal  = formatTanggalIndonesia(now);
    const jam      = formatJamIndonesia(now);
    // Ambil jam & menit dari formatJamIndonesia (sudah timezone-aware)
    const jamParts = jam.split(':');
    const menitNow = parseInt(jamParts[0]) * 60 + parseInt(jamParts[1]);

    const guru = cariGuru(idBarcode);
    if (!guru) {
      return { success: false, message: 'ID Barcode tidak ditemukan: ' + idBarcode };
    }

    // Ambil batas jam pulang dari setting
    // JAM_PULANG_NORMAL berbeda tergantung hari
    const tz      = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    const hariStr = Utilities.formatDate(now, tz, 'u'); // 1=Senin ... 7=Minggu (ISO)
    const hariNum = parseInt(hariStr); // 5=Jumat, 6=Sabtu

    const jamPulangAwal   = getSetting('JAM_PULANG_AWAL')   || '09:00';
    const jamPulangAkhir  = getSetting('JAM_PULANG_AKHIR')  || '17:00';

    let jamPulangNormal;
    if (hariNum === 5) {
      // Jumat
      jamPulangNormal = getSetting('JAM_PULANG_NORMAL_JUMAT') || '10:00';
    } else if (hariNum === 6) {
      // Sabtu
      jamPulangNormal = getSetting('JAM_PULANG_NORMAL_SABTU') || '11:00';
    } else {
      // Senin–Kamis (dan Minggu jika masuk)
      jamPulangNormal = getSetting('JAM_PULANG_NORMAL') || '13:00';
    }

    const menitAwal   = jamKeMenit(jamPulangAwal);
    const menitNormal = jamKeMenit(jamPulangNormal);
    const menitAkhir  = jamKeMenit(jamPulangAkhir);

    // Terlalu awal — ditolak
    if (menitNow < menitAwal) {
      return {
        success: false,
        message: 'Absen pulang belum dibuka. Dibuka mulai pukul ' + jamPulangAwal + '.'
      };
    }

    // Sudah lewat batas — ditolak
    if (menitNow > menitAkhir) {
      return {
        success: false,
        message: 'Batas absen pulang sudah lewat (maks. pukul ' + jamPulangAkhir + ').'
      };
    }

    // Tentukan status pulang
    const statusPulang = menitNow < menitNormal ? 'MENDAHULUI' : 'PULANG';

    const existing = cekPresensiHariIni(idBarcode, tanggal);
    if (!existing) {
      return { success: false, message: guru.nama + ' belum absen masuk hari ini.' };
    }

    // Pastikan statusMasuk adalah HADIR atau TERLAMBAT (bukan IJIN/SAKIT/ALPA)
    const statusMasuk = String(existing.data[5] || '').toUpperCase();
    if (statusMasuk !== 'HADIR' && statusMasuk !== 'TERLAMBAT') {
      return {
        success: false,
        message: guru.nama + ' tercatat ' + statusMasuk + ' hari ini, tidak bisa absen pulang.'
      };
    }

    if (existing.data[6]) {
      return {
        success:    false,
        message:    guru.nama + ' sudah absen pulang hari ini pukul ' + nilaiJamKeString(existing.data[6]),
        sudahAbsen: true
      };
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    sheet.getRange(existing.row, 7).setValue(jam);
    sheet.getRange(existing.row, 8).setValue(statusPulang);
    SpreadsheetApp.flush(); // Pastikan data langsung tersimpan

    const pesanStatus = statusPulang === 'MENDAHULUI'
      ? 'Absen pulang berhasil (MENDAHULUI - sebelum pukul ' + jamPulangNormal + ')'
      : 'Absen pulang berhasil!';

    return {
      success: true,
      message: pesanStatus,
      nama:    guru.nama,
      urlFoto: guru.urlFoto,
      tanggal: tanggal,
      jam:     jam,
      status:  statusPulang
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
    SpreadsheetApp.flush(); // Pastikan data langsung tersimpan

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
    // Flush untuk memastikan semua perubahan tersimpan sebelum dibaca
    SpreadsheetApp.flush();

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
      // Tangani kasus Google Sheets mengkonversi kolom tanggal ke objek Date
      let tglBaris = dataPres[i][1];
      if (tglBaris instanceof Date) {
        tglBaris = formatTanggalIndonesia(tglBaris);
      } else {
        tglBaris = String(tglBaris).trim();
      }
      if (tglBaris === tanggal) {
        mapPresensi[String(dataPres[i][2]).trim()] = {
          jamMasuk:     nilaiJamKeString(dataPres[i][4]),
          statusMasuk:  dataPres[i][5] || '-',
          jamPulang:    nilaiJamKeString(dataPres[i][6]),
          statusPulang: dataPres[i][7] || '-',
          keterangan:   dataPres[i][8] || ''
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
    const namaSekolah    = getSetting('NAMA_SEKOLAH')    || 'Sistem Presensi';
    const namaKepsek     = getSetting('NAMA_KEPSEK')     || '';
    const logoUrl        = getSetting('LOGO_URL')        || '';
    const tahunAjaran    = getSetting('TAHUN_AJARAN')    || '';
    const jamMasukAwal   = getSetting('JAM_MASUK_AWAL')  || '05:30';
    const jamMasukNormal = getSetting('JAM_MASUK_NORMAL')|| '07:00';
    const jamPulangAwal  = getSetting('JAM_PULANG_AWAL')   || '11:00';
    const jamPulangAkhir = getSetting('JAM_PULANG_AKHIR')  || '17:00';

    return {
      success:      true,
      tanggal:      tanggal,
      jam:          formatJamIndonesia(now),
      namaSekolah:  namaSekolah,
      namaKepsek:   namaKepsek,
      logoUrl:      logoUrl,
      tahunAjaran:  tahunAjaran,
      jamMasukAwal:    jamMasukAwal,
      jamMasukNormal:  jamMasukNormal,
      jamPulangAwal:   jamPulangAwal,
      jamPulangAkhir:  jamPulangAkhir,
      guru:         result
    };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ============================================================
// DEBUG: Kembalikan 5 baris pertama PRESENSI untuk cek format data
// Akses via: URL_WEB_APP?action=debugPresensi
// ============================================================
function debugPresensi() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    const data  = sheet.getDataRange().getValues();
    var sample  = [];
    for (var i = 1; i < Math.min(data.length, 6); i++) {
      var tglRaw = data[i][1];
      sample.push({
        row:          i + 1,
        tglRaw:       String(tglRaw),
        tglType:      typeof tglRaw,
        isDate:       tglRaw instanceof Date,
        tglParsed:    parseTanggalSheet(tglRaw),
        idBarcode:    String(data[i][2]).trim(),
        statusMasuk:  String(data[i][5] || ''),
        statusPulang: String(data[i][7] || '')
      });
    }
    return { success: true, totalRows: data.length - 1, sample: sample };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// HELPER: PARSE TANGGAL DARI SPREADSHEET KE FORMAT DD-MM-YYYY
// Menangani kasus kolom berisi objek Date ATAU string DD-MM-YYYY
// ============================================================
function parseTanggalSheet(val) {
  if (!val) return '';
  // Jika Google Sheets menyimpan sebagai objek Date
  if (val instanceof Date) {
    return formatTanggalIndonesia(val);
  }
  var s = String(val).trim();
  // Sudah format DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  // Format YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    var p = s.substring(0, 10).split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  }
  // Coba parse sebagai Date jika format lain
  var d = new Date(s);
  if (!isNaN(d.getTime())) return formatTanggalIndonesia(d);
  return s;
}

// ============================================================
// AMBIL STATISTIK (global / individu per bulan)
// ============================================================
function getStatistik(tipe, params) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetGuru = ss.getSheetByName(SHEET_GURU);
    const sheetPres = ss.getSheetByName(SHEET_PRESENSI);
    const dataGuru  = sheetGuru.getDataRange().getValues();
    const dataPres  = sheetPres.getDataRange().getValues();

    const bl = parseInt(params.bulan);
    const th = parseInt(params.tahun);

    // Filter baris presensi bulan & tahun yang diminta
    // Gunakan parseTanggalSheet agar aman dari format Date objek
    var rows = [];
    for (var i = 1; i < dataPres.length; i++) {
      if (!dataPres[i][1]) continue;
      var tglStr = parseTanggalSheet(dataPres[i][1]); // selalu DD-MM-YYYY
      var parts  = tglStr.split('-');
      if (parts.length < 3) continue;
      var barisBulan = parseInt(parts[1]);
      var barisTahun = parseInt(parts[2]);
      if (barisBulan !== bl || barisTahun !== th) continue;

      rows.push({
        tanggal:      tglStr,
        idBarcode:    String(dataPres[i][2]).trim(),
        nama:         String(dataPres[i][3] || ''),
        jamMasuk:     dataPres[i][4] ? String(dataPres[i][4]) : '-',
        statusMasuk:  String(dataPres[i][5] || '').trim().toUpperCase(),
        jamPulang:    dataPres[i][6] ? String(dataPres[i][6]) : '-',
        statusPulang: String(dataPres[i][7] || '').trim().toUpperCase(),
        keterangan:   String(dataPres[i][8] || '')
      });
    }

    if (tipe === 'global') {
      // Hitung hari kerja unik (tanggal yang ada di data presensi)
      var hariSet = {};
      for (var h = 0; h < rows.length; h++) {
        hariSet[rows[h].tanggal] = true;
      }
      var totalHariKerja = 0;
      for (var hk in hariSet) { totalHariKerja++; }

      // Bangun map guru dari master DATA_GURU
      var mapGuru = {};
      for (var j = 1; j < dataGuru.length; j++) {
        if (!dataGuru[j][0]) continue;
        var id = String(dataGuru[j][2]).trim();
        mapGuru[id] = {
          nama:      String(dataGuru[j][1]),
          hadir:     0,
          terlambat: 0,
          ijin:      0,
          sakit:     0,
          alpa:      0
        };
      }

      // Akumulasi dari data presensi
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        if (!mapGuru[row.idBarcode]) continue;
        var s = row.statusMasuk;
        if      (s === 'HADIR')     mapGuru[row.idBarcode].hadir++;
        else if (s === 'TERLAMBAT') mapGuru[row.idBarcode].terlambat++;
        else if (s === 'IJIN')      mapGuru[row.idBarcode].ijin++;
        else if (s === 'SAKIT')     mapGuru[row.idBarcode].sakit++;
        else if (s === 'ALPA')      mapGuru[row.idBarcode].alpa++;
      }

      // Konversi map ke array (tanpa Object.values agar kompatibel semua GAS)
      var perGuru = [];
      for (var gid in mapGuru) {
        perGuru.push(mapGuru[gid]);
      }
      perGuru.sort(function(a, b) {
        return a.nama < b.nama ? -1 : a.nama > b.nama ? 1 : 0;
      });

      var totalGuru = perGuru.length || 1;
      var sumHadir = 0, sumTelat = 0, sumAbsen = 0;
      for (var pg = 0; pg < perGuru.length; pg++) {
        sumHadir  += perGuru[pg].hadir;
        sumTelat  += perGuru[pg].terlambat;
        sumAbsen  += perGuru[pg].ijin + perGuru[pg].sakit + perGuru[pg].alpa;
      }

      return {
        success:        true,
        tipe:           'global',
        bulan:          bl,
        tahun:          th,
        totalHariKerja: totalHariKerja,
        rataHadir:      Math.round(sumHadir  / totalGuru * 10) / 10,
        rataTerlambat:  Math.round(sumTelat  / totalGuru * 10) / 10,
        rataAbsen:      Math.round(sumAbsen  / totalGuru * 10) / 10,
        perGuru:        perGuru
      };
    }

    if (tipe === 'individu') {
      var idTarget = String(params.idBarcode || '').trim();
      // Cari data guru
      var guruData = null;
      for (var k = 1; k < dataGuru.length; k++) {
        if (String(dataGuru[k][2]).trim() === idTarget) {
          guruData = { nama: dataGuru[k][1], idBarcode: idTarget, urlFoto: dataGuru[k][3] };
          break;
        }
      }
      if (!guruData) return { success: false, message: 'Guru tidak ditemukan.' };

      var detail = rows.filter(function(r){ return r.idBarcode === idTarget; });
      detail.sort(function(a,b){ return a.tanggal < b.tanggal ? -1 : 1; });

      var hadir=0, terlambat=0, ijin=0, sakit=0, alpa=0, mendahului=0;
      detail.forEach(function(r){
        var s = r.statusMasuk;
        if (s==='HADIR')     hadir++;
        else if (s==='TERLAMBAT') terlambat++;
        else if (s==='IJIN') ijin++;
        else if (s==='SAKIT') sakit++;
        else if (s==='ALPA') alpa++;
        if (r.statusPulang==='MENDAHULUI') mendahului++;
      });

      return {
        success:    true,
        tipe:       'individu',
        bulan:      bl,
        tahun:      th,
        guru:       guruData,
        hadir:      hadir,
        terlambat:  terlambat,
        ijin:       ijin,
        sakit:      sakit,
        alpa:       alpa,
        mendahului: mendahului,
        detail:     detail
      };
    }

    return { success: false, message: 'Tipe statistik tidak dikenal: ' + tipe };
  } catch(e) {
    return { success: false, message: 'Error getStatistik: ' + e.message };
  }
}

// ============================================================
// AMBIL DATA LAPORAN (harian / mingguan / bulanan)
// ============================================================
function getLaporan(tipe, params) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPres = ss.getSheetByName(SHEET_PRESENSI);
    const dataPres  = sheetPres.getDataRange().getValues();

    // Tentukan filter tanggal berdasarkan tipe
    var tanggalSet = {};

    if (tipe === 'harian') {
      tanggalSet[params.tanggal] = true;
    }
    else if (tipe === 'mingguan') {
      // Iterasi semua tanggal dari 'dari' sampai 'sampai' (DD-MM-YYYY)
      var d0 = parseTanggalID(params.dari);
      var d1 = parseTanggalID(params.sampai);
      var cur = new Date(d0);
      while (cur <= d1) {
        tanggalSet[formatTanggalIndonesia(cur)] = true;
        cur.setDate(cur.getDate() + 1);
      }
    }
    else if (tipe === 'bulanan') {
      var bl = parseInt(params.bulan);
      var th = parseInt(params.tahun);
      var daysInMonth = new Date(th, bl, 0).getDate();
      for (var day = 1; day <= daysInMonth; day++) {
        var tgl = String(day).padStart(2,'0') + '-' + String(bl).padStart(2,'0') + '-' + th;
        tanggalSet[tgl] = true;
      }
    }

    // Filter baris presensi
    var rows = [];
    for (var i = 1; i < dataPres.length; i++) {
      // Tangani kasus Google Sheets mengkonversi kolom tanggal ke objek Date
      var tglBaris = dataPres[i][1];
      if (tglBaris instanceof Date) {
        tglBaris = formatTanggalIndonesia(tglBaris);
      } else {
        tglBaris = String(tglBaris).trim();
      }
      if (tanggalSet[tglBaris]) {
        rows.push({
          tanggal:      tglBaris,
          idBarcode:    String(dataPres[i][2]).trim(),
          nama:         dataPres[i][3],
          jamMasuk:     nilaiJamKeString(dataPres[i][4]),
          statusMasuk:  dataPres[i][5] || '-',
          jamPulang:    nilaiJamKeString(dataPres[i][6]),
          statusPulang: dataPres[i][7] || '-',
          keterangan:   dataPres[i][8] || ''
        });
      }
    }

    // Urutkan: tanggal asc, nama asc
    rows.sort(function(a, b) {
      if (a.tanggal < b.tanggal) return -1;
      if (a.tanggal > b.tanggal) return 1;
      return a.nama.localeCompare(b.nama);
    });

    var result = {
      success: true,
      tipe:    tipe,
      rows:    rows
    };
    if (tipe === 'harian')   result.tanggal = params.tanggal;
    if (tipe === 'mingguan') { result.dari = params.dari; result.sampai = params.sampai; }
    if (tipe === 'bulanan')  { result.bulan = params.bulan; result.tahun = params.tahun; }

    return result;
  } catch(e) {
    return { success: false, message: 'Error getLaporan: ' + e.message };
  }
}

// Helper: parse DD-MM-YYYY ke Date
function parseTanggalID(str) {
  var parts = str.split('-');
  return new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
}

// ============================================================
// AMBIL SEMUA GURU (master data, tanpa filter apapun)
// Digunakan untuk dropdown statistik individu
// ============================================================
function getSemuaGuru() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_GURU);
    const data  = sheet.getDataRange().getValues();
    const result = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      result.push({
        no:        data[i][0],
        nama:      data[i][1],
        idBarcode: String(data[i][2]).trim(),
        urlFoto:   data[i][3]
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// AMBIL DATA GURU YANG BELUM ABSEN HARI INI (untuk dropdown absen manual)
// Guru yang sudah memiliki data presensi hari ini (apapun statusnya)
// tidak akan muncul di dropdown absen manual.
// ============================================================
function getDataGuru() {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetGuru = ss.getSheetByName(SHEET_GURU);
    const sheetPres = ss.getSheetByName(SHEET_PRESENSI);

    const dataGuru = sheetGuru.getDataRange().getValues();
    const dataPres = sheetPres.getDataRange().getValues();

    // Buat set ID barcode yang sudah absen hari ini
    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);
    const sudahAbsen = {};
    for (let i = 1; i < dataPres.length; i++) {
      let tglBaris = dataPres[i][1];
      if (tglBaris instanceof Date) {
        tglBaris = formatTanggalIndonesia(tglBaris);
      } else {
        tglBaris = String(tglBaris).trim();
      }
      if (tglBaris === tanggal) {
        sudahAbsen[String(dataPres[i][2]).trim()] = true;
      }
    }

    // Kembalikan hanya guru yang belum absen hari ini
    const result = [];
    for (let i = 1; i < dataGuru.length; i++) {
      if (!dataGuru[i][0]) continue;
      const id = String(dataGuru[i][2]).trim();
      if (sudahAbsen[id]) continue; // sudah absen, skip
      result.push({
        no:        dataGuru[i][0],
        nama:      dataGuru[i][1],
        idBarcode: id,
        urlFoto:   dataGuru[i][3]
      });
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// AMBIL DATA GURU YANG SUDAH HADIR TAPI BELUM PULANG
// (untuk dropdown absen kepulangan)
// Hanya guru dengan statusMasuk HADIR atau TERLAMBAT
// dan belum memiliki jamPulang hari ini yang ditampilkan.
// ============================================================
function getDataGuruHadir() {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetGuru = ss.getSheetByName(SHEET_GURU);
    const sheetPres = ss.getSheetByName(SHEET_PRESENSI);

    const dataGuru = sheetGuru.getDataRange().getValues();
    const dataPres = sheetPres.getDataRange().getValues();

    const now     = new Date();
    const tanggal = formatTanggalIndonesia(now);

    // Buat map presensi hari ini: id → { statusMasuk, sudahPulang }
    const mapPresensi = {};
    for (let i = 1; i < dataPres.length; i++) {
      let tglBaris = dataPres[i][1];
      if (tglBaris instanceof Date) {
        tglBaris = formatTanggalIndonesia(tglBaris);
      } else {
        tglBaris = String(tglBaris).trim();
      }
      if (tglBaris === tanggal) {
        const id          = String(dataPres[i][2]).trim();
        const statusMasuk = String(dataPres[i][5] || '').toUpperCase();
        const jamPulang   = dataPres[i][6];
        mapPresensi[id] = {
          statusMasuk:  statusMasuk,
          sudahPulang:  jamPulang !== null && jamPulang !== undefined && jamPulang !== ''
        };
      }
    }

    // Kembalikan hanya guru yang sudah hadir/terlambat dan belum pulang
    const result = [];
    for (let i = 1; i < dataGuru.length; i++) {
      if (!dataGuru[i][0]) continue;
      const id   = String(dataGuru[i][2]).trim();
      const pres = mapPresensi[id];
      if (!pres) continue; // belum absen masuk sama sekali
      if (pres.statusMasuk !== 'HADIR' && pres.statusMasuk !== 'TERLAMBAT') continue;
      if (pres.sudahPulang) continue; // sudah pulang
      result.push({
        no:        dataGuru[i][0],
        nama:      dataGuru[i][1],
        idBarcode: id,
        urlFoto:   dataGuru[i][3]
      });
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
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
      case 'getSemuaGuru':
        result = getSemuaGuru();
        break;
      case 'getDataGuruHadir':
        result = getDataGuruHadir();
        break;
      case 'loginAdmin':
        result = loginAdmin(e.parameter.password);
        break;
      case 'getLaporan':
        result = getLaporan(e.parameter.tipe, {
          tanggal: e.parameter.tanggal || '',
          dari:    e.parameter.dari    || '',
          sampai:  e.parameter.sampai  || '',
          bulan:   e.parameter.bulan   || '',
          tahun:   e.parameter.tahun   || ''
        });
        break;
      case 'getStatistik':
        result = getStatistik(e.parameter.tipe, {
          bulan:     e.parameter.bulan     || '',
          tahun:     e.parameter.tahun     || '',
          idBarcode: e.parameter.idBarcode || ''
        });
        break;
      case 'debugPresensi':
        result = debugPresensi();
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
      case 'getSemuaGuru':
        result = getSemuaGuru();
        break;
      case 'getDataGuruHadir':
        result = getDataGuruHadir();
        break;
      case 'loginAdmin':
        result = loginAdmin(params.password);
        break;
      case 'getLaporan':
        result = getLaporan(params.tipe, {
          tanggal: params.tanggal || '',
          dari:    params.dari    || '',
          sampai:  params.sampai  || '',
          bulan:   params.bulan   || '',
          tahun:   params.tahun   || ''
        });
        break;
      case 'getStatistik':
        result = getStatistik(params.tipe, {
          bulan:     params.bulan     || '',
          tahun:     params.tahun     || '',
          idBarcode: params.idBarcode || ''
        });
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
