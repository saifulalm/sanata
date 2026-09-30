---
name: sanata-admin-documentation
description: Dokumentasi lengkap Admin Panel Sanata Construction Management System
version: 1.0
last_updated: 2026-09-29
---

# Dokumentasi Admin Panel — Sanata Construction

## Daftar Isi

| No | Menu | Lokasi | Peran |
|----|------|--------|-------|
| 1 | [Dashboard](#1-dashboard) | `/admin` | Semua |
| 2 | [Proyek & RAB](#2-proyek--rab) | `/admin/rab` | Admin, Editor |
| 3 | [Import RAB dari Excel](#3-import-rab-dari-excel) | `/admin/rab/import` | Admin, Editor |
| 4 | [Perbandingan Kurva S](#4-perbandingan-kurva-s) | `/admin/rab/multi-schedule` | Admin, Editor |
| 5 | [Surat Penawaran](#5-surat-penawaran) | `/admin/quotations` | Admin, Editor |
| 6 | [Pengajuan](#6-pengajuan) | `/admin/submissions` | Admin, Editor |
| 7 | [Workforce Dashboard](#7-workforce-dashboard) | `/admin/workforce` | Semua |
| 8 | [Database Worker](#8-database-worker) | `/admin/workforce/workers` | Admin, Editor |
| 9 | [Assessment](#9-assessment) | `/admin/workforce/assessments` | Admin, Editor |
| 10 | [Penugasan (Assignments)](#10-penugasan-assignments) | `/admin/workforce/assignments` | Admin, Editor |
| 11 | [Execution & Dokumentasi](#11-execution--dokumentasi) | `/admin/workforce/executions` | Admin, Editor |
| 12 | [Quality Control](#12-quality-control-qc) | `/admin/workforce/qc` | Admin, Editor |
| 13 | [Method Statements](#13-method-statements) | `/admin/workforce/method-statements` | Admin, Editor |
| 14 | [QC Templates](#14-qc-templates) | `/admin/workforce/qc-templates` | Admin, Editor |
| 15 | [Lesson Learned](#15-lesson-learned) | `/admin/workforce/lesson-learned` | Semua |
| 16 | [KPI Performance](#16-kpi-performance) | `/admin/workforce/kpi` | Admin, Editor |
| 17 | [Tools & Inventory](#17-tools--inventory) | `/admin/workforce/tools` | Admin, Editor |
| 18 | [AHSP](#18-ahsp) | `/admin/ahsp` | Admin, Editor |
| 19 | [Harga Satuan](#19-harga-satuan) | `/admin/price-items` | Admin, Editor |
| 20 | [Konten Situs](#20-konten-situs) | `/admin/site-content` | Admin, Editor |
| 21 | [Artikel & Halaman](#21-artikel--halaman) | `/admin/contents` | Admin, Editor |
| 22 | [Article Scraper](#22-article-scraper) | `/admin/scraper` | Admin, Editor |
| 23 | [Pustaka Media](#23-pustaka-media) | `/admin/media` | Admin, Editor |
| 24 | [SEO](#24-seo) | `/admin/seo` | Admin, Editor |
| 25 | [Layanan](#25-layanan) | `/admin/products` | Admin, Editor |
| 26 | [Kategori](#26-kategori) | `/admin/categories` | Admin, Editor |
| 27 | [Pengguna](#27-pengguna) | `/admin/users` | Admin |
| 28 | [Jabatan & Penanda Tangan](#28-jabatan--penanda-tangan) | `/admin/roles` | Admin |
| 29 | [Keamanan](#29-keamanan) | `/admin/security` | Admin, Editor |
| 30 | [Audit Log](#30-audit-log) | `/admin/audit-log` | Admin |
| 31 | [Laporan Harian](#31-laporan-harian) | `/admin/daily-reports` | Admin, Editor |
| 32 | [Marketing Dashboard](#32-marketing-dashboard) | `/admin/marketing` | Admin, Editor |
| 33 | [Campaigns](#33-campaigns) | `/admin/marketing/campaigns` | Admin, Editor |
| 34 | [Contacts](#34-contacts) | `/admin/marketing/contacts` | Admin, Editor |
| 35 | [Broadcast Lists](#35-broadcast-lists) | `/admin/marketing/broadcast` | Admin, Editor |
| 36 | [Broadcast](#36-broadcast) | `/admin/broadcasts` | Admin, Editor |
| 37 | [Pesan Masuk](#37-pesan-masuk) | `/admin/inquiries` | Admin, Editor |
| 38 | [Login Admin](#38-login-admin) | `/admin/login` | Semua |

---

## Otentikasi & Autorisasi

### Login
- **URL**: `/admin/login`
- **Metode**: Form login dengan email + password
- **Default credentials** (seed data):
  - Admin: `admin@sanata.id` / `Admin123!`
  - Editor: `editor@sanata.id` / `Editor123!`
- **Token**: JWT access + refresh token disimpan sebagai HTTP-only cookie
- **Token refresh**: Otomatis saat access token expired (tanpa logout)

### Peran (Role)
| Role | Akses |
|------|-------|
| **ADMIN** | Semua menu termasuk `users`, `roles`, `audit-log` |
| **EDITOR** | Semua menu kecuali `users`, `roles` |
| **USER** | Hanya `workforce` dashboard (read-only) |

> **Catatan**: Menu `adminOnly` hanya terlihat oleh ADMIN. Role lain tidak melihat menu tersebut di sidebar.

---

## Navigasi & Struktur Menu

Menu sidebar admin panel dikelompokkan berdasarkan domain pekerjaan:

```
Dashboard
├── Proyek
│   ├── Proyek & RAB          (/admin/rab)
│   ├── Pengajuan              (/admin/submissions)
│   └── Surat Penawaran        (/admin/quotations)
├── SANTRA
│   ├── Workforce Dashboard    (/admin/workforce)
│   ├── Database Worker        (/admin/workforce/workers)
│   ├── Assessment            (/admin/workforce/assessments)
│   ├── Penugasan             (/admin/workforce/assignments)
│   ├── Execution             (/admin/workforce/executions)
│   ├── Quality Control       (/admin/workforce/qc)
│   ├── Method Statements     (/admin/workforce/method-statements)
│   ├── QC Templates          (/admin/workforce/qc-templates)
│   ├── Lesson Learned        (/admin/workforce/lesson-learned)
│   ├── KPI Performance       (/admin/workforce/kpi)
│   └── Tools & Inventory     (/admin/workforce/tools)
├── Pelaporan
│   ├── Laporan Harian        (/admin/daily-reports)
│   └── Audit Log             (/admin/audit-log)
├── Sistem
│   ├── Pengguna              (/admin/users)         ← Admin only
│   ├── Jabatan & Penanda Tangan (/admin/roles)     ← Admin only
│   └── Keamanan             (/admin/security)
├── Estimasi Biaya
│   ├── AHSP                  (/admin/ahsp)
│   └── Harga Satuan          (/admin/price-items)
├── Situs & Konten
│   ├── Konten Situs          (/admin/site-content)
│   ├── Artikel & Halaman     (/admin/contents)
│   ├── Article Scraper       (/admin/scraper)
│   ├── Pustaka Media         (/admin/media)
│   ├── SEO                   (/admin/seo)
│   ├── Layanan               (/admin/products)
│   └── Kategori              (/admin/categories)
├── Marketing
│   ├── Marketing Dashboard   (/admin/marketing)
│   ├── Campaigns             (/admin/marketing/campaigns)
│   ├── Contacts              (/admin/marketing/contacts)
│   ├── Templates             (/admin/marketing/templates)
│   ├── Offers                (/admin/marketing/offers)
│   ├── Broadcast Lists       (/admin/marketing/broadcast)
│   └── Analytics            (/admin/marketing/analytics)
└── Prospek
    ├── Pesan Masuk           (/admin/inquiries)
    └── Broadcast             (/admin/broadcasts)
```

---

## Konvensi UI

### Komponen UI
| Komponen | Keterangan |
|----------|------------|
| **StatCard** | Card statistik dengan nilai utama, hint, icon, dan tautan ke halaman detail |
| **Panel** | Container dengan header opsional, aksi tambahan, dan body |
| **Badge** | Label status dengan warna: `success` (hijau), `warning` (kuning), `danger` (merah), `neutral` (abu) |
| **ListRow** | Baris tabel/daftar dengan tautan, teks utama, teks sekunder, dan elemen trailing |
| **EmptyState** | Placeholder saat data kosong |
| **ConfirmDialog** | Modal konfirmasi untuk aksi berbahaya (delete) |
| **RichTextEditor** | Editor TipTap untuk konten HTML |
| **ImageUploadField** | Unggah gambar dengan drag-drop |
| **SearchableSelect** | Select dengan pencarian |
| **GpsInput** | Input koordinat GPS dengan validasi |
| **PhotoGallery** | Galeri foto dengan anotasi |

### Konvensi Aksi
- **POST** → form action (Server Action) atau `fetch` POST
- **DELETE** → selalu melalui `ConfirmDialog` dengan konfirmasi
- **Filter** → parameter URL query (`?status=APPROVED&search=gedung`)
- **Pagination** → `?page=1&size=20` (default: page=1, size=20)

### Format Tanggal & Mata Uang
- Tanggal: `DD MMM YYYY` (contoh: `29 Sep 2026`) via `formatDate()`
- Mata uang: `Rp X.XXX.XXX` (contoh: `Rp 125.000.000`) via `formatRupiah()`
- Nomor RAB: font monospace (`font-mono`)

---

## Status Reference

### RAB Status
| Status | Arti | Badge Tone |
|--------|------|------------|
| `DRAFT` | Belum diajukan | neutral |
| `REVIEW` | Sedang direview | warning |
| `APPROVED` | Disetujui | success |
| `REJECTED` | Ditolak | danger |
| `ARCHIVED` | Diarsipkan | neutral |

### Submission Status
| Status | Arti | Badge Tone |
|--------|------|------------|
| `PENDING` | Menunggu | warning |
| `APPROVED` | Disetujui | success |
| `REJECTED` | Ditolak | danger |
| `REVISION_REQUESTED` | Perlu revisi | warning |

### Submission Type
| Type | Arti |
|------|------|
| `BILLING` | Penagihan |
| `SCHEDULE_CHANGE` | Perubahan jadwal |
| `RAB_REVISION` | Revisi RAB |
| `CLAIM` | Klaim/permintaan |

### Inquiry Status
| Status | Arti |
|--------|------|
| `NEW` | Baru masuk (nilai default, bisa diedit) |
| `CONTACTED` | Sudah dihubungi |
| `CLOSED` | Ditutup |

### Content Status
| Status | Arti |
|--------|------|
| `DRAFT` | Simpanan draf |
| `PUBLISHED` | Terpublikasi di situs |
| `ARCHIVED` | Diarsipkan |

### Content Type
| Type | Arti |
|------|------|
| `PAGE` | Halaman (statis) |
| `POST` | Artikel (berita/blog) |

---

## Tips Troubleshooting

### Masalah Umum
1. **403 Unauthorized** → Pastikan login dan role sesuai. Refresh token dengan logout/login ulang.
2. **Form tidak submit** → Cek field required (biasanya ditandai dengan asterik `*`).
3. **Data tidak muncul** → Cek filter URL (`?status=...`, `?search=...`). Gunakan filter "Semua" untuk reset.
4. **Dashboard blank** → Pastikan backend berjalan di port 5000.

### Hard Refresh
Jika perubahan tidak terlihat setelah restart backend:
- **Browser**: `Ctrl + Shift + R` (hard refresh)
- **Vite cache**: Restart `npm run dev:web`

---

*Untuk detail setiap menu, lihat section masing-masing di bawah.*
