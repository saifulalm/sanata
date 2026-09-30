# 11. Execution & Dokumentasi

**URL**: `/admin/workforce/executions`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mendokumentasikan pelaksanaan pekerjaan harian. Execution record mencakup progress, foto, GPS location, dan catatan harian.

---

## Daftar Execution

### Tampilan Tabel / Board

| Kolom | Keterangan |
|-------|------------|
| **Tanggal** | Tanggal pelaksanaan |
| **Proyek** | Nama proyek RAB |
| **Worker** | Worker yang melaksanakan |
| **Assignment** | Penugasan terkait |
| **Progress** | % progress saat itu |
| **Status** | DRAFT, SUBMITTED, APPROVED |
| **Foto** | Thumbnail foto dokumentasi |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Tanggal** | Range tanggal |
| **Proyek** | Filter berdasarkan RAB |
| **Worker** | Filter berdasarkan worker |
| **Status** | Filter berdasarkan status |

---

## Membuat Execution Baru

**URL**: `/admin/workforce/executions/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Tanggal** | Ya | Tanggal pelaksanaan |
| **Assignment** | Ya | Pilih penugasan |
| **Proyek** | Auto | Terisi otomatis dari assignment |
| **Worker** | Auto | Worker dari assignment |
| **Deskripsi** | Ya | Uraian pekerjaan hari itu |

### Progress Update

| Field | Required | Keterangan |
|-------|----------|------------|
| **Progress %** | Ya | Progress saat ini (0-100) |
| **Target Hari Ini** | Tidak | Target yang ingin dicapai |
| **Realisasi** | Tidak | Actual yang tercapai |

### Dokumentasi Foto

| Elemen | Keterangan |
|--------|------------|
| **Upload Foto** | Multiple foto (drag-drop atau browse) |
| **Caption** | Deskripsi tiap foto |
| **Annotasi** | Tandai area penting di foto |

### GPS Location

| Field | Keterangan |
|-------|------------|
| **Latitude** | Koordinat latitude |
| **Longitude** | Koordinat longitude |
| **Accuracy** | Akurasi GPS (meter) |

> **Catatan**: Fitur GPS memerlukan device dengan GPS dan permission browser.

---

## Detail Execution

**URL**: `/admin/workforce/executions/[id]`

### Informasi

- Tanggal dan waktu
- Worker yang melaksanakan
- Proyek dan assignment
- Progress saat itu

### Dokumentasi

- Gallery foto dengan caption
- GPS coordinates (jika ada)
- Peta lokasi (jika ada)

### Catatan

- Deskripsi pekerjaan
- Catatan dari site manager
- Issue/kendala yang ditemukan

---

## Edit Execution

**URL**: `/admin/workforce/executions/[id]/edit`

Sama dengan form create, dengan data pre-filled.

### Restriksi
- Mungkin tidak bisa edit jika status sudah APPROVED
- Edit mungkin terbatas hanya oleh admin atau site manager

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/executions` | Daftar execution |
| GET | `/api/executions/:id` | Detail execution |
| POST | `/api/executions` | Buat execution baru |
| PUT | `/api/executions/:id` | Update execution |
| DELETE | `/api/executions/:id` | Hapus execution |

---

## GPS Input Component

Komponen `GpsInput` digunakan untuk input koordinat:

```
┌─────────────────────────────────┐
│ 📍 Lokasi GPS                  │
├─────────────────────────────────┤
│ Latitude:  [-6.2087634      ]  │
│ Longitude: [106.845599       ]  │
│                                 │
│ [📍 Deteksi Otomatis]           │
│ Status: ● Akurat (±5m)        │
└─────────────────────────────────┘
```

Fitur:
- Input manual latitude/longitude
- Tombol "Deteksi Otomatis" untuk auto-detect via browser Geolocation API
- Validasi format koordinat
- Tampilan akurasi GPS

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./10-assignments.md) | [Menu Berikutnya](./12-qc.md)*
