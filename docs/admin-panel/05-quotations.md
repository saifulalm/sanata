# 5. Surat Penawaran

**URL**: `/admin/quotations`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola Surat Penawaran harga ke klien. Setiap quotation berisi detail harga, terms, dan penanda tangan.

---

## Daftar Surat Penawaran

### Tampilan Tabel (QuotationBoard)

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor quotation (font monospace) |
| **Untuk** | Nama klien/pemberi tugas |
| **Perihal** | Judul/subjek penawaran |
| **Tanggal** | Tanggal quotation dibuat |
| **Berlaku Until** | Tanggal berakhirnya penawaran |
| **Nilai** | Total nilai penawaran (Rp) |
| **Status** | Status: DRAFT, SENT, APPROVED, REJECTED, EXPIRED |
| **Aksi** | View, Edit, Duplicate, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan nomor, klien, atau hal |
| **Status Filter** | Filter berdasarkan status |

---

## Membuat Surat Penawaran Baru

**URL**: `/admin/quotations/new`  
**Peran**: ADMIN, EDITOR

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nomor Quotation** | Ya | Auto-generated atau input manual |
| **Untuk** | Ya | Nama klien/pemberi tugas |
| **Alamat** | Tidak | Alamat klien |
| **Perihal** | Ya | Subjek penawaran |
| **Tanggal** | Ya | Tanggal quotation |
| **Berlaku Until** | Ya | Tanggal kadaluarsa |
| **Catatan** | Tidak | Catatan tambahan |

### Item Penawaran

Tabel item dengan:

| Kolom | Required | Keterangan |
|-------|----------|------------|
| **No** | Auto | Nomor urut |
| **Uraian** | Ya | Deskripsi item |
| **Qty** | Ya | Kuantitas |
| **Satuan** | Ya | Satuan (pcs, m2, dll) |
| **Harga Satuan** | Ya | Harga per unit |
| **Jumlah** | Auto | Qty × Harga Satuan |

**Aksi**: Tambah baris, Hapus baris

### Term & Conditions

| Field | Keterangan |
|-------|------------|
| **Payment Terms** | Contoh: "DP 30%,剩下 70%" |
| **Validitas** | Contoh: "Penawaran berlaku 30 hari" |
| **Pengiriman** | Contoh: "Pengiriman 14 hari kerja" |
| **Garansi** | Contoh: "Garansi 6 bulan" |

### Penanda Tangan

Pilih penanda tangan dari daftar yang tersedia:
- **Nama**: Nama lengkap
- **Jabatan**: Jabatan (Direksi Utama, Manajer Proyek, dll)
- **Tanda Tangan**: Upload gambar tanda tangan (opsional)

---

## Detail & Edit Quotation

**URL**: `/admin/quotations/[id]`  
**Peran**: ADMIN, EDITOR

Sama dengan form create, dengan data yang sudah terisi.

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan sebagai DRAFT |
| **Kirim** | Kirim quotation ke klien (status → SENT) |
| **Print** | Export sebagai PDF |
| **Duplicate** | Buat salinan quotation baru |

---

## Status Quotation

| Status | Arti | Badge Tone |
|--------|------|------------|
| `DRAFT` | Belum dikirim | neutral |
| `SENT` | Sudah dikirim | warning |
| `APPROVED` | Disetujui klien | success |
| `REJECTED` | Ditolak klien | danger |
| `EXPIRED` | Kadaluarsa | danger |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/quotations` | Daftar quotation |
| GET | `/api/quotations/:id` | Detail quotation |
| POST | `/api/quotations` | Buat quotation baru |
| PUT | `/api/quotations/:id` | Update quotation |
| DELETE | `/api/quotations/:id` | Hapus quotation |
| GET | `/api/signatories` | Daftar penanda tangan |

---

## Tips

1. **Template** → Gunakan quotation existing dan klik "Duplicate" untuk bikin baru dengan data mirip
2. **Auto-numbering** → Sistem auto-generate nomor: `QT-{YEAR}-{SEQUENCE}`
3. **Print** → Quotation siap print dengan layout yang sudah diformat
4. **Expired check** → Quotation expired tidak bisa di-sent

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./04-multi-schedule.md) | [Menu Berikutnya](./06-submissions.md)*
