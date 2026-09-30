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
