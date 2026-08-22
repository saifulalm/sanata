/**
 * Daftar koleksi konten situs yang bisa dikelola dari admin.
 *
 * Semua daftar berulang di homepage dan halaman lain memakai satu tabel
 * (`SiteCollectionItem`). Registry ini mendefinisikan koleksi apa saja yang
 * sah, label untuk admin, dan field mana yang relevan — dipakai backend untuk
 * validasi dan frontend untuk membentuk formulir editornya.
 */

export type FieldKey = "title" | "subtitle" | "body" | "icon" | "imageUrl" | "href";

/**
 * Field pilihan tersimpan di kolom `meta` (Json), bukan kolom tetap.
 *
 * Kolom tetap di `SiteCollectionItem` dipakai bersama seluruh koleksi, jadi
 * menambah kolom baru demi satu koleksi akan membuat tabel itu makin melar.
 * Nilai di sini selalu berupa token pendek (mis. "tower", "cyan") yang
 * diterjemahkan frontend menjadi komponen/kelas — token disimpan, bukan kelas
 * CSS-nya, supaya Tailwind tetap bisa memindai kelas secara statis.
 */
export type ChoiceKey = "variant" | "accent";

export interface ChoiceDef {
  label: string;
  /** Opsi pertama menjadi nilai bawaan saat admin belum memilih apa pun. */
  options: { value: string; label: string }[];
}

/**
 * Field angka, juga tersimpan di `meta`.
 *
 * Dipakai data yang memang berupa ukuran — tinggi dan denah lantai pada model
 * 3D. Menyimpannya sebagai teks di kolom `body` akan memaksa frontend menebak
 * format angka, jadi tipenya dijaga sejak validator.
 */
export type NumberKey = "heightM" | "widthM" | "depthM" | "startWeek" | "durationWeeks";

/**
 * Field teks pendek, juga tersimpan di `meta`.
 *
 * Dipakai nilai yang bukan salah satu kolom tetap dan bukan pilihan tertutup —
 * mis. nomor WhatsApp per agen. Menumpangkannya pada kolom `href` sempat
 * dipertimbangkan, tapi nomor telepon bukan tautan dan salah menamai kolom
 * akan menyesatkan orang berikutnya yang membaca datanya.
 */
export type TextKey = "phone" | "hours" | "keywords";

export interface TextDef {
  label: string;
  placeholder?: string;
  maxLength?: number;
}

export interface NumberDef {
  label: string;
  min: number;
  max: number;
  step: number;
  /** Nilai bawaan bila admin belum mengisi apa pun. */
  fallback: number;
  suffix?: string;
}

export interface CollectionDef {
  /** Judul yang tampil di admin. */
  label: string;
  /** Halaman tempat daftar ini dipakai — untuk pengelompokan di admin. */
  page: string;
  description: string;
  /** Field yang dipakai koleksi ini, beserta label khasnya. */
  fields: Partial<Record<FieldKey, string>>;
  /** Field pilihan opsional, disimpan di `meta`. */
  choices?: Partial<Record<ChoiceKey, ChoiceDef>>;
  /** Field angka opsional, juga disimpan di `meta`. */
  numbers?: Partial<Record<NumberKey, NumberDef>>;
  /** Field teks pendek opsional, juga disimpan di `meta`. */
  texts?: Partial<Record<TextKey, TextDef>>;
}

/** Token yang sah untuk `meta.variant` dan `meta.accent` pada hero scene. */
export const HERO_SCENE_VARIANTS = ["tower", "transit", "subsea"] as const;
export const HERO_SCENE_ACCENTS = ["cyan", "indigo", "amber", "emerald"] as const;

export const SITE_COLLECTIONS = {
  home_stats: {
    label: "Statistik Hero",
    page: "Beranda",
    description: "Angka pencapaian di bagian hero (mis. 15+ Tahun Pengalaman).",
    fields: { title: "Angka", subtitle: "Akhiran (mis. +)", body: "Keterangan" },
  },
  home_hero_scenes: {
    label: "Hero Scene Carousel",
    page: "Beranda",
    description:
      "Slide utama hero. Kosongkan gambar untuk memakai ilustrasi bawaan; unggah foto proyek untuk menggantinya.",
    fields: { title: "Judul Scene", subtitle: "Subjudul Scene", imageUrl: "Gambar Scene", href: "Tautan" },
    choices: {
      variant: {
        label: "Ilustrasi Bawaan (dipakai bila gambar kosong)",
        options: [
          { value: "tower", label: "Menara / Gedung Tinggi" },
          { value: "transit", label: "Transit / Infrastruktur" },
          { value: "subsea", label: "Pesisir / Bawah Laut" },
        ],
      },
      accent: {
        label: "Warna Aksen",
        options: [
          { value: "cyan", label: "Cyan" },
          { value: "indigo", label: "Indigo" },
          { value: "amber", label: "Amber" },
          { value: "emerald", label: "Emerald" },
        ],
      },
    },
  },
  whatsapp_agents: {
    label: "Agen WhatsApp",
    page: "Global",
    description:
      "Daftar orang yang bisa dihubungi lewat widget WhatsApp. Kosongkan koleksi ini untuk memakai satu nomor tunggal dari Pengaturan Kontak.",
    fields: {
      title: "Nama Agen",
      subtitle: "Peran / Divisi",
      body: "Keterangan Singkat",
      imageUrl: "Foto Agen",
    },
    texts: {
      phone: {
        label: "Nomor WhatsApp (format internasional tanpa +)",
        placeholder: "6281234567890",
        maxLength: 20,
      },
      hours: {
        label: "Jam Kerja Agen (opsional, mis. 08:00-17:00)",
        placeholder: "08:00-17:00",
        maxLength: 40,
      },
      keywords: {
        label: "Kata Kunci Topik (dipakai asisten untuk menyarankan tim ini)",
        placeholder: "harga biaya rab penawaran survei",
        maxLength: 200,
      },
    },
  },
  building_floors: {
    label: "Model 3D — Lantai Bangunan",
    page: "Beranda",
    description:
      "Lantai pada pratinjau 3D exploded view, diurutkan dari lantai paling bawah. Ukuran dipakai apa adanya oleh model, lalu diskalakan otomatis agar seluruh bangunan pas di bingkai.",
    fields: {
      title: "Nama Lantai",
      subtitle: "Label Singkat (mis. luas)",
      body: "Deskripsi Lantai",
      imageUrl: "Denah / Foto Lantai",
      href: "Tautan",
    },
    choices: {
      accent: {
        label: "Warna Lantai",
        options: [
          { value: "cyan", label: "Cyan" },
          { value: "indigo", label: "Indigo" },
          { value: "amber", label: "Amber" },
          { value: "emerald", label: "Emerald" },
        ],
      },
    },
    numbers: {
      heightM: { label: "Tinggi Lantai", min: 1, max: 20, step: 0.1, fallback: 3.5, suffix: "m" },
      widthM: { label: "Lebar Denah", min: 1, max: 200, step: 0.5, fallback: 24, suffix: "m" },
      depthM: { label: "Panjang Denah", min: 1, max: 200, step: 0.5, fallback: 16, suffix: "m" },
      // Dimensi waktu untuk mode 4D: kapan lantai ini mulai dikerjakan dan
      // berapa lama, dihitung dalam minggu sejak proyek dimulai.
      startWeek: { label: "Mulai Minggu Ke", min: 0, max: 520, step: 1, fallback: 0, suffix: "minggu" },
      durationWeeks: { label: "Durasi Pengerjaan", min: 1, max: 260, step: 1, fallback: 4, suffix: "minggu" },
    },
  },
  home_services: {
    label: "Ringkasan Layanan",
    page: "Beranda",
    description: "Kartu layanan singkat di beranda.",
    fields: { title: "Judul", body: "Deskripsi", icon: "Ikon", href: "Tautan" },
  },
        sanata_services: {
          label: "SANATA Services",
          page: "Beranda",
          description: "Daftar layanan utama SANATA GROUP untuk panel enterprise.",
          fields: { title: "Judul", subtitle: "Micro Label", body: "Deskripsi", icon: "Ikon", href: "Tautan" },
        },
        rumahesra_services: {
          label: "RUMAMESRA Services",
          page: "Beranda",
          description: "Daftar layanan utama Rumamesra untuk panel residential.",
          fields: { title: "Judul", subtitle: "Micro Label", body: "Deskripsi", icon: "Ikon", href: "Tautan" },
        },
  home_why: {
    label: "Kenapa Memilih Kami",
    page: "Beranda",
    description: "Alasan memilih perusahaan.",
    fields: { title: "Judul", body: "Deskripsi", icon: "Ikon" },
  },
  home_process: {
    label: "Alur Kerja",
    page: "Beranda",
    description: "Tahapan proses kerja, urut sesuai nomor.",
    fields: { title: "Judul", subtitle: "Nomor Tahap", body: "Deskripsi", icon: "Ikon" },
  },
  certificates: {
    label: "Sertifikasi",
    page: "Beranda",
    description: "Badge sertifikasi dan legalitas.",
    fields: { title: "Nama Sertifikasi", icon: "Ikon" },
  },
  testimonials: {
    label: "Testimoni",
    page: "Beranda & Testimoni",
    description: "Kutipan klien, dipakai di beranda dan halaman testimoni.",
    fields: { title: "Nama", subtitle: "Jabatan / Asal", body: "Kutipan" },
  },
  about_values: {
    label: "Nilai Perusahaan",
    page: "Tentang",
    description: "Nilai yang dipegang perusahaan.",
    fields: { title: "Judul", body: "Deskripsi", icon: "Ikon" },
  },
  about_timeline: {
    label: "Perjalanan Perusahaan",
    page: "Tentang",
    description: "Tonggak sejarah perusahaan per tahun.",
    fields: { title: "Tahun", subtitle: "Judul", body: "Deskripsi" },
  },
  about_leadership: {
    label: "Jajaran Pimpinan",
    page: "Tentang",
    description: "Nama dan jabatan pimpinan.",
    fields: { title: "Nama", subtitle: "Jabatan", imageUrl: "Foto" },
  },
  about_awards: {
    label: "Penghargaan & Sertifikat",
    page: "Tentang",
    description: "Daftar penghargaan dan sertifikat.",
    fields: { title: "Nama" },
  },
  faq: {
    label: "FAQ",
    page: "FAQ",
    description: "Pertanyaan yang sering diajukan.",
    fields: { title: "Pertanyaan", body: "Jawaban" },
  },
        service_detail_advantages: {
          label: "Keunggulan Layanan",
          page: "Layanan",
          description: "Keunggulan umum yang tampil di halaman detail layanan.",
          fields: { title: "Judul", body: "Deskripsi", icon: "Ikon" },
        },
        service_detail_timeline: {
          label: "Timeline Layanan",
          page: "Layanan",
          description: "Tahapan umum di halaman detail layanan.",
          fields: { title: "Tahap", subtitle: "Durasi", body: "Deskripsi" },
        },
        service_detail_faq: {
          label: "FAQ Layanan",
          page: "Layanan",
          description: "Pertanyaan umum di halaman detail layanan.",
          fields: { title: "Pertanyaan", body: "Jawaban" },
        },
  career_benefits: {
    label: "Benefit Karier",
    page: "Karier",
    description: "Keuntungan bekerja di perusahaan.",
    fields: { title: "Judul", body: "Deskripsi", icon: "Ikon" },
  },
  career_positions: {
    label: "Lowongan",
    page: "Karier",
    description: "Posisi yang sedang dibuka.",
    fields: { title: "Posisi", subtitle: "Tipe (mis. Full-time)", body: "Lokasi / Keterangan" },
  },
  client_sectors: {
    label: "Sektor Klien",
    page: "Klien",
    description: "Sektor industri yang dilayani.",
    fields: { title: "Judul", body: "Deskripsi", icon: "Ikon" },
  },
  contact_info: {
    label: "Info Kontak",
    page: "Kontak",
    description: "Alamat, telepon, email, jam operasional.",
    fields: { title: "Label", body: "Isi", icon: "Ikon" },
  },
  partners: {
    label: "Mitra",
    page: "Beranda & Klien",
    description: "Logo/nama mitra kerja.",
    fields: { title: "Nama Mitra", imageUrl: "Logo" },
  },
        privacy_sections: {
          label: "Kebijakan Privasi",
          page: "Legal",
          description: "Bagian-bagian pada halaman kebijakan privasi.",
          fields: { title: "Judul Bagian", body: "Isi" },
        },
        terms_sections: {
          label: "Syarat & Ketentuan",
          page: "Legal",
          description: "Bagian-bagian pada halaman syarat & ketentuan.",
          fields: { title: "Judul Bagian", body: "Isi" },
        },
} as const satisfies Record<string, CollectionDef>;

export type CollectionKey = keyof typeof SITE_COLLECTIONS;

export const COLLECTION_KEYS = Object.keys(SITE_COLLECTIONS) as CollectionKey[];

export function isCollectionKey(value: string): value is CollectionKey {
  return Object.prototype.hasOwnProperty.call(SITE_COLLECTIONS, value);
}

/** Setting tunggal yang dikenali, beserta nilai bawaannya. */
export const SITE_SETTING_DEFAULTS: {
  key: string;
  value: string;
  group: string;
  label: string;
  type: "text" | "textarea";
  order: number;
}[] = [
  { key: "home.hero.headline", value: "Your|Building Partner.|Let's Build|Something Meaningful|Together.", group: "Beranda", label: "Headline Hero (pisahkan baris dengan |)", type: "textarea", order: 1 },
  { key: "home.hero.subheadline", value: "SANATA GROUP — Solusi one-stop untuk konstruksi terstruktur, transparan, dan human-centered. Dari fondasi hingga interior.", group: "Beranda", label: "Subjudul Hero", type: "textarea", order: 2 },
  { key: "home.hero.carousel_label", value: "Live 4D Carousel", group: "Beranda", label: "Label Carousel Hero", type: "text", order: 3 },
  // 0 mematikan pergantian otomatis; pengunjung tetap bisa menggeser manual.
  { key: "home.hero.carousel_interval_ms", value: "4500", group: "Beranda", label: "Jeda Ganti Slide Hero (milidetik, 0 = mati)", type: "text", order: 4 },
  // --- Pratinjau 3D exploded view ---
  { key: "home.exploded.enabled", value: "true", group: "Beranda", label: "Tampilkan Model 3D Exploded View (true/false)", type: "text", order: 5 },
  { key: "home.exploded.eyebrow", value: "Model 3D Interaktif", group: "Beranda", label: "Eyebrow Seksi 3D", type: "text", order: 6 },
  { key: "home.exploded.title", value: "Exploded Floor View", group: "Beranda", label: "Judul Seksi 3D", type: "text", order: 7 },
  { key: "home.exploded.description", value: "Geser pemisah lantai untuk membedah bangunan lapis demi lapis, lalu pilih satu lantai untuk melihat rinciannya.", group: "Beranda", label: "Deskripsi Seksi 3D", type: "textarea", order: 8 },
  { key: "home.exploded.explode", value: "40", group: "Beranda", label: "Jarak Pisah Awal (0–100)", type: "text", order: 9 },
  { key: "home.exploded.autorotate", value: "true", group: "Beranda", label: "Putar Otomatis Model 3D (true/false)", type: "text", order: 10 },
  { key: "site.company_name", value: "SANATA GROUP", group: "Umum", label: "Nama Perusahaan", type: "text", order: 1 },
  { key: "site.tagline", value: "Your Building Partner.", group: "Umum", label: "Tagline Perusahaan", type: "text", order: 2 },
  { key: "site.since_year", value: "2010", group: "Umum", label: "Tahun Berdiri", type: "text", order: 3 },
  // --- SEO global: dipakai root layout, sitemap, robots, dan JSON-LD ---
  { key: "seo.site_url", value: "https://sanata.id", group: "SEO", label: "URL Kanonik Situs (tanpa slash akhir)", type: "text", order: 1 },
  { key: "seo.default_title", value: "SANATA GROUP — Your Building Partner. Konstruksi Terstruktur & Interior.", group: "SEO", label: "Judul Beranda / Default", type: "text", order: 2 },
  { key: "seo.title_template", value: "%s | SANATA GROUP", group: "SEO", label: "Pola Judul Halaman (%s = judul halaman)", type: "text", order: 3 },
  { key: "seo.default_description", value: "SANATA GROUP adalah perusahaan konstruksi profesional yang menyediakan solusi one-stop terstruktur, transparan, dan human-centered. Mencakup structural construction (SANATA) dan interior design & finishing (RUMAMESRA).", group: "SEO", label: "Deskripsi Default", type: "textarea", order: 4 },
  { key: "seo.keywords", value: "konstruksi, kontraktor, renovasi, arsitektur, interior, sanata group, rumamesra, tangerang selatan", group: "SEO", label: "Kata Kunci Situs (pisahkan dengan koma)", type: "text", order: 5 },
  { key: "seo.default_og_image", value: "", group: "SEO", label: "Gambar Open Graph Default (URL)", type: "text", order: 6 },
  { key: "seo.allow_indexing", value: "true", group: "SEO", label: "Izinkan Mesin Pencari Mengindeks (true/false)", type: "text", order: 7 },
  { key: "seo.google_site_verification", value: "", group: "SEO", label: "Kode Verifikasi Google Search Console", type: "text", order: 8 },
  { key: "seo.bing_site_verification", value: "", group: "SEO", label: "Kode Verifikasi Bing Webmaster", type: "text", order: 9 },
  { key: "seo.organization_type", value: "GeneralContractor", group: "SEO", label: "Tipe Organisasi Schema.org", type: "text", order: 10 },
  { key: "seo.area_served", value: "Jabodetabek", group: "SEO", label: "Area Layanan (Schema.org)", type: "text", order: 11 },
      { key: "about.hero.eyebrow", value: "Tentang Kami", group: "Halaman Tentang", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "about.hero.title", value: "Your Building Partner", group: "Halaman Tentang", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "about.hero.description", value: "SANATA GROUP adalah perusahaan konstruksi dan built-environment professional yang menyediakan solusi one-stop terstruktur, transparan, dan human-centered. Melalui sistem terintegrasi, kami menangani structural construction (SANATA) dan interior design & finishing (RUMAMESRA).", group: "Halaman Tentang", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "services.hero.eyebrow", value: "Layanan Kami", group: "Halaman Layanan", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "services.hero.title", value: "Layanan SANATA GROUP", group: "Halaman Layanan", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "services.hero.description", value: "Solusi one-stop untuk konstruksi dan interior. Mulai dari perencanaan, fondasi, struktur, hingga finishing. Fleksibel sesuai kebutuhan Anda.", group: "Halaman Layanan", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "service.detail.price_note", value: "Harga dapat berubah sesuai hasil survei lokasi", group: "Halaman Layanan", label: "Catatan Harga Detail Layanan", type: "text", order: 4 },
      { key: "projects.hero.eyebrow", value: "Proyek & Portofolio", group: "Halaman Proyek", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "projects.hero.title", value: "Karya yang Telah Kami Selesaikan", group: "Halaman Proyek", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "projects.hero.description", value: "Jelajahi proyek residensial, komersial, dan retail yang telah dikerjakan SANATA GROUP.", group: "Halaman Proyek", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "project.detail.location", value: "Jabodetabek, Indonesia", group: "Halaman Proyek", label: "Lokasi Default Detail Proyek", type: "text", order: 4 },
      { key: "project.detail.completed", value: "Diselesaikan tahun ini", group: "Halaman Proyek", label: "Status Waktu Detail Proyek", type: "text", order: 5 },
      { key: "journal.hero.eyebrow", value: "Insight", group: "Halaman Insight", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "journal.hero.title", value: "Wawasan & Berita Konstruksi", group: "Halaman Insight", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "journal.hero.description", value: "Tips, studi kasus, dan pembaruan terbaru seputar konstruksi dan interior dari tim SANATA GROUP.", group: "Halaman Insight", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "gallery.hero.eyebrow", value: "Galeri", group: "Halaman Galeri", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "gallery.hero.title", value: "Dokumentasi Proyek Kami", group: "Halaman Galeri", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "gallery.hero.description", value: "Dokumentasi proyek konstruksi, renovasi, dan interior dari tim SANATA GROUP.", group: "Halaman Galeri", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "clients.hero.eyebrow", value: "Klien Kami", group: "Halaman Klien", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "clients.hero.title", value: "Dipercaya di Berbagai Sektor", group: "Halaman Klien", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "clients.hero.description", value: "SANATA GROUP telah melayani klien di berbagai sektor: residensial, komersial, dan retail/lifestyle.", group: "Halaman Klien", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "contact.hero.eyebrow", value: "Hubungi Kami", group: "Halaman Kontak", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "contact.hero.title", value: "Mari Diskusikan Proyek Anda", group: "Halaman Kontak", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "contact.hero.description", value: "Isi formulir di bawah untuk permintaan penawaran, atau hubungi kami langsung melalui telepon maupun WhatsApp.", group: "Halaman Kontak", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "contact.whatsapp", value: "6285788882662", group: "Halaman Kontak", label: "Nomor WhatsApp (format internasional tanpa +)", type: "text", order: 4 },
      { key: "contact.map_embed_url", value: "https://maps.google.com/maps?q=Jakarta%20Selatan&t=&z=13&ie=UTF8&iwloc=&output=embed", group: "Halaman Kontak", label: "URL Embed Google Maps", type: "textarea", order: 5 },
      { key: "career.hero.eyebrow", value: "Karir", group: "Halaman Karir", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "career.hero.title", value: "Bangun Karir Bersama SANATA GROUP", group: "Halaman Karir", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "career.hero.description", value: "Kami mencari talenta terbaik untuk bertumbuh bersama dalam industri konstruksi.", group: "Halaman Karir", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "faq.hero.eyebrow", value: "FAQ", group: "Halaman FAQ", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "faq.hero.title", value: "Pertanyaan yang Sering Diajukan", group: "Halaman FAQ", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "faq.hero.description", value: "Belum menemukan jawaban? Hubungi tim kami langsung melalui halaman kontak.", group: "Halaman FAQ", label: "Deskripsi Hero", type: "textarea", order: 3 },
      { key: "testimonials.hero.eyebrow", value: "Testimoni", group: "Halaman Testimoni", label: "Eyebrow Hero", type: "text", order: 1 },
      { key: "testimonials.hero.title", value: "Apa Kata Klien Kami", group: "Halaman Testimoni", label: "Judul Hero", type: "textarea", order: 2 },
      { key: "testimonials.hero.description", value: "Kepuasan klien adalah prioritas utama dalam setiap proyek yang kami kerjakan.", group: "Halaman Testimoni", label: "Deskripsi Hero", type: "textarea", order: 3 },
  { key: "contact.phone", value: "+62 8578 888 2662", group: "Kontak", label: "Telepon", type: "text", order: 1 },
  { key: "contact.email", value: "Rumamesra@santarasbc.com", group: "Kontak", label: "Email", type: "text", order: 2 },
  { key: "contact.address", value: "Jalan Puring, Ciputat Timur, Tangerang Selatan 15419", group: "Kontak", label: "Alamat", type: "textarea", order: 3 },
  { key: "contact.website", value: "www.sanata.id", group: "Kontak", label: "Website", type: "text", order: 4 },
  { key: "contact.hours", value: "Senin - Jumat, 08.00 - 17.00 WIB", group: "Kontak", label: "Jam Operasional", type: "text", order: 5 },
  // Tombol WhatsApp mengambang di seluruh halaman publik.
  { key: "contact.whatsapp_float", value: "true", group: "Kontak", label: "Tampilkan Tombol WhatsApp Mengambang (true/false)", type: "text", order: 6 },
  { key: "contact.whatsapp_message", value: "Halo SANATA GROUP, saya ingin konsultasi proyek.", group: "Kontak", label: "Pesan Awal WhatsApp", type: "textarea", order: 7 },
  { key: "contact.whatsapp_label", value: "Chat WhatsApp", group: "Kontak", label: "Teks Tombol WhatsApp", type: "text", order: 8 },
  // --- Panel widget WhatsApp ---
  { key: "contact.whatsapp_panel_title", value: "SANATA GROUP", group: "Kontak", label: "Judul Panel WhatsApp", type: "text", order: 9 },
  { key: "contact.whatsapp_panel_subtitle", value: "Biasanya membalas dalam beberapa menit", group: "Kontak", label: "Subjudul Panel WhatsApp", type: "text", order: 10 },
  { key: "contact.whatsapp_greeting", value: "Halo! 👋 Ada yang bisa kami bantu soal rencana bangun atau renovasi Anda?", group: "Kontak", label: "Sapaan Pembuka Panel", type: "textarea", order: 11 },
  { key: "contact.whatsapp_quick_replies", value: "Minta penawaran (RAB)|Tanya biaya renovasi|Jadwalkan survei lokasi|Tanya progres proyek saya", group: "Kontak", label: "Balasan Cepat (pisahkan dengan |)", type: "textarea", order: 12 },
  // Jam kerja dipakai untuk menandai status online/offline pada widget.
  { key: "contact.whatsapp_hours_start", value: "08:00", group: "Kontak", label: "Jam Mulai Layanan WhatsApp (HH:MM)", type: "text", order: 13 },
  { key: "contact.whatsapp_hours_end", value: "17:00", group: "Kontak", label: "Jam Selesai Layanan WhatsApp (HH:MM)", type: "text", order: 14 },
  { key: "contact.whatsapp_hours_days", value: "1,2,3,4,5", group: "Kontak", label: "Hari Kerja WhatsApp (0=Minggu … 6=Sabtu)", type: "text", order: 15 },
  { key: "contact.whatsapp_timezone_offset", value: "7", group: "Kontak", label: "Selisih Zona Waktu Kantor dari UTC (WIB=7)", type: "text", order: 16 },
  { key: "contact.whatsapp_offline_note", value: "Di luar jam kerja. Tinggalkan pesan — tim kami membalas pada hari kerja berikutnya.", group: "Kontak", label: "Catatan Saat Di Luar Jam Kerja", type: "textarea", order: 17 },
  { key: "contact.whatsapp_capture_lead", value: "true", group: "Kontak", label: "Tampilkan Form Tinggalkan Pesan di Widget (true/false)", type: "text", order: 18 },
  // Asisten menjawab dari koleksi FAQ — tidak memakai model bahasa eksternal.
  { key: "contact.whatsapp_assistant", value: "true", group: "Kontak", label: "Aktifkan Asisten Jawab Otomatis dari FAQ (true/false)", type: "text", order: 19 },
  { key: "contact.whatsapp_assistant_intro", value: "Ketik pertanyaan Anda — saya coba jawab dari daftar pertanyaan umum lebih dulu.", group: "Kontak", label: "Ajakan Asisten", type: "textarea", order: 20 },
  { key: "contact.whatsapp_assistant_miss", value: "Saya belum punya jawaban untuk itu. Lanjutkan ke tim kami lewat WhatsApp, ya.", group: "Kontak", label: "Pesan Saat Asisten Tidak Tahu", type: "textarea", order: 21 },
      { key: "privacy.hero.eyebrow", value: "Legal", group: "Halaman Legal", label: "Eyebrow Hero Privasi", type: "text", order: 1 },
      { key: "privacy.hero.title", value: "Kebijakan Privasi", group: "Halaman Legal", label: "Judul Hero Privasi", type: "text", order: 2 },
      { key: "privacy.hero.description", value: "Terakhir diperbarui: 1 Agustus 2026", group: "Halaman Legal", label: "Deskripsi Hero Privasi", type: "text", order: 3 },
      { key: "terms.hero.eyebrow", value: "Legal", group: "Halaman Legal", label: "Eyebrow Hero Syarat", type: "text", order: 4 },
      { key: "terms.hero.title", value: "Syarat & Ketentuan", group: "Halaman Legal", label: "Judul Hero Syarat", type: "text", order: 5 },
      { key: "terms.hero.description", value: "Terakhir diperbarui: 1 Agustus 2026", group: "Halaman Legal", label: "Deskripsi Hero Syarat", type: "text", order: 6 },
];
