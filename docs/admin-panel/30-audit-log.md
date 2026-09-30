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
