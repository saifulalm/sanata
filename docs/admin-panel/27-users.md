# 27. Pengguna

**URL**: `/admin/users`  
**Peran**: ADMIN only  
**Auth**: `requireAdminRole("ADMIN")`

---

## Gambaran Umum

Menu untuk mengelola akun pengguna admin panel. **Hanya accessible oleh ADMIN**. Digunakan untuk:
- Tambah user baru
- Edit data user
- Reset password
- Deactivate/delete user

---

## Daftar Pengguna

### Tampilan Tabel

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap |
| **Email** | Alamat email (login) |
| **Role** | ADMIN / EDITOR / USER |
| **Status** | ACTIVE / INACTIVE |
| **Terakhir Login** | Tanggal login terakhir |
| **Aksi** | View, Edit, Reset Password, Delete |

---

## Form Tambah User

**URL**: `/admin/users/new` (jika ada)

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **Email** | Ya | Email (uniques, untuk login) |
| **Password** | Ya | Password (minimal 8 karakter) |
| **Role** | Ya | ADMIN / EDITOR / USER |
| **Status** | Ya | ACTIVE / INACTIVE |

### Role Permissions

| Role | Dashboard | Content | RAB | Workforce | Users | Roles |
|------|-----------|---------|-----|-----------|-------|-------|
| **ADMIN** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **EDITOR** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **USER** | R | ✗ | ✗ | R | ✗ | ✗ |

---

## Edit User

**URL**: `/admin/users/[id]/edit`

### Fields

| Field | Required | Keterangan |
|-------|----------|------------|
| **Nama** | Ya | Nama lengkap |
| **Email** | Ya | Email (tidak bisa diubah jika ada) |
| **Role** | Ya | Role user |
| **Status** | Ya | ACTIVE / INACTIVE |

---

## Reset Password

| Metode | Keterangan |
|--------|------------|
| **Manual** | Admin input password baru |
| **Auto-generate** | Sistem generate random password |
| **Send Email** | Kirim password baru via email |

---

## Deactivate vs Delete

| Aksi | Arti | Data |
|------|------|------|
| **Deactivate** | Non-aktifkan user | Data tetap ada |
| **Delete** | Hapus user permanen | Data dihapus (cascade) |

---

## Default Users (Seed Data)

| Email | Password | Role | Nama |
|-------|----------|------|------|
| `admin@sanata.id` | `Admin123!` | ADMIN | Administrator |
| `editor@sanata.id` | `Editor123!` | EDITOR | Editor |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/users` | Daftar user |
| GET | `/api/users/:id` | Detail user |
| POST | `/api/users` | Tambah user baru |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/users/:id/password` | Reset password |
| DELETE | `/api/users/:id` | Hapus user |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./26-categories.md) | [Menu Berikutnya](./28-roles.md)*
