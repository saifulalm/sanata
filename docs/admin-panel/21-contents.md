# 21. Artikel & Halaman

**URL**: `/admin/contents`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola konten dinamis situs web: artikel blog, halaman statis, dan testimonial. Menggunakan RichTextEditor (TipTap) untuk formatted content.

---

## Daftar Konten

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Judul** | Judul artikel/halaman |
| **Tipe** | PAGE / POST |
| **Kategori** | Kategori |
| **Status** | DRAFT / PUBLISHED / ARCHIVED |
| **Views** | Jumlah views |
| **Tanggal** | Tanggal dibuat/dipublish |
| **Author** | Pembuat |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari judul atau konten |
| **Status** | DRAFT, PUBLISHED, ARCHIVED |
| **Type** | PAGE, POST |
| **Kategori** | Filter kategori |

---

## Tipe Konten

| Type | Arti | Penggunaan |
|------|------|------------|
| **PAGE** | Halaman | About, Services, Contact |
| **POST** | Artikel | Blog, News, Updates |

---

## Status Konten

| Status | Arti | Terlihat di Publik |
|--------|------|-------------------|
| **DRAFT** | Simpanan draf | Tidak |
| **PUBLISHED** | Sudah publish | Ya |
| **ARCHIVED** | Diarsipkan | Tidak |

---

## Membuat Konten Baru

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Judul** | Ya | Judul konten |
| **Slug** | Auto | URL slug (auto-generated dari judul) |
| **Tipe** | Ya | PAGE / POST |
| **Kategori** | Ya | Pilih kategori |
| **Status** | Ya | DRAFT / PUBLISHED |
| **Featured Image** | Tidak | Gambar utama |
| **Excerpt** | Tidak | Ringkasan singkat |
| **Konten** | Ya | Isi konten (Rich Text) |

### Rich Text Editor (TipTap)

Fitur editor:

| Fitur | Shortcut | Keterangan |
|-------|----------|------------|
| **Bold** | Ctrl+B | Teks tebal |
| **Italic** | Ctrl+I | Teks miring |
| **Heading** | - | H1, H2, H3 |
| **List** | - | Bullet, Numbered |
| **Link** | Ctrl+K | Tambah hyperlink |
| **Image** | - | Insert gambar |
| **Quote** | - | Block quote |
| **Code** | - | Inline code / code block |

### SEO Fields

| Field | Keterangan |
|-------|------------|
| **Meta Title** | Title untuk SEO |
| **Meta Description** | Description untuk SEO |
| **Focus Keyword** | Keyword utama |
| **Canonical URL** | URL canonical |

---

## Detail & Edit Konten

**URL**: `/admin/contents/[id]` (jika ada detail page)

### Tab/Section

1. **Konten** — Editor utama
2. **SEO** — Settings SEO
3. **Media** — Gambar/video dalam konten
4. **Revisions** — Riwayat edit

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan sebagai DRAFT |
| **Publikasi** | Publish (DRAFT → PUBLISHED) |
| **Arsipkan** | Arsipkan (PUBLISHED → ARCHIVED) |
| **Preview** | Lihat preview sebelum publish |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/contents` | Daftar konten |
| GET | `/api/contents/:id` | Detail konten |
| GET | `/api/contents/slug/:slug` | Cari by slug |
| POST | `/api/contents` | Buat konten baru |
| PUT | `/api/contents/:id` | Update konten |
| DELETE | `/api/contents/:id` | Hapus konten |
| GET | `/api/categories` | Daftar kategori |
| GET | `/api/media` | Daftar media |

---

## Tips

1. **Auto-save** → Editor auto-save setiap 30 detik
2. **Preview** → Gunakan preview sebelum publish
3. **Slug** → Slug auto-generated tapi bisa diedit manual
4. **Featured Image** → Gambar utama untuk thumbnail dan OG image
5. **Excerpt** → Ringkasan untuk listing page dan meta description fallback

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./20-site-content.md) | [Menu Berikutnya](./22-scraper.md)*
