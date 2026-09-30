# 29. Keamanan

**URL**: `/admin/security`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Menu untuk mengatur pengaturan keamanan akun sendiri. Pengguna bisa:
- Ganti password
- Aktifkan/nonaktifkan 2FA
- Lihat active sessions
- Atur preferensi keamanan

---

## Profile & Password

### Form Ubah Password

| Field | Required | Keterangan |
|-------|----------|------------|
| **Password Lama** | Ya | Password saat ini |
| **Password Baru** | Ya | Password baru (min. 8 karakter) |
| **Konfirmasi Password** | Ya | Ulangi password baru |

### Validasi Password

Password baru harus memenuhi:
- Minimal 8 karakter
- Minimal 1 huruf besar
- Minimal 1 huruf kecil
- Minimal 1 angka
- Minimal 1 karakter khusus

---

## Two-Factor Authentication (2FA)

### Enable 2FA

1. Klik **Enable 2FA**
2. Scan QR code dengan authenticator app (Google Authenticator, Authy)
3. Masukkan 6-digit code dari app
4. Simpan backup codes

### Disable 2FA

1. Klik **Disable 2FA**
2. Masukkan 6-digit code dari authenticator

### Backup Codes

- 10 backup codes generated saat enable 2FA
- Each code hanya bisa digunakan sekali
- Simpan di tempat aman

---

## Active Sessions

### Daftar Session

| Field | Keterangan |
|-------|------------|
| **Device** | Browser + OS |
| **IP Address** | Alamat IP |
| **Location** | Lokasi perkiraan |
| **Last Active** | Waktu terakhir aktif |
| **Current** | Ya (jika session ini) |

### Aksi Session

| Aksi | Keterangan |
|------|------------|
| **Revoke** | Logout dari device |
| **Revoke All** | Logout dari semua device |

---

## Login History

### Daftar Riwayat

| Field | Keterangan |
|-------|------------|
| **Tanggal** | Waktu login |
| **Device** | Browser + OS |
| **IP** | Alamat IP |
| **Location** | Lokasi |
| **Status** | Success / Failed |

### Filter

| Filter | Keterangan |
|--------|------------|
| **Date Range** | Filter tanggal |
| **Status** | Success / Failed |
| **User** | Filter user (admin only) |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| PUT | `/api/auth/password` | Ganti password |
| POST | `/api/auth/2fa/enable` | Enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| POST | `/api/auth/2fa/verify` | Verify 2FA code |
| GET | `/api/auth/sessions` | Daftar active sessions |
| DELETE | `/api/auth/sessions/:id` | Revoke session |
| DELETE | `/api/auth/sessions` | Revoke all sessions |
| GET | `/api/auth/login-history` | Riwayat login |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./28-roles.md) | [Menu Berikutnya](./30-audit-log.md)*
