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
