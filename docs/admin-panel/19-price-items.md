# 19. Harga Satuan

**URL**: `/admin/price-items`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola database harga satuan item individual. Berbeda dengan AHSP yang analisa lengkap, Price Items adalah harga satuan material, alat, atau jasa tanpa dekomposisi komponen.

---

## Daftar Harga Satuan

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama item |
| **Kategori** | Kategori item |
| **Satuan** | Satuan default |
| **Harga** | Harga satuan (Rp) |
| **Sumber** | Sumber data harga |
| **Update** | Tanggal update terakhir |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan nama |
| **Kategori** | Filter berdasarkan kategori |
| **Sumber** | Filter berdasarkan sumber |

---

## Kategori Price Items

| Kategori | Contoh Items |
|----------|-------------|
| **Material** | Bata, semen, pasir, kayu, besi |
| **Tenaga** | Upah harian, borongan |
| **Alat** | Sewa alat, fuel |
| **Overhead** | Biaya umum |
| **Jasa** | Jasa borongan, konsultansi |

---

## Form Tambah/Edit

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Item** | Ya | Nama/jenis item |
| **Kategori** | Ya | Pilih kategori |
| **Satuan Default** | Ya | Satuan utama |
| **Harga** | Ya | Harga dalam Rp |
| **Sumber** | Tidak | Sumber data (tokopedia, supplier, dll) |
| **Deskripsi** | Tidak | Detail item |
| **Merek** | Tidak | Merek (jika applicable) |
| **Notes** | Tidak | Catatan tambahan |

### Variants (Opsional)

Item bisa memiliki multiple variants (misal: ukuran berbeda):

| Variant | Satuan | Harga |
|---------|--------|-------|
| 20 kg | zak | Rp 75,000 |
| 40 kg | zak | Rp 140,000 |
| 50 kg | zak | Rp 170,000 |

---

## Update Harga

| Metode | Keterangan |
|--------|------------|
| **Manual** | Input satu per satu |
| **Bulk Update** | Upload Excel |
| **API Integration** | Sinkron dari supplier |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/price-items` | Daftar price items |
| GET | `/api/price-items/:id` | Detail price item |
| POST | `/api/price-items` | Tambah price item |
| PUT | `/api/price-items/:id` | Update price item |
| DELETE | `/api/price-items/:id` | Hapus price item |

---

## Hubungan dengan AHSP

Price Items adalah komponen penyusun AHSP. Saat membuat AHSP, bisa pilih Price Items sebagai komponen:

```
AHSP Component → Price Item → Harga otomatis terisi
```

Ini memungkinkan update harga terpusat: jika Price Item diupdate, semua AHSP yang menggunakannya akan otomatis reflect harga baru (jika menggunakan referensi).

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./18-ahsp.md) | [Menu Berikutnya](./20-site-content.md)*
