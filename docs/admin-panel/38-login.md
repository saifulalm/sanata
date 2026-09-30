# 38. Login Admin

**URL**: `/admin/login`  
**Peran**: Semua (public page)  
**Auth**: Tidak ada (halaman publik)

---

## Gambaran Umum

Halaman login untuk mengakses admin panel. Halaman ini tidak memerlukan autentikasi sebelumnya.

---

## Form Login

### Fields

| Field | Type | Required | Keterangan |
|-------|------|----------|------------|
| **Email** | Email input | Ya | Alamat email |
| **Password** | Password input | Ya | Password |

### Tombol

| Tombol | Keterangan |
|--------|------------|
| **Login** | Submit form |
| **Forgot Password** | Link reset password (jika ada) |

---

## Proses Login

### Flow

```
User submits form
       │
       ▼
Backend validates credentials
       │
       ├── Invalid ──▶ Show error "Email atau password salah"
       │
       └── Valid ──▶ Generate JWT tokens
                      │
                      ▼
              Set HTTP-only cookies
              - admin_access (access token)
              - admin_refresh (refresh token)
                      │
                      ▼
              Redirect to /admin (dashboard)
```

### JWT Tokens

| Token | Type | Expires | HttpOnly |
|-------|------|---------|----------|
| **admin_access** | Access Token | 15 minutes | Yes |
| **admin_refresh** | Refresh Token | 7 days | Yes |

### Token Refresh

Saat access token expired:
1. Frontend mendeteksi 401 response
2. Frontend memanggil refresh endpoint
3. Backend memvalidasi refresh token
4. Backend generate access token baru
5. Frontend retry request asli

---

## Default Credentials (Development)

> ⚠️ **Jangan gunakan di production!**

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | `admin@sanata.id` | `Admin123!` |
| **EDITOR** | `editor@sanata.id` | `Editor123!` |

---

## Error Messages

| Error | Arti | Solusi |
|-------|------|--------|
| "Email atau password salah" | Kredensial tidak valid | Cek email & password |
| "Akun nonaktif" | User deactivated | Hubungi admin |
| "Terlalu banyak percobaan" | Rate limited | Tunggu beberapa menit |
| "Token invalid" | Session corrupt | Clear cookies, login ulang |

---

## Security Features

| Feature | Keterangan |
|---------|------------|
| **CSRF Protection** | Form dilindungi CSRF token |
| **Rate Limiting** | Max 5 percobaan per 15 menit |
| **HTTP-only Cookies** | Token tidak bisa diaccess JS |
| **Secure Flag** | Cookie hanya HTTPS (production) |
| **SameSite** | Cookie hanya dikirim ke origin yang sama |

---

## Logout

### Cara Logout

1. Klik icon user/profile di sidebar
2. Pilih "Logout" atau "Sign Out"
3. Cookie di-clear
4. Redirect ke `/admin/login`

### Remote Logout (Admin)

Admin bisa logout user lain dari menu Security:
- View active sessions
- Revoke specific session
- Revoke all sessions

---

## Forgot Password

Jika fitur tersedia:

1. Klik "Forgot Password"
2. Masukkan email
3. Sistem kirim email reset link
4. User klik link di email
5. Reset password baru
6. Login dengan password baru

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Stuck di login page | Clear cookies, coba lagi |
| "Access denied" setelah login | Role tidak punya akses ke halaman |
| 403 setelah beberapa waktu | Token expired, login ulang |
| "Session not found" | Cookies blocked, enable cookies |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./37-inquiries.md)*
