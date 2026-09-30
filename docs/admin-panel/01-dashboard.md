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
