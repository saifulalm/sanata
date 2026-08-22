# Sanata Construction

Enterprise construction-company platform: a Next.js public marketing site **and** admin panel, backed by an Express/Prisma/PostgreSQL API.

Tagline: *"Mitra Konstruksi Terpercaya."*

## Architecture

```
sanata/
├── backend/           Express API — Prisma/PostgreSQL, JWT auth, RBAC, CRUD, uploads (src/, prisma/)
├── frontend-next/       Next.js 16 (App Router) — public site AND admin panel
└── package.json         npm workspaces root
```

`frontend-next/src/app/(public)/*` is the public marketing site (Header/Footer chrome).
`frontend-next/src/app/admin/*` is the admin panel: `admin/login` is unauthenticated,
everything under `admin/(dashboard)/*` is protected by `src/proxy.ts` (session-cookie gate
with automatic token refresh) and a matching `requireAdminRole()`/`getAdminSession()` check
inside every Server Component and Server Action — defense in depth, since proxy alone doesn't
guarantee coverage for Server Function calls (see Next.js's own guidance on this).

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (access + refresh) auth, Zod validation, Multer uploads, Nodemailer, Winston logging, Helmet/CORS/rate-limiting.
- **Frontend** (`frontend-next`): Next.js 16 (App Router, Turbopack), React 19.2, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, TipTap, Lucide icons.

## Prerequisites

- Node.js 20.9+ (Next.js 16 minimum)
- PostgreSQL 14+ running locally (Laragon ships PostgreSQL 16 under
  `laragon/bin/postgresql/` — see the tutorial below)
- Redis (optional) — the API runs fine without it, just without response caching. Laragon
  ships a Redis binary under `laragon/bin/redis/`; start it with
  `redis-server.exe --port 6379` (on Windows, run it via PowerShell rather than Git Bash —
  the Windows Redis port doesn't bind correctly under Git Bash's socket emulation).

## Setup

1. Install dependencies (installs both workspaces):
   ```bash
   npm install
   ```

2. Configure the backend environment:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL Anda (lihat tutorial di bawah).
   Replace `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` with strong random values before deploying anywhere beyond local dev.

3. Configure the Next.js frontend environment:
   ```bash
   cp frontend-next/.env.example frontend-next/.env.local
   ```

4. Create the database and run migrations — lihat **Tutorial PostgreSQL** di bawah untuk
   langkah lengkapnya. Ringkasnya:
   ```bash
   psql -U postgres -c "CREATE DATABASE sanata"
   npm run prisma:migrate
   ```

5. Seed demo data (admin/editor accounts, categories, sample content & services, CMS collections/settings, broadcast
   center defaults, plus 18 basic unit prices and 7 SNI-style AHSP entries):
   ```bash
   npm run prisma:seed
   ```
   Default admin login: `admin@sanata.id` / `Admin123!`
   Default editor login: `editor@sanata.id` / `Editor123!`

6. Run in development (separate terminals):
   ```bash
   npm run dev:backend     # http://localhost:5000 — API (docs at /api/docs)
   npm run dev:web         # http://localhost:5001 — public site + admin panel (/admin)
   ```
   Frontend lokal memakai:
   ```bash
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```

### Seeder Guide

- Seeder root command:
  ```bash
  npm run prisma:seed
  ```
- Seeder backend workspace command:
  ```bash
  npm run prisma:seed --workspace backend
  ```
- Run the seeder **after**:
  1. `backend/.env` is configured
  2. database is created
  3. migrations have been applied with `npm run prisma:migrate`
- The seeder is designed to be safe to rerun:
  - admin/editor users are created with `upsert`
  - categories, sample products, articles, price items, and AHSP are refreshed/upserted
  - site settings are upserted, so new CMS keys added by newer code will appear automatically
  - site content collections are only inserted when a collection is still empty, so existing admin-managed content is not overwritten
- If you already have an older local database and want the new CMS collections/settings to appear:
  1. pull the latest code
  2. run `npm run prisma:migrate`
  3. run `npm run prisma:seed`
- If you need a fully clean demo database, recreate the database first, run migrations, then run the seeder once.

---

## Tutorial PostgreSQL

Proyek ini memakai PostgreSQL 14+ (diuji pada 16.1) sebagai satu-satunya database.
Bagian ini memuat pemasangan, pembuatan database, penerapan skema, verifikasi, sampai
backup.

### 1. Menyiapkan server

**Laragon (Windows)** — PostgreSQL sudah dibundel, tinggal dijalankan:

```bash
"D:/laragon/bin/postgresql/postgresql-16.1-1-windows-x64-binaries/bin/pg_ctl" -D "D:/laragon/data/postgresql-16" -l "D:/laragon/data/postgresql-16/server.log" start
```

Hentikan dengan `... pg_ctl -D "D:/laragon/data/postgresql-16" stop`. Sesuaikan versi pada
path bila folder di mesin Anda berbeda. Kalau folder data belum ada, inisialisasi dulu:

```bash
"D:/laragon/bin/postgresql/postgresql-16.1-1-windows-x64-binaries/bin/initdb" -D "D:/laragon/data/postgresql-16" -U postgres --encoding=UTF8 --locale=C
```

**Linux / macOS**

```bash
sudo apt install postgresql          # Debian/Ubuntu
brew install postgresql@16 && brew services start postgresql@16   # macOS
```

**Docker** — cara tercepat kalau tak ingin memasang apa pun:

```bash
docker run --name sanata-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sanata -p 5432:5432 -d postgres:16
```

Pastikan server hidup:

```bash
psql -h 127.0.0.1 -U postgres -c "SELECT version()"
```

### 2. Membuat database

```bash
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE sanata"
```

PostgreSQL memakai UTF-8 secara default, jadi tidak perlu menyetel charset/collation
apa pun saat membuat database. Untuk memakai user khusus (disarankan di server):

```bash
psql -h 127.0.0.1 -U postgres <<'SQL'
CREATE USER sanata_app WITH PASSWORD 'ganti-password-ini';
CREATE DATABASE sanata OWNER sanata_app;
GRANT ALL PRIVILEGES ON DATABASE sanata TO sanata_app;
SQL
```

### 3. Mengisi `DATABASE_URL`

Di `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sanata?schema=public"
```

Catatan:
- Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
- Password dengan karakter khusus wajib di-URL-encode — `@` → `%40`, `:` → `%3A`, `/` → `%2F`
- Server yang mewajibkan TLS: tambahkan `&sslmode=require`
- Layanan terkelola (Supabase, Neon, RDS) biasanya sudah memberi connection string siap pakai

### 4. Menerapkan skema

Development (membuat migration baru saat schema berubah):

```bash
npm run prisma:migrate
```

Production / CI (hanya menerapkan migration yang sudah ada, tidak pernah mengubah schema):

```bash
npm run prisma:generate --workspace backend
npx prisma migrate deploy --schema backend/prisma/schema.prisma
```

Cek hasilnya:

```bash
npx prisma migrate status --schema backend/prisma/schema.prisma
```

### 5. Seed & verifikasi

```bash
npm run prisma:seed
psql -h 127.0.0.1 -U postgres -d sanata -c "\dt"
```

Login bawaan: `admin@sanata.id` / `Admin123!`.

### 6. Backup & restore

```bash
pg_dump -h 127.0.0.1 -U postgres -Fc sanata > sanata.dump          # backup
pg_restore -h 127.0.0.1 -U postgres -d sanata --clean sanata.dump  # restore
```

### 7. Prisma Client wajib digenerate sebelum build

`npm run build --workspace backend` **selalu** menjalankan `prisma generate` lebih dulu, dan
`postinstall` di workspace backend melakukan hal yang sama setelah `npm install`.

Ini bukan hiasan. Tanpa client yang tergenerate, `@prisma/client` tidak mengekspor `Prisma`
maupun tipe model, sehingga TypeScript menolak **seluruh** berkas yang menyentuh database —
gejalanya ratusan error `TS2305: Module '"@prisma/client"' has no exported member 'Prisma'`
dan `TS7006: Parameter implicitly has an 'any' type` di 16 berkas yang tersebar, padahal tak
ada satu pun baris kode yang salah. Bila melihat pola error itu, jalankan:

```bash
npm run prisma:generate --workspace backend
```

`prisma generate` hanya membaca `schema.prisma`; ia tidak menghubungi database, jadi perintah
ini tetap berhasil walau server PostgreSQL sedang mati.

### 8. Catatan perilaku PostgreSQL yang tercermin di kode

| Hal | Perilaku PostgreSQL | Konsekuensi di kode |
| --- | --- | --- |
| Perbandingan teks | case-sensitive | pencarian admin memakai `mode: "insensitive"`; email dinormalkan ke huruf kecil di validator auth, user, dan inquiry |
| Tipe teks | `text` tanpa batas panjang | batas panjang ditegakkan Zod, bukan database |
| Kolom JSON | `JSONB` | mendukung indeks & query JSON |
| Nilai JSON kosong | SQL NULL dan JSON `null` adalah dua nilai berbeda | kode memakai `Prisma.DbNull` supaya tersimpan sebagai SQL NULL |
| Enum | tipe enum native | menambah nilai enum wajib lewat migration |
| Identifier | maksimum 63 karakter | sudah diverifikasi: nama terpanjang 57 karakter (`BroadcastChannelConnection_channel_isPrimary_priority_idx`) |

---

## Deployment (PM2 + Nginx)

Panduan ini memakai satu VPS Linux (Ubuntu 22.04/24.04) dengan **satu domain**: Nginx
menjadi reverse proxy di depan dua proses Node yang dijalankan PM2.

```
                    ┌── / ─────────────► 127.0.0.1:5001  Next.js (public + /admin)
Internet ─► Nginx ──┼── /api ──────────► 127.0.0.1:5000  Express API
           (443)    ├── /uploads ──────► 127.0.0.1:5000  berkas lokal (driver "local")
                    └── /health ───────► 127.0.0.1:5000  health check
```

Kenapa satu domain, bukan `api.domain.com` terpisah:

- Cookie refresh token dipasang `sameSite: "lax"` ([auth.controller.ts:15](backend/src/controllers/auth.controller.ts:15)),
  jadi origin frontend dan API harus satu site.
- `cors({ origin: env.clientUrl })` mencocokkan origin secara **persis** — satu origin
  membuat konfigurasi CORS tidak pernah jadi sumber bug.
- Rewrite `/uploads` di [next.config.ts](frontend-next/next.config.ts) tidak pernah terpakai
  karena Nginx sudah mencegatnya lebih dulu, sehingga gambar tidak melewati dua hop.

Bila Anda tetap ingin memisah API ke subdomain, gunakan subdomain di bawah domain yang sama
(`app.sanata.id` + `api.sanata.id`, keduanya satu registrable domain) supaya cookie `lax`
tetap terkirim, dan set `CLIENT_URL` ke origin frontend.

### 1. Menyiapkan server

```bash
sudo apt update && sudo apt install -y nginx postgresql redis-server git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Buat user non-root khusus aplikasi (jangan menjalankan PM2 sebagai root):

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/sanata && sudo chown -R deploy:deploy /var/www/sanata
```

Siapkan database — langkah lengkap ada di **Tutorial PostgreSQL** di atas:

```bash
sudo -u postgres psql -c "CREATE USER sanata WITH PASSWORD 'ganti-password-kuat'"
sudo -u postgres psql -c "CREATE DATABASE sanata OWNER sanata"
```

Buka firewall bila `ufw` aktif — port 5000/5001 **tidak** perlu dibuka karena hanya diakses
Nginx dari localhost:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # 80 + 443
sudo ufw enable
```

### 2. Ambil kode dan build

```bash
sudo -iu deploy
git clone <repo-url> /var/www/sanata && cd /var/www/sanata
npm install                 # memasang kedua workspace + prisma generate via postinstall
```

Isi `backend/.env` untuk produksi:

```env
DATABASE_URL="postgresql://sanata:ganti-password-kuat@localhost:5432/sanata?schema=public"
PORT=5000
NODE_ENV=production
CLIENT_URL="https://sanata.id"          # wajib origin publik, bukan localhost
JWT_ACCESS_SECRET="<openssl rand -base64 48>"
JWT_REFRESH_SECRET="<openssl rand -base64 48>"
UPLOAD_DIR="uploads"
REDIS_URL="redis://127.0.0.1:6379"
```

`NODE_ENV=production` juga yang membuat cookie refresh token dikirim dengan flag `secure`,
jadi HTTPS wajib aktif sebelum login dicoba.

Isi `frontend-next/.env.production` (dibaca saat build **dan** saat runtime):

```env
NEXT_PUBLIC_API_URL="https://sanata.id/api"
```

`NEXT_PUBLIC_*` di-inline ke bundle saat `next build`, jadi setiap kali nilai ini berubah
frontend harus di-build ulang — bukan sekadar restart. Karena itu kedua nilai di atas
langsung ditulis dengan `https://` walau sertifikat baru dipasang di langkah 5: situs memang
belum bisa dipakai sampai TLS aktif, tapi Anda tidak perlu build dua kali.

`next build` bisa memakai >1 GB RAM. Pada VPS 1–2 GB, siapkan swap dulu supaya build tidak
dibunuh OOM killer:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Terapkan skema, seed sekali, lalu build keduanya:

```bash
(cd backend && npx prisma migrate deploy)   # bukan `npm run prisma:migrate`
npm run prisma:seed                          # cukup sekali di instalasi baru
npm run build:backend
npm run build:web
```

> Script `npm run prisma:migrate` memanggil `prisma migrate dev`, yang **tidak boleh** dipakai
> di produksi: ia bisa membuat file migration baru dan mereset database. Di produksi selalu
> `prisma migrate deploy`, dan jalankan dari direktori `backend/` supaya Prisma memuat
> `backend/.env` secara otomatis.

Setelah deploy pertama, segera ganti password akun seed (`admin@sanata.id` /
`Admin123!`) lewat panel admin atau hapus akun editor demo bila tidak dipakai.

### 3. Menjalankan dengan PM2

Buat `ecosystem.config.js` di root proyek (file ini tidak ikut di repo karena berisi
detail spesifik server):

```js
module.exports = {
  apps: [
    {
      name: "sanata-api",
      cwd: "/var/www/sanata/backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "512M",
      error_file: "/var/log/sanata/api.error.log",
      out_file: "/var/log/sanata/api.out.log",
      time: true,
    },
    {
      name: "sanata-web",
      cwd: "/var/www/sanata/frontend-next",
      // Path absolut: npm workspaces meng-hoist `next` ke node_modules root,
      // bukan ke frontend-next/node_modules. Cek nilainya di server dengan:
      //   cd frontend-next && node -p "require.resolve('next/dist/bin/next')"
      script: "/var/www/sanata/node_modules/next/dist/bin/next",
      args: "start -p 5001",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "1G",
      error_file: "/var/log/sanata/web.error.log",
      out_file: "/var/log/sanata/web.out.log",
      time: true,
    },
  ],
};
```

Catatan penting soal konfigurasi di atas:

- `exec_mode: "fork"` dengan satu instance dipakai sengaja. Mode `cluster` belum aman untuk
  API ini karena rate limiter (`express-rate-limit`) menyimpan hitungan di memori proses —
  beberapa worker berarti setiap worker punya kuota sendiri. Naikkan instance hanya setelah
  limiter dipindah ke store Redis.
- `script: "dist/index.js"` menjalankan hasil `npm run build:backend`; jangan menunjuk ke
  `src/index.ts` (butuh `tsx`, tidak untuk produksi).
- Next.js dipanggil lewat binary-nya langsung, bukan `npm run start`, supaya PM2 mengawasi
  proses Node sungguhan dan bukan shell npm perantara.
- Karena `exec_mode` fork, `pm2 reload` berperilaku sama dengan `pm2 restart` (ada jeda
  singkat saat proses berganti). Reload nol-downtime baru berlaku di mode cluster.
- `cwd` pada `sanata-api` bersifat wajib, bukan kosmetik. Backend memakai `import
  "dotenv/config"` yang membaca `.env` dari direktori kerja proses, dan direktori unggahan
  dihitung `path.resolve(process.cwd(), UPLOAD_DIR)` ([storage.ts:28](backend/src/lib/storage.ts:28)).
  Salah `cwd` berarti env tidak terbaca dan berkas unggahan mendarat di folder lain.

Jalankan dan pasang autostart:

```bash
sudo mkdir -p /var/log/sanata && sudo chown deploy:deploy /var/log/sanata
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy    # jalankan perintah yang dicetak, sebagai root
```

Pasang rotasi log — tanpa ini `/var/log/sanata/*.log` tumbuh tanpa batas sampai disk penuh:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

Perintah harian:

```bash
pm2 status
pm2 logs sanata-api --lines 100
pm2 reload sanata-api            # muat ulang setelah deploy
pm2 restart sanata-web --update-env   # --update-env bila .env berubah
```

### 4. Konfigurasi Nginx

Pasang konfigurasi **HTTP dulu**, tanpa blok TLS. Sertifikat belum ada di titik ini, dan
`ssl_certificate` yang menunjuk berkas tak ada membuat `nginx -t` gagal total
(`[emerg] cannot load certificate ... BIO_new_file() failed`) sehingga Nginx tidak mau
reload dan certbot pun tak bisa jalan. Certbot yang akan menambahkan blok TLS di langkah 5.

Pertama, buat berkas header proxy bersama di `/etc/nginx/snippets/sanata-proxy.conf`:

```nginx
proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Connection        "";
```

Berkas terpisah ini bukan sekadar kerapian — **wajib**. Di Nginx, `proxy_set_header` adalah
direktif array: begitu sebuah `location` mendeklarasikan satu `proxy_set_header`, seluruh
`proxy_set_header` yang diwarisi dari level `server` **dibuang**, tidak digabung. Meletakkan
header di level `server` lalu menambah satu header di dalam `location /api/` membuat
`X-Forwarded-For` hilang persis di jalur yang paling membutuhkannya. Akibatnya di aplikasi
ini fatal: `app.set("trust proxy", 1)` ([app.ts:18](backend/src/app.ts:18)) jatuh ke IP soket,
semua pengunjung terlihat sebagai `127.0.0.1`, dan `globalApiLimiter` (300 request / 15 menit,
[rateLimiters.ts:3](backend/src/middleware/rateLimiters.ts:3)) memblokir seluruh situs dalam
hitungan menit. Karena itu snippet di atas di-`include` di **setiap** `location`.

`Connection ""` diperlukan agar `keepalive` pada blok `upstream` benar-benar berfungsi
(HTTP/1.1 ke upstream tanpa header `Connection: close`).

Lalu `/etc/nginx/sites-available/sanata.conf`:

```nginx
upstream sanata_api { server 127.0.0.1:5000; keepalive 32; }
upstream sanata_web { server 127.0.0.1:5001; keepalive 32; }

server {
    listen 80;
    listen [::]:80;
    server_name sanata.id www.sanata.id;

    # Unggahan dibatasi 5 MB di multer; beri ruang untuk overhead multipart.
    client_max_body_size 10m;

    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    # Swagger UI. Blok lebih spesifik daripada /api/ sehingga dipilih lebih dulu.
    # Hapus blok ini bila dokumentasi API memang boleh publik.
    location /api/docs {
        allow 203.0.113.10;          # ganti dengan IP kantor Anda
        deny all;
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_api;
    }

    location /api/ {
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_api;
        proxy_read_timeout 120s;
    }

    location = /health {
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_api;
        access_log off;
    }

    # Berkas unggahan (STORAGE_DRIVER="local"). Pada driver "s3" blok ini
    # tidak terpakai karena berkas dilayani dari CDN.
    location /uploads/ {
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_api;
        # express.static mengirim "public, max-age=0"; buang dulu, jangan
        # ditumpuk — dua header Cache-Control membingungkan cache perantara.
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=604800";
    }

    # Aset build Next.js sudah dikirim dengan "public, max-age=31536000,
    # immutable" oleh Next sendiri, jadi cukup diteruskan apa adanya.
    location /_next/static/ {
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_web;
    }

    location / {
        include /etc/nginx/snippets/sanata-proxy.conf;
        proxy_pass http://sanata_web;
    }
}
```

Aktifkan dan uji:

```bash
sudo ln -s /etc/nginx/sites-available/sanata.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Catatan pemilihan `location`:

- `= /health` memakai pencocokan **persis**. Dengan prefix biasa (`/health`), path seperti
  `/healthcheck` ikut tertangkap.
- `/api/docs`, `/api/`, `/uploads/`, dan `/_next/static/` adalah prefix yang lebih panjang
  daripada `/`, jadi Nginx memilihnya lebih dulu tanpa peduli urutan penulisan. `/` hanya
  menangkap sisanya (halaman publik dan `/admin`).
- Tidak ada `proxy_set_header Upgrade`/`Connection "upgrade"` karena `next start` di produksi
  tidak memakai WebSocket (itu hanya perlu untuk HMR saat `next dev`). Memasang
  `Connection: upgrade` tanpa `map $http_upgrade` justru merusak keepalive ke upstream.

Sampai di sini yang bisa diuji baru jalur proxy-nya, bukan situsnya:

```bash
curl http://sanata.id/health     # {"success":true,...} — Nginx → Express jalan
```

Halaman publik **belum** akan tampil benar. Server Component mengambil data lewat
`NEXT_PUBLIC_API_URL` yang sudah diisi `https://` ([api.ts:1](frontend-next/src/lib/api.ts:1)),
sedangkan TLS baru aktif di langkah berikutnya — jadi fetch SSR masih gagal. Login juga
belum bertahan karena cookie refresh dipasang `secure` saat `NODE_ENV=production`. Keduanya
beres setelah langkah 5, tanpa perlu build ulang.

### 5. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sanata.id -d www.sanata.id
```

Certbot menyunting `sanata.conf` di tempat: menambahkan blok `listen 443 ssl`, path
sertifikat, dan blok redirect 80 → 443. Semua `location` beserta `include` snippet-nya ikut
terbawa ke blok HTTPS. Timer perpanjangan otomatis dipasang sekaligus:

```bash
sudo certbot renew --dry-run
```

Opsional, aktifkan HTTP/2 setelah certbot selesai. Sintaksnya berbeda antar versi — cek
dengan `nginx -v`:

```nginx
# nginx >= 1.25.1 (Ubuntu 24.04+): direktif terpisah
http2 on;

# nginx < 1.25.1 (Ubuntu 22.04): parameter pada listen
# listen 443 ssl http2;
```

Jalankan `sudo nginx -t && sudo systemctl reload nginx` setelah menyunting.

### 6. Verifikasi

```bash
curl -I https://sanata.id                 # 200, halaman publik dari Next.js
curl  https://sanata.id/health            # {"success":true,"data":{"status":"ok",...}}
curl -I https://sanata.id/api/products    # 200 dari Express
pm2 status                                # kedua proses "online", restart 0
```

Pastikan juga IP klien benar-benar sampai ke Express — ini yang paling sering diam-diam
salah. Jalankan dari **dua mesin berbeda** (mis. server dan laptop Anda):

```bash
curl -sI https://sanata.id/api/products | grep -i ratelimit-remaining
```

Nilai `RateLimit-Remaining` harus turun **terpisah** untuk tiap mesin. Bila dua mesin
berbagi hitungan yang sama, `X-Forwarded-For` tidak sampai dan seluruh pengunjung memakai
satu kuota — periksa `include` snippet proxy di setiap `location`.

Lalu login ke `https://sanata.id/admin` dan pastikan sesi bertahan setelah refresh — bila
gagal, penyebab tersering adalah `CLIENT_URL` masih `localhost` atau `NODE_ENV` belum
`production` (cookie tidak dikirim `secure` di belakang HTTPS).

Bila di depan Nginx masih ada proksi lain (Cloudflare, load balancer), `X-Forwarded-For`
berisi lebih dari satu entri sedangkan `app.set("trust proxy", 1)` hanya memercayai satu
hop, sehingga IP yang terbaca adalah IP proksi perantara. Naikkan angka `trust proxy` sesuai
jumlah hop di [app.ts:18](backend/src/app.ts:18) bila memakai topologi itu.

### 7. Update rilis berikutnya

```bash
cd /var/www/sanata
git pull
npm install
(cd backend && npx prisma migrate deploy)
npm run build:backend && npm run build:web
pm2 reload sanata-api && pm2 reload sanata-web
```

Jalankan `npm run build:web` **sebelum** reload: `next start` menyajikan isi `.next`, jadi
reload tanpa build ulang hanya menghidupkan kembali versi lama.

### 8. Masalah yang sering muncul

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `502 Bad Gateway` di semua path | proses PM2 mati atau port salah | `pm2 status`, `pm2 logs`, cocokkan `PORT` di `.env` dengan `upstream` |
| Halaman tampil, semua panggilan API gagal CORS | `CLIENT_URL` tidak sama persis dengan origin publik (beda `www`/skema) | samakan nilainya, lalu `pm2 restart sanata-api --update-env` |
| Login berhasil tapi sesi hilang saat refresh | `NODE_ENV` bukan `production` atau situs diakses via HTTP | aktifkan HTTPS dan set `NODE_ENV=production` |
| Frontend masih menembak `localhost:5000` | `NEXT_PUBLIC_API_URL` diubah tanpa build ulang | `npm run build:web`, lalu reload PM2 |
| `413 Request Entity Too Large` saat unggah | `client_max_body_size` default 1 MB | naikkan seperti contoh di atas |
| Rate limit memblokir seluruh pengunjung | sebuah `location` mendeklarasikan `proxy_set_header` sendiri sehingga membuang header warisan; `X-Forwarded-For` hilang | `include /etc/nginx/snippets/sanata-proxy.conf;` di **setiap** `location`, jangan andalkan pewarisan |
| Error TypeScript massal saat build | Prisma Client belum di-generate | `npm run prisma:generate --workspace backend` |
| `nginx -t` gagal: `cannot load certificate` | blok TLS dipasang sebelum certbot membuat sertifikat | pasang konfigurasi HTTP dulu (langkah 4), baru jalankan certbot |
| `next build` mati sendiri / `Killed` | kehabisan RAM di VPS kecil | aktifkan swap seperti di langkah 2 |
| Unggahan tersimpan tapi gambar 404 | `cwd` PM2 salah, `UPLOAD_DIR` teresolusi ke folder lain | pastikan `cwd: "/var/www/sanata/backend"` di ecosystem, lalu `pm2 restart sanata-api` |
| Backend gagal start: `Missing required env var` | `.env` tidak terbaca karena `cwd` proses bukan `backend/` | perbaiki `cwd` di ecosystem file |
| `/var/log` penuh | rotasi log belum dipasang | `pm2 install pm2-logrotate` (langkah 3) |

## Features (current)

**Public site — `frontend-next`** (Next.js, active rewrite)
- Enterprise homepage: fullscreen animated hero, stats counters, services preview, featured
  projects (live from the API), why-choose-us, process timeline, certificates/partner strip,
  testimonials, latest articles (live from the API), contact CTA with embedded map.
- **Widget WhatsApp** — a floating panel rather than a bare `wa.me` link. Opening it shows a
  greeting, quick-reply chips, a message draft box, and the list of teams that can be contacted;
  picking a team opens WhatsApp with the draft already filled in.
  - **Leads stop leaking.** Every other channel in this app records a prospect; the old link
    recorded nothing, so a visitor who tapped it and never sent the message left no trace. The
    panel's "tinggalkan pesan" form posts through the **same Server Action as the contact page**,
    so the lead lands in Admin → Pesan Masuk with `preferredChannel: WHATSAPP` and syncs to
    broadcast contacts when consent is given — one entry path, one set of validation and rate
    limits, nothing to keep in step separately.
  - **Page context travels with the message.** The prefilled text appends the page title and URL,
    so the team can see what the visitor was looking at instead of guessing.
  - **Multiple agents.** Teams come from the `whatsapp_agents` collection (name, role, note,
    photo, own number, own hours). With the collection empty it falls back to the single
    `contact.whatsapp` number, so existing installs keep working untouched.
  - **Honest opening hours.** Online/offline is computed in *office* time (UTC + a configurable
    offset), not the visitor's clock — otherwise someone browsing from abroad during Jakarta
    business hours would be told the team is closed. Outside hours the panel says so rather than
    implying an instant reply. Overnight shifts (close earlier than open) are handled.
  - **Asisten jawab cepat.** Typing a question and pressing Enter answers it straight from the
    **FAQ collection the admin already maintains** — no external language model. That is a
    deliberate choice, not a shortcut: every reply is a sentence the team actually wrote and
    approved, so the widget cannot invent a price, a warranty, or a delivery date. Adding a new
    answer means adding an FAQ entry, not touching code or tuning a prompt.
    - Matching is word overlap with a crude Indonesian stemmer, so "bayar" finds "pembayaran" and
      "bangun" finds "pembangunan". Words in an entry's *question* count double against words in
      its answer, since the question defines the topic. Below a confidence threshold the assistant
      says it does not know and hands over to WhatsApp — a predictable miss beats a confident
      wrong answer.
    - The same matcher suggests which team to contact, using per-agent keywords from the CMS. With
      no clear winner it stays quiet rather than routing to the wrong desk.
    - Verified against the seeded FAQ: 12/12 cases, including "resep rendang padang" correctly
      answered with "I don't know".
  - Escape closes the panel, focus moves in on open and returns to the trigger on close,
    navigation closes it, and the pulse indicator respects `prefers-reduced-motion`. Focus is only
    returned once the panel has actually been opened — without that guard the effect fired on
    mount and every page load stole focus to the floating button.
- **Model 3D — Exploded Floor View** (`#exploded-view`): an interactive three.js section that pulls
  a building apart floor by floor. One slider controls the separation, floors can be picked either
  by clicking the model or from the list beside it, and the selected floor shows its own
  description, plan image, and link.
  - Every floor is a CMS entry with **real dimensions in metres** (height, width, depth) plus a
    colour. The model derives its own scale from the data — from the total height *and* the widest
    footprint — so a single-storey house and a twenty-storey tower both stay framed without any
    hard-coded numbers. Floor order uses the collection's existing reorder buttons.
  - The canvas is `aria-hidden`; every control is an ordinary HTML element beside it (slider,
    floor buttons, rotate toggle), so keyboard and screen-reader users get the same path rather
    than a second-class one.
  - `prefers-reduced-motion` disables auto-rotation and the toggle says so instead of looking
    broken. The slider and floor selection keep working — they are user-initiated, not ambient
    motion. The preference is read with `useSyncExternalStore`, so there is no state-in-effect and
    no hydration mismatch.
  - Without WebGL the component falls back to a stacked diagram that keeps the floors' relative
    widths and heights, so the actual information still lands. Support is probed once and cached.
  - Rendering is gated by `IntersectionObserver` + `visibilitychange`, one static frame is always
    drawn, and every geometry/material/renderer is disposed on unmount — matching the hero canvas.
  - **Garis Waktu 4D** — a second mode on the same model that adds the time dimension, so "4D"
    describes something the page actually does rather than a label. Each floor carries a start
    week and a duration; dragging the week slider (or pressing play) grows the floors from their
    base as their scheduled window passes, and the readout shows overall progress plus which floor
    is currently being worked on — or the next one due, so a week that lands exactly on a handover
    does not read as "nothing in progress" while 90% of the building already stands.
    - Progress is weighted by **volume**, not floor count: a big floor is more work than a small
      one. Project length is derived from the floor data, so adding a floor in the admin extends
      the timeline by itself.
    - Growth is applied as a Y-scale on the existing meshes, not new geometry, so scrubbing the
      timeline rebuilds nothing. Play is suppressed under `prefers-reduced-motion`; the slider
      still works because scrubbing is user-initiated.
- Hero scene carousel: slides come from the CMS, with prev/next controls, autoplay that pauses on
  hover and on keyboard focus, `aria-current` thumbnails, and autoplay suppressed under
  `prefers-reduced-motion` — matching what the 3D canvas already did. The live region only
  announces while autoplay is stopped, so an unattended slideshow does not talk over a screen
  reader.
- Design system: Plus Jakarta Sans / Inter / Manrope, forest-green + gold enterprise palette,
  Framer Motion scroll reveals and counters, fully responsive.
- Server-rendered data fetching straight from the Express API (SEO-friendly, revalidated).
- Full site now live: About (story/values/timeline/leadership/certifications), Services
  (filterable listing + detail page with advantages/timeline/FAQ), Projects/Portfolio
  (filterable listing + case-study detail with related projects), Journal (filterable listing
  + article detail with reading time, share links, related posts), Contact (working inquiry
  form via a Server Action, persisted to the database), Clients, Career, Gallery, Testimonials,
  FAQ (native accordion), Privacy, Terms. Any URL not yet implemented falls back to a branded
  404.

**Admin panel — `frontend-next` (`/admin`)**
- BFF auth: Next.js server owns its own httpOnly cookies (`admin_access`/`admin_refresh`),
  `src/proxy.ts` gates every `/admin/*` route and proactively refreshes via the Express API;
  every Server Component/Action also re-checks the session (`requireAdminRole`) so auth
  doesn't depend on the proxy alone.
- Role-based access: `ADMIN`, `EDITOR`, `USER`.
- 2FA (TOTP): setup/enable/disable from Admin → Keamanan, QR + 6-digit confirm; login enforces
  the code once enabled.
- Dashboard with stat cards, content-status pie chart, top-content bar chart (Recharts).
- CRUD for Content, Products, Categories via Server Actions (`useActionState`/`useFormStatus`),
  search + status filters, pagination.
- Users: role change + active toggle, self-delete protected.
- Inquiries: full lead workflow (Baru → Dihubungi → Selesai) with status tabs showing live
  counts, search, pagination, and one-click mail/WhatsApp links straight to the sender.
- Broadcast Center: multi-channel campaign hub di `/admin/broadcasts` untuk Email, Telegram,
  WhatsApp open source gateway, WhatsApp Official, Instagram, dan Facebook; lengkap dengan
  multi-account sender pool, tes koneksi, draft campaign, auto-route campaign, pengiriman
  broadcast, dan delivery summary.
- **Pustaka Media** — `/admin/media`: seluruh berkas yang pernah diunggah bisa dicari (nama
  berkas, filter gambar/berkas lain), disalin URL-nya satu klik, dan dihapus. Ringkasan jumlah
  berkas serta total ukuran penyimpanan ada di kepala halaman. Sebelumnya unggahan hanya bisa
  dibuat, tidak pernah bisa ditelusuri kembali (`GET /api/media` baru ditambahkan).
- **Buat pengguna dari panel** — pendaftaran publik selalu menghasilkan role `USER`, sehingga
  akun `ADMIN`/`EDITOR` dulu hanya bisa lahir dari seeder. Kini ada `POST /api/users` beserta
  formulirnya di `/admin/users` (nama, email, password awal, role, status aktif), lengkap dengan
  penolakan email ganda.
- **Command palette** (`Ctrl`/`Cmd` + `K`) di header: cari dan lompat ke menu mana pun tanpa
  menggulir sidebar. Daftar entrinya mengikuti hak akses, jadi menu khusus ADMIN tidak muncul
  untuk EDITOR.
- **Lencana pesan masuk** di sidebar menampilkan jumlah inquiry berstatus baru.
- Broadcast: kontak kini bisa **ditambah manual** (klien lama di luar form publik) dan
  dinonaktifkan, serta campaign bisa **dihapus** — sebelumnya kontak hanya bisa masuk lewat form
  kontak publik dan campaign tidak pernah bisa dibersihkan.
- Audit Log: entity filter tabs and pagination — every mutation across
  Content/Product/Category/User/PriceItem/AHSP/RAB/SiteContent/Inquiry is recorded here.
- **Design system panel admin** — `src/components/admin/ui.tsx`: `PageHeader`, `Panel`, `Badge`,
  `EmptyState`, primitif tabel (`TableWrap`/`Th`/`Td`/`Tr`), `ListRow`, serta helper kelas
  `btn()`, `inputClass`, `selectClass`, `textareaClass`.

  Halaman admin awalnya ditulis bertema terang lalu dipaksa gelap oleh selektor `!important` di
  `globals.css` (`.admin-theme [class*="bg-white"]`, `[class*="text-primary-"]`, …). Pendekatan
  itu rapuh: `[class*="bg-white"]` juga mengenai `bg-white/[0.04]`, dan penimpaan `text-primary-*`
  meratakan seluruh hierarki teks jadi satu warna. Primitif baru menulis warna gelapnya sendiri.
  Dashboard, Pengguna, dan Pustaka Media sudah memakainya (dashboard terverifikasi nol simpul
  bertema terang); lapisan CSS lama sengaja dipertahankan sebagai jaring pengaman untuk halaman
  yang belum dimigrasi (RAB, Quotation, AHSP, Harga Satuan, Konten Situs).
- Shared UX across every menu: skeleton loading states, an error boundary with retry, an
  in-panel 404, and a branded confirmation dialog (Esc to dismiss, focus defaults to Cancel)
  instead of native `confirm()`. Destructive actions that the backend refuses — deleting a
  category still in use, an AHSP referenced by a RAB — surface the reason inline rather than
  throwing.
- Sidebar grouped by job to do: Estimasi Biaya, Situs &amp; Konten, Prospek, Sistem.
- **Rich text editor** (TipTap) for article/page bodies — headings, lists, quotes, links, undo —
  replacing the raw HTML textarea. Output is plain HTML, styled to match the public article page.
- **Image upload** with preview for leadership photos, partner logos, and any image field:
  the file goes through a Server Action so the access token never reaches the browser, and is
  validated for type and size on both sides.

**File storage**
- Pluggable driver: local disk (the zero-config default) or S3/Cloudflare R2, selected with
  `STORAGE_DRIVER`. Uploads take one code path — multer buffers the file, the driver decides
  where it lands — so behaviour is identical either way.
- Setting `STORAGE_DRIVER=s3` with incomplete credentials fails loudly at the first upload
  rather than silently writing somewhere unexpected. R2 and other S3-compatible services work
  via `S3_ENDPOINT`.
- Deleting a media record also removes the underlying file; a storage failure there is logged
  and never blocks the delete.

**Email** (optional, all no-ops until SMTP is set)
- Internal notification to the team on every new inquiry.
- Branded auto-reply to the sender confirming receipt, quoting their message back, with contact
  details pulled live from the CMS settings so it never goes stale.
- Both are fire-and-forget — the public contact form cannot fail because of mail.

**Broadcast multi-channel**
- Data model lengkap: `BroadcastContact`, `BroadcastChannelConnection`, `BroadcastCampaign`, dan
  `BroadcastDelivery`, plus consent + preferred channel pada inquiry publik.
- Multi-account sender pool:
  - satu channel dapat memiliki banyak akun/sender
  - setiap akun punya `provider`, `accountKey`, `priority`, `weight`, `dailyLimit`, dan `hourlyLimit`
  - campaign dapat di-pin ke akun tertentu atau dibiarkan `Auto Route`
- Channel adapters siap pakai:
  - Email via SMTP backend
  - Telegram via Bot API
  - WhatsApp via Baileys gateway pattern
  - WhatsApp Official via Meta Cloud API
  - WhatsApp via gateway pattern lain (WAHA / Evolution API) bila masih dipakai
  - Instagram via Meta Messaging API
  - Facebook via Messenger API
- Setiap pengiriman disimpan per-recipient sehingga status `SENT`, `FAILED`, dan `PARTIAL`
  bisa diaudit dari admin panel.
- Routing broadcast membagi pengiriman berdasarkan akun aktif dengan prioritas, weight, dan limit
  per akun, sehingga volume kecil/menengah bisa disebar ke beberapa sender WhatsApp.
- QR pairing untuk akun `WHATSAPP_BAILEYS` — jalur utama sekarang berbasis QR, bukan JSON:
  - kartu **Perangkat WhatsApp** di `/admin/broadcasts` › tombol `Hubungkan WhatsApp`
  - admin cukup mengisi nama perangkat; `accountKey`, `session`, `baseUrl`, dan `apiKey`
    diisi otomatis dari `BAILEYS_GATEWAY_URL` / `BAILEYS_API_KEY` di `backend/.env`
  - dialog menampilkan QR besar + instruksi langkah, memantau status tiap 3 detik, dan
    menyegarkan QR sendiri saat kedaluwarsa — tidak perlu klik `Refresh` manual
  - alternatif tanpa kamera: **kode pairing 8 karakter** dengan memasukkan nomor WhatsApp
  - akun pengirim bisa dihapus dari kartu koneksi (riwayat campaign tetap tersimpan)
  - form JSON lama tetap ada di balik disclosure `Konfigurasi lanjutan (JSON)` untuk gateway
    non-standar
  - backend menyediakan endpoint session:
    - `POST /api/broadcasts/connections/whatsapp/quick-connect`
    - `GET /api/broadcasts/connections/:id/session`
    - `POST /api/broadcasts/connections/:id/session`
    - `POST /api/broadcasts/connections/:id/session/refresh`
    - `POST /api/broadcasts/connections/:id/session/pair`
    - `DELETE /api/broadcasts/connections/:id/session`
    - `DELETE /api/broadcasts/connections/:id`
  - `mock-baileys-gateway.js` di root repo mensimulasikan gateway (QR, pairing code, logout,
    plus `POST /sessions/:id/simulate-connect` untuk menguji status tersambung)
  - konfigurasi manual akun Baileys di `config` (hanya bila tidak memakai quick-connect):
    - `baseUrl`: alamat HTTP gateway Baileys Anda
      - contoh lokal: `http://127.0.0.1:3005`
      - contoh server LAN/VPS: `http://192.168.1.10:3005` atau `https://wa-gateway.sanata.id`
      - isi hanya origin/base URL, tanpa path endpoint tambahan
    - `session`: nama sesi akun WhatsApp di gateway
      - contoh: `sanata-a`
      - untuk multi account gunakan nama unik per akun, misalnya:
        - `sanata-admin-1`
        - `sanata-sales-1`
        - `sanata-followup-1`
      - nilai ini harus sama dengan session id yang dipakai gateway Baileys
    - `apiKey` bila gateway memerlukan auth
  - contoh `config` paling sederhana:
    ```json
    {
      "provider": "baileys",
      "baseUrl": "http://127.0.0.1:3005",
      "apiKey": "",
      "session": "sanata-a"
    }
    ```
  - panduan isi field:
    - jika gateway Baileys jalan di mesin yang sama dengan backend/admin, pakai `http://127.0.0.1:<port>`
    - jika gateway jalan di server lain, pakai URL gateway tersebut yang bisa diakses backend
    - `session` bukan nomor WhatsApp; ini adalah identifier internal untuk 1 akun
    - 1 akun WhatsApp = 1 `session`
    - 1 akun pengirim baru = buat `session` baru lagi
  - optional override bila gateway Anda memakai path custom:
    - `sessionInitEndpoint`
    - `sessionStatusEndpoint`
    - `sessionQrEndpoint`
    - `sessionRefreshEndpoint`
    - `sessionDisconnectEndpoint`
  - jika gateway hanya mengembalikan QR string mentah, backend otomatis mengubahnya menjadi gambar
    data URL agar langsung bisa dipindai dari admin panel.
- Seeder membuat default account untuk Email, Telegram, WhatsApp Baileys, WhatsApp Official,
  Instagram, dan Facebook, plus sample campaign agar Broadcast Center langsung punya data awal.

**SEO** — `/admin/seo`
- Skor on-page per konten (judul, meta deskripsi, panjang, slug, gambar sosial, subjudul, dan
  analisis kata kunci utama) dengan pesan perbaikan yang konkret, bukan sekadar angka.
- Pengaturan SEO global bisa diubah langsung dari halaman ini (grup setting `SEO`):
  `seo.site_url`, `seo.default_title`, `seo.title_template`, `seo.default_description`,
  `seo.keywords`, `seo.default_og_image`, `seo.allow_indexing`, `seo.google_site_verification`,
  `seo.bing_site_verification`, `seo.organization_type`, `seo.area_served`.
- Metadata root layout (title template, deskripsi, Open Graph, Twitter card, tag verifikasi)
  dibangun dari setelan tersebut — tidak ada lagi nilai hardcoded.
- `seo.allow_indexing=false` memblokir seluruh crawler lewat `robots.txt` sekaligus mengosongkan
  `sitemap.xml`; berguna untuk staging.
- `sitemap.xml` mencakup halaman statis, artikel jurnal, **dan** detail layanan (`/services/:slug`)
  serta proyek (`/projects/:slug`) — sebelumnya dua kelompok terakhir tidak pernah masuk sitemap.
- JSON-LD: `Article` di detail jurnal, plus organisasi di beranda lengkap dengan `contactPoint`
  WhatsApp sehingga hasil pencarian bisa menawarkan aksi chat.
- Halaman detail layanan & proyek kini punya canonical URL dan tag Open Graph bergambar.

**Konten situs (CMS)** — `/admin/site-content`
- Every repeating list on the public site (hero stats, service cards, why-choose-us, process
  steps, hero scene carousel, SANATA services, RUMAMESRA services, certifications, testimonials,
  company values, timeline, leadership, awards, FAQ, service-detail advantages/timeline/FAQ,
  career benefits & vacancies, client sectors, contact info, partners, privacy sections, and
  terms sections) is editable: add, edit, delete, reorder, or hide items without touching code.
- Single-value copy (hero headline, subheadline, tagline, phone, email, address, opening hours)
  plus per-page hero copy, WhatsApp link, embedded map URL, and several detail-page labels are
  edited as settings in one form.
- All collections share one table and one editor UI, driven by a registry that declares which
  fields each collection uses — so a new collection is a config entry, not a new CRUD screen.
- Icons come from a fixed whitelist (a dropdown in the editor) rather than arbitrary names, so
  the icon bundle stays small and the value is always renderable.
- Collections can also declare **choice fields**, **number fields**, and **short text fields**, stored in the shared `meta`
  JSON column instead of new table columns. The hero carousel uses choices for per-slide
  illustration variant (tower/transit/subsea) and accent colour; the 3D floor collection adds
  numeric height/width/depth in metres. Choice values are short tokens, never CSS class names —
  Tailwind scans source statically, so a class assembled at runtime would never be generated.
  Number fields are posted under a separate `num:` prefix so they reach the API as JSON numbers;
  the validator rejects them as strings, which is the point. Text fields cover values that are
  neither a fixed column nor a closed list — a per-agent WhatsApp number, for instance. Putting
  those in the `href` column was considered and rejected: a phone number is not a link, and
  mislabelled columns mislead whoever reads the data next.
- The hero carousel's label and autoplay interval are settings (`home.hero.carousel_label`,
  `home.hero.carousel_interval_ms`); an interval of `0` turns autoplay off while leaving manual
  navigation intact.
- Setting defaults live in one registry (`backend/src/config/siteContent.ts`) that the seeder
  imports. It previously kept its own copy, which had silently drifted 16 settings behind.
- Saving calls Next.js's `updateTag()` on the site-content cache tag, so edits appear on the
  public site immediately rather than after the ISR window.
- Every page keeps its original copy as a hard-coded fallback, so the site renders correctly
  even if the API is unreachable or a collection is empty.

**Estimasi biaya konstruksi (Harga Satuan Dasar → AHSP → RAB)**
- **Harga Satuan Dasar** (`/admin/price-items`): master price list for upah (labour), bahan
  (materials), and alat (equipment), filterable by type.
- **AHSP** (`/admin/ahsp`): Analisa Harga Satuan Pekerjaan following the Permen PUPR 28/2016
  pattern — each entry holds coefficients against price items, and the API returns the computed
  breakdown: `biaya langsung = Σ(koefisien × harga satuan)`, then `HSP = biaya langsung +
  overhead & profit`. The editor previews the result live while you type; the stored value is
  always recomputed server-side. Rows expand to show the full labour/material/equipment
  breakdown.
- **RAB** (`/admin/rab`): Rencana Anggaran Biaya documents with work sections (Pekerjaan
  Persiapan, Tanah, Struktur, …) and line items. Picking an AHSP auto-fills the description,
  unit, and unit price. Totals follow the standard chain — `subtotal → diskon → DPP → PPN →
  total` — recomputed server-side on every write, so no floating-point drift.
- **Export**: a print-optimised A4 document at `/admin/print/rab/{id}` (browser "Print → Save as
  PDF", no PDF dependency needed) including the section weight recap and signature block, plus
  CSV export that opens straight in Excel.
- **Surat Penawaran** (`/admin/quotations`): a formal quotation letter generated from a RAB.
  Auto-numbered `SPH/<year>/<seq>`, with recipient block, validity period, editable opening and
  closing paragraphs, terms, payment instalments (with a live check that they total 100%), and a
  named signatory. The printable letter at `/admin/print/quotation/{id}` follows the Indonesian
  SPH format — letterhead pulled from the CMS contact settings, *Kepada Yth.* block, priced work
  breakdown, **terbilang** (amount written out in words), instalment table, and signature block.
  - **Amounts are frozen at issue.** Creating a quotation copies the RAB's sections, items and
    totals into an immutable snapshot. Editing the RAB afterwards changes nothing on a letter the
    client already has — the single most important property of the whole feature.
  - Status workflow `Draf → Terkirim → Diterima/Ditolak` with only sensible transitions allowed;
    accepted or rejected letters lock their contents, and accepted ones cannot be deleted (cancel
    instead, so the history survives). Expiry is derived from `validUntil` on read, so no cron.
- **Jadwal pelaksanaan & kurva S** (`/admin/rab/{id}/schedule`) — the time dimension on top of an
  existing RAB. Each work item gets a start offset and duration; the project start date lives on
  the RAB, so a slipped project is re-dated in one place instead of item by item.
  - Bobot (weight) per item is `amount / subtotal`, the split contractors already use. `subtotal`
    is the denominator, not `total`: discount and PPN are document-level pricing that nobody
    executes on site, so using `total` would stop the curve short of 100%.
  - The planned curve spreads each item's weight evenly across its duration and accumulates it
    per week. The S shape comes from work bunching up mid-project, not from a smoothing formula.
  - Realisasi is recorded as **cumulative** opname per item per date (a re-entry on the same date
    overwrites rather than stacks), and the actual curve reads the latest opname on or before each
    week's end. Deviation is reported at the week containing the most recent opname — carrying the
    last figure forward to the final week would report a delay that has not happened yet.
  - Weekly CSV export (`Minggu, Mulai, Selesai, Rencana %, Realisasi %, Deviasi %, …`) for the
    progress reports that get attached to termin invoices.
  - **Working-day calendar.** Durations are entered in *working* days, because that is how
    contractors plan — "pengecoran 5 hari" means five days of work, not five calendar days that
    happen to contain two Sundays. Rest days are a per-RAB weekday mask (default: Sunday) plus a
    per-project holiday list; holidays are per-RAB rather than global because two projects in
    different regions do not share local holidays. Buckets stay weekly by calendar date so the
    curve still lines up with monthly reporting. Leaving the mask empty reproduces the old
    calendar-day behaviour exactly.
  - **Baselines.** The current plan can be frozen under a name, so a replan can be compared with
    what was agreed at contract signing instead of silently overwriting it. The most recent
    baseline is drawn as a dashed third line, matched by period number rather than array position
    (a stretched schedule has more periods than the original plan).
- **Opname: bukti foto + pemeriksaan berjenjang.** Progress entries carry photo attachments and a
  `PENDING → APPROVED/REJECTED` workflow. Entries recorded by an ADMIN are approved on the spot;
  an EDITOR represents the site team, so their figures wait for review. **Only approved opname
  moves the S-curve or can be billed** — an unchecked number must never quietly raise an invoice.
  Editing an approved entry sends it back to PENDING.
- **Laporan harian lapangan** (`/admin/rab/{id}/daily-reports`) — weather morning/afternoon,
  workforce counts per trade, equipment, materials received, activities, obstacles, notes, and any
  number of captioned photos tagged with the part of the works they show. One report per project
  per day, enforced in the database. There is a printable A4 version at
  `/admin/print/daily-report/{id}` with a signature block for pelaksana / pengawas / manajer
  proyek. This is a legal record as much as a technical one: when a delay is disputed, what
  settles it is the weather, headcount, and obstacles written down daily.
- **Termin berbasis progres** (`/admin/rab/{id}/billings`) — progress billing computed from
  approved opname:

  ```
  nilai kumulatif = Σ (nilai item × % opname disetujui s/d periode)
  nilai termin    = nilai kumulatif − yang sudah ditagih sebelumnya
  retensi         = nilai termin × retentionPct
  PPN             = (nilai termin − retensi) × taxPct
  dibayar         = nilai termin − retensi + PPN
  ```

  Auto-numbered `BAP/<year>/<seq>`, with a preview before issuing and a CSV berita acara.
  **Amounts are frozen at issue** into a snapshot, exactly like Surat Penawaran: revising an
  opname after the berita acara is signed must not change an invoice the client already holds.
  Status flows `Draf → Terkirim → Dibayar`, cancellation keeps the history, and only drafts can be
  deleted. Issuing a termin with no new approved progress is rejected rather than filed as a zero.
- All money is stored as SQL `DECIMAL` and computed with `Prisma.Decimal`; the API returns
  strings so precision survives the round trip, and only the UI converts to Number for display.
  Curve percentages follow the same rule — rupiah values are derived from the unrounded ratio, so
  week 1 of a schedule reports exactly the item's amount rather than a few hundred rupiah off.

**Backend**
- Layered architecture: routes → controllers → services → Prisma.
- Zod request validation, centralized error handler (Zod/Prisma/ApiError aware), Helmet
  security headers.
- Prisma schema: `User` (with TOTP 2FA fields), `RefreshToken`, `Category`, `Content`,
  `Product`, `Media`, `AuditLog`, `Inquiry`, the estimation chain `PriceItem`, `Ahsp`,
  `AhspComponent`, `Rab`, `RabSection`, `RabItem`, and the CMS models `SiteSetting` +
  `SiteCollectionItem`.
- **Audit trail**: every content/product/category/user mutation is recorded to `AuditLog`
  (who, what, when) — queryable via `GET /api/audit-logs` (admin only).
- **Tiered rate limiting**: a global API limiter, a strict login limiter (failed attempts
  only, brute-force resistant), a registration limiter, and dedicated limiters for the
  inquiry form and media uploads.
- **API docs**: full OpenAPI 3 spec served as interactive Swagger UI at `/api/docs`.
- **Redis caching**: read-heavy public list endpoints (`/categories`, `/contents`,
  `/products`) are cached with a version-tag scheme — a cache version counter per resource
  is bumped on any create/update/delete, so stale reads are never served after a mutation,
  and no key-scanning is needed to invalidate. The app runs correctly without Redis (cache is
  best-effort and skipped if unavailable).
- **2FA (TOTP)**: any user can enable authenticator-app 2FA from Admin → Keamanan (QR setup,
  6-digit confirm). Once enabled, `POST /auth/login` requires a `totpCode` — the API responds
  with `{ errors: { requiresTwoFactor: true } }` when it's missing or wrong so the client can
  prompt for it.

## Roadmap (staged rewrite)

- [x] **Stage 1 — Foundation + Homepage**: Next.js scaffold, design system, header/footer,
      enterprise-grade homepage wired to the live API.
- [x] **Stage 2 — Remaining public pages**: About, Services, Projects/Portfolio, Journal
      (blog detail + listing), Career, Gallery, Testimonials, FAQ, Contact (working form), Clients, Privacy, Terms.
- [x] **Stage 3 — Backend hardening**: audit-log wiring, tiered rate limiting, Swagger/OpenAPI
      docs, Redis caching (version-tag invalidation), TOTP 2FA (setup/enable/disable + login
      flow).
- [x] **Stage 4 — Admin panel parity in Next.js**: full admin built inside `frontend-next`
      (`/admin`) — BFF cookie auth w/ proxy-based refresh, defense-in-depth role checks, 2FA,
      Dashboard (Recharts), Content/Products/Categories CRUD via Server Actions, Users,
      Inquiries, Audit Log. The legacy Vite admin workspace has been retired.
- [x] **Stage 5 — Estimasi biaya konstruksi**: the Harga Satuan Dasar → AHSP → RAB chain, with
      Decimal-precise server-side computation, an AHSP component editor with live preview, a RAB
      editor that pulls unit prices straight from AHSP, and print/PDF + CSV export.
- [x] **Stage 6 — Site content CMS**: every homepage/page block is now editable from the admin
      panel — 16 content collections plus key/value settings, with instant cache invalidation.
- [x] **Stage 7 — Dimensi waktu (4D)**: jadwal pelaksanaan dan kurva S di atas RAB — bobot dari
      nilai item, rencana disebar per durasi, realisasi dari opname kumulatif, plus ekspor CSV
      mingguan.
- [x] **Stage 8 — Pelaksanaan lapangan**: kalender hari kerja + hari libur proyek, baseline jadwal,
      opname berfoto dengan persetujuan pengawas, laporan harian lapangan berikut dokumentasi dan
      versi cetaknya, serta termin berbasis progres yang nilainya dibekukan saat terbit.
- [ ] **Stage 9 — Advanced features**: live chat, notifications, and vendor/partner portals.

Each stage is built, lint/build/visual-tested, and committed as its own milestone before
moving to the next — see git log for history.

## Known limitations / next steps

- Inquiry email notifications are wired (Nodemailer) but **off until SMTP is configured** — set
  `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`INQUIRY_NOTIFY_TO` in `backend/.env` to enable. Sending is
  fire-and-forget: a mail failure is logged and never blocks the public contact form.
- Existing local databases may need `npm run prisma:seed` again after pulling newer code so newly
  added CMS keys/collections are populated.
- Database lokal yang sudah lebih lama akan mempertahankan akun WhatsApp lama hasil migrasi;
  jalankan `npm run prisma:seed` untuk menambahkan profil Baileys/Official default tanpa
  menimpa akun yang sudah ada.
- Jika `npm run prisma:generate` gagal di Windows dengan `EPERM ... query_engine-windows.dll.node`,
  hentikan dulu proses backend/dev server yang sedang memakai Prisma engine, lalu jalankan ulang
  `npm run prisma:generate`.
- Services and Projects/Portfolio both reuse the `Product` model (one dataset framed two ways:
  "service offering" vs "completed case study"). Advantages/timeline/FAQ on service detail
  pages and location/year on project detail pages are static placeholder copy, not real schema
  fields — worth splitting into a dedicated `Project` model in Stage 3 if the two need to
  diverge (e.g. real project photos, status, budget, location).
- Leadership names, career listings, testimonials, certifications, and "partner" placeholders
  across About/Career/Testimonials/Clients/homepage are illustrative demo content — replace
  with real details via Admin → Konten Situs before launch (no code change needed).
- Hero background is a styled gradient/blueprint-grid placeholder, ready to swap for a real
  drone/construction video (`<video>` tag) once footage is available.
- "Partner" logos and certificate badges on the homepage are placeholders — swap in real
  logos/certifications once available; no real company names are used.
- Kurva S masih memakai periode **mingguan** tetap; laporan bulanan atau dua-mingguan perlu
  diringkas sendiri dari ekspor CSV.
- Termin memakai satu angka retensi untuk seluruh proyek. Kontrak dengan retensi bertingkat
  (mis. 5% sampai serah terima pertama, 2,5% setelahnya) perlu dicatat manual di catatan termin.
- Laporan harian belum punya alur persetujuan sendiri seperti opname — laporan langsung tersimpan
  final. Yang diperiksa berjenjang baru opname, karena itulah yang menjadi dasar tagihan.
- Lima koleksi CMS — `home_stats`, `home_services`, `home_why`, `home_process`, dan `certificates`
  — masih terdaftar di registry sehingga editornya muncul di admin, tetapi tidak ada halaman yang
  membacanya sejak beranda diganti `FuturisticHomePage`. Mengeditnya tidak mengubah apa pun.
  Pilihannya: menyambungkannya kembali ke beranda, atau menghapusnya dari registry — yang berarti
  membuang data yang mungkin sudah diisi admin. Dibiarkan apa adanya sampai ada keputusan.
- Koleksi layanan Rumamesra terdaftar sebagai `rumahesra_services` (salah eja dari merek
  "Rumamesra"). Frontend membaca `rumamesra_services` lebih dulu lalu jatuh ke ejaan lama, jadi
  tidak ada yang rusak, tapi nama kuncinya menyimpan cacat itu selamanya. Mengganti nama kunci
  akan memutus baris yang sudah ada di database, jadi perlu migrasi data tersendiri.
- Production builds serve `frontend-next` and `backend` separately; put a reverse proxy
  (nginx, Caddy) in front for a single-origin deployment.

## Tooling notes

This project was built using Claude Code's built-in tools (Bash/git, Read/Write/Edit, the
in-app Browser for visual testing, and Next.js's bundled local docs under
`frontend-next/node_modules/next/dist/docs/` as the up-to-date framework reference). Several
MCP servers requested in project instructions (Context7, GitHub, Playwright, Sequential
Thinking, Memory, dedicated DB/Git MCPs) are not available in this environment — the
equivalent built-in tools were used instead throughout.

## Scripts (root)

| Command | Description |
|---|---|
| `npm run dev:backend` | Start API in watch mode |
| `npm run dev:web` | Start the Next.js site (public + admin) |
| `npm run build:backend` | Generate Prisma Client, then compile backend to `backend/dist` |
| `npm run build:web` | Build the Next.js site to `frontend-next/.next` |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:seed` | Seed demo data |
