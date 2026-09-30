# 9. Assessment

**URL**: `/admin/workforce/assessments`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mencatat dan mengelola penilaian (assessment) terhadap worker. Assessment mencakup skill assessment, evaluasi performa, dan kompetensi worker.

---

## Daftar Assessment

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor assessment |
| **Worker** | Nama worker yang dinilai |
| **Jenis** | Tipe assessment |
| **Tanggal** | Tanggal assessment |
| **Penilai** | Nama penilai |
| **Skor** | Nilai/rating |
| **Status** | DRAFT, COMPLETED |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan worker atau ID |
| **Date Range** | Filter berdasarkan tanggal |
| **Type Filter** | Filter berdasarkan jenis assessment |

---

## Membuat Assessment Baru

**URL**: `/admin/workforce/assessments/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Pilih worker dari dropdown |
| **Jenis Assessment** | Ya | Pilih jenis (Skill, Safety, Quality, dll) |
| **Tanggal** | Ya | Tanggal assessment |
| **Penilai** | Ya | Nama penilai |
| **Skor** | Ya | Nilai numeric (0-100 atau skala lain) |

### Detail Assessment Items

Assessment bisa terdiri dari multiple items/kategori:

| Item | Bobot | Skor |
|------|-------|------|
| Safety Compliance | 20% | 85 |
| Quality of Work | 30% | 90 |
| Productivity | 25% | 80 |
| Teamwork | 15% | 95 |
| Communication | 10% | 88 |

**Total Score**: Di-kalkulasi dari weighted average

### Catatan

| Field | Keterangan |
|-------|------------|
| **Kekuatan** | Hal positif yang perlu dipertahankan |
| **Kelemahan** | Area yang perlu diperbaiki |
| **Rekomendasi** | Saran pengembangan |

---

## Detail Assessment

**URL**: `/admin/workforce/assessments/[id]`

Tampilan read-only dengan semua detail assessment termasuk:
- Worker info
- Detail items
- Notes
- History perubahan

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Edit** | Ubah assessment (jika status DRAFT) |
| **Finalize** | Selesaikan assessment (DRAFT → COMPLETED) |
| **Delete** | Hapus assessment |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/assessments` | Daftar assessment |
| GET | `/api/assessments/:id` | Detail assessment |
| POST | `/api/assessments` | Buat assessment baru |
| PUT | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Hapus assessment |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./08-workers.md) | [Menu Berikutnya](./10-assignments.md)*
