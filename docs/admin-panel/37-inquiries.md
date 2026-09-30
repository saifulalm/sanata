# 37. Pesan Masuk

**URL**: `/admin/inquiries`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola pesan/m enquiries yang masuk dari situs web. Pesan bisa dari:
- Form kontak website
- Landing page forms
- Chat widget
- Email langsung

---

## Daftar Pesan

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama pengirim |
| **Email** | Email pengirim |
| **Telepon** | Nomor telepon |
| **Layanan** | Layanan yang diminta |
| **Pesan** | Preview pesan |
| **Status** | NEW, CONTACTED, CLOSED |
| **Tanggal** | Tanggal masuk |
| **Aksi** | View, Reply, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari nama, email, atau pesan |
| **Status** | NEW, CONTACTED, CLOSED |
| **Date Range** | Filter tanggal |
| **Service** | Filter berdasarkan layanan |

---

## Status Pesan

| Status | Arti | Badge | Aksi |
|--------|------|-------|------|
| `NEW` | Pesan baru, belum ditangani | Warning (kuning) | Perlu ditindaklanjuti |
| `CONTACTED` | Sudah dihubungi | Info (blue) | Dalam proses |
| `CLOSED` | Selesai ditutup | Success (hijau) | Tidak perlu aksi |

---

## Detail Pesan

**URL**: `/admin/inquiries/[id]`

### Informasi Pengirim

| Field | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Email** | Alamat email |
| **Telepon** | Nomor telepon |
| **Perusahaan** | Nama perusahaan (jika ada) |
| **Sumber** | Dari mana pesan datang |
| **Layanan** | Layanan yang diminta |

### Isi Pesan

| Field | Keterangan |
|-------|------------|
| **Subjek** | Subjek pesan |
| **Pesan** | Isi lengkap pesan |
| **Attachments** | Lampiran (jika ada) |

### Metadata

| Field | Keterangan |
|-------|------------|
| **Tanggal Masuk** | Kapan pesan masuk |
| **IP Address** | Alamat IP pengirim |
| **User Agent** | Browser yang digunakan |

---

## Reply Pesan

### Compose Reply

| Field | Keterangan |
|-------|------------|
| **To** | Email pengirim (auto-filled) |
| **Subject** | Subjek (Re: [original subject]) |
| **Template** | Pilih template balasan |
| **Message** | Isi balasan (Rich Text) |

### Template Balasan

Template yang sudah dibuat untuk balasan cepat:

| Template | Keterangan |
|----------|------------|
| **Terima Kasih** | Balasan terima kasih otomatis |
| **Permintaan Info** | Minta informasi tambahan |
| **Penawaran** | Kirim quotation |
| **Penjadwalan** | Jadwalkan meeting |

---

## Aksi Massal

| Aksi | Keterangan |
|------|------------|
| **Mark as Contacted** | Set status ke CONTACTED |
| **Mark as Closed** | Set status ke CLOSED |
| **Delete Selected** | Hapus pesan yang dipilih |
| **Export** | Export ke CSV |

---

## Notifikasi

### Badge Counter

Menu sidebar menampilkan badge dengan jumlah pesan NEW:

```
Pesan Masuk [3]  ← Badge merah
```

### Dashboard Integration

Dashboard menampilkan ringkasan pesan baru:
- **Card Stats**: "Pesan Baru" dengan trend
- **Panel**: "Perlu Ditindaklanjuti" dengan 5 pesan terbaru

---

## Integrasi CRM

Pesan bisa di-convert menjadi:

| Convert To | Keterangan |
|-----------|------------|
| **Contact** | Masuk ke database kontak marketing |
| **Lead** | Masuk ke pipeline sales |
| **Project** | Buat proyek baru |
| **Task** | Buat task untuk follow-up |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/inquiries` | Daftar inquiry |
| GET | `/api/inquiries/:id` | Detail inquiry |
| POST | `/api/inquiries` | Buat inquiry baru |
| PUT | `/api/inquiries/:id` | Update inquiry |
| PUT | `/api/inquiries/:id/status` | Update status |
| DELETE | `/api/inquiries/:id` | Hapus inquiry |
| POST | `/api/inquiries/:id/reply` | Kirim balasan |

---

## Workflow Penanganan

```
Pesan Masuk (NEW)
       │
       ▼
┌──────────────┐
│ Hubungi      │ ──── telepon/email ────▶
│ (CONTACTED)  │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Follow-up?  │ ── Ya ──▶ Hubungi lagi
│             │ ── Tidak ──▶
└──────────────┘
       │
       ▼
┌──────────────┐
│ Tutup        │
│ (CLOSED)    │
└──────────────┘
```

---

## Tips

1. **Prioritas** → Cek pesan NEW setiap pagi
2. **Template** → Gunakan template untuk balasan cepat
3. **Badge** → Badge merah di sidebar menunjukkan jumlah pesan baru
4. **Export** → Export pesan lama untuk backup

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./36-broadcast.md) | [Menu Berikutnya](./38-login.md)*
