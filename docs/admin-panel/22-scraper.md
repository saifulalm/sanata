# 22. Article Scraper

**URL**: `/admin/scraper`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk scrape/mengambil konten artikel dari URL eksternal. Berguna untuk:
- Import konten dari sumber lain
- Backup konten dari website lain
- Research competitor

---

## Fitur Scraper

### Input URL

| Field | Keterangan |
|-------|------------|
| **URL** | URL lengkap halaman yang akan di-scrape |
| **Options** | Pilihan scraping |

### Options

| Option | Keterangan |
|--------|------------|
| **Images** | Download gambar (Y/N) |
| **Links** | Preserve links (Y/N) |
| **Strip CSS** | Hapus inline styles (Y/N) |
| **Translate** | Translate konten (Y/N) |

---

## Preview Scraper

Setelah URL dimasukkan:

### Preview Output

| Field | Keterangan |
|-------|------------|
| **Title** | Judul artikel |
| **Excerpt** | Ringkasan |
| **Content Preview** | Preview 500 karakter pertama |
| **Images** | Daftar gambar yang akan didownload |
| **Word Count** | Jumlah kata |

### Editable Fields

Sebelum confirm import:

| Field | Keterangan |
|-------|------------|
| **Title** | Edit judul (pre-filled) |
| **Slug** | Edit slug (auto-generated) |
| **Content** | Edit konten (WYSIWYG) |
| **Author** | Author attribution |
| **Source URL** | URL sumber asli |

---

## Import Options

| Option | Keterangan |
|--------|------------|
| **Create as Draft** | Import sebagai DRAFT |
| **Create as Published** | Langsung publish |
| **Add Source Attribution** | Tambah atribusi sumber |
| **Download Images** | Download gambar ke server |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/scraper/scrape` | Scrape URL |
| GET | `/api/scraper/preview` | Preview hasil scrape |

---

## Catatan Penting

1. **Copyright** → Pastikan memiliki izin untuk mengimport konten
2. **Attribution** → Selalu cantumkan sumber asli
3. **Rate Limit** → Tidak semua website bisa di-scrape
4. **Login Wall** → Website dengan login tidak bisa di-scrape

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./21-contents.md) | [Menu Berikutnya](./23-media.md)*
