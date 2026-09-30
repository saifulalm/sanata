# 18. AHSP

**URL**: `/admin/ahsp`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

AHSP (Analisis Harga Satuan Pekerjaan) adalah database analisa harga per item pekerjaan. Setiap AHSP terdiri dari kode, uraian, satuan, dan komponen material + tenaga + alat.

---

## Daftar AHSP

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Kode** | Kode AHSP (font monospace, contoh: `A.4.1.1`) |
| **Uraian** | Deskripsi pekerjaan |
| **Satuan** | Satuan (m2, m3, kg, dll) |
| **Komponen** | Jumlah komponen penyusun |
| **Harga** | Total harga analisa |

### Statistik Header

| Stat | Value |
|------|-------|
| **Total Analisa** | Jumlah AHSP dalam database |
| **Total Komponen** | Total komponen semua AHSP |
| **Rata-rata Harga** | Rata-rata harga AHSP |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan kode atau uraian |
| **Kategori** | Filter berdasarkan kategori (opsional) |

---

## Form Tambah/Edit AHSP

### Header Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Kode** | Ya | Kode analisa (contoh: `A.4.1.1`, `B.2.3.5`) |
| **Uraian Pekerjaan** | Ya | Deskripsi (contoh: `Pemasangan 1 m2 dinding bata merah`) |
| **Satuan** | Ya | Satuan (contoh: `m2`, `m3`, `kg`, `pcs`) |
| **Kategori** | Tidak | Kelompok pekerjaan |
| **Overhead (%)** | Ya | Persentase overhead (0-100, default: 0.00) |

### Komponen

AHSP terdiri dari komponen:

| Komponen | Tipe | Deskripsi |
|----------|------|-----------|
| **Material** | Material | Bahan/material yang digunakan |
| **Labour** | Tenaga | Upah tenaga kerja |
| **Equipment** | Alat | Peralatan yang digunakan |

#### Tabel Komponen

| Kolom | Required | Keterangan |
|-------|----------|------------|
| **Tipe** | Ya | Material / Labour / Equipment |
| **Deskripsi** | Ya | Nama komponen |
| **Satuan** | Ya | Satuan komponen |
| **Koefisien** | Ya | Jumlah per satuan AHSP |
| **Harga Satuan** | Ya | Harga per satuan komponen |
| **Jumlah** | Auto | Koefisien × Harga |

**Total Harga**: Dijumlahkan dari semua komponen × (1 + overhead%)

### Tambah Komponen

Klik **+ Tambah Komponen** untuk menambah baris baru.

---

## Contoh AHSP

```
AHSP: A.4.1.1 - Pemasangan 1 m2 dinding bata merah ukuran (5x11x22) cm
Satuan: m2
Overhead: 0%

Komponen:
┌──────────┬─────────────────────────┬────────┬───────────┬────────────┬──────────┐
│ Tipe     │ Deskripsi               │ Sat    │ Koefisien │ Harga Sat  │ Jumlah   │
├──────────┼─────────────────────────┼────────┼───────────┼────────────┼──────────┤
│ Material │ Bata merah               │ bh     │ 70.0000   │ Rp 300     │ 21,000   │
│ Material │ Semen PC                 │ kg     │ 14.5000   │ Rp 1,500   │ 21,750   │
│ Material │ Pasir Pasang             │ m3     │ 0.0200    │ 250,000    │ 5,000    │
│ Labour   │ Pekerja                  │ OH     │ 0.3000    │ 75,000     │ 22,500   │
│ Labour   │ Tukang Batu              │ OH     │ 0.1000    │ 100,000    │ 10,000   │
│ Equipment│ -                        │ -      │ -         │ -          │ 0        │
└──────────┴─────────────────────────┴────────┴───────────┴────────────┴──────────┘
Sub Total: Rp 80,250
```

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/ahsp` | Daftar AHSP |
| GET | `/api/ahsp/:id` | Detail AHSP |
| POST | `/api/ahsp` | Tambah AHSP baru |
| PUT | `/api/ahsp/:id` | Update AHSP |
| DELETE | `/api/ahsp/:id` | Hapus AHSP |

---

## Tips

1. **Kode SNI** → Gunakan kode sesuai SNI (Sistem Nasional Indonesia) untuk standarisasi
2. **Komponen** → Setiap AHSP bisa memiliki banyak komponen material + labour + equipment
3. **Overhead** → Gunakan jika ada biaya umum yang perlu ditambahkan
4. **Import** → AHSP bisa di-import dari Excel untuk bulk entry

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./17-tools.md) | [Menu Berikutnya](./19-price-items.md)*
