# 17. Tools & Inventory

**URL**: `/admin/workforce/tools`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola inventory alat dan equipment. Includes tracking peminjaman, maintenance schedule, dan availability.

---

## Daftar Tools

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama alat |
| **Kategori** | Kategori (Elektrik, Plumbing, dll) |
| **Kode** | Kode inventory |
| **Stok** | Jumlah unit |
| **Tersedia** | Jumlah tersedia |
| **Dipinjam** | Jumlah dipinjam |
| **Status** | ACTIVE / MAINTENANCE / RETIRED |
| **Aksi** | View, Edit, Pinjam, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Kategori** | Filter berdasarkan kategori |
| **Status** | Filter berdasarkan status |
| **Availability** | Tersedia / Dipinjam / All |

---

## Kategori Tools

| Kategori | Contoh |
|----------|--------|
| **Elektrik** | Bor, gerinda, mesin las |
| **Plumbing** | Kunci pipa, tang, waterpass |
| **Survey** | Theodolit, GPS, meteran |
| **Transport** | Dolly, forklift, gerobak |
| **Safety** | Helm, sarung tangan, harness |
| **Lainnya** | Alat lainnya |

---

## Form Tambah/Edit Tool

**URL**: `/admin/workforce/tools/new` atau `/admin/workforce/tools/[id]/edit`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama alat |
| **Kategori** | Ya | Pilih kategori |
| **Kode** | Ya | Kode unik inventory |
| **Deskripsi** | Tidak | Deskripsi alat |
| **Merek/Model** | Tidak | Merek dan model |
| **Serial Number** | Tidak | Nomor seri |
| **Lokasi Penyimpanan** | Tidak | Gudang / Lokasi |
| **Stok Total** | Ya | Jumlah unit total |
| **Minimum Stok** | Ya | Minimum sebelum restock |
| **Status** | Ya | ACTIVE / MAINTENANCE / RETIRED |

### Maintenance Info

| Field | Keterangan |
|-------|------------|
| **Last Maintenance** | Tanggal maintenance terakhir |
| **Next Maintenance** | Tanggal maintenance berikutnya |
| **Maintenance Interval** | Interval (hari) |
| **Catatan Maintenance** | Riwayat maintenance |

---

## Peminjaman Tool

**URL**: `/admin/workforce/tools/[id]/loan`

### Form Peminjaman

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Worker yang pinjam |
| **Jumlah** | Ya | Jumlah unit dipinjam |
| **Tanggal Pinjam** | Ya | Tanggal pinjam |
| **Tanggal Kembali** | Ya | Tanggal rencana kembali |
| **Keperluan** | Ya | Tujuan peminjaman |
| **Notes** | Tidak | Catatan tambahan |

### Return Tool

Saat alat dikembalikan:
- Update stok tersedia
- Catat kondisi saat return
- Catat kerusakan jika ada

---

## Maintenance Schedule

### Daftar Maintenance

| Tool | Tanggal | Jenis | Status |
|------|---------|-------|--------|
| Bor Listrik #1 | 2026-10-15 | Service | PENDING |
| Theodolit | 2026-10-01 | Kalibrasi | COMPLETED |

### Quick Stats Card

- **Total Tools**: Jumlah seluruh alat
- **In Maintenance**: Alat sedang maintenance
- **On Loan**: Alat sedang dipinjam
- **Available Rate**: % ketersediaan

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/tools` | Daftar tools |
| GET | `/api/tools/:id` | Detail tool |
| POST | `/api/tools` | Tambah tool |
| PUT | `/api/tools/:id` | Update tool |
| DELETE | `/api/tools/:id` | Hapus tool |
| POST | `/api/tools/:id/loan` | Pinjam tool |
| POST | `/api/tools/:id/return` | Return tool |
| GET | `/api/tools/categories` | Daftar kategori |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./16-kpi.md) | [Menu Berikutnya](./18-ahsp.md)*
