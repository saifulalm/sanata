# 32. Marketing Dashboard

**URL**: `/admin/marketing`  
**Peran**: ADMIN, EDITOR  
**Auth**: `requireAdminRole("ADMIN", "EDITOR")`

---

## Gambaran Umum

Marketing Dashboard adalah hub pusat untuk mengelola aktivitas marketing digital: campaigns, contacts, broadcast, dan analytics.

---

## Statistik Dashboard

### Metrik Utama

| Metric | Value | Keterangan |
|--------|-------|------------|
| **Total Contacts** | `{count}` | Jumlah kontak |
| **Active Campaigns** | `{active}` | Campaign berjalan |
| **Total Broadcast Sent** | `{sent}` | Pesan terkirim |
| **Open Rate** | `{rate}%` | Persentase terbuka |

### Breakdown

| Kategori | Keterangan |
|----------|------------|
| **By Source** | Breakdown kontak berdasarkan sumber |
| **By Status** | Active, Inactive, Unsubscribed |
| **By Campaign** | Performa per campaign |

---

## Navigasi Sub-Modul

| Modul | URL | Keterangan |
|-------|-----|------------|
| **Campaigns** | `/admin/marketing/campaigns` | Kampanye email/marketing |
| **Contacts** | `/admin/marketing/contacts` | Database kontak marketing |
| **Templates** | `/admin/marketing/templates` | Email templates |
| **Offers** | `/admin/marketing/offers` | Penawaran/-diskon |
| **Broadcast Lists** | `/admin/marketing/broadcast` | Daftar broadcast |
| **Analytics** | `/admin/marketing/analytics` | Data analytics |

---

## Quick Actions

| Aksi | Keterangan |
|------|------------|
| **Create Campaign** | Buat campaign baru |
| **Import Contacts** | Import kontak dari CSV |
| **Send Broadcast** | Kirim broadcast |
| **View Analytics** | Buka analytics |

---

## API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/marketing/stats` | Statistik marketing |
| GET | `/api/marketing/dashboard` | Data dashboard |
| GET | `/api/marketing/contacts` | Statistik kontak |
| GET | `/api/marketing/campaigns` | Statistik campaign |

---

*Kembali ke [Daftar Isi](../README.md) | [Menu Sebelumnya](./31-daily-reports.md) | [Menu Berikutnya](./33-campaigns.md)*
