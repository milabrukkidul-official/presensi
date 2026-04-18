# 📋 Sistem Presensi Guru - Mobile

Aplikasi presensi guru berbasis mobile yang berjalan di GitHub Pages dan terhubung dengan Google Spreadsheet sebagai database.

---

## 🗂️ Struktur File

```
presensi/
├── index.html          ← Aplikasi utama (deploy ke GitHub Pages)
├── assets/
│   ├── css/style.css   ← Stylesheet
│   └── js/app.js       ← Logika aplikasi
├── setup.gs            ← Google Apps Script (untuk Spreadsheet)
└── README.md
```

---

## 🚀 Cara Deploy

### Langkah 1 — Setup Google Spreadsheet

1. Buka [Google Spreadsheet](https://sheets.google.com) baru
2. Klik **Extensions → Apps Script**
3. Hapus kode default, paste seluruh isi `setup.gs`
4. Klik **Run → `setupSpreadsheet`** (izinkan akses saat diminta)
5. Spreadsheet akan otomatis membuat 3 sheet:
   - `DATA_GURU` — data master guru (NO, NAMA, ID BARCODE, URL FOTO)
   - `PRESENSI` — rekap presensi harian
   - `SETTING` — konfigurasi sistem (nama sekolah, logo, jam masuk, dll)

### Langkah 2 — Deploy Web App

1. Di Apps Script, klik **Deploy → New Deployment**
2. Pilih type: **Web App**
3. Isi deskripsi (bebas)
4. **Execute as:** Me
5. **Who has access:** Anyone
6. Klik **Deploy** → salin URL yang muncul

### Langkah 3 — Deploy ke GitHub Pages

1. Upload semua file ke repository GitHub
2. Buka **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Tunggu beberapa menit, akses URL GitHub Pages

### Langkah 4 — Konfigurasi URL API

1. Buka aplikasi di browser/HP
2. Klik ikon ⚙️ di pojok kanan atas
3. Paste URL Web App dari Langkah 2
4. Klik **Simpan**

---

## 📱 Fitur Aplikasi

| Fitur | Keterangan |
|-------|-----------|
| 🏠 Beranda | Daftar kehadiran guru hari ini + statistik |
| 📷 Scan Barcode | Scan QR/barcode kartu guru untuk absen masuk/pulang |
| 📝 Absen Manual | Catat ijin, sakit, atau alpa |
| 🏠 Absen Pulang | Catat kepulangan guru secara manual |
| ⚙️ Pengaturan | Konfigurasi URL API |

---

## 📊 Format Spreadsheet

### Sheet: DATA_GURU
| NO | NAMA | ID BARCODE | URL FOTO |
|----|------|-----------|---------|
| 1 | Ahmad Fauzi, S.Pd | GURU001 | https://... |

### Sheet: PRESENSI
| NO | TANGGAL | ID BARCODE | NAMA | JAM MASUK | STATUS MASUK | JAM PULANG | STATUS PULANG | KETERANGAN |
|----|---------|-----------|------|-----------|-------------|-----------|--------------|-----------|
| 1 | 18-04-2026 | GURU001 | Ahmad Fauzi | 07:05 | HADIR | 14:10 | PULANG | |

### Sheet: SETTING
| KEY | VALUE | KETERANGAN |
|-----|-------|-----------|
| NAMA_SEKOLAH | SMA Negeri 1 | Nama sekolah |
| LOGO_URL | https://... | URL logo (kosongkan jika tidak ada) |
| JAM_MASUK | 07:00 | Batas jam masuk |
| JAM_PULANG | 14:00 | Jam pulang normal |
| TERLAMBAT_MENIT | 15 | Toleransi keterlambatan |
| PASSWORD_ADMIN | admin123 | Password admin |

---

## 🕐 Format Waktu

- **Tanggal:** `DD-MM-YYYY` (contoh: `18-04-2026`)
- **Jam:** `HH:mm` (contoh: `07:05`)
- Waktu diambil dari server Google (WIB/zona Indonesia)

---

## 📌 Catatan

- Pastikan kamera diizinkan saat menggunakan fitur scan barcode
- Barcode yang didukung: QR Code, Code 128, Code 39, EAN, dll
- Logo sekolah diambil dari URL yang diisi di sheet SETTING
- Jika LOGO_URL kosong, akan tampil ikon default 🏫
