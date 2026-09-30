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
