# 28. Jabatan & Penanda Tangan

**URL**: `/admin/roles`  
**Peran**: ADMIN only  
**Auth**: `requireAdminRole("ADMIN")`

---

## Gambaran Umum

Menu untuk mengelola daftar jabatan (roles) dan penanda tangan resmi. Penanda tangan digunakan di dokumen seperti:
- RAB (tanda tangan pemberi tugas, direksi)
- Surat Penawaran
- Laporan Harian
- Dokumen proyek lainnya

---

## Tab: Workforce Roles (Jabatan)

### Daftar Jabatan

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama jabatan |
| **Role Key** | Key sistem (misal: `SITE_MANAGER`) |
| **Kategori** | Direksi / Manajemen / Lapangan / Lainnya |
| **Aktif** | Ya/Tidak |
| **Aksi** | Edit, Toggle Active |

### Form Tambah/Edit Jabatan

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap jabatan |
| **Role Key** | Ya | Key unik (huruf kapital, underscore) |
| **Kategori** | Ya | Kategori jabatan |
| **Deskripsi** | Tidak | Deskripsi jabatan |
| **Aktif** | Ya | Jabatan aktif/tidak |

### Kategori Jabatan

| Kategori | Contoh |
|----------|--------|
| **Direksi** | Direktur Utama, Direktur |
| **Manajemen** | Manajer Proyek, Site Manager |
| **Lapangan** | Kepala Tukang, Tukang Batu, Mandor |
| **Administrasi** | Staf |

---

## Tab: Signatories (Penanda Tangan)

### Daftar Penanda Tangan

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Jabatan** | Jabatan resmi |
| **Role** | Role di dokumen |
| **Tanda Tangan** | Preview gambar |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Role** | Filter berdasarkan role (Pemberi Tugas, Direksi, dll) |
| **Active** | Ya/Tidak |

---

## Form Tambah/Edit Penanda Tangan

### Data Pribadi

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **NIK** | Tidak | NIK KTP |
| **Email** | Tidak | Email |
| **Telepon** | Tidak | Nomor telepon |

### Data Jabatan

| Field | Required | Keterangan |
|-------|----------|------------|
| **Jabatan** | Ya | Jabatan resmi |
| **Role** | Ya | Role di dokumen |
| **Department** | Tidak | Departemen |

### Role di Dokumen

| Role | Digunakan di |
|------|-------------|
| `PEMBERI_TUGAS` | RAB, Laporan |
| `DIREKTUR` | RAB, Surat Penawaran |
| `MANAGER` | Laporan |
| `SITE_MANAGER` | Laporan Harian |
| `KEPALA_TUKANG` | Laporan Harian |
| `KONSULTAN` | Berita Acara |

### Tanda Tangan

| Field | Keterangan |
|-------|------------|
| **Gambar Tanda Tangan** | Upload gambar PNG/JPG |
| **Preview** | Tampilkan preview |
| **Position X/Y** | Posisi di dokumen (untuk print layout) |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/workforce-roles` | Daftar jabatan |
| POST | `/api/workforce-roles` | Tambah jabatan |
| PUT | `/api/workforce-roles/:id` | Update jabatan |
| DELETE | `/api/workforce-roles/:id` | Hapus jabatan |
| GET | `/api/signatories` | Daftar penanda tangan |
| POST | `/api/signatories` | Tambah penanda tangan |
| PUT | `/api/signatories/:id` | Update penanda tangan |
| DELETE | `/api/signatories/:id` | Hapus penanda tangan |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./27-users.md) | [Menu Berikutnya](./29-security.md)*
