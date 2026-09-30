# 13. Method Statements

**URL**: `/admin/workforce/method-statements`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola Method Statement - dokumen yang menjelaskan metode dan prosedur pelaksanaan pekerjaan di proyek. Diperlukan untuk standarisasi dan compliance.

---

## Daftar Method Statement

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor method statement |
| **Judul** | Judul/thema metode |
| **Proyek** | Proyek terkait |
| **Versi** | Nomor versi |
| **Tanggal** | Tanggal dibuat/diapprove |
| **Status** | DRAFT, APPROVED, REVISION |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan proyek |
| **Status** | Filter berdasarkan status |

---

## Membuat Method Statement Baru

**URL**: `/admin/workforce/method-statements/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Judul** | Ya | Judul method statement |
| **Proyek (RAB)** | Ya | Proyek terkait |
| **Versi** | Ya | Nomor versi (format: v1.0) |
| **Tanggal** | Ya | Tanggal efektif |
| **Status** | Ya | DRAFT / APPROVED |

### Sections

Method statement biasanya terdiri dari sections:

| Section | Keterangan |
|---------|------------|
| **1. Tujuan** | Tujuan pekerjaan |
| **2. Ruang Lingkup** | Cakupan pekerjaan |
| **3. Referensi** | Standar, regulasi yang dipakai |
| **4. Definisi** | Istilah dan definisi |
| **5. Material & Alat** | Material dan peralatan yang diperlukan |
| **6. Langkah Kerja** | Prosedur pelaksanaan langkah per langkah |
| **7. Safety** | Prosedur K3 |
| **8. Quality Control** | Standar kualitas |
| **9. Lampiran** | Foto, gambar pendukung |

### Editor

Menggunakan **RichTextEditor** (TipTap) untuk formatted text, bullet points, numbered lists.

---

## Detail Method Statement

**URL**: `/admin/workforce/method-statements/[id]`

Tampilan read-only dengan semua sections.

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Edit** | Ubah content (jika status DRAFT) |
| **Approve** | Set status ke APPROVED |
| **Revisi** | Buat versi baru |
| **Print** | Print sebagai PDF |
| **Download** | Download sebagai DOCX/PDF |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/method-statements` | Daftar method statements |
| GET | `/api/method-statements/:id` | Detail method statement |
| POST | `/api/method-statements` | Buat baru |
| PUT | `/api/method-statements/:id` | Update |
| DELETE | `/api/method-statements/:id` | Hapus |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./12-qc.md) | [Menu Berikutnya](./14-qc-templates.md)*
