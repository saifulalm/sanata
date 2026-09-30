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
