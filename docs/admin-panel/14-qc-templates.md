# 14. QC Templates

**URL**: `/admin/workforce/qc-templates`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola template checklist Quality Control. Template digunakan saat membuat QC record baru untuk standarisasi inspeksi.

---

## Daftar Template

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama template |
| **Kategori** | Kategori (Pondasi, Struktur, Arsitektur, MEP, dll) |
| **Items** | Jumlah checklist items |
| **Versi** | Nomor versi |
| **Status** | ACTIVE / INACTIVE |
| **Aksi** | View, Edit, Delete |

---

## Membuat Template Baru

**URL**: `/admin/workforce/qc-templates/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Template** | Ya | Nama template |
| **Kategori** | Ya | Kategori pekerjaan |
| **Versi** | Ya | Nomor versi |
| **Deskripsi** | Tidak | Deskripsi template |
| **Status** | Ya | ACTIVE / INACTIVE |

### Checklist Items

Template terdiri dari checklist items:

| Field | Required | Keterangan |
|-------|----------|------------|
| **Item** | Ya | Teks checklist |
| **Category** | Tidak | Sub-kategori |
| **Mandatory** | Ya | Wajib dicek (Y/N) |
| **Photo Required** | Ya | Perlu foto evidence (Y/N) |
| **Notes Required** | Ya | Perlu catatan (Y/N) |
| **Order** | Ya | Urutan tampil |

---

## Template Categories

| Kategori | Contoh Items |
|----------|-------------|
| **Pondasi** | Dimensi sesuai图纸, Mutu beton, Besi tulangan |
| **Struktur** | Kolom sesuai图纸, Beton sudah curing, Scaffolding aman |
| **Arsitektur** | Dinding sesuai spesifikasi, Cat rapi, Kusen terpasang |
| **MEP** | Instalasi listrik sesuai, Plumbing tidak bocor, AC terpasang |
| **Safety** | APD digunakan, Area kerja aman, Sirkulasi udara |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/qc-templates` | Daftar template |
| GET | `/api/qc-templates/:id` | Detail template |
| POST | `/api/qc-templates` | Buat template baru |
| PUT | `/api/qc-templates/:id` | Update template |
| DELETE | `/api/qc-templates/:id` | Hapus template |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./13-method-statements.md) | [Menu Berikutnya](./15-lesson-learned.md)*
