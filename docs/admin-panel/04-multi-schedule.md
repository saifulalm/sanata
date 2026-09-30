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
