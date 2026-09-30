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
