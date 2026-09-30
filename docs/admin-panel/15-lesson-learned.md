# 15. Lesson Learned

**URL**: `/admin/workforce/lesson-learned`  
**Peran**: Semua (ADMIN, EDITOR, USER)  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mendokumentasikan pembelajaran dari pelaksanaan proyek. Lesson Learned menangkap pengetahuan yang diperoleh dari pengalaman (sukses maupun kegagalan) untuk improve di proyek masa depan.

---

## Daftar Lesson Learned

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor dokumen |
| **Judul** | Topik pembelajaran |
| **Kategori** | Kategori (Safety, Quality, Schedule, Cost, dll) |
| **Proyek** | Proyek asal |
| **Tanggal** | Tanggal dibuat |
| **Tipe** | POSITIVE / NEGATIVE |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Kategori** | Filter berdasarkan kategori |
| **Tipe** | POSITIVE / NEGATIVE |
| **Proyek** | Filter berdasarkan proyek |

---

## Kategori Lesson Learned

| Kategori | Arti |
|----------|------|
| **SAFETY** | Berkaitan dengan K3 |
| **QUALITY** | Berkaitan dengan kualitas |
| **SCHEDULE** | Berkaitan dengan waktu/jadwal |
| **COST** | Berkaitan dengan biaya |
| **ENVIRONMENT** | Berkaitan dengan lingkungan |
| **PROCESS** | Berkaitan dengan proses kerja |

---

## Membuat Lesson Learned Baru

**URL**: (biasanya inline dari list page)

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Judul** | Ya | Topik pembelajaran |
| **Kategori** | Ya | Pilih kategori |
| **Proyek** | Ya | Proyek asal |
| **Tipe** | Ya | POSITIVE (keberhasilan) / NEGATIVE (kegagalan) |
| **Tanggal** | Ya | Tanggal kejadian |
| **Deskripsi** | Ya | Penjelasan detail |
| **Penyebab** | Tidak | Penyebab kejadian (khusus NEGATIVE) |
| **Solusi** | Ya | Solusi/cara mengatasinya |
| **Rekomendasi** | Ya | Saran untuk proyek lain |

---

## Tipe Lesson Learned

| Tipe | Badge | Arti |
|------|-------|------|
| **POSITIVE** | Success (hijau) | Keberhasilan yang perlu direplikasi |
| **NEGATIVE** | Danger (merah) | Kegagalan yang perlu dihindari |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/lesson-learned` | Daftar lesson learned |
| GET | `/api/lesson-learned/:id` | Detail lesson learned |
| POST | `/api/lesson-learned` | Buat baru |
| PUT | `/api/lesson-learned/:id` | Update |
| DELETE | `/api/lesson-learned/:id` | Hapus |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./14-qc-templates.md) | [Menu Berikutnya](./16-kpi.md)*
