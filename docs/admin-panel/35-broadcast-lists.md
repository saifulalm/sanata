# 35. Broadcast Lists

**URL**: `/admin/marketing/broadcast`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola daftar broadcast dan mengirim pesan massal via berbagai channel (Email, WhatsApp, Telegram).

---

## Daftar Broadcast List

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama daftar |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Contacts** | Jumlah kontak |
| **Status** | ACTIVE, INACTIVE |
| **Created** | Tanggal dibuat |
| **Aksi** | View, Edit, Send, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Status** | ACTIVE, INACTIVE |

---

## Membuat Broadcast List

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama daftar broadcast |
| **Channel** | Ya | Channel yang digunakan |
| **Description** | Tidak | Deskripsi daftar |
| **Status** | Ya | ACTIVE / INACTIVE |

### Add Contacts

| Method | Keterangan |
|--------|------------|
| **Select Contacts** | Pilih dari database kontak |
| **Manual Add** | Tambah manual satu per satu |
| **Import CSV** | Import dari file CSV |

### Channel Configuration

**Email:**
- SMTP settings
- Sender name & email

**WhatsApp:**
- Baileys / Official API
- Phone number
- Template approval

**Telegram:**
- Bot token
- Chat IDs

---

## Send Broadcast

### Step 1: Select List

Pilih broadcast list yang akan dikirim.

### Step 2: Compose Message

| Field | Keterangan |
|-------|------------|
| **Message** | Isi pesan |
| **Variables** | {name}, {email} dll |
| **Preview** | Preview pesan |

### Variable Placeholders

| Variable | Output |
|----------|--------|
| `{name}` | Nama kontak |
| `{email}` | Email |
| `{company}` | Company |
| `{date}` | Tanggal kirim |

### Step 3: Schedule

| Option | Keterangan |
|--------|------------|
| **Send Now** | Kirim sekarang |
| **Schedule** | Jadwalkan |
| **Recurring** | Pengiriman berulang |

### Step 4: Confirm & Send

Preview jumlah penerima, estimated time, dan konfirmasi.

---

## Connection Status

| Status | Arti | Color |
|--------|------|-------|
| **CONNECTED** | Channel aktif | Green |
| **DISCONNECTED** | Channel tidak terhubung | Gray |
| **ERROR** | Ada error | Red |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/broadcast` | Daftar broadcast list |
| GET | `/api/marketing/broadcast/:id` | Detail list |
| POST | `/api/marketing/broadcast` | Buat list baru |
| PUT | `/api/marketing/broadcast/:id` | Update list |
| DELETE | `/api/marketing/broadcast/:id` | Hapus list |
| POST | `/api/marketing/broadcast/:id/send` | Kirim broadcast |
| GET | `/api/broadcast/connections` | Status koneksi |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./34-contacts.md) | [Menu Berikutnya](./36-broadcast.md)*
