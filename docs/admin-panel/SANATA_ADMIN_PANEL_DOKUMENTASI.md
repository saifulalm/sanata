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


---

# 1. Dashboard

**URL**: `/admin`  
**Peran**: Semua (ADMIN, EDITOR, USER)  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")` — USER mungkin hanya bisa lihat halaman tanpa data

---

## Gambaran Umum

Dashboard adalah halaman utama admin panel yang menampilkan ringkasan seluruh aktivitas sistem. Terdiri dari:

1. **Statistik Utama** (4 card)
2. **Statistik Sekunder** (3 card)
3. **Quick Actions** — pintasan ke fitur sering dipakai
4. **Aktivitas 7 Hari** — chart aktivitas
5. **Perlu Ditindaklanjuti** — pesan masuk terbaru
6. **Pipeline RAB** — grafik + daftar RAB terbaru
7. **Chart** — Status Konten + Konten Terpopuler
8. **Konten Terbaru & Layanan Terbaru**
9. **Aktivitas Terkini** — timeline aktivitas
10. **Notifications** — notifikasi sistem

---

## Statistik Utama

### Card 1: Pesan Baru
| Field | Keterangan |
|-------|------------|
| **Label** | Pesan Baru |
| **Value** | Jumlah inquiry dengan status NEW |
| **Hint** | `dari {totalInquiries} total pesan` |
| **Icon** | Inbox |
| **Tone** | `attention` jika ada pesan baru, `default` jika kosong |
| **Link** | `/admin/inquiries?status=NEW` |
| **Trend** | `{value: 12, direction: "up"}` vs kemarin |

### Card 2: Nilai RAB Disetujui
| Field | Keterangan |
|-------|------------|
| **Label** | Nilai RAB Disetujui |
| **Value** | `Rp {rabApprovedValue}` (hanya RAB APPROVED) |
| **Hint** | `{rabCount} RAB · total Rp {rabTotalValue}` |
| **Icon** | Calculator |
| **Link** | `/admin/rab` |
| **Trend** | `{value: 8, direction: "up"}` vs bulan lalu |

### Card 3: Database Estimasi
| Field | Keterangan |
|-------|------------|
| **Label** | Database Estimasi |
| **Value** | `{ahsp} AHSP` |
| **Hint** | `{priceItems} harga satuan dasar` |
| **Icon** | Layers |
| **Link** | `/admin/ahsp` |

### Card 4: Layanan Aktif
| Field | Keterangan |
|-------|------------|
| **Label** | Layanan Aktif |
| **Value** | `{activeProducts}/{products}` |
| **Icon** | ShoppingBag |
| **Link** | `/admin/products` |
| **Tone** | `attention` jika ada layanan non-aktif |

---

## Statistik Sekunder

| Card | Value | Icon | Link |
|------|-------|------|------|
| Total Konten | `{content}` (dengan hint `{publishedContent} terpublikasi`) | FileText | `/admin/contents` |
| Total Views | `Rp {totalViews}` (format rupiah tanpa mata uang) | Eye | - |
| Pengguna | `{users}` | Activity | `/admin/users` |

---

## Quick Actions

Pintasan dengan 6 tombol aksi cepat:

| Label | Icon | Link | Color |
|-------|------|------|-------|
| RAB Baru | Calculator | `/admin/rab/new` | Desert (primary) |
| Tulis Konten | FileText | `/admin/contents` | Emerald |
| Balas Pesan | MessageSquare | `/admin/inquiries?status=NEW` | Amber |
| Tambah Layanan | ShoppingBag | `/admin/products` | Purple |
| Kirim Broadcast | Send | `/admin/broadcasts` | Teal |
| Pengaturan | Settings | `/admin/security` | Slate |

---

## Perlu Ditindaklanjuti

Panel berisi maksimal 5 inquiry terbaru dengan status NEW. Setiap baris menampilkan:
- **Primary**: Nama pengirim
- **Secondary**: Layanan yang diminta (opsional)
- **Trailing**: Badge "Baru" + tanggal dibuat
- **Link**: Klik navigasi ke `/admin/inquiries?status=NEW`

Jika kosong: *"Tidak ada pesan yang menunggu tindakan."*

---

## Pipeline RAB

### Grafik
- **Tipe**: Bar chart horizontal atau kanban-style
- **Data**: RAB per status (DRAFT, REVIEW, APPROVED, REJECTED, ARCHIVED)
- **Library**: Recharts

### Daftar Terbaru
- Maksimal 3 RAB terbaru dengan:
  - **Primary**: Judul proyek
  - **Secondary**: Nomor RAB
  - **Trailing**: Badge status dengan warna sesuai

---

## Sumber Data

Data diambil dari `getDashboardSummary()` di `src/lib/adminResources.ts`:

```typescript
interface DashboardSummary {
  cards: {
    newInquiries: number;
    totalInquiries: number;
    rabApprovedValue: number;
    rabTotalValue: number;
    rabCount: number;
    ahsp: number;
    priceItems: number;
    activeProducts: number;
    products: number;
    content: number;
    publishedContent: number;
    totalViews: number;
    users: number;
  };
  recentInquiries: Inquiry[];
  rabByStatus: RabStatusCount[];
  recentRabs: Rab[];
  contentByStatus: ContentStatusCount[];
  topContent: ContentView[];
  recentContents: Content[];
  recentProducts: Product[];
}
```

---

## Tips Penggunaan

1. **Prioritas kerja**: Cek bagian "Perlu Ditindaklanjuti" setiap pagi
2. **Monitoring RAB**: Panel Pipeline RAB menunjukkan distribusi status semua proyek
3. **Quick Actions**: Gunakan pintasan untuk navigasi cepat ke fitur sering dipakai
4. **Notifikasi**: Badge merah di menu sidebar "Pesan Masuk" menunjukkan jumlah pesan baru

---

## API Endpoint

- `GET /api/dashboard/summary` → Mengambil semua data ringkasan

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./README.md) | [Menu Berikutnya](./02-rab.md)*


---

# 2. Proyek & RAB

**URL**: `/admin/rab`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu **Proyek & RAB** adalah halaman utama untuk mengelola semua proyek konstruksi dan dokumen RAB (Rencana Anggaran Biaya). RAB adalah dokumen estimasi biaya yang dibuat per proyek.

---

## Daftar RAB

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor RAB (font monospace), contoh: `AWA-2025-001` |
| **Nama Pekerjaan** | Judul proyek + lokasi |
| **Pemilik** | Nama klien/pemberi tugas |
| **Status** | Badge status: DRAFT, REVIEW, APPROVED, REJECTED, ARCHIVED |
| **Nilai Total** | Total RAB dalam format Rp (dari item dengan harga) |
| **Tanggal** | Tanggal dibuat + nama pembuat |
| **Aksi** | Tombol: Lihat dokumen (icon Eye) + Hapus (icon Trash) |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Input teks: cari berdasarkan nomor, judul, atau pemilik |
| **Status Filter** | Tombol grup: Semua, Draf, Review, Disetujui, Ditolak, Diarsipkan |

### Aksi

| Aksi | Lokasi | Keterangan |
|------|--------|------------|
| **Bandingkan Kurva S** | Header, kanan | Navigasi ke `/admin/rab/multi-schedule` |
| **Import Excel** | Header, kanan | Navigasi ke `/admin/rab/import` |
| **RAB Baru** | Header, kanan | Navigasi ke `/admin/rab/new` |

### Pagination
- Default: page=1, size=20
- Navigasi: Previous, Next + nomor halaman

---

## RAB Detail

**URL**: `/admin/rab/[id]`  
**Peran**: ADMIN, EDITOR

Setiap RAB memiliki sub-menu/tab navigasi:

| Tab | URL | Keterangan |
|-----|-----|------------|
| **Overview** | `/admin/rab/[id]/overview` | Ringkasan RAB + metadata |
| **Schedule** | `/admin/rab/[id]/schedule` | Jadwal proyek (Kurva S) |
| **Takeoff** | `/admin/rab/[id]/takeoff` | Volume/quantity takeoff |
| **Billings** | `/admin/rab/[id]/billings` | Penagihan |
| **Daily Reports** | `/admin/rab/[id]/daily-reports` | Laporan harian proyek |
| **Letters** | `/admin/rab/[id]/letters` | Surat-surat proyek |
| **Logbook** | `/admin/rab/[id]/logbook` | Buku harian |
| **Memos** | `/admin/rab/[id]/memos` | Memo internal |
| **Reports** | `/admin/rab/[id]/reports` | Laporan proyek |
| **Submissions** | `/admin/rab/[id]/submissions` | Pengajuan/permintaan |

### Project Header
Setiap halaman detail RAB menampilkan header dengan:
- Judul proyek
- Nomor RAB
- Badge status
- Tombol Print
- Tombol Edit (jika role sesuai)

---

## Membuat RAB Baru

**URL**: `/admin/rab/new`  
**Peran**: ADMIN, EDITOR

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nomor RAB** | Ya | Auto-generated: `{PREFIX}-{YEAR}-{SEQUENCE}` atau input manual |
| **Nama Proyek** | Ya | Judul proyek (required) |
| **Nama Klien** | Tidak | Nama pemberi tugas/pemilik |
| **Lokasi** | Tidak | Alamat lokasi proyek |
| **Tanggal Mulai** | Ya | Tanggal mulai jadwal proyek |
| **Tanggal Selesai** | Tidak | Tanggal selesai (auto-kalkulasi dari schedule) |
| **Deskripsi** | Tidak | Catatan tambahan |
| **Status** | Ya | Default: DRAFT |

### Form Sections (RabEditor)

Setelah header disimpan, bisa menambah:

1. **Items** — Item pekerjaan dengan:
   - Section (kelompok pekerjaan, contoh: "I. PEKERJAAN PERSIAPAN")
   - Item (uraian pekerjaan)
   - Volume (jumlah)
   - Satuan (m2, m3, kg, dll)
   - Harga Satuan
   - Jumlah (auto: volume × harga)

2. **Schedule Items** — Jadwal dengan:
   - Nama komponen
   - Bobot (%)
   - Tanggal mulai (offset dari tanggal mulai proyek)
   - Durasi (hari)

3. **Signatories** — Penanda tangan:
   - Pilih dari daftar penanda tangan
   - Tanda tangan dengan role (Pemberi Tugas, Direksi, dll)

### Aksi Form

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan sebagai DRAFT |
| **Ajukan Review** | Kirim untuk direview (status → REVIEW) |
| **Export PDF** | Download RAB sebagai PDF |

---

## Workflow RAB

```
┌─────────┐    Simpan     ┌─────────┐   Submit   ┌─────────┐
│  DRAFT  │──────────────▶│  DRAFT  │───────────▶│ REVIEW  │
└─────────┘               └─────────┘            └─────────┘
                              ▲                       │
                              │                       ▼
                              │                  ┌─────────┐
                              └──────────────────│REJECTED │
                                                 └─────────┘
                                                       │
                                                       ▼
                                                  ┌──────────┐
                                                  │ APPROVED │
                                                  └──────────┘
                                                       │
                                                       ▼
                                                  ┌───────────┐
                                                  │ ARCHIVED  │
                                                  └───────────┘
```

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/rab` | Daftar RAB dengan pagination + filter |
| GET | `/api/rab/:id` | Detail RAB |
| POST | `/api/rab` | Buat RAB baru |
| PUT | `/api/rab/:id` | Update RAB |
| DELETE | `/api/rab/:id` | Hapus RAB |
| GET | `/api/rab/:id/schedule` | Schedule RAB |
| POST | `/api/rab/:id/schedule` | Tambah schedule item |
| GET | `/api/rab/:id/takeoff` | Takeoff items |

---

## Troubleshooting

1. **"Nomor RAB sudah ada"** → Gunakan nomor unik atau biarkan auto-generated
2. **Schedule tidak tampil** → Pastikan tanggal mulai sudah diisi
3. **Nilai total Rp 0** → Pastikan semua item memiliki harga satuan > 0
4. **Tidak bisa delete** → Cek apakah ada submissions terkait

---

## Tips

1. **Import Excel** → Gunakan `/admin/rab/import` untuk import dari file Excel yang sudah ada
2. **Bandingkan 2+ RAB** → Gunakan `/admin/rab/multi-schedule` untuk melihat kurva S beberapa proyek
3. **Auto-save** → Draft otomatis tersimpan saat mengedit
4. **Print** → Gunakan tombol Print di header detail untuk export PDF

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./01-dashboard.md) | [Menu Berikutnya](./03-import-rab.md)*


---

# 3. Import RAB dari Excel

**URL**: `/admin/rab/import`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu Import RAB memungkinkan import data RAB dari file Excel (.xlsx) ke dalam sistem. Ini mempercepat pembuatan RAB karena tidak perlu input manual satu per satu.

---

## Alur Kerja Import

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  STEP 1      │     │  STEP 2       │     │  STEP 3      │
│  Upload      │ ──▶ │  Preview &    │ ──▶ │  Success     │
│  File Excel  │     │  Form Input   │     │  Confirmation│
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Upload File

### Aksi
- **Download Template** → Download file template Excel kosong
- **Pilih File** → Upload file Excel (.xlsx) yang akan diimport

### Format File yang Didukung

Format import Excel yang didukung:

| File | Sheet | Struktur |
|------|-------|----------|
| RAB Rumah THE AWA 2-2.xlsx | `BQ L7` | Roman sections (I–XVII), item per baris |
| RAB STR-ARS Pondok Indah RAP | `rekap` + 9 work sheets | Header rekap + detail per sheet |

### Validasi Step 1
File harus:
- Format: `.xlsx`
- Terdapat data di sheet yang dikenali
- Kolom yang diperlukan tersedia

---

## Step 2: Preview & Form Input

### Preview Table

Setelah file diparse, ditampilkan preview dengan statistik:

| Item | Keterangan |
|------|------------|
| **Jumlah Section** | Berapa kelompok pekerjaan (misal: "I. PEKERJAAN PERSIAPAN") |
| **Jumlah Item** | Total item pekerjaan |
| **Nilai Total** | Total RAB dari semua item |
| **Total Bobot** | Total % bobot schedule |

### Errors & Warnings

Jika ada masalah dengan data, ditampilkan daftar:

| Tipe | Warna | Arti |
|------|-------|------|
| **Error** | Merah | Data wajib diperbaiki sebelum import |
| **Warning** | Kuning | Data boleh-import tapi perlu perhatian |

Contoh error:
- Volume = 0 tapi harga > 0
- Kolom numerik terkontaminasi teks ("By Owner")
- Section tanpa item

### Form Input

Setelah preview, perlu isi form:

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nomor RAB** | Ya | Nomor unik, contoh: `AWA-2025-001` |
| **Nama Proyek** | Ya | Judul proyek |
| **Nama Klien** | Tidak | Nama pemberi tugas |
| **Lokasi** | Tidak | Alamat lokasi |
| **Tanggal Mulai** | Ya | Tanggal mulai jadwal proyek |
| **Hari Libur** | Tidak | Array hari libur (default: [0] = Minggu) |

---

## Format Payload Import

Data yang di-submit ke backend mengikuti schema:

```json
{
  "number": "AWA-2025-001",
  "title": "Proyek Gedung A",
  "clientName": "PT XYZ",
  "location": "Jakarta",
  "scheduleStart": "2025-01-01",
  "restDays": [0],
  "sections": [
    {
      "name": "I. PEKERJAAN PERSIAPAN",
      "items": [
        {
          "description": "1. Uitzet / Bowplank",
          "unit": "m1",
          "volume": 128,
          "unitPrice": 23000,
          "amount": 2944000,
          "startOffsetDays": 0,
          "durationDays": 30
        }
      ]
    }
  ]
}
```

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/rab/import-template` | Download template Excel kosong |
| POST | `/api/rab/import-preview` | Parse + validasi file (multipart upload) |
| POST | `/api/rab/import-confirm` | Eksekusi import dengan payload yang sudah divalidasi |

### Contoh Request

**Preview:**
```
POST /api/rab/import-preview
Content-Type: multipart/form-data

file: <excel file>
```

**Confirm:**
```
POST /api/rab/import-confirm
Content-Type: application/json

{
  "number": "AWA-2025-001",
  "title": "Proyek Gedung A",
  ...
}
```

---

## Format Kolom Excel

### RAB Rumah THE AWA (BQ L7)

| Kolom | Index | Isi |
|-------|-------|-----|
| A | 0 | Nomor item |
| D | 3 | Unit / Sub Total |
| E | 4 | Satuan |
| F | 5 | Volume |
| G | 6 | Harga Satuan |
| H | 7 | Jumlah Grup |
| N | 13 | Harga Type 53 |
| O | 14 | Jumlah Type 53 |

### RAB STR-ARS Pondok Indah

| Kolom | Index | Isi |
|-------|-------|-----|
| A | 0 | No |
| B | 1 | Uraian |
| E | 4 | Satuan |
| T | 19 | Volume |
| U | 20 | Harga Satuan |
| W | 22 | Jumlah |

---

## Tips & Best Practice

1. **Gunakan template** → Download template dulu untuk memastikan format kolom benar
2. **Bersihkan data** → Hapus baris formula/Sub Total sebelum import
3. **Cek preview** → Selalu cek errors/warnings sebelum konfirmasi
4. **Validasi angka** → Pastikan semua kolom numerik tidak terkontaminasi teks
5. **Volume = 0** → Item dengan volume 0 akan diskip

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "File tidak dikenali" | Pastikan format sesuai dengan template |
| "Kolom tidak ditemukan" | Cek header kolom di sheet yang benar |
| "Jumlah item 0" | Pastikan sheet dan range data benar |
| "Tanggal invalid" | Format tanggal: DD/MM/YY atau YYYY-MM-DD |
| Import gagal | Cek console backend untuk error detail |

---

## Known Issues

1. **Window location di success step** → Step 3 menggunakan `window.location` untuk redirect, tidak menggunakan Next.js router
2. **Formula rows** → Baris dengan formula Excel mungkin tidak terbaca (gunakan `data_only=True`)
3. **"#VALUE!" cells** → Sel dengan error formula akan diskip

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./02-rab.md) | [Menu Berikutnya](./04-multi-schedule.md)*


---

# 4. Perbandingan Kurva S

**URL**: `/admin/rab/multi-schedule`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu ini memungkinkan perbandingan jadwal (Kurva S) dari 2 atau lebih proyek RAB secara bersamaan. Berguna untuk:
- Membandingkan progress beberapa proyek
- Analisis overlap jadwal
- Planning resource alocation

---

## Fitur

### Multi-Select Proyek

| Elemen | Keterangan |
|--------|------------|
| **Dropdown/Checklist** | Pilih proyek RAB yang akan dibanding |
| **Minimum** | Pilih minimal 2 proyek |
| **Maximum** | Tidak terbatas (disarankan max 5 untuk keterbacaan) |

### Kurva S Comparison Chart

Grafik yang menampilkan:
- **Sumbu X**: Waktu (minggu/bulan)
- **Sumbu Y**: Bobot kumulatif (%)
- **Multiple lines**: Satu garis per proyek

### Tabel Ringkasan

| Kolom | Keterangan |
|-------|------------|
| **Proyek** | Nama + nomor RAB |
| **Tanggal Mulai** | Tanggal mulai schedule |
| **Tanggal Selesai** | Tanggal selesai schedule |
| **Durasi** | Total hari pelaksanaan |
| **Bobot Total** | Total % bobot |
| **Status** | Status RAB |

---

## Alur Kerja

1. **Pilih Proyek** → Checklist proyek yang akan dibanding
2. **Lihat Grafik** → Kurva S ditampilkan per proyek
3. **Analisis** → Bandingkan overlap dan progress

---

## API Endpoint

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/rab?status=APPROVED,DRAFT,REVIEW` | Daftar RAB untuk selector |
| GET | `/api/rab/:id/schedule` | Schedule detail per RAB |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./03-import-rab.md) | [Menu Berikutnya](./05-quotations.md)*


---

# 5. Surat Penawaran

**URL**: `/admin/quotations`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola Surat Penawaran harga ke klien. Setiap quotation berisi detail harga, terms, dan penanda tangan.

---

## Daftar Surat Penawaran

### Tampilan Tabel (QuotationBoard)

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor quotation (font monospace) |
| **Untuk** | Nama klien/pemberi tugas |
| **Perihal** | Judul/subjek penawaran |
| **Tanggal** | Tanggal quotation dibuat |
| **Berlaku Until** | Tanggal berakhirnya penawaran |
| **Nilai** | Total nilai penawaran (Rp) |
| **Status** | Status: DRAFT, SENT, APPROVED, REJECTED, EXPIRED |
| **Aksi** | View, Edit, Duplicate, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan nomor, klien, atau hal |
| **Status Filter** | Filter berdasarkan status |

---

## Membuat Surat Penawaran Baru

**URL**: `/admin/quotations/new`  
**Peran**: ADMIN, EDITOR

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nomor Quotation** | Ya | Auto-generated atau input manual |
| **Untuk** | Ya | Nama klien/pemberi tugas |
| **Alamat** | Tidak | Alamat klien |
| **Perihal** | Ya | Subjek penawaran |
| **Tanggal** | Ya | Tanggal quotation |
| **Berlaku Until** | Ya | Tanggal kadaluarsa |
| **Catatan** | Tidak | Catatan tambahan |

### Item Penawaran

Tabel item dengan:

| Kolom | Required | Keterangan |
|-------|----------|------------|
| **No** | Auto | Nomor urut |
| **Uraian** | Ya | Deskripsi item |
| **Qty** | Ya | Kuantitas |
| **Satuan** | Ya | Satuan (pcs, m2, dll) |
| **Harga Satuan** | Ya | Harga per unit |
| **Jumlah** | Auto | Qty × Harga Satuan |

**Aksi**: Tambah baris, Hapus baris

### Term & Conditions

| Field | Keterangan |
|-------|------------|
| **Payment Terms** | Contoh: "DP 30%,剩下 70%" |
| **Validitas** | Contoh: "Penawaran berlaku 30 hari" |
| **Pengiriman** | Contoh: "Pengiriman 14 hari kerja" |
| **Garansi** | Contoh: "Garansi 6 bulan" |

### Penanda Tangan

Pilih penanda tangan dari daftar yang tersedia:
- **Nama**: Nama lengkap
- **Jabatan**: Jabatan (Direksi Utama, Manajer Proyek, dll)
- **Tanda Tangan**: Upload gambar tanda tangan (opsional)

---

## Detail & Edit Quotation

**URL**: `/admin/quotations/[id]`  
**Peran**: ADMIN, EDITOR

Sama dengan form create, dengan data yang sudah terisi.

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan sebagai DRAFT |
| **Kirim** | Kirim quotation ke klien (status → SENT) |
| **Print** | Export sebagai PDF |
| **Duplicate** | Buat salinan quotation baru |

---

## Status Quotation

| Status | Arti | Badge Tone |
|--------|------|------------|
| `DRAFT` | Belum dikirim | neutral |
| `SENT` | Sudah dikirim | warning |
| `APPROVED` | Disetujui klien | success |
| `REJECTED` | Ditolak klien | danger |
| `EXPIRED` | Kadaluarsa | danger |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/quotations` | Daftar quotation |
| GET | `/api/quotations/:id` | Detail quotation |
| POST | `/api/quotations` | Buat quotation baru |
| PUT | `/api/quotations/:id` | Update quotation |
| DELETE | `/api/quotations/:id` | Hapus quotation |
| GET | `/api/signatories` | Daftar penanda tangan |

---

## Tips

1. **Template** → Gunakan quotation existing dan klik "Duplicate" untuk bikin baru dengan data mirip
2. **Auto-numbering** → Sistem auto-generate nomor: `QT-{YEAR}-{SEQUENCE}`
3. **Print** → Quotation siap print dengan layout yang sudah diformat
4. **Expired check** → Quotation expired tidak bisa di-sent

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./04-multi-schedule.md) | [Menu Berikutnya](./06-submissions.md)*


---

# 6. Pengajuan

**URL**: `/admin/submissions`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu **Pengajuan** adalah inbox lintas-proyek yang menampilkan semua pengajuan/permintaan dari berbagai RAB. Berbeda dengan submissions per-proyek (`/admin/rab/[id]/submissions`), halaman ini aggregates semua pengajuan.

---

## Daftar Pengajuan

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor submission (font monospace) |
| **Proyek** | Judul + nomor RAB asal |
| **Jenis** | Tipe pengajuan |
| **Pemohon** | Nama yang mengajukan |
| **Tanggal** | Tanggal dibuat |
| **Status** | Badge: PENDING, APPROVED, REJECTED, REVISION_REQUESTED |
| **Nilai** | Jumlah nominal (jika applicable) |
| **Aksi** | View, Approve/Reject, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan nomor, proyek, atau pemohon |
| **Status Filter** | Semua, Pending, Disetujui, Ditolak, Revisi |
| **Type Filter** | Semua, BILLING, SCHEDULE_CHANGE, RAB_REVISION, CLAIM |

---

## Tipe Pengajuan

| Type | Arti | Keterangan |
|------|------|------------|
| `BILLING` | Penagihan | Permintaan pembayaran dari klien |
| `SCHEDULE_CHANGE` | Perubahan Jadwal | Revisi jadwal proyek |
| `RAB_REVISION` | Revisi RAB | Perubahan estimasi biaya |
| `CLAIM` | Klaim | Klaim dari pihak ketiga |

---

## Status Workflow

```
PENDING ──────────────────────────▶ APPROVED
   │                                    ▲
   │ (revisi)                           │
   ▼                                    │
REVISION_REQUESTED ────────────────────│
   │                                    │
   └──────── REJECTED ◀─────────────────┘
```

---

## Manajemen per Proyek

Pengajuan juga bisa dikelola per proyek melalui:
- `/admin/rab/[id]/submissions`

Halaman ini adalah aggregated view untuk review lintas-proyek.

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/submissions` | Daftar submission (cross-project) |
| GET | `/api/submissions/:id` | Detail submission |
| POST | `/api/submissions` | Buat submission baru |
| PUT | `/api/submissions/:id` | Update submission |
| PUT | `/api/submissions/:id/status` | Update status (approve/reject) |
| DELETE | `/api/submissions/:id` | Hapus submission |

---

## Tips

1. **Daily review** → Cek halaman ini setiap hari untuk menindaklanjuti pengajuan
2. **Filter by status** → Gunakan "Pending" untuk fokus pada yang perlu ditindaklanjuti
3. **Cross-project view** → Lihat semua pengajuan di satu halaman untuk prioritas kerja

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./05-quotations.md) | [Menu Berikutnya](./07-workforce.md)*


---

# 7. Workforce Dashboard

**URL**: `/admin/workforce`  
**Peran**: Semua (ADMIN, EDITOR, USER)  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Workforce Dashboard adalah hub pusat untuk mengelola tenaga kerja (SANTRA - Santri/Tenaga Konstruksi). Menu ini menampilkan statistik agregat dan navigasi ke semua sub-modul workforce.

---

## Statistik Dashboard

### Statistik Utama

| Card | Value | Keterangan |
|------|-------|------------|
| **Total Workers** | `{total}` | Jumlah worker dalam database |
| **Available** | `{available}` | Worker yang sedang tidak ditugaskan |
| **On Assignment** | `{onAssignment}` | Worker yang sedang ditugaskan |
| **Total Tools** | `{tools}` | Jumlah alat dalam inventory |

### Breakdown Workers

| Kategori | Keterangan |
|----------|------------|
| **Active** | Worker dengan status aktif |
| **Inactive** | Worker yang tidak aktif |
| **By Role** | Distribusi berdasarkan jabatan |

---

## Navigasi Sub-Modul

Dashboard menyediakan tautan ke sub-modul:

| Modul | URL | Keterangan |
|-------|-----|------------|
| **Database Worker** | `/admin/workforce/workers` | Master data worker |
| **Assessment** | `/admin/workforce/assessments` | Penilaian skill & kompeteni |
| **Assignments** | `/admin/workforce/assignments` | Penugasan ke proyek |
| **Executions** | `/admin/workforce/executions` | Dokumentasi harian |
| **Quality Control** | `/admin/workforce/qc` | Inspeksi & QC |
| **Method Statements** | `/admin/workforce/method-statements` | Dokumen metode kerja |
| **QC Templates** | `/admin/workforce/qc-templates` | Template inspeksi |
| **Lesson Learned** | `/admin/workforce/lesson-learned` | Dokumentasi pembelajaran |
| **KPI Performance** | `/admin/workforce/kpi` | Tracking KPI |
| **Tools & Inventory** | `/admin/workforce/tools` | Manajemen alat |

---

## Quick Actions

| Aksi | Lokasi | Keterangan |
|------|--------|------------|
| **Tambah Worker** | Button | Navigasi ke `/admin/workforce/workers/new` |
| **Buat Assessment** | Button | Navigasi ke `/admin/workforce/assessments/new` |
| **Penugasan Baru** | Button | Navigasi ke `/admin/workforce/assignments/new` |
| **Buat Laporan** | Button | Navigasi ke `/admin/workforce/executions/new` |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/workforce/stats` | Statistik workforce |
| GET | `/api/workers` | Daftar worker |
| GET | `/api/assignments` | Statistik assignment |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./06-submissions.md) | [Menu Berikutnya](./08-workers.md)*


---

# 8. Database Worker

**URL**: `/admin/workforce/workers`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola database master tenaga kerja (workers). Setiap worker memiliki data pribadi, skill, dan history penugasan.

---

## Daftar Worker

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap worker |
| **NIK** | Nomor Induk Kependudukan |
| **Jabatan** | Jabatan (Site Manager, Tukang Batu, dll) |
| **Kontak** | Nomor telepon |
| **Status** | Aktif / Non-aktif |
| **Tanggal Bergabung** | Tanggal mulai bekerja |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan nama atau NIK |
| **Status Filter** | Aktif, Non-aktif |
| **Role Filter** | Filter berdasarkan jabatan |

---

## Form Tambah/Edit Worker

**URL**: `/admin/workforce/workers/new` atau `/admin/workforce/workers/[id]/edit`

### Data Pribadi

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Lengkap** | Ya | Nama sesuai KTP |
| **NIK** | Ya | 16 digit NIK (validasi angka) |
| **Tempat Lahir** | Tidak | Kota lahir |
| **Tanggal Lahir** | Tidak | Tanggal lahir |
| **Jenis Kelamin** | Tidak | Laki-laki / Perempuan |
| **Alamat** | Tidak | Alamat lengkap |
| **Kontak** | Tidak | Nomor telepon |

### Data Kepegawaian

| Field | Required | Keterangan |
|-------|----------|------------|
| **Jabatan** | Ya | Pilih dari daftar jabatan |
| **Status** | Ya | Aktif / Non-aktif |
| **Tanggal Bergabung** | Tidak | Tanggal mulai kerja |
| **照片** | Tidak | Upload foto worker |

### Skill & Kompetensi

| Field | Keterangan |
|-------|------------|
| **Keahlian** | Skill khusus (multi-select) |
| **Sertifikasi** | Sertifikat yang dimiliki |
| **Level** | Beginner / Intermediate / Advanced |

---

## Detail Worker

**URL**: `/admin/workforce/workers/[id]`

### Tab/Section

1. **Data Diri** — Informasi pribadi
2. **Penugasan** — Riwayat penugasan
3. **Assessment** — Hasil penilaian
4. **Dokumentasi** — Foto, Sertifikat
5. **QC Record** — Catatan QC

---

## Jabatan Worker (ProjectRole)

Daftar jabatan yang tersedia:

| Role | Arti |
|------|------|
| `DIREKTUR_UTAMA` | Direktur Utama |
| `DIREKTUR` | Direktur |
| `MANAGER_PROYEK` | Manajer Proyek |
| `SITE_MANAGER` | Site Manager |
| `PIMPINAN_PROYEK` | Pimpinan Proyek |
| `KEPALA_TUKANG` | Kepala Tukang |
| `TUKANG_BATU` | Tukang Batu |
| `TUKANG_KAYU` | Tukang Kayu |
| `TUKANG_BESI` | Tukang Besi |
| `OPERATOR` | Operator Alat |
| `MANDOR` | Mandor |
| `PEKERJA` | Pekerja |
| `STAF` | Staf Administrasi |
| `LAINNYA` | Lainnya |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/workers` | Daftar worker |
| GET | `/api/workers/:id` | Detail worker |
| POST | `/api/workers` | Tambah worker |
| PUT | `/api/workers/:id` | Update worker |
| DELETE | `/api/workers/:id` | Hapus worker |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./07-workforce.md) | [Menu Berikutnya](./09-assessments.md)*


---

# 9. Assessment

**URL**: `/admin/workforce/assessments`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mencatat dan mengelola penilaian (assessment) terhadap worker. Assessment mencakup skill assessment, evaluasi performa, dan kompetensi worker.

---

## Daftar Assessment

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor assessment |
| **Worker** | Nama worker yang dinilai |
| **Jenis** | Tipe assessment |
| **Tanggal** | Tanggal assessment |
| **Penilai** | Nama penilai |
| **Skor** | Nilai/rating |
| **Status** | DRAFT, COMPLETED |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Elemen | Keterangan |
|--------|------------|
| **Search** | Cari berdasarkan worker atau ID |
| **Date Range** | Filter berdasarkan tanggal |
| **Type Filter** | Filter berdasarkan jenis assessment |

---

## Membuat Assessment Baru

**URL**: `/admin/workforce/assessments/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Pilih worker dari dropdown |
| **Jenis Assessment** | Ya | Pilih jenis (Skill, Safety, Quality, dll) |
| **Tanggal** | Ya | Tanggal assessment |
| **Penilai** | Ya | Nama penilai |
| **Skor** | Ya | Nilai numeric (0-100 atau skala lain) |

### Detail Assessment Items

Assessment bisa terdiri dari multiple items/kategori:

| Item | Bobot | Skor |
|------|-------|------|
| Safety Compliance | 20% | 85 |
| Quality of Work | 30% | 90 |
| Productivity | 25% | 80 |
| Teamwork | 15% | 95 |
| Communication | 10% | 88 |

**Total Score**: Di-kalkulasi dari weighted average

### Catatan

| Field | Keterangan |
|-------|------------|
| **Kekuatan** | Hal positif yang perlu dipertahankan |
| **Kelemahan** | Area yang perlu diperbaiki |
| **Rekomendasi** | Saran pengembangan |

---

## Detail Assessment

**URL**: `/admin/workforce/assessments/[id]`

Tampilan read-only dengan semua detail assessment termasuk:
- Worker info
- Detail items
- Notes
- History perubahan

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Edit** | Ubah assessment (jika status DRAFT) |
| **Finalize** | Selesaikan assessment (DRAFT → COMPLETED) |
| **Delete** | Hapus assessment |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/assessments` | Daftar assessment |
| GET | `/api/assessments/:id` | Detail assessment |
| POST | `/api/assessments` | Buat assessment baru |
| PUT | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Hapus assessment |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./08-workers.md) | [Menu Berikutnya](./10-assignments.md)*


---

# 10. Penugasan (Assignments)

**URL**: `/admin/workforce/assignments`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola penugasan worker ke proyek. Menggunakan **kanban board** untuk visualisasi status penugasan.

---

## Kanban Board

### Kolom Status

| Kolom | Keterangan | Card Color |
|-------|------------|------------|
| **Available** | Worker yang siap ditugaskan | Default/Neutral |
| **Assigned** | Sudah ditugaskan, belum mulai | Blue |
| **In Progress** | Sedang berjalan | Yellow/Warning |
| **Completed** | Selesai | Green/Success |

### Assignment Card

Setiap kartu menampilkan:

| Field | Keterangan |
|-------|------------|
| **Worker** | Nama + foto worker |
| **Proyek** | Judul proyek penugasan |
| **Role** | Jabatan di proyek |
| **Periode** | Tanggal mulai - selesai |
| **Progress** | Progress bar (%) |
| **Status** | Badge status |

---

## Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan RAB/proyek |
| **Worker** | Filter berdasarkan worker |
| **Status** | Filter berdasarkan status |
| **Date Range** | Filter berdasarkan periode |

---

## Membuat Assignment Baru

**URL**: `/admin/workforce/assignments/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Pilih worker |
| **Proyek (RAB)** | Ya | Pilih proyek RAB |
| **Role/Jabatan** | Ya | Jabatan di proyek |
| **Tanggal Mulai** | Ya | Tanggal mulai penugasan |
| **Tanggal Selesai** | Ya | Tanggal selesai penugasan |
| **Deskripsi** | Tidak | Detail tugas |
| **Target Output** | Tidak | Target yang harus dicapai |

### Resource Assignment

Jika penugasan memerlukan resources:

| Field | Keterangan |
|-------|------------|
| **Alat** | Alat yang diperlukan (dari inventory) |
| **Kendaraan** | Kendaraan jika diperlukan |
| **Material** | Material jika diperlukan |

---

## Edit Assignment

**URL**: `/admin/workforce/assignments/[id]/edit`

### Update Progress

| Field | Keterangan |
|-------|------------|
| **Progress %** | Update progress (0-100) |
| **Status** | Ubah status penugasan |
| **Catatan** | Update catatan progress |

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Simpan** | Simpan perubahan |
| **Mulai** | Set status ke In Progress |
| **Selesaikan** | Set status ke Completed |
| **Batal** | Cancel assignment |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/assignments` | Daftar assignment (support kanban) |
| GET | `/api/assignments/:id` | Detail assignment |
| POST | `/api/assignments` | Buat assignment baru |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Hapus assignment |
| PUT | `/api/assignments/:id/status` | Update status |

---

## Known Issues

1. **Pagination hardcoded** → Default ke page 1, size 20
2. **Error swallowed** → Error pada fetch tidak ditampilkan secara eksplisit

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./09-assessments.md) | [Menu Berikutnya](./11-executions.md)*


---

# 11. Execution & Dokumentasi

**URL**: `/admin/workforce/executions`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mendokumentasikan pelaksanaan pekerjaan harian. Execution record mencakup progress, foto, GPS location, dan catatan harian.

---

## Daftar Execution

### Tampilan Tabel / Board

| Kolom | Keterangan |
|-------|------------|
| **Tanggal** | Tanggal pelaksanaan |
| **Proyek** | Nama proyek RAB |
| **Worker** | Worker yang melaksanakan |
| **Assignment** | Penugasan terkait |
| **Progress** | % progress saat itu |
| **Status** | DRAFT, SUBMITTED, APPROVED |
| **Foto** | Thumbnail foto dokumentasi |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Tanggal** | Range tanggal |
| **Proyek** | Filter berdasarkan RAB |
| **Worker** | Filter berdasarkan worker |
| **Status** | Filter berdasarkan status |

---

## Membuat Execution Baru

**URL**: `/admin/workforce/executions/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Tanggal** | Ya | Tanggal pelaksanaan |
| **Assignment** | Ya | Pilih penugasan |
| **Proyek** | Auto | Terisi otomatis dari assignment |
| **Worker** | Auto | Worker dari assignment |
| **Deskripsi** | Ya | Uraian pekerjaan hari itu |

### Progress Update

| Field | Required | Keterangan |
|-------|----------|------------|
| **Progress %** | Ya | Progress saat ini (0-100) |
| **Target Hari Ini** | Tidak | Target yang ingin dicapai |
| **Realisasi** | Tidak | Actual yang tercapai |

### Dokumentasi Foto

| Elemen | Keterangan |
|--------|------------|
| **Upload Foto** | Multiple foto (drag-drop atau browse) |
| **Caption** | Deskripsi tiap foto |
| **Annotasi** | Tandai area penting di foto |

### GPS Location

| Field | Keterangan |
|-------|------------|
| **Latitude** | Koordinat latitude |
| **Longitude** | Koordinat longitude |
| **Accuracy** | Akurasi GPS (meter) |

> **Catatan**: Fitur GPS memerlukan device dengan GPS dan permission browser.

---

## Detail Execution

**URL**: `/admin/workforce/executions/[id]`

### Informasi

- Tanggal dan waktu
- Worker yang melaksanakan
- Proyek dan assignment
- Progress saat itu

### Dokumentasi

- Gallery foto dengan caption
- GPS coordinates (jika ada)
- Peta lokasi (jika ada)

### Catatan

- Deskripsi pekerjaan
- Catatan dari site manager
- Issue/kendala yang ditemukan

---

## Edit Execution

**URL**: `/admin/workforce/executions/[id]/edit`

Sama dengan form create, dengan data pre-filled.

### Restriksi
- Mungkin tidak bisa edit jika status sudah APPROVED
- Edit mungkin terbatas hanya oleh admin atau site manager

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/executions` | Daftar execution |
| GET | `/api/executions/:id` | Detail execution |
| POST | `/api/executions` | Buat execution baru |
| PUT | `/api/executions/:id` | Update execution |
| DELETE | `/api/executions/:id` | Hapus execution |

---

## GPS Input Component

Komponen `GpsInput` digunakan untuk input koordinat:

```
┌─────────────────────────────────┐
│ 📍 Lokasi GPS                  │
├─────────────────────────────────┤
│ Latitude:  [-6.2087634      ]  │
│ Longitude: [106.845599       ]  │
│                                 │
│ [📍 Deteksi Otomatis]           │
│ Status: ● Akurat (±5m)        │
└─────────────────────────────────┘
```

Fitur:
- Input manual latitude/longitude
- Tombol "Deteksi Otomatis" untuk auto-detect via browser Geolocation API
- Validasi format koordinat
- Tampilan akurasi GPS

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./10-assignments.md) | [Menu Berikutnya](./12-qc.md)*


---

# 12. Quality Control (QC)

**URL**: `/admin/workforce/qc`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu Quality Control untuk mencatat inspeksi dan kontrol kualitas di proyek. QC record mencakup checklist inspeksi, foto kondisi, dan finding/komplain.

---

## Daftar QC

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor QC record |
| **Proyek** | Nama proyek |
| **Tanggal** | Tanggal inspeksi |
| **Inspektor** | Nama inspektor |
| **Template** | Template QC yang digunakan |
| **Result** | PASS / FAIL / NEED_REVIEW |
| **Finding** | Jumlah finding |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Tanggal** | Range tanggal inspeksi |
| **Proyek** | Filter berdasarkan proyek |
| **Result** | PASS, FAIL, NEED_REVIEW |
| **Template** | Filter berdasarkan template |

---

## Membuat QC Baru

**URL**: `/admin/workforce/qc/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Proyek (RAB)** | Ya | Pilih proyek |
| **Tanggal** | Ya | Tanggal inspeksi |
| **Inspektor** | Ya | Nama inspektor |
| **Template** | Ya | Pilih template QC |
| **Lokasi** | Tidak | Lokasi spesifik inspeksi |
| **Catatan Umum** | Tidak | Catatan inspeksi |

### Checklist Items

Jika menggunakan template, checklist otomatis terisi dari template:

| Item | Check | Notes | Photo |
|------|-------|-------|-------|
| □ Pondasi sesuai spesifikasi | ☑ | Ok | [📷] |
| □ Beton sudah dicor | ☐ | - | - |
| □ Tulangan sesuai图纸 | ☑ | Ok | [📷] |

### Result

| Result | Arti |
|--------|------|
| **PASS** | Semua checklist sesuai spesifikasi |
| **FAIL** | Ada item yang tidak sesuai |
| **NEED_REVIEW** | Perlu review lebih lanjut |

### Finding/Komplain

Jika ada yang tidak sesuai, buat finding:

| Field | Required | Keterangan |
|-------|----------|------------|
| **Deskripsi** | Ya | Detail finding |
| **Severity** | Ya | Critical / Major / Minor |
| **Tenggat Perbaikan** | Tidak | Deadline perbaikan |
| **Foto** | Tidak | Foto evidence |
| **Status** | Ya | OPEN / IN_PROGRESS / CLOSED |

---

## Detail QC

**URL**: `/admin/workforce/qc/[id]`

### Tab/Section

1. **Overview** — Metadata QC
2. **Checklist** — Detail checklist items
3. **Findings** — Daftar finding
4. **Photos** — Gallery foto dokumentasi

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Edit** | Ubah QC record |
| **Tambah Finding** | Buat finding baru |
| **Close Finding** | Tutup finding (mark as resolved) |
| **Print** | Print QC report |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/qc` | Daftar QC records |
| GET | `/api/qc/:id` | Detail QC record |
| POST | `/api/qc` | Buat QC baru |
| PUT | `/api/qc/:id` | Update QC |
| DELETE | `/api/qc/:id` | Hapus QC |
| GET | `/api/qc-templates` | Daftar template |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./11-executions.md) | [Menu Berikutnya](./13-method-statements.md)*


---

# 13. Method Statements

**URL**: `/admin/workforce/method-statements`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola Method Statement - dokumen yang menjelaskan metode dan prosedur pelaksanaan pekerjaan di proyek. Diperlukan untuk standarisasi dan compliance.

---

## Daftar Method Statement

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor method statement |
| **Judul** | Judul/thema metode |
| **Proyek** | Proyek terkait |
| **Versi** | Nomor versi |
| **Tanggal** | Tanggal dibuat/diapprove |
| **Status** | DRAFT, APPROVED, REVISION |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan proyek |
| **Status** | Filter berdasarkan status |

---

## Membuat Method Statement Baru

**URL**: `/admin/workforce/method-statements/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Judul** | Ya | Judul method statement |
| **Proyek (RAB)** | Ya | Proyek terkait |
| **Versi** | Ya | Nomor versi (format: v1.0) |
| **Tanggal** | Ya | Tanggal efektif |
| **Status** | Ya | DRAFT / APPROVED |

### Sections

Method statement biasanya terdiri dari sections:

| Section | Keterangan |
|---------|------------|
| **1. Tujuan** | Tujuan pekerjaan |
| **2. Ruang Lingkup** | Cakupan pekerjaan |
| **3. Referensi** | Standar, regulasi yang dipakai |
| **4. Definisi** | Istilah dan definisi |
| **5. Material & Alat** | Material dan peralatan yang diperlukan |
| **6. Langkah Kerja** | Prosedur pelaksanaan langkah per langkah |
| **7. Safety** | Prosedur K3 |
| **8. Quality Control** | Standar kualitas |
| **9. Lampiran** | Foto, gambar pendukung |

### Editor

Menggunakan **RichTextEditor** (TipTap) untuk formatted text, bullet points, numbered lists.

---

## Detail Method Statement

**URL**: `/admin/workforce/method-statements/[id]`

Tampilan read-only dengan semua sections.

### Aksi

| Aksi | Keterangan |
|------|------------|
| **Edit** | Ubah content (jika status DRAFT) |
| **Approve** | Set status ke APPROVED |
| **Revisi** | Buat versi baru |
| **Print** | Print sebagai PDF |
| **Download** | Download sebagai DOCX/PDF |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/method-statements` | Daftar method statements |
| GET | `/api/method-statements/:id` | Detail method statement |
| POST | `/api/method-statements` | Buat baru |
| PUT | `/api/method-statements/:id` | Update |
| DELETE | `/api/method-statements/:id` | Hapus |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./12-qc.md) | [Menu Berikutnya](./14-qc-templates.md)*


---

# 14. QC Templates

**URL**: `/admin/workforce/qc-templates`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola template checklist Quality Control. Template digunakan saat membuat QC record baru untuk standarisasi inspeksi.

---

## Daftar Template

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama template |
| **Kategori** | Kategori (Pondasi, Struktur, Arsitektur, MEP, dll) |
| **Items** | Jumlah checklist items |
| **Versi** | Nomor versi |
| **Status** | ACTIVE / INACTIVE |
| **Aksi** | View, Edit, Delete |

---

## Membuat Template Baru

**URL**: `/admin/workforce/qc-templates/new`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Template** | Ya | Nama template |
| **Kategori** | Ya | Kategori pekerjaan |
| **Versi** | Ya | Nomor versi |
| **Deskripsi** | Tidak | Deskripsi template |
| **Status** | Ya | ACTIVE / INACTIVE |

### Checklist Items

Template terdiri dari checklist items:

| Field | Required | Keterangan |
|-------|----------|------------|
| **Item** | Ya | Teks checklist |
| **Category** | Tidak | Sub-kategori |
| **Mandatory** | Ya | Wajib dicek (Y/N) |
| **Photo Required** | Ya | Perlu foto evidence (Y/N) |
| **Notes Required** | Ya | Perlu catatan (Y/N) |
| **Order** | Ya | Urutan tampil |

---

## Template Categories

| Kategori | Contoh Items |
|----------|-------------|
| **Pondasi** | Dimensi sesuai图纸, Mutu beton, Besi tulangan |
| **Struktur** | Kolom sesuai图纸, Beton sudah curing, Scaffolding aman |
| **Arsitektur** | Dinding sesuai spesifikasi, Cat rapi, Kusen terpasang |
| **MEP** | Instalasi listrik sesuai, Plumbing tidak bocor, AC terpasang |
| **Safety** | APD digunakan, Area kerja aman, Sirkulasi udara |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/qc-templates` | Daftar template |
| GET | `/api/qc-templates/:id` | Detail template |
| POST | `/api/qc-templates` | Buat template baru |
| PUT | `/api/qc-templates/:id` | Update template |
| DELETE | `/api/qc-templates/:id` | Hapus template |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./13-method-statements.md) | [Menu Berikutnya](./15-lesson-learned.md)*


---

# 15. Lesson Learned

**URL**: `/admin/workforce/lesson-learned`  
**Peran**: Semua (ADMIN, EDITOR, USER)  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mendokumentasikan pembelajaran dari pelaksanaan proyek. Lesson Learned menangkap pengetahuan yang diperoleh dari pengalaman (sukses maupun kegagalan) untuk improve di proyek masa depan.

---

## Daftar Lesson Learned

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **ID** | Nomor dokumen |
| **Judul** | Topik pembelajaran |
| **Kategori** | Kategori (Safety, Quality, Schedule, Cost, dll) |
| **Proyek** | Proyek asal |
| **Tanggal** | Tanggal dibuat |
| **Tipe** | POSITIVE / NEGATIVE |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Kategori** | Filter berdasarkan kategori |
| **Tipe** | POSITIVE / NEGATIVE |
| **Proyek** | Filter berdasarkan proyek |

---

## Kategori Lesson Learned

| Kategori | Arti |
|----------|------|
| **SAFETY** | Berkaitan dengan K3 |
| **QUALITY** | Berkaitan dengan kualitas |
| **SCHEDULE** | Berkaitan dengan waktu/jadwal |
| **COST** | Berkaitan dengan biaya |
| **ENVIRONMENT** | Berkaitan dengan lingkungan |
| **PROCESS** | Berkaitan dengan proses kerja |

---

## Membuat Lesson Learned Baru

**URL**: (biasanya inline dari list page)

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Judul** | Ya | Topik pembelajaran |
| **Kategori** | Ya | Pilih kategori |
| **Proyek** | Ya | Proyek asal |
| **Tipe** | Ya | POSITIVE (keberhasilan) / NEGATIVE (kegagalan) |
| **Tanggal** | Ya | Tanggal kejadian |
| **Deskripsi** | Ya | Penjelasan detail |
| **Penyebab** | Tidak | Penyebab kejadian (khusus NEGATIVE) |
| **Solusi** | Ya | Solusi/cara mengatasinya |
| **Rekomendasi** | Ya | Saran untuk proyek lain |

---

## Tipe Lesson Learned

| Tipe | Badge | Arti |
|------|-------|------|
| **POSITIVE** | Success (hijau) | Keberhasilan yang perlu direplikasi |
| **NEGATIVE** | Danger (merah) | Kegagalan yang perlu dihindari |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/lesson-learned` | Daftar lesson learned |
| GET | `/api/lesson-learned/:id` | Detail lesson learned |
| POST | `/api/lesson-learned` | Buat baru |
| PUT | `/api/lesson-learned/:id` | Update |
| DELETE | `/api/lesson-learned/:id` | Hapus |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./14-qc-templates.md) | [Menu Berikutnya](./16-kpi.md)*


---

# 16. KPI Performance

**URL**: `/admin/workforce/kpi`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk tracking Key Performance Indicator (KPI) tenaga kerja dan proyek. KPI mencakup metrik kualitas, produktivitas, kehadiran, dan safety.

---

## KPI Dashboard

### Metrik Utama

| KPI | Deskripsi | Target | Formula |
|-----|-----------|--------|---------|
| **Quality Score** | % pekerjaan sesuai spesifikasi | >95% | (Passed QC / Total QC) × 100 |
| **Productivity Index** | Rasio output vs target | >100% | (Actual / Target) × 100 |
| **Attendance Rate** | % kehadiran | >95% | (Hadir / Total Hari) × 100 |
| **Safety Score** | % compliance K3 | 100% | (No Incident / Total Task) × 100 |

---

## Worker KPI

### Tampilan per Worker

| Kolom | Keterangan |
|-------|------------|
| **Worker** | Nama worker |
| **Quality** | Score kualitas |
| **Productivity** | Index produktivitas |
| **Attendance** | Rate kehadiran |
| **Overall** | Score keseluruhan |
| **Trend** | Naik/Turun vs periode sebelumnya |

### Chart

- **Bar Chart**: Perbandingan KPI antar worker
- **Line Chart**: Trend KPI worker per periode
- **Radar Chart**: Overall performance worker

---

## Filter & Periode

| Filter | Keterangan |
|--------|------------|
| **Periode** | Mingguan / Bulanan / Quarterly |
| **Proyek** | Filter berdasarkan proyek |
| **Worker** | Filter berdasarkan worker |
| **Date Range** | Range tanggal |

---

## Target Setting

Menu untuk mengatur target KPI:

| Field | Required | Keterangan |
|-------|----------|------------|
| **KPI Type** | Ya | Jenis KPI |
| **Target Value** | Ya | Nilai target |
| **Min Value** | Ya | Batas minimum |
| **Max Value** | Ya | Batas maksimum |
| **Weight** | Ya | Bobot untuk overall score |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/kpi` | Daftar KPI records |
| GET | `/api/kpi/worker/:id` | KPI per worker |
| GET | `/api/kpi/summary` | Ringkasan KPI |
| POST | `/api/kpi` | Record KPI baru |
| PUT | `/api/kpi/:id` | Update KPI |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./15-lesson-learned.md) | [Menu Berikutnya](./17-tools.md)*


---

# 17. Tools & Inventory

**URL**: `/admin/workforce/tools`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola inventory alat dan equipment. Includes tracking peminjaman, maintenance schedule, dan availability.

---

## Daftar Tools

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama alat |
| **Kategori** | Kategori (Elektrik, Plumbing, dll) |
| **Kode** | Kode inventory |
| **Stok** | Jumlah unit |
| **Tersedia** | Jumlah tersedia |
| **Dipinjam** | Jumlah dipinjam |
| **Status** | ACTIVE / MAINTENANCE / RETIRED |
| **Aksi** | View, Edit, Pinjam, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Kategori** | Filter berdasarkan kategori |
| **Status** | Filter berdasarkan status |
| **Availability** | Tersedia / Dipinjam / All |

---

## Kategori Tools

| Kategori | Contoh |
|----------|--------|
| **Elektrik** | Bor, gerinda, mesin las |
| **Plumbing** | Kunci pipa, tang, waterpass |
| **Survey** | Theodolit, GPS, meteran |
| **Transport** | Dolly, forklift, gerobak |
| **Safety** | Helm, sarung tangan, harness |
| **Lainnya** | Alat lainnya |

---

## Form Tambah/Edit Tool

**URL**: `/admin/workforce/tools/new` atau `/admin/workforce/tools/[id]/edit`

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama alat |
| **Kategori** | Ya | Pilih kategori |
| **Kode** | Ya | Kode unik inventory |
| **Deskripsi** | Tidak | Deskripsi alat |
| **Merek/Model** | Tidak | Merek dan model |
| **Serial Number** | Tidak | Nomor seri |
| **Lokasi Penyimpanan** | Tidak | Gudang / Lokasi |
| **Stok Total** | Ya | Jumlah unit total |
| **Minimum Stok** | Ya | Minimum sebelum restock |
| **Status** | Ya | ACTIVE / MAINTENANCE / RETIRED |

### Maintenance Info

| Field | Keterangan |
|-------|------------|
| **Last Maintenance** | Tanggal maintenance terakhir |
| **Next Maintenance** | Tanggal maintenance berikutnya |
| **Maintenance Interval** | Interval (hari) |
| **Catatan Maintenance** | Riwayat maintenance |

---

## Peminjaman Tool

**URL**: `/admin/workforce/tools/[id]/loan`

### Form Peminjaman

| Field | Required | Keterangan |
|-------|----------|------------|
| **Worker** | Ya | Worker yang pinjam |
| **Jumlah** | Ya | Jumlah unit dipinjam |
| **Tanggal Pinjam** | Ya | Tanggal pinjam |
| **Tanggal Kembali** | Ya | Tanggal rencana kembali |
| **Keperluan** | Ya | Tujuan peminjaman |
| **Notes** | Tidak | Catatan tambahan |

### Return Tool

Saat alat dikembalikan:
- Update stok tersedia
- Catat kondisi saat return
- Catat kerusakan jika ada

---

## Maintenance Schedule

### Daftar Maintenance

| Tool | Tanggal | Jenis | Status |
|------|---------|-------|--------|
| Bor Listrik #1 | 2026-10-15 | Service | PENDING |
| Theodolit | 2026-10-01 | Kalibrasi | COMPLETED |

### Quick Stats Card

- **Total Tools**: Jumlah seluruh alat
- **In Maintenance**: Alat sedang maintenance
- **On Loan**: Alat sedang dipinjam
- **Available Rate**: % ketersediaan

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/tools` | Daftar tools |
| GET | `/api/tools/:id` | Detail tool |
| POST | `/api/tools` | Tambah tool |
| PUT | `/api/tools/:id` | Update tool |
| DELETE | `/api/tools/:id` | Hapus tool |
| POST | `/api/tools/:id/loan` | Pinjam tool |
| POST | `/api/tools/:id/return` | Return tool |
| GET | `/api/tools/categories` | Daftar kategori |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./16-kpi.md) | [Menu Berikutnya](./18-ahsp.md)*


---

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


---

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


---

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


---

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


---

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


---

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


---

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


---

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


---

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


---

# 27. Pengguna

**URL**: `/admin/users`  
**Peran**: ADMIN only  
**Auth**: `requireAdminRole("ADMIN")`

---

## Gambaran Umum

Menu untuk mengelola akun pengguna admin panel. **Hanya accessible oleh ADMIN**. Digunakan untuk:
- Tambah user baru
- Edit data user
- Reset password
- Deactivate/delete user

---

## Daftar Pengguna

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Email** | Alamat email (login) |
| **Role** | ADMIN / EDITOR / USER |
| **Status** | ACTIVE / INACTIVE |
| **Terakhir Login** | Tanggal login terakhir |
| **Aksi** | View, Edit, Reset Password, Delete |

---

## Form Tambah User

**URL**: `/admin/users/new` (jika ada)

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **Email** | Ya | Email (uniques, untuk login) |
| **Password** | Ya | Password (minimal 8 karakter) |
| **Role** | Ya | ADMIN / EDITOR / USER |
| **Status** | Ya | ACTIVE / INACTIVE |

### Role Permissions

| Role | Dashboard | Content | RAB | Workforce | Users | Roles |
|------|-----------|---------|-----|-----------|-------|-------|
| **ADMIN** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **EDITOR** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **USER** | R | ✗ | ✗ | R | ✗ | ✗ |

---

## Edit User

**URL**: `/admin/users/[id]/edit`

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **Email** | Ya | Email (tidak bisa diubah jika ada) |
| **Role** | Ya | Role user |
| **Status** | Ya | ACTIVE / INACTIVE |

---

## Reset Password

| Metode | Keterangan |
|--------|------------|
| **Manual** | Admin input password baru |
| **Auto-generate** | Sistem generate random password |
| **Send Email** | Kirim password baru via email |

---

## Deactivate vs Delete

| Aksi | Arti | Data |
|------|------|------|
| **Deactivate** | Non-aktifkan user | Data tetap ada |
| **Delete** | Hapus user permanen | Data dihapus (cascade) |

---

## Default Users (Seed Data)

| Email | Password | Role | Nama |
|-------|----------|------|------|
| `admin@sanata.id` | `Admin123!` | ADMIN | Administrator |
| `editor@sanata.id` | `Editor123!` | EDITOR | Editor |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/users` | Daftar user |
| GET | `/api/users/:id` | Detail user |
| POST | `/api/users` | Tambah user baru |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/users/:id/password` | Reset password |
| DELETE | `/api/users/:id` | Hapus user |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./26-categories.md) | [Menu Berikutnya](./28-roles.md)*


---

# 28. Jabatan & Penanda Tangan

**URL**: `/admin/roles`  
**Peran**: ADMIN only  
**Auth**: `requireAdminRole("ADMIN")`

---

## Gambaran Umum

Menu untuk mengelola daftar jabatan (roles) dan penanda tangan resmi. Penanda tangan digunakan di dokumen seperti:
- RAB (tanda tangan pemberi tugas, direksi)
- Surat Penawaran
- Laporan Harian
- Dokumen proyek lainnya

---

## Tab: Workforce Roles (Jabatan)

### Daftar Jabatan

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama jabatan |
| **Role Key** | Key sistem (misal: `SITE_MANAGER`) |
| **Kategori** | Direksi / Manajemen / Lapangan / Lainnya |
| **Aktif** | Ya/Tidak |
| **Aksi** | Edit, Toggle Active |

### Form Tambah/Edit Jabatan

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap jabatan |
| **Role Key** | Ya | Key unik (huruf kapital, underscore) |
| **Kategori** | Ya | Kategori jabatan |
| **Deskripsi** | Tidak | Deskripsi jabatan |
| **Aktif** | Ya | Jabatan aktif/tidak |

### Kategori Jabatan

| Kategori | Contoh |
|----------|--------|
| **Direksi** | Direktur Utama, Direktur |
| **Manajemen** | Manajer Proyek, Site Manager |
| **Lapangan** | Kepala Tukang, Tukang Batu, Mandor |
| **Administrasi** | Staf |

---

## Tab: Signatories (Penanda Tangan)

### Daftar Penanda Tangan

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Jabatan** | Jabatan resmi |
| **Role** | Role di dokumen |
| **Tanda Tangan** | Preview gambar |
| **Aksi** | View, Edit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Role** | Filter berdasarkan role (Pemberi Tugas, Direksi, dll) |
| **Active** | Ya/Tidak |

---

## Form Tambah/Edit Penanda Tangan

### Data Pribadi

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **NIK** | Tidak | NIK KTP |
| **Email** | Tidak | Email |
| **Telepon** | Tidak | Nomor telepon |

### Data Jabatan

| Field | Required | Keterangan |
|-------|----------|------------|
| **Jabatan** | Ya | Jabatan resmi |
| **Role** | Ya | Role di dokumen |
| **Department** | Tidak | Departemen |

### Role di Dokumen

| Role | Digunakan di |
|------|-------------|
| `PEMBERI_TUGAS` | RAB, Laporan |
| `DIREKTUR` | RAB, Surat Penawaran |
| `MANAGER` | Laporan |
| `SITE_MANAGER` | Laporan Harian |
| `KEPALA_TUKANG` | Laporan Harian |
| `KONSULTAN` | Berita Acara |

### Tanda Tangan

| Field | Keterangan |
|-------|------------|
| **Gambar Tanda Tangan** | Upload gambar PNG/JPG |
| **Preview** | Tampilkan preview |
| **Position X/Y** | Posisi di dokumen (untuk print layout) |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/workforce-roles` | Daftar jabatan |
| POST | `/api/workforce-roles` | Tambah jabatan |
| PUT | `/api/workforce-roles/:id` | Update jabatan |
| DELETE | `/api/workforce-roles/:id` | Hapus jabatan |
| GET | `/api/signatories` | Daftar penanda tangan |
| POST | `/api/signatories` | Tambah penanda tangan |
| PUT | `/api/signatories/:id` | Update penanda tangan |
| DELETE | `/api/signatories/:id` | Hapus penanda tangan |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./27-users.md) | [Menu Berikutnya](./29-security.md)*


---

# 29. Keamanan

**URL**: `/admin/security`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengatur pengaturan keamanan akun sendiri. Pengguna bisa:
- Ganti password
- Aktifkan/nonaktifkan 2FA
- Lihat active sessions
- Atur preferensi keamanan

---

## Profile & Password

### Form Ubah Password

| Field | Required | Keterangan |
|-------|----------|------------|
| **Password Lama** | Ya | Password saat ini |
| **Password Baru** | Ya | Password baru (min. 8 karakter) |
| **Konfirmasi Password** | Ya | Ulangi password baru |

### Validasi Password

Password baru harus memenuhi:
- Minimal 8 karakter
- Minimal 1 huruf besar
- Minimal 1 huruf kecil
- Minimal 1 angka
- Minimal 1 karakter khusus

---

## Two-Factor Authentication (2FA)

### Enable 2FA

1. Klik **Enable 2FA**
2. Scan QR code dengan authenticator app (Google Authenticator, Authy)
3. Masukkan 6-digit code dari app
4. Simpan backup codes

### Disable 2FA

1. Klik **Disable 2FA**
2. Masukkan 6-digit code dari authenticator

### Backup Codes

- 10 backup codes generated saat enable 2FA
- Each code hanya bisa digunakan sekali
- Simpan di tempat aman

---

## Active Sessions

### Daftar Session

| Field | Keterangan |
|-------|------------|
| **Device** | Browser + OS |
| **IP Address** | Alamat IP |
| **Location** | Lokasi perkiraan |
| **Last Active** | Waktu terakhir aktif |
| **Current** | Ya (jika session ini) |

### Aksi Session

| Aksi | Keterangan |
|------|------------|
| **Revoke** | Logout dari device |
| **Revoke All** | Logout dari semua device |

---

## Login History

### Daftar Riwayat

| Field | Keterangan |
|-------|------------|
| **Tanggal** | Waktu login |
| **Device** | Browser + OS |
| **IP** | Alamat IP |
| **Location** | Lokasi |
| **Status** | Success / Failed |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Date Range** | Filter tanggal |
| **Status** | Success / Failed |
| **User** | Filter user (admin only) |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| PUT | `/api/auth/password` | Ganti password |
| POST | `/api/auth/2fa/enable` | Enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| POST | `/api/auth/2fa/verify` | Verify 2FA code |
| GET | `/api/auth/sessions` | Daftar active sessions |
| DELETE | `/api/auth/sessions/:id` | Revoke session |
| DELETE | `/api/auth/sessions` | Revoke all sessions |
| GET | `/api/auth/login-history` | Riwayat login |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./28-roles.md) | [Menu Berikutnya](./30-audit-log.md)*


---

# 30. Audit Log

**URL**: `/admin/audit-log`  
**Peran**: ADMIN only  
**Auth**: `requireAdminRole("ADMIN")`

---

## Gambaran Umum

Menu untuk melihat log aktivitas sistem. **Hanya accessible oleh ADMIN**. Audit log mencatat semua aksi yang dilakukan di sistem untuk:
- Compliance dan regulatory
- Investigasi keamanan
- Troubleshooting
- User accountability

---

## Daftar Log

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Waktu** | Tanggal dan waktu aksi |
| **User** | User yang melakukan |
| **Role** | Role user |
| **Aksi** | Jenis aksi |
| **Entity** | Entity yang di-aksi (contoh: RAB #001) |
| **Detail** | Detail aksi |
| **IP** | Alamat IP user |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Date Range** | Filter tanggal |
| **User** | Filter user |
| **Action Type** | CREATE, UPDATE, DELETE, LOGIN, dll |
| **Entity** | Filter entity type |
| **Search** | Pencarian teks |

---

## Action Types

| Action | Arti | Contoh |
|--------|------|-------|
| `CREATE` | Membuat data baru | Buat RAB baru |
| `UPDATE` | Update data | Edit quotation |
| `DELETE` | Hapus data | Hapus user |
| `LOGIN` | Login | User login |
| `LOGOUT` | Logout | User logout |
| `PASSWORD_CHANGE` | Ganti password | User ganti password |
| `EXPORT` | Export data | Export laporan |
| `IMPORT` | Import data | Import RAB dari Excel |
| `APPROVE` | Approval | Approve RAB |
| `REJECT` | Penolakan | Reject submission |
| `PUBLISH` | Publish | Publish konten |

---

## Entity Types

| Entity | Contoh Log |
|--------|------------|
| `User` | Admin mengubah role Editor ke ADMIN |
| `RAB` | Editor membuat RAB baru |
| `Quotation` | Admin delete quotation |
| `Content` | Editor publish artikel |
| `Worker` | Admin tambah worker baru |
| `Assignment` | Site manager buat assignment |

---

## Detail Log

Klik baris untuk melihat detail:

```
{
  "id": "log_123456",
  "timestamp": "2026-09-29T10:30:00Z",
  "user": {
    "id": "user_admin",
    "name": "Administrator",
    "email": "admin@sanata.id",
    "role": "ADMIN"
  },
  "action": "UPDATE",
  "entity_type": "RAB",
  "entity_id": "rab_001",
  "entity_name": "Proyek Gedung A - AWA-2025-001",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "changes": {
    "status": {
      "old": "DRAFT",
      "new": "REVIEW"
    }
  },
  "metadata": {
    "browser": "Chrome",
    "os": "Windows 11"
  }
}
```

---

## Retention Policy

| Setting | Default | Keterangan |
|---------|---------|------------|
| **Retention Period** | 90 hari | Log disimpan selama |
| **Archive** | Enabled | Log lama di-archive |
| **Export Before Delete** | Enabled | Export sebelum hapus |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/audit-log` | Daftar audit log |
| GET | `/api/audit-log/:id` | Detail log |
| GET | `/api/audit-log/export` | Export log (CSV/JSON) |
| DELETE | `/api/audit-log` | Hapus old logs (admin only) |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./29-security.md) | [Menu Berikutnya](./31-daily-reports.md)*


---

# 31. Laporan Harian

**URL**: `/admin/daily-reports`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola laporan harian proyek. Laporan harian adalah dokumen resmi yang mencatat progress dan kondisi proyek setiap hari. Berbeda dengan `Executions` yang dokumentasi kerja, Daily Reports adalah laporan formal dengan format yang distandardisasi.

---

## Daftar Laporan Harian

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nomor** | Nomor laporan (format: `LPJ/RAB/{NOMOR}/{BULAN}/{TAHUN}`) |
| **Proyek** | Nama proyek RAB |
| **Tanggal** | Tanggal laporan |
| **Periode** | Periode laporan (mingguan/bulanan) |
| **Status** | DRAFT, SUBMITTED, APPROVED |
| **Pemberi Tugas** | Penanda tangan pemberi tugas |
| **Aksi** | View, Edit, Submit, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Proyek** | Filter berdasarkan RAB |
| **Tanggal** | Range tanggal |
| **Status** | Filter status |

---

## Format Laporan Harian

### Header

| Field | Keterangan |
|-------|------------|
| **Nomor** | Nomor surat |
| **Tanggal** | Tanggal laporan |
| **Proyek** | Nama proyek |
| **Lokasi** | Alamat proyek |
| **Periode** | Tanggal mulai - selesai periode |

### Kondisi Weather

| Field | Keterangan |
|-------|------------|
| **Cuaca** | Cerah, Mendung, Hujan |
| **Temperature** | Suhu udara |
| **Kelembapan** | Kelembapan (%) |

### Personil

| Field | Keterangan |
|-------|------------|
| **Direksi** | Jumlah + nama |
| **Staf** | Jumlah + nama |
| **Pekerja** | Jumlah + breakdown |

### Equipment & Material

| Field | Keterangan |
|-------|------------|
| **Alat** | Equipment yang digunakan |
| **Material** | Material yang masuk/dipakai |

### Progress

| Field | Keterangan |
|-------|------------|
| **Rencana** | Target progress hari itu |
| **Realisasi** | Actual progress |
| **Komponen** | Detail per komponen |

### Catatan

| Field | Keterangan |
|-------|------------|
| **Kemajuan** | Deskripsi kemajuan hari ini |
| **Kendala** | Kendala/hambatan |
| **Rencana Besok** | Rencana untuk besok |

### Tanda Tangan

| Tanda Tangan | Role |
|--------------|------|
| **Pemberi Tugas** | Site Manager Pemberi Tugas |
| **Direksi** | Direksi PT Sanata |
| **Pelaksana** | Site Manager/Pelaksana |

---

## Generate Laporan

Fitur untuk generate laporan dari data execution:

1. **Select Period** → Pilih range tanggal
2. **Select Project** → Pilih proyek
3. **Select Executions** → Pilih execution records
4. **Generate** → Generate draft laporan

---

## Print / Export

| Format | Keterangan |
|--------|------------|
| **PDF** | Print-ready PDF |
| **DOCX** | Word document |
| **Print Preview** | Preview print layout |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/daily-reports` | Daftar laporan |
| GET | `/api/daily-reports/:id` | Detail laporan |
| POST | `/api/daily-reports` | Buat laporan baru |
| PUT | `/api/daily-reports/:id` | Update laporan |
| DELETE | `/api/daily-reports/:id` | Hapus laporan |
| GET | `/api/daily-reports/generate` | Generate dari executions |
| GET | `/api/daily-reports/:id/print` | Print PDF |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./30-audit-log.md) | [Menu Berikutnya](./32-marketing.md)*


---

# 32. Marketing Dashboard

**URL**: `/admin/marketing`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Marketing Dashboard adalah hub pusat untuk mengelola aktivitas marketing digital: campaigns, contacts, broadcast, dan analytics.

---

## Statistik Dashboard

### Metrik Utama

| Metric | Value | Keterangan |
|--------|-------|------------|
| **Total Contacts** | `{count}` | Jumlah kontak |
| **Active Campaigns** | `{active}` | Campaign berjalan |
| **Total Broadcast Sent** | `{sent}` | Pesan terkirim |
| **Open Rate** | `{rate}%` | Persentase terbuka |

### Breakdown

| Kategori | Keterangan |
|----------|------------|
| **By Source** | Breakdown kontak berdasarkan sumber |
| **By Status** | Active, Inactive, Unsubscribed |
| **By Campaign** | Performa per campaign |

---

## Navigasi Sub-Modul

| Modul | URL | Keterangan |
|-------|-----|------------|
| **Campaigns** | `/admin/marketing/campaigns` | Kampanye email/marketing |
| **Contacts** | `/admin/marketing/contacts` | Database kontak marketing |
| **Templates** | `/admin/marketing/templates` | Email templates |
| **Offers** | `/admin/marketing/offers` | Penawaran/-diskon |
| **Broadcast Lists** | `/admin/marketing/broadcast` | Daftar broadcast |
| **Analytics** | `/admin/marketing/analytics` | Data analytics |

---

## Quick Actions

| Aksi | Keterangan |
|------|------------|
| **Create Campaign** | Buat campaign baru |
| **Import Contacts** | Import kontak dari CSV |
| **Send Broadcast** | Kirim broadcast |
| **View Analytics** | Buka analytics |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/stats` | Statistik marketing |
| GET | `/api/marketing/dashboard` | Data dashboard |
| GET | `/api/marketing/contacts` | Statistik kontak |
| GET | `/api/marketing/campaigns` | Statistik campaign |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./31-daily-reports.md) | [Menu Berikutnya](./33-campaigns.md)*


---

# 33. Campaigns

**URL**: `/admin/marketing/campaigns`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk membuat dan mengelola kampanye marketing (email, broadcast). Campaigns adalah email marketing terencana yang dikirim ke segment tertentu.

---

## Daftar Campaign

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama campaign |
| **Subject** | Subjek email |
| **Status** | DRAFT, SCHEDULED, SENDING, SENT, FAILED |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Sent** | Jumlah terkirim |
| **Opens** | Jumlah terbuka |
| **Clicks** | Jumlah diklik |
| **Tanggal** | Tanggal kirim/buat |
| **Aksi** | View, Edit, Duplicate, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Status** | Filter status |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Date Range** | Filter tanggal |

---

## Status Campaign

| Status | Arti | Badge |
|--------|------|-------|
| `DRAFT` | Belum dikirim | Gray |
| `SCHEDULED` | Terjadwal | Blue |
| `SENDING` | Sedang dikirim | Yellow |
| `SENT` | Selesai dikirim | Green |
| `PARTIAL` | Sebagian dikirim | Orange |
| `FAILED` | Gagal | Red |
| `CANCELLED` | Dibatalkan | Gray |

---

## Membuat Campaign Baru

**URL**: `/admin/marketing/campaigns/new`

### Step 1: Setup

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama Campaign** | Ya | Nama internal |
| **Subject** | Ya | Subjek email |
| **Channel** | Ya | EMAIL / WHATSAPP / TELEGRAM |

### Step 2: Audience

| Field | Required | Keterangan |
|-------|----------|------------|
| **Segment** | Ya | Pilih segment target |
| **Exclude** | Tidak | Segment yang dikecualikan |
| **Estimated Recipients** | Auto | Jumlah penerima |

### Segment Options

| Segment | Keterangan |
|---------|------------|
| **All Contacts** | Semua kontak |
| **By Tag** | Berdasarkan tag |
| **By Source** | Berdasarkan sumber |
| **By Status** | Active/Inactive |
| **Custom List** | Daftar manual |

### Step 3: Content

| Field | Required | Keterangan |
|-------|----------|------------|
| **Template** | Tidak | Pilih template |
| **Content** | Ya | Isi pesan (Plain text atau HTML) |

### Step 4: Schedule

| Field | Required | Keterangan |
|-------|----------|------------|
| **Send Now** | - | Kirim sekarang |
| **Schedule** | - | Jadwalkan untuk nanti |
| **Date & Time** | Ya (jika schedule) | Tanggal dan waktu kirim |

---

## Analytics Campaign

### Metrics

| Metric | Keterangan |
|--------|------------|
| **Sent** | Jumlah email terkirim |
| **Delivered** | Jumlah berhasil terkirim |
| **Bounced** | Jumlah bounce |
| **Opened** | Jumlah email dibuka |
| **Clicked** | Jumlah link diklik |
| **Unsubscribed** | Jumlah unsubscribe |

### Chart

| Chart | Keterangan |
|-------|------------|
| **Timeline** | Opens/clicks over time |
| **Geographic** | Lokasi penerima |
| **Device** | Desktop vs Mobile |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/campaigns` | Daftar campaign |
| GET | `/api/marketing/campaigns/:id` | Detail campaign |
| POST | `/api/marketing/campaigns` | Buat campaign |
| PUT | `/api/marketing/campaigns/:id` | Update campaign |
| DELETE | `/api/marketing/campaigns/:id` | Hapus campaign |
| POST | `/api/marketing/campaigns/:id/send` | Kirim campaign |
| POST | `/api/marketing/campaigns/:id/cancel` | Batalkan campaign |
| GET | `/api/marketing/campaigns/:id/analytics` | Analytics |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./32-marketing.md) | [Menu Berikutnya](./34-contacts.md)*


---

# 34. Contacts

**URL**: `/admin/marketing/contacts`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola database kontak marketing. Contacts digunakan untuk email campaigns dan broadcast.

---

## Daftar Contacts

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama kontak |
| **Email** | Alamat email |
| **Telepon** | Nomor telepon |
| **Tags** | Tags/labels |
| **Source** | Sumber kontak |
| **Status** | ACTIVE, INACTIVE, UNSUBSCRIBED |
| **Last Contact** | Tanggal kontak terakhir |
| **Aksi** | View, Edit, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari nama atau email |
| **Status** | ACTIVE, INACTIVE, UNSUBSCRIBED |
| **Source** | Filter sumber |
| **Tags** | Filter tags |
| **Date Added** | Filter tanggal daftar |

---

## Import Contacts

### CSV Format

Kolom yang didukung:
```csv
name,email,phone,tags,source,company
John Doe,john@example.com,08123456789,interested,website,PT XYZ
Jane Smith,jane@example.com,087654321,leads,referral,
```

### Import Steps

1. **Upload CSV** → Pilih file CSV
2. **Map Fields** → Mapping kolom CSV ke field sistem
3. **Preview** → Preview data yang akan diimport
4. **Validate** → Cek duplikat dan error
5. **Confirm** → Import data

### Validation

| Check | Keterangan |
|-------|------------|
| **Email Valid** | Format email benar |
| **Duplicate** | Cek email duplikat |
| **Required Fields** | Field wajib terisi |

---

## Export Contacts

| Format | Keterangan |
|--------|------------|
| **CSV** | Comma-separated values |
| **Excel** | .xlsx format |
| **JSON** | JSON array |

---

## Tags & Segmentation

### Tags

| Tag | Keterangan |
|-----|------------|
| `interested` | Tertarik layanan |
| `leads` | Prospek |
| `customer` | Sudah menjadi pelanggan |
| `inactive` | Tidak aktif |
| `hot` | Prospek panas |
| `warm` | Prospek hangat |
| `cold` | Prospek dingin |

### Segments

Segment adalah dynamic group berdasarkan criteria:
- All Active
- Hot Leads
- Inactive 30 Days
- By Source
- By Company

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/contacts` | Daftar kontak |
| GET | `/api/marketing/contacts/:id` | Detail kontak |
| POST | `/api/marketing/contacts` | Tambah kontak |
| PUT | `/api/marketing/contacts/:id` | Update kontak |
| DELETE | `/api/marketing/contacts/:id` | Hapus kontak |
| POST | `/api/marketing/contacts/import` | Import CSV |
| GET | `/api/marketing/contacts/export` | Export CSV |
| GET | `/api/marketing/contacts/tags` | Daftar tags |
| POST | `/api/marketing/contacts/tags` | Tambah tag |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./33-campaigns.md) | [Menu Berikutnya](./35-broadcast-lists.md)*


---

# 35. Broadcast Lists

**URL**: `/admin/marketing/broadcast`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola daftar broadcast dan mengirim pesan massal via berbagai channel (Email, WhatsApp, Telegram).

---

## Daftar Broadcast List

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama daftar |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Contacts** | Jumlah kontak |
| **Status** | ACTIVE, INACTIVE |
| **Created** | Tanggal dibuat |
| **Aksi** | View, Edit, Send, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Status** | ACTIVE, INACTIVE |

---

## Membuat Broadcast List

### Form Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama daftar broadcast |
| **Channel** | Ya | Channel yang digunakan |
| **Description** | Tidak | Deskripsi daftar |
| **Status** | Ya | ACTIVE / INACTIVE |

### Add Contacts

| Method | Keterangan |
|--------|------------|
| **Select Contacts** | Pilih dari database kontak |
| **Manual Add** | Tambah manual satu per satu |
| **Import CSV** | Import dari file CSV |

### Channel Configuration

**Email:**
- SMTP settings
- Sender name & email

**WhatsApp:**
- Baileys / Official API
- Phone number
- Template approval

**Telegram:**
- Bot token
- Chat IDs

---

## Send Broadcast

### Step 1: Select List

Pilih broadcast list yang akan dikirim.

### Step 2: Compose Message

| Field | Keterangan |
|-------|------------|
| **Message** | Isi pesan |
| **Variables** | {name}, {email} dll |
| **Preview** | Preview pesan |

### Variable Placeholders

| Variable | Output |
|----------|--------|
| `{name}` | Nama kontak |
| `{email}` | Email |
| `{company}` | Company |
| `{date}` | Tanggal kirim |

### Step 3: Schedule

| Option | Keterangan |
|--------|------------|
| **Send Now** | Kirim sekarang |
| **Schedule** | Jadwalkan |
| **Recurring** | Pengiriman berulang |

### Step 4: Confirm & Send

Preview jumlah penerima, estimated time, dan konfirmasi.

---

## Connection Status

| Status | Arti | Color |
|--------|------|-------|
| **CONNECTED** | Channel aktif | Green |
| **DISCONNECTED** | Channel tidak terhubung | Gray |
| **ERROR** | Ada error | Red |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/broadcast` | Daftar broadcast list |
| GET | `/api/marketing/broadcast/:id` | Detail list |
| POST | `/api/marketing/broadcast` | Buat list baru |
| PUT | `/api/marketing/broadcast/:id` | Update list |
| DELETE | `/api/marketing/broadcast/:id` | Hapus list |
| POST | `/api/marketing/broadcast/:id/send` | Kirim broadcast |
| GET | `/api/broadcast/connections` | Status koneksi |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./34-contacts.md) | [Menu Berikutnya](./36-broadcast.md)*


---

# 36. Broadcast (Otomatis)

**URL**: `/admin/broadcasts`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu broadcast untuk mengirim pesan massal secara otomatis. Berbeda dengan Campaign yang untuk email marketing, Broadcast lebih ke pesan otomatis dan integrasi WhatsApp/Telegram.

---

## Daftar Broadcast

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama broadcast |
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Recipients** | Jumlah penerima |
| **Status** | DRAFT, QUEUED, SENDING, SENT, FAILED |
| **Created** | Tanggal dibuat |
| **Sent At** | Tanggal terkirim |
| **Aksi** | View, Send, Delete |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Channel** | EMAIL, WHATSAPP, TELEGRAM |
| **Status** | Status broadcast |

---

## Channel Providers

| Channel | Provider | Keterangan |
|---------|----------|------------|
| **EMAIL** | SMTP | Email via SMTP server |
| **WHATSAPP** | Baileys / Official | WhatsApp via API |
| **TELEGRAM** | Bot API | Telegram Bot |

### Provider Status

| Status | Arti |
|--------|------|
| **CONNECTED** | Tersambung |
| **DISCONNECTED** | Putus |
| **ERROR** | Error connection |

---

## Buat Broadcast

### Form

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama broadcast |
| **Channel** | Ya | EMAIL / WHATSAPP / TELEGRAM |
| **Recipients** | Ya | Pilih penerima |
| **Message** | Ya | Isi pesan |

### Recipient Selection

| Method | Keterangan |
|--------|------------|
| **All Contacts** | Semua kontak |
| **By List** | Pilih broadcast list |
| **By Tag** | Pilih berdasarkan tags |
| **Manual** | Masukkan manual |

---

## WhatsApp Broadcast

### Message Format

```
Halo {name}!

Terima kasih telah menghubungi Sanata Construction.

{project_info}

Best regards,
Tim Sanata
```

### Media Attachment

| Tipe | Keterangan |
|------|------------|
| **Image** | Kirim gambar dengan caption |
| **Document** | Kirim dokumen PDF |
| **Video** | Kirim video |

### Template (WhatsApp Official)

WhatsApp Official API requires pre-approved templates:
- Template Name
- Language
- Variables

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/broadcasts` | Daftar broadcast |
| GET | `/api/broadcasts/:id` | Detail broadcast |
| POST | `/api/broadcasts` | Buat broadcast |
| PUT | `/api/broadcasts/:id` | Update broadcast |
| DELETE | `/api/broadcasts/:id` | Hapus broadcast |
| POST | `/api/broadcasts/:id/send` | Kirim broadcast |
| POST | `/api/broadcasts/:id/cancel` | Batalkan |
| GET | `/api/broadcasts/:id/status` | Status pengiriman |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./35-broadcast-lists.md) | [Menu Berikutnya](./37-inquiries.md)*


---

# 37. Pesan Masuk

**URL**: `/admin/inquiries`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengelola pesan/m enquiries yang masuk dari situs web. Pesan bisa dari:
- Form kontak website
- Landing page forms
- Chat widget
- Email langsung

---

## Daftar Pesan

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama pengirim |
| **Email** | Email pengirim |
| **Telepon** | Nomor telepon |
| **Layanan** | Layanan yang diminta |
| **Pesan** | Preview pesan |
| **Status** | NEW, CONTACTED, CLOSED |
| **Tanggal** | Tanggal masuk |
| **Aksi** | View, Reply, Delete |

### Filter & Pencarian

| Filter | Keterangan |
|--------|------------|
| **Search** | Cari nama, email, atau pesan |
| **Status** | NEW, CONTACTED, CLOSED |
| **Date Range** | Filter tanggal |
| **Service** | Filter berdasarkan layanan |

---

## Status Pesan

| Status | Arti | Badge | Aksi |
|--------|------|-------|------|
| `NEW` | Pesan baru, belum ditangani | Warning (kuning) | Perlu ditindaklanjuti |
| `CONTACTED` | Sudah dihubungi | Info (blue) | Dalam proses |
| `CLOSED` | Selesai ditutup | Success (hijau) | Tidak perlu aksi |

---

## Detail Pesan

**URL**: `/admin/inquiries/[id]`

### Informasi Pengirim

| Field | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Email** | Alamat email |
| **Telepon** | Nomor telepon |
| **Perusahaan** | Nama perusahaan (jika ada) |
| **Sumber** | Dari mana pesan datang |
| **Layanan** | Layanan yang diminta |

### Isi Pesan

| Field | Keterangan |
|-------|------------|
| **Subjek** | Subjek pesan |
| **Pesan** | Isi lengkap pesan |
| **Attachments** | Lampiran (jika ada) |

### Metadata

| Field | Keterangan |
|-------|------------|
| **Tanggal Masuk** | Kapan pesan masuk |
| **IP Address** | Alamat IP pengirim |
| **User Agent** | Browser yang digunakan |

---

## Reply Pesan

### Compose Reply

| Field | Keterangan |
|-------|------------|
| **To** | Email pengirim (auto-filled) |
| **Subject** | Subjek (Re: [original subject]) |
| **Template** | Pilih template balasan |
| **Message** | Isi balasan (Rich Text) |

### Template Balasan

Template yang sudah dibuat untuk balasan cepat:

| Template | Keterangan |
|----------|------------|
| **Terima Kasih** | Balasan terima kasih otomatis |
| **Permintaan Info** | Minta informasi tambahan |
| **Penawaran** | Kirim quotation |
| **Penjadwalan** | Jadwalkan meeting |

---

## Aksi Massal

| Aksi | Keterangan |
|------|------------|
| **Mark as Contacted** | Set status ke CONTACTED |
| **Mark as Closed** | Set status ke CLOSED |
| **Delete Selected** | Hapus pesan yang dipilih |
| **Export** | Export ke CSV |

---

## Notifikasi

### Badge Counter

Menu sidebar menampilkan badge dengan jumlah pesan NEW:

```
Pesan Masuk [3]  ← Badge merah
```

### Dashboard Integration

Dashboard menampilkan ringkasan pesan baru:
- **Card Stats**: "Pesan Baru" dengan trend
- **Panel**: "Perlu Ditindaklanjuti" dengan 5 pesan terbaru

---

## Integrasi CRM

Pesan bisa di-convert menjadi:

| Convert To | Keterangan |
|-----------|------------|
| **Contact** | Masuk ke database kontak marketing |
| **Lead** | Masuk ke pipeline sales |
| **Project** | Buat proyek baru |
| **Task** | Buat task untuk follow-up |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/inquiries` | Daftar inquiry |
| GET | `/api/inquiries/:id` | Detail inquiry |
| POST | `/api/inquiries` | Buat inquiry baru |
| PUT | `/api/inquiries/:id` | Update inquiry |
| PUT | `/api/inquiries/:id/status` | Update status |
| DELETE | `/api/inquiries/:id` | Hapus inquiry |
| POST | `/api/inquiries/:id/reply` | Kirim balasan |

---

## Workflow Penanganan

```
Pesan Masuk (NEW)
       │
       ▼
┌──────────────┐
│ Hubungi      │ ──── telepon/email ────▶
│ (CONTACTED)  │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Follow-up?  │ ── Ya ──▶ Hubungi lagi
│             │ ── Tidak ──▶
└──────────────┘
       │
       ▼
┌──────────────┐
│ Tutup        │
│ (CLOSED)    │
└──────────────┘
```

---

## Tips

1. **Prioritas** → Cek pesan NEW setiap pagi
2. **Template** → Gunakan template untuk balasan cepat
3. **Badge** → Badge merah di sidebar menunjukkan jumlah pesan baru
4. **Export** → Export pesan lama untuk backup

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./36-broadcast.md) | [Menu Berikutnya](./38-login.md)*


---

# 38. Login Admin

**URL**: `/admin/login`  
**Peran**: Semua (public page)  
**Auth**: Tidak ada (halaman publik)

---

## Gambaran Umum

Halaman login untuk mengakses admin panel. Halaman ini tidak memerlukan autentikasi sebelumnya.

---

## Form Login

### Fields

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| **Email** | Email input | Ya | Alamat email |
| **Password** | Password input | Ya | Password |

### Tombol

| Tombol | Keterangan |
|--------|------------|
| **Login** | Submit form |
| **Forgot Password** | Link reset password (jika ada) |

---

## Proses Login

### Flow

```
User submits form
       │
       ▼
Backend validates credentials
       │
       ├── Invalid ──▶ Show error "Email atau password salah"
       │
       └── Valid ──▶ Generate JWT tokens
                      │
                      ▼
              Set HTTP-only cookies
              - admin_access (access token)
              - admin_refresh (refresh token)
                      │
                      ▼
              Redirect to /admin (dashboard)
```

### JWT Tokens

| Token | Type | Expires | HttpOnly |
|-------|------|---------|----------|
| **admin_access** | Access Token | 15 minutes | Yes |
| **admin_refresh** | Refresh Token | 7 days | Yes |

### Token Refresh

Saat access token expired:
1. Frontend mendeteksi 401 response
2. Frontend memanggil refresh endpoint
3. Backend memvalidasi refresh token
4. Backend generate access token baru
5. Frontend retry request asli

---

## Default Credentials (Development)

> ⚠️ **Jangan gunakan di production!**

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | `admin@sanata.id` | `Admin123!` |
| **EDITOR** | `editor@sanata.id` | `Editor123!` |

---

## Error Messages

| Error | Arti | Solusi |
|-------|------|--------|
| "Email atau password salah" | Kredensial tidak valid | Cek email & password |
| "Akun nonaktif" | User deactivated | Hubungi admin |
| "Terlalu banyak percobaan" | Rate limited | Tunggu beberapa menit |
| "Token invalid" | Session corrupt | Clear cookies, login ulang |

---

## Security Features

| Feature | Keterangan |
|---------|------------|
| **CSRF Protection** | Form dilindungi CSRF token |
| **Rate Limiting** | Max 5 percobaan per 15 menit |
| **HTTP-only Cookies** | Token tidak bisa diaccess JS |
| **Secure Flag** | Cookie hanya HTTPS (production) |
| **SameSite** | Cookie hanya dikirim ke origin yang sama |

---

## Logout

### Cara Logout

1. Klik icon user/profile di sidebar
2. Pilih "Logout" atau "Sign Out"
3. Cookie di-clear
4. Redirect ke `/admin/login`

### Remote Logout (Admin)

Admin bisa logout user lain dari menu Security:
- View active sessions
- Revoke specific session
- Revoke all sessions

---

## Forgot Password

Jika fitur tersedia:

1. Klik "Forgot Password"
2. Masukkan email
3. Sistem kirim email reset link
4. User klik link di email
5. Reset password baru
6. Login dengan password baru

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Stuck di login page | Clear cookies, coba lagi |
| "Access denied" setelah login | Role tidak punya akses ke halaman |
| 403 setelah beberapa waktu | Token expired, login ulang |
| "Session not found" | Cookies blocked, enable cookies |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./37-inquiries.md)*
