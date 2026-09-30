# 26. Kategori

**URL**: `/admin/categories`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola kategori yang digunakan di:
- Konten/Artikel (`contents`)
- Layanan (`products`)
- Media

---

## Daftar Kategori

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama kategori |
| **Slug** | URL slug |
| **Tipe** | Jenis kategori (content/product) |
| **Parent** | Kategori parent (jika ada) |
| **Items** | Jumlah item dalam kategori |
| **Status** | ACTIVE / INACTIVE |
| **Aksi** | Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Tipe** | Content, Product, All |
| **Status** | Active, Inactive |

---

## Hierarki Kategori

Kategori bisa memiliki parent-child:

```
├── Konstruksi
│   ├── Pembangunan Rumah
│   ├── Renovasi
│   └── Interior
├── Konsultasi
│   ├── Desain
│   └── Pengawasan
└── Lainnya
```

### Field Parent

| Field | Keterangan |
|-------|------------|
| **Parent** | Pilih parent category (atau "None" untuk root) |

---

## Form Tambah/Edit Kategori

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama kategori |
| **Slug** | Auto | URL slug (auto-generated) |
| **Tipe** | Ya | content / product |
| **Parent** | Tidak | Parent category |
| **Deskripsi** | Tidak | Deskripsi kategori |
| **Status** | Ya | ACTIVE / INACTIVE |

### Fields Tambahan

| Field | Keterangan |
|-------|------------|
| **Icon** | Icon untuk kategori (opsional) |
| **Image** | Gambar kategori |
| **Color** | Warna untuk differentiate |
| **Order** | Urutan tampil |

### SEO Fields

| Field | Keterangan |
|-------|------------|
| **Meta Title** | SEO title |
| **Meta Description** | SEO description |

---

## Kategori Default

Seed data biasanya membuat kategori default:

**Content Categories:**
- Berita
- Proyek
- Tips & Tricks
- Testimonial

**Product Categories:**
- Pembangunan
- Renovasi
- Konsultasi
- Interior

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/categories` | Daftar kategori |
| GET | `/api/categories/:id` | Detail kategori |
| GET | `/api/categories/tree` | Tree/hierarki kategori |
| POST | `/api/categories` | Tambah kategori |
| PUT | `/api/categories/:id` | Update kategori |
| DELETE | `/api/categories/:id` | Hapus kategori |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./25-products.md) | [Menu Berikutnya](./27-users.md)*
