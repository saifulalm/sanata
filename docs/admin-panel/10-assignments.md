# 10. Penugasan (Assignments)

**URL**: `/admin/workforce/assignments`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola penugasan worker ke proyek. Menggunakan **kanban board** untuk visualisasi status penugasan.

---

## Kanban Board

### Kolom Status

| Kolom | Keterangan | Card Color |
|-------|------------|------------|
| **Available** | Worker yang siap ditugaskan | Default/Neutral |
| **Assigned** | Sudah ditugaskan, belum mulai | Blue |
| **In Progress** | Sedang berjalan | Yellow/Warning |
| **Completed** | Selesai | Green/Success |

### Assignment Card

Setiap kartu menampilkan:

| Field | Keterangan |
|-------|------------|
| **Worker** | Nama + foto worker |
| **Proyek** | Judul proyek penugasan |
| **Role** | Jabatan di proyek |
| **Periode** | Tanggal mulai - selesai |
| **Progress** | Progress bar (%) |
| **Status** | Badge status |

---

## Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan RAB/proyek |
| **Worker** | Filter berdasarkan worker |
| **Status** | Filter berdasarkan status |
| **Date Range** | Filter berdasarkan periode |

---

## Membuat Assignment Baru

**URL**: `/admin/workforce/assignments/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Pilih worker |
| **Proyek (RAB)** | Ya | Pilih proyek RAB |
| **Role/Jabatan** | Ya | Jabatan di proyek |
| **Tanggal Mulai** | Ya | Tanggal mulai penugasan |
| **Tanggal Selesai** | Ya | Tanggal selesai penugasan |
| **Deskripsi** | Tidak | Detail tugas |
| **Target Output** | Tidak | Target yang harus dicapai |

### Resource Assignment

Jika penugasan memerlukan resources:

| Field | Keterangan |
|-------|------------|
| **Alat** | Alat yang diperlukan (dari inventory) |
| **Kendaraan** | Kendaraan jika diperlukan |
| **Material** | Material jika diperlukan |

---

## Edit Assignment

**URL**: `/admin/workforce/assignments/[id]/edit`

### Update Progress

| Field | Keterangan |
|-------|------------|
| **Progress %** | Update progress (0-100) |
| **Status** | Ubah status penugasan |
| **Catatan** | Update catatan progress |

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan perubahan |
| **Mulai** | Set status ke In Progress |
| **Selesaikan** | Set status ke Completed |
| **Batal** | Cancel assignment |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/assignments` | Daftar assignment (support kanban) |
| GET | `/api/assignments/:id` | Detail assignment |
| POST | `/api/assignments` | Buat assignment baru |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Hapus assignment |
| PUT | `/api/assignments/:id/status` | Update status |

---

## Known Issues

1. **Pagination hardcoded** → Default ke page 1, size 20
2. **Error swallowed** → Error pada fetch tidak ditampilkan secara eksplisit

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./09-assessments.md) | [Menu Berikutnya](./11-executions.md)*
