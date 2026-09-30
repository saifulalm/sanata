# 20. Konten Situs

**URL**: `/admin/site-content`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengatur konten statis situs web (perbedaan dengan Artikel/Halaman: ini untuk halaman yang tidak perlu editor rich text, hanya key-value settings).

---

## Daftar Collection

Halaman menampilkan daftar "collections" (kelompok settings):

| Collection | Keterangan |
|------------|------------|
| **company** | Informasi perusahaan |
| **contact** | Informasi kontak |
| **social** | Link social media |
| **seo** | Default SEO settings |
| **homepage** | Konten homepage |
| **footer** | Konten footer |
| **header** | Konten header |

---

## Edit Collection

**URL**: `/admin/site-content/[collection]`

### Contoh: company

| Field | Keterangan |
|-------|------------|
| **company_name** | Nama perusahaan |
| **tagline** | Tagline |
| **description** | Deskripsi singkat |
| **founded_year** | Tahun berdiri |
| **vision** | Visi perusahaan |
| **mission** | Misi perusahaan |

### Contoh: contact

| Field | Keterangan |
|-------|------------|
| **address** | Alamat lengkap |
| **phone** | Nomor telepon |
| **email** | Email |
| **whatsapp** | WhatsApp |
| **maps_embed** | Google Maps embed code |
| **operating_hours** | Jam operasional |

### Contoh: social

| Field | Keterangan |
|-------|------------|
| **instagram** | URL Instagram |
| **facebook** | URL Facebook |
| **linkedin** | URL LinkedIn |
| **youtube** | URL YouTube |
| **tiktok** | URL TikTok |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/site-content` | Ambil semua content |
| GET | `/api/site-content/:collection` | Ambil satu collection |
| PUT | `/api/site-content/:collection` | Update collection |
| GET | `/api/site-content/:collection/:key` | Ambil satu key |
| PUT | `/api/site-content/:collection/:key` | Update satu key |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./19-price-items.md) | [Menu Berikutnya](./21-contents.md)*
