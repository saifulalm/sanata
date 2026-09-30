# 36. Broadcast (Otomatis)

**URL**: `/admin/broadcasts`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu broadcast untuk mengirim pesan massal secara otomatis. Berbeda dengan Campaign yang untuk email marketing, Broadcast lebih ke pesan otomatis dan integrasi WhatsApp/Telegram.

---

## Daftar Broadcast

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama broadcast |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Recipients** | Jumlah penerima |
| **Status** | DRAFT, QUEUED, SENDING, SENT, FAILED |
| **Created** | Tanggal dibuat |
| **Sent At** | Tanggal terkirim |
| **Aksi** | View, Send, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Status** | Status broadcast |

---

## Channel Providers

| Channel | Provider | Keterangan |
|---------|----------|------------|
| **EMAIL** | SMTP | Email via SMTP server |
| **WHATSAPP** | Baileys / Official | WhatsApp via API |
| **TELEGRAM** | Bot API | Telegram Bot |

### Provider Status

| Status | Arti |
|--------|------|
| **CONNECTED** | Tersambung |
| **DISCONNECTED** | Putus |
| **ERROR** | Error connection |

---

## Buat Broadcast

### Form

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama broadcast |
| **Channel** | Ya | EMAIL / WHATSAPP / TELEGRAM |
| **Recipients** | Ya | Pilih penerima |
| **Message** | Ya | Isi pesan |

### Recipient Selection

| Method | Keterangan |
|--------|------------|
| **All Contacts** | Semua kontak |
| **By List** | Pilih broadcast list |
| **By Tag** | Pilih berdasarkan tags |
| **Manual** | Masukkan manual |

---

## WhatsApp Broadcast

### Message Format

```
Halo {name}!

Terima kasih telah menghubungi Sanata Construction.

{project_info}

Best regards,
Tim Sanata
```

### Media Attachment

| Tipe | Keterangan |
|------|------------|
| **Image** | Kirim gambar dengan caption |
| **Document** | Kirim dokumen PDF |
| **Video** | Kirim video |

### Template (WhatsApp Official)

WhatsApp Official API requires pre-approved templates:
- Template Name
- Language
- Variables

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/broadcasts` | Daftar broadcast |
| GET | `/api/broadcasts/:id` | Detail broadcast |
| POST | `/api/broadcasts` | Buat broadcast |
| PUT | `/api/broadcasts/:id` | Update broadcast |
| DELETE | `/api/broadcasts/:id` | Hapus broadcast |
| POST | `/api/broadcasts/:id/send` | Kirim broadcast |
| POST | `/api/broadcasts/:id/cancel` | Batalkan |
| GET | `/api/broadcasts/:id/status` | Status pengiriman |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./35-broadcast-lists.md) | [Menu Berikutnya](./37-inquiries.md)*
