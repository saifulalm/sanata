# 25. Layanan

**URL**: `/admin/products`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola layanan/jasa yang ditawarkan. Layanan ditampilkan di halaman `/services` situs publik.

---

## Daftar Layanan

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama layanan |
| **Kategori** | Kategori layanan |
| **Harga** | Harga dari |
| **Status** | ACTIVE / INACTIVE |
| **Featured** | Ya/Tidak |
| **Order** | Urutan tampil |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari nama layanan |
| **Kategori** | Filter kategori |
| **Status** | ACTIVE, INACTIVE |

---

## Form Tambah/Edit Layanan

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama layanan |
| **Slug** | Auto | URL slug |
| **Kategori** | Ya | Pilih kategori |
| **Deskripsi** | Ya | Deskripsi layanan (Rich Text) |
| **Harga** | Ya | Harga dari (Rp) |
| **Satuan** | Ya | Satuan harga (per proyek, per m2, dll) |
| **Status** | Ya | ACTIVE / INACTIVE |
| **Featured** | Tidak | Tampilkan di homepage (Y/N) |

### Detail Fields

| Field | Keterangan |
|-------|------------|
| **Short Description** | Ringkasan singkat (untuk card) |
| **Benefits** | Daftar manfaat layanan |
| **Included** | Yang termasuk dalam layanan |
| **Process** | Alur proses |

### Media

| Field | Keterangan |
|-------|------------|
| **Featured Image** | Gambar utama layanan |
| **Gallery** | Galeri foto |
| **Brochure** | File PDF brosur |

### SEO

| Field | Keterangan |
|-------|------------|
| **Meta Title** | SEO title |
| **Meta Description** | SEO description |
| **Focus Keyword** | Keyword utama |

---

## Featured Services

Layanan dengan `featured: true` ditampilkan di:
- Homepage carousel/section
- Service listing (prioritas atas)

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/products` | Daftar produk/layanan |
| GET | `/api/products/:id` | Detail produk |
| GET | `/api/products/featured` | Produk featured |
| POST | `/api/products` | Tambah produk |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./24-seo.md) | [Menu Berikutnya](./26-categories.md)*
