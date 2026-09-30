# 31. Laporan Harian

**URL**: `/admin/daily-reports`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola laporan harian proyek. Laporan harian adalah dokumen resmi yang mencatat progress dan kondisi proyek setiap hari. Berbeda dengan `Executions` yang dokumentasi kerja, Daily Reports adalah laporan formal dengan format yang distandardisasi.

---

## Daftar Laporan Harian

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor laporan (format: `LPJ/RAB/{NOMOR}/{BULAN}/{TAHUN}`) |
| **Proyek** | Nama proyek RAB |
| **Tanggal** | Tanggal laporan |
| **Periode** | Periode laporan (mingguan/bulanan) |
| **Status** | DRAFT, SUBMITTED, APPROVED |
| **Pemberi Tugas** | Penanda tangan pemberi tugas |
| **Aksi** | View, Edit, Submit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan RAB |
| **Tanggal** | Range tanggal |
| **Status** | Filter status |

---

## Format Laporan Harian

### Header

| Field | Keterangan |
|-------|------------|
| **Nomor** | Nomor surat |
| **Tanggal** | Tanggal laporan |
| **Proyek** | Nama proyek |
| **Lokasi** | Alamat proyek |
| **Periode** | Tanggal mulai - selesai periode |

### Kondisi Weather

| Field | Keterangan |
|-------|------------|
| **Cuaca** | Cerah, Mendung, Hujan |
| **Temperature** | Suhu udara |
| **Kelembapan** | Kelembapan (%) |

### Personil

| Field | Keterangan |
|-------|------------|
| **Direksi** | Jumlah + nama |
| **Staf** | Jumlah + nama |
| **Pekerja** | Jumlah + breakdown |

### Equipment & Material

| Field | Keterangan |
|-------|------------|
| **Alat** | Equipment yang digunakan |
| **Material** | Material yang masuk/dipakai |

### Progress

| Field | Keterangan |
|-------|------------|
| **Rencana** | Target progress hari itu |
| **Realisasi** | Actual progress |
| **Komponen** | Detail per komponen |

### Catatan

| Field | Keterangan |
|-------|------------|
| **Kemajuan** | Deskripsi kemajuan hari ini |
| **Kendala** | Kendala/hambatan |
| **Rencana Besok** | Rencana untuk besok |

### Tanda Tangan

| Tanda Tangan | Role |
|--------------|------|
| **Pemberi Tugas** | Site Manager Pemberi Tugas |
| **Direksi** | Direksi PT Sanata |
| **Pelaksana** | Site Manager/Pelaksana |

---

## Generate Laporan

Fitur untuk generate laporan dari data execution:

1. **Select Period** → Pilih range tanggal
2. **Select Project** → Pilih proyek
3. **Select Executions** → Pilih execution records
4. **Generate** → Generate draft laporan

---

## Print / Export

| Format | Keterangan |
|--------|------------|
| **PDF** | Print-ready PDF |
| **DOCX** | Word document |
| **Print Preview** | Preview print layout |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/daily-reports` | Daftar laporan |
| GET | `/api/daily-reports/:id` | Detail laporan |
| POST | `/api/daily-reports` | Buat laporan baru |
| PUT | `/api/daily-reports/:id` | Update laporan |
| DELETE | `/api/daily-reports/:id` | Hapus laporan |
| GET | `/api/daily-reports/generate` | Generate dari executions |
| GET | `/api/daily-reports/:id/print` | Print PDF |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./30-audit-log.md) | [Menu Berikutnya](./32-marketing.md)*
