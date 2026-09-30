# 24. SEO

**URL**: `/admin/seo`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola Search Engine Optimization (SEO) seluruh situs. Includes sitemap, robots.txt, meta settings, dan analytics integration.

---

## SEO Settings

### Global Settings

| Setting | Keterangan |
|---------|------------|
| **Site Title** | Judul default situs |
| **Site Description** | Deskripsi default |
| **Default OG Image** | Gambar default untuk social share |
| **Twitter Card Type** | Summary / Summary Large Image |
| **Google Analytics ID** | GA4 tracking ID |
| **Google Search Console** | Verification code |

### Robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /client/
```

### Sitemap Settings

| Setting | Keterangan |
|---------|------------|
| **Auto-generate** | Generate sitemap otomatis |
| **Include** | Halaman, Artikel, Kategori, Products |
| **Change Frequency** | daily, weekly, monthly |
| **Priority** | default priority |

---

## Per-Page SEO

Setiap page/content memiliki SEO fields:

| Field | Keterangan |
|-------|------------|
| **Meta Title** | Title tag (50-60 chars ideal) |
| **Meta Description** | Meta description (150-160 chars ideal) |
| **Focus Keyword** | Keyword utama |
| **Canonical URL** | URL canonical |
| **Robots** | index, noindex, follow, nofollow |
| **OG Image** | Gambar untuk social share |

---

## SEO AI Assistant

Fitur AI untuk bantu optimize:

| Fitur | Keterangan |
|-------|------------|
| **Title Generator** | Generate SEO title dari konten |
| **Description Generator** | Generate meta description |
| **Keyword Suggestions** | Saran keyword terkait |
| **Content Score** | Skor SEO konten (0-100) |

---

## Analytics

### Google Analytics Integration

| Metric | Keterangan |
|--------|------------|
| **Pageviews** | Jumlah pageviews |
| **Unique Visitors** | Visitor unik |
| **Bounce Rate** | Persentase bounce |
| **Avg. Time on Page** | Rata-rata waktu |
| **Top Pages** | Halaman paling populer |

### Search Console Integration

| Metric | Keterangan |
|--------|------------|
| **Impressions** | Jumlah muncul di search |
| **Clicks** | Jumlah klik dari search |
| **CTR** | Click-through rate |
| **Position** | Posisi rata-rata |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/seo/settings` | Ambil SEO settings |
| PUT | `/api/seo/settings` | Update SEO settings |
| GET | `/api/seo/sitemap` | Generate sitemap |
| GET | `/api/seo/analytics` | Data analytics |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./23-media.md) | [Menu Berikutnya](./25-products.md)*
