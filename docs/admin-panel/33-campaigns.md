# 33. Campaigns

**URL**: `/admin/marketing/campaigns`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola kampanye marketing (email, broadcast). Campaigns adalah email marketing terencana yang dikirim ke segment tertentu.

---

## Daftar Campaign

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama campaign |
| **Subject** | Subjek email |
| **Status** | DRAFT, SCHEDULED, SENDING, SENT, FAILED |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Sent** | Jumlah terkirim |
| **Opens** | Jumlah terbuka |
| **Clicks** | Jumlah diklik |
| **Tanggal** | Tanggal kirim/buat |
| **Aksi** | View, Edit, Duplicate, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Status** | Filter status |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Date Range** | Filter tanggal |

---

## Status Campaign

| Status | Arti | Badge |
|--------|------|-------|
| `DRAFT` | Belum dikirim | Gray |
| `SCHEDULED` | Terjadwal | Blue |
| `SENDING` | Sedang dikirim | Yellow |
| `SENT` | Selesai dikirim | Green |
| `PARTIAL` | Sebagian dikirim | Orange |
| `FAILED` | Gagal | Red |
| `CANCELLED` | Dibatalkan | Gray |

---

## Membuat Campaign Baru

**URL**: `/admin/marketing/campaigns/new`

### Step 1: Setup

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Campaign** | Ya | Nama internal |
| **Subject** | Ya | Subjek email |
| **Channel** | Ya | EMAIL / WHATSAPP / TELEGRAM |

### Step 2: Audience

| Field | Required | Keterangan |
|-------|----------|------------|
| **Segment** | Ya | Pilih segment target |
| **Exclude** | Tidak | Segment yang dikecualikan |
| **Estimated Recipients** | Auto | Jumlah penerima |

### Segment Options

| Segment | Keterangan |
|---------|------------|
| **All Contacts** | Semua kontak |
| **By Tag** | Berdasarkan tag |
| **By Source** | Berdasarkan sumber |
| **By Status** | Active/Inactive |
| **Custom List** | Daftar manual |

### Step 3: Content

| Field | Required | Keterangan |
|-------|----------|------------|
| **Template** | Tidak | Pilih template |
| **Content** | Ya | Isi pesan (Plain text atau HTML) |

### Step 4: Schedule

| Field | Required | Keterangan |
|-------|----------|------------|
| **Send Now** | - | Kirim sekarang |
| **Schedule** | - | Jadwalkan untuk nanti |
| **Date & Time** | Ya (jika schedule) | Tanggal dan waktu kirim |

---

## Analytics Campaign

### Metrics

| Metric | Keterangan |
|--------|------------|
| **Sent** | Jumlah email terkirim |
| **Delivered** | Jumlah berhasil terkirim |
| **Bounced** | Jumlah bounce |
| **Opened** | Jumlah email dibuka |
| **Clicked** | Jumlah link diklik |
| **Unsubscribed** | Jumlah unsubscribe |

### Chart

| Chart | Keterangan |
|-------|------------|
| **Timeline** | Opens/clicks over time |
| **Geographic** | Lokasi penerima |
| **Device** | Desktop vs Mobile |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/campaigns` | Daftar campaign |
| GET | `/api/marketing/campaigns/:id` | Detail campaign |
| POST | `/api/marketing/campaigns` | Buat campaign |
| PUT | `/api/marketing/campaigns/:id` | Update campaign |
| DELETE | `/api/marketing/campaigns/:id` | Hapus campaign |
| POST | `/api/marketing/campaigns/:id/send` | Kirim campaign |
| POST | `/api/marketing/campaigns/:id/cancel` | Batalkan campaign |
| GET | `/api/marketing/campaigns/:id/analytics` | Analytics |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./32-marketing.md) | [Menu Berikutnya](./34-contacts.md)*
