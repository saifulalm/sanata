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
