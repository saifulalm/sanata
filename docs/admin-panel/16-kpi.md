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
