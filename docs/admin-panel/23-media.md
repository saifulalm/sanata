# 23. Pustaka Media

**URL**: `/admin/media`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola file media (gambar, video, dokumen) yang digunakan di seluruh situs. Includes upload, organize, search, dan delete.

---

## Daftar Media

### Tampilan

#### Grid View
Thumbnails besar dengan filename dan ukuran.

#### List View
Tabel dengan detail lengkap.

| Kolom | Keterangan |
|-------|------------|
| **Preview** | Thumbnail gambar |
| **Nama File** | Nama file original |
| **Tipe** | MIME type (image/png, video/mp4, dll) |
| **Ukuran** | Size file |
| **Dimensions** | Width × Height (untuk gambar) |
| **Uploaded** | Tanggal upload |
| **Folder** | Folder penyimpanan |
| **Aksi** | Copy URL, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari filename |
| **Type** | Images, Videos, Documents, All |
| **Folder** | Filter folder |
| **Sort** | Tanggal, Nama, Ukuran |

---

## Upload Media

### Metode Upload

| Metode | Keterangan |
|--------|------------|
| **Drag & Drop** | Seret file ke area upload |
| **Browse** | Klik untuk pilih file |
| **Multi-upload** | Pilih/banyak sekaligus |
| **URL Import** | Import dari URL eksternal |

### Upload Settings

| Setting | Keterangan |
|---------|------------|
| **Folder** | Tentukan folder penyimpanan |
| **Overwrite** | Timpa jika file ada |
| **Resize** | Resize otomatis (untuk gambar) |
| **Compress** | Kompres untuk optimization |

### Batas Upload

| Tipe | Batas |
|------|-------|
| **Maks file size** | 10 MB (default) |
| **Format gambar** | JPG, PNG, GIF, WebP, SVG |
| **Format video** | MP4, WebM |
| **Format dokumen** | PDF, DOC, DOCX |

---

## Folder Organization

| Folder | Keterangan |
|--------|------------|
| **/** (root) | Semua media |
| **/images** | Semua gambar |
| **/videos** | Semua video |
| **/documents** | Semua dokumen |
| **/avatars** | Foto profil |
| **/banners** | Gambar banner |
| **/products** | Gambar produk |
| **/contents** | Gambar artikel |

---

## Copy URL / Path

Setiap media memiliki:
- **URL Publik**: `https://sanata.id/media/xxx.jpg`
- **Path**: `/uploads/2025/09/xxx.jpg`
- **Markdown**: `![alt](url)`
- **HTML**: `<img src="url" />`

Tombol **Copy** untuk salin ke clipboard.

---

## Image Editor (Light)

Fitur edit ringan:

| Fitur | Keterangan |
|-------|------------|
| **Crop** | Potong area |
| **Resize** | Ubah ukuran |
| **Rotate** | Putar 90° |
| **Flip** | Balik horizontal/vertikal |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/media` | Daftar media |
| GET | `/api/media/:id` | Detail media |
| POST | `/api/media` | Upload media baru |
| DELETE | `/api/media/:id` | Hapus media |
| POST | `/api/media/import-url` | Import dari URL |
| GET | `/api/media/folders` | Daftar folder |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./22-scraper.md) | [Menu Berikutnya](./24-seo.md)*
