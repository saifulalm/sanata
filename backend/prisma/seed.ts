import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { SITE_SETTING_DEFAULTS } from "../src/config/siteContent";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@sanata.id" },
    update: {},
    create: { name: "Sanata Admin", email: "admin@sanata.id", passwordHash: adminPassword, role: "ADMIN" },
  });

  const editorPassword = await bcrypt.hash("Editor123!", 12);
  await prisma.user.upsert({
    where: { email: "editor@sanata.id" },
    update: {},
    create: { name: "Sanata Editor", email: "editor@sanata.id", passwordHash: editorPassword, role: "EDITOR" },
  });

  const categoryNames = ["Residensial", "Komersial", "Renovasi", "Interior", "Insight"];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { slug: slugify(name, { lower: true, strict: true }) },
        update: {},
        create: { name, slug: slugify(name, { lower: true, strict: true }) },
      })
    )
  );

  const [residensial, komersial, renovasi, interior, insight] = categories;

  const posts = [
    { title: "Sanata Merampungkan Proyek Ruko 3 Lantai di Jakarta Selatan", status: "PUBLISHED" as const, category: insight },
    { title: "5 Hal yang Perlu Diperhatikan Sebelum Renovasi Rumah", status: "PUBLISHED" as const, category: insight },
    { title: "Tips Memilih Kontraktor Konstruksi yang Tepat", status: "DRAFT" as const, category: insight },
  ];

  for (const post of posts) {
    const slug = slugify(post.title, { lower: true, strict: true });
    await prisma.content.upsert({
      where: { slug },
      update: {},
      create: {
        title: post.title,
        slug,
        excerpt: `${post.title} - ringkasan singkat.`,
        body: `<p>${post.title}. Artikel lengkap akan segera hadir.</p>`,
        type: "POST",
        status: post.status,
        publishedAt: post.status === "PUBLISHED" ? new Date() : null,
        authorId: admin.id,
        categoryId: post.category.id,
      },
    });
  }

  const services = [
    { name: "Jasa Bangun Rumah Tinggal", price: 3_500_000, stock: 10, category: residensial, description: "Konstruksi rumah tinggal dari nol, mulai dari pondasi hingga finishing, per meter persegi." },
    { name: "Konstruksi Ruko & Gedung Komersial", price: 4_200_000, stock: 8, category: komersial, description: "Pembangunan ruko dan gedung komersial dengan perencanaan struktur dan MEP lengkap." },
    { name: "Renovasi & Perluasan Bangunan", price: 1_800_000, stock: 15, category: renovasi, description: "Renovasi struktur, penambahan lantai, dan perluasan ruang sesuai kebutuhan." },
    { name: "Desain & Instalasi Interior", price: 950_000, stock: 20, category: interior, description: "Desain interior dan pengerjaan instalasi untuk hunian maupun ruang komersial." },
  ];

  for (const s of services) {
    const slug = slugify(s.name, { lower: true, strict: true });
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: s.name,
        slug,
        description: s.description,
        price: s.price,
        stock: s.stock,
        isActive: true,
        categoryId: s.category.id,
        createdById: admin.id,
      },
    });
  }

  await seedEstimation();
  await seedSiteContent();
  await seedBroadcast(admin.id);
  await seedSignatories();
  await seedProjectDocs(admin.id);

  console.log("Seed complete. Admin login: admin@sanata.id / Admin123!");
}

async function seedSignatories() {
  const existing = await prisma.signatory.count();
  if (existing > 0) {
    console.log("Skipping signatories seed — already exist.");
    return;
  }

  await prisma.signatory.createMany({
    data: [
      { name: "Ir. Hendra Kusuma", title: "Direktur Utama", role: "DIREKTUR_UTAMA", department: "Direksi", isActive: true },
      { name: "Ir. Budi Santoso", title: "Direktur Operasional", role: "DIREKTUR", department: "Direksi", isActive: true },
      { name: "Dr. Rina Hartati", title: "Manager Proyek", role: "MANAGER_PROYEK", department: "Divisi Konstruksi", isActive: true },
      { name: "Agus Prasetyo, ST", title: "Site Manager", role: "SITE_MANAGER", department: "Proyek Gedung A", isActive: true },
      { name: "Dewi Susilowati, ST", title: "Pimpinan Proyek", role: "PIMPINAN_PROYEK", department: "Proyek Gedung B", isActive: true },
      { name: "Ahmad Fauzi", title: "Staf Keuangan", role: "STAF", department: "Keuangan", isActive: true },
      { name: "Siti Nurhaliza", title: "Admin Proyek", role: "LAINNYA", department: "Proyek Gedung A", isActive: false },
    ],
  });

  console.log("Signatories seeded.");
}

async function seedBroadcast(adminId: string) {
  const channels = [
    {
      channel: "EMAIL" as const,
      provider: "EMAIL_SMTP" as const,
      mode: "PRODUCTION" as const,
      accountKey: "smtp-primary",
      label: "Email SMTP",
      senderIdentity: "halo@sanata.id",
      isPrimary: true,
      priority: 10,
      weight: 1,
      config: {
        transport: "smtp-env",
        note: "Menggunakan konfigurasi SMTP dari backend/.env",
      },
    },
    {
      channel: "TELEGRAM" as const,
      provider: "TELEGRAM_BOT" as const,
      mode: "PRODUCTION" as const,
      accountKey: "telegram-main",
      label: "Telegram Bot",
      senderIdentity: "@sanata_bot",
      isPrimary: true,
      priority: 10,
      weight: 1,
      config: {
        botToken: "",
        parseMode: "HTML",
      },
    },
    {
      channel: "WHATSAPP" as const,
      provider: "WHATSAPP_BAILEYS" as const,
      mode: "EXPERIMENTAL" as const,
      accountKey: "wa-baileys-a",
      label: "WhatsApp Baileys A",
      senderIdentity: "628111111111",
      isPrimary: true,
      priority: 10,
      weight: 2,
      dailyLimit: 250,
      hourlyLimit: 40,
      config: {
        provider: "baileys",
        baseUrl: "",
        apiKey: "",
        session: "sanata-a",
        endpoint: "",
      },
    },
    {
      channel: "WHATSAPP" as const,
      provider: "WHATSAPP_BAILEYS" as const,
      mode: "EXPERIMENTAL" as const,
      accountKey: "wa-baileys-b",
      label: "WhatsApp Baileys B",
      senderIdentity: "628122222222",
      isPrimary: false,
      priority: 20,
      weight: 1,
      dailyLimit: 200,
      hourlyLimit: 30,
      config: {
        provider: "baileys",
        baseUrl: "",
        apiKey: "",
        session: "sanata-b",
        endpoint: "",
      },
    },
    {
      channel: "WHATSAPP" as const,
      provider: "WHATSAPP_OFFICIAL" as const,
      mode: "PRODUCTION" as const,
      accountKey: "wa-official-main",
      label: "WhatsApp Official",
      senderIdentity: "phone-number-id",
      isPrimary: false,
      priority: 30,
      weight: 1,
      dailyLimit: 1000,
      hourlyLimit: 200,
      config: {
        apiVersion: "v21.0",
        phoneNumberId: "",
        accessToken: "",
      },
    },
    {
      channel: "INSTAGRAM" as const,
      provider: "INSTAGRAM_META" as const,
      mode: "PRODUCTION" as const,
      accountKey: "instagram-main",
      label: "Instagram Messaging API",
      senderIdentity: "@sanata.id",
      isPrimary: true,
      priority: 10,
      weight: 1,
      config: {
        apiVersion: "v21.0",
        pageId: "",
        accessToken: "",
      },
    },
    {
      channel: "FACEBOOK" as const,
      provider: "FACEBOOK_META" as const,
      mode: "PRODUCTION" as const,
      accountKey: "facebook-main",
      label: "Facebook Messenger API",
      senderIdentity: "sanata-construction",
      isPrimary: true,
      priority: 10,
      weight: 1,
      config: {
        apiVersion: "v21.0",
        pageId: "",
        accessToken: "",
        tag: "ACCOUNT_UPDATE",
      },
    },
  ];

  for (const connection of channels) {
    const existing = await prisma.broadcastChannelConnection.findFirst({
      where: {
        channel: connection.channel,
        accountKey: connection.accountKey,
      },
    });

    if (existing) {
      await prisma.broadcastChannelConnection.update({
        where: { id: existing.id },
        data: {
          provider: connection.provider,
          mode: connection.mode,
          label: connection.label,
          senderIdentity: connection.senderIdentity,
          isPrimary: connection.isPrimary,
          priority: connection.priority,
          weight: connection.weight,
          dailyLimit: connection.dailyLimit ?? null,
          hourlyLimit: connection.hourlyLimit ?? null,
          config: connection.config,
        },
      });
    } else {
      await prisma.broadcastChannelConnection.create({
        data: {
          channel: connection.channel,
          provider: connection.provider,
          mode: connection.mode,
          accountKey: connection.accountKey,
          label: connection.label,
          senderIdentity: connection.senderIdentity,
          isPrimary: connection.isPrimary,
          priority: connection.priority,
          weight: connection.weight,
          dailyLimit: connection.dailyLimit ?? null,
          hourlyLimit: connection.hourlyLimit ?? null,
          config: connection.config,
        },
      });
    }
  }

  const existingContacts = await prisma.broadcastContact.count();
  if (existingContacts === 0) {
    await prisma.broadcastContact.createMany({
      data: [
        {
          name: "Kontak Demo Email",
          email: "demo-broadcast@sanata.id",
          consent: true,
          consentSource: "seed",
          preferredChannel: "EMAIL",
          tags: ["demo", "email"],
        },
        {
          name: "Kontak Demo Telegram",
          telegramChatId: "123456789",
          consent: false,
          consentSource: "seed",
          preferredChannel: "TELEGRAM",
          tags: ["demo", "telegram"],
        },
      ],
    });
  }

  const existingCampaigns = await prisma.broadcastCampaign.count();
  if (existingCampaigns === 0) {
    const emailConnection = await prisma.broadcastChannelConnection.findFirst({
      where: { channel: "EMAIL", accountKey: "smtp-primary" },
    });
    if (emailConnection) {
      await prisma.broadcastCampaign.create({
        data: {
          title: "Perkenalan Broadcast Center",
          channel: "EMAIL",
          subject: "Sanata Broadcast Center siap digunakan",
          message:
            "Halo,\n\nBroadcast Center SANATA GROUP sudah aktif. Silakan lengkapi konfigurasi channel sebelum mengirim kampanye produksi.\n\nSalam,\nTim Sanata",
          connectionId: emailConnection.id,
          createdById: adminId,
        },
      });
    }
  }

  console.log(`Seeded ${channels.length} broadcast channel accounts.`);
}

/**
 * Sample RAB project with documents: submissions, logbook, memos, letters.
 *
 * Creates data that populates the document pages so they're not empty on first run.
 * Only creates if the database doesn't already have RAB records.
 */
async function seedProjectDocs(adminId: string) {
  const existingRabs = await prisma.rab.count();
  if (existingRabs >= 2) {
    console.log("Skipping project docs seed — 2+ RAB records already exist.");
    return;
  }
  const hendraId = (await prisma.signatory.findFirst({ where: { name: { contains: "Hendra" } } }))?.id ?? null;
  const rab1 = await prisma.rab.upsert({
    where: { number: "RAB-2026-001" },
    create: { number: "RAB-2026-001", title: "Pembangunan Gedung Perkantoran 4 Lantai", clientName: "PT Nusantara Realty Indonesia", location: "Jl. Sudirman No. 45, Jakarta Selatan", projectDate: new Date("2026-01-15"), scheduleStart: new Date("2026-02-01"), taxPct: 11, subtotal: 4_850_000_000, discountAmount: 0, taxAmount: 533_500_000, total: 5_383_500_000, createdById: adminId },
    update: { title: "Pembangunan Gedung Perkantoran 4 Lantai" },
  });
  const existingSections1 = await prisma.rabSection.count({ where: { rabId: rab1.id } });
  if (existingSections1 === 0) {
    const s1a = await prisma.rabSection.create({ data: { rabId: rab1.id, name: "Pekerjaan Struktur", order: 1 } });
    const s1b = await prisma.rabSection.create({ data: { rabId: rab1.id, name: "Pekerjaan Arsitektur", order: 2 } });
    const s1c = await prisma.rabSection.create({ data: { rabId: rab1.id, name: "Pekerjaan MEP", order: 3 } });
    await prisma.rabItem.createMany({ data: [
      { sectionId: s1a.id, description: "Pekerjaan pondasi Strauss pile D300", unit: "m'", volume: 120, unitPrice: 850_000, amount: 102_000_000 },
      { sectionId: s1a.id, description: "Pekerjaan sloof 30x50 cm", unit: "m3", volume: 24, unitPrice: 2_500_000, amount: 60_000_000 },
      { sectionId: s1a.id, description: "Pekerjaan kolom utama 40x40 cm", unit: "m3", volume: 48, unitPrice: 3_200_000, amount: 153_600_000 },
      { sectionId: s1a.id, description: "Pekerjaan balok 30x50 cm", unit: "m3", volume: 36, unitPrice: 2_800_000, amount: 100_800_000 },
      { sectionId: s1a.id, description: "Pekerjaan plat lantai tebal 12 cm", unit: "m2", volume: 960, unitPrice: 385_000, amount: 369_600_000 },
      { sectionId: s1b.id, description: "Pasangan dinding bata merah 1PC:5PP", unit: "m2", volume: 1800, unitPrice: 95_000, amount: 171_000_000 },
      { sectionId: s1b.id, description: "Plesteran dinding dalam", unit: "m2", volume: 3600, unitPrice: 65_000, amount: 234_000_000 },
      { sectionId: s1b.id, description: "Pengecatan dinding dalam", unit: "m2", volume: 3600, unitPrice: 45_000, amount: 162_000_000 },
      { sectionId: s1b.id, description: "Pemasangan kusen aluminium", unit: "unit", volume: 24, unitPrice: 3_500_000, amount: 84_000_000 },
      { sectionId: s1b.id, description: "Pemasangan pintu triplek", unit: "unit", volume: 18, unitPrice: 850_000, amount: 15_300_000 },
      { sectionId: s1c.id, description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 480_000_000, amount: 480_000_000 },
      { sectionId: s1c.id, description: "Sistem plumbing & drainase", unit: "ls", volume: 1, unitPrice: 320_000_000, amount: 320_000_000 },
      { sectionId: s1c.id, description: "AC split 1 PK", unit: "unit", volume: 16, unitPrice: 7_500_000, amount: 120_000_000 },
      { sectionId: s1c.id, description: "Fire alarm system", unit: "ls", volume: 1, unitPrice: 180_000_000, amount: 180_000_000 },
    ]});
  }
  const quot1 = await prisma.quotation.upsert({
    where: { number: "QUOT-2026-001" },
    create: {
      number: "QUOT-2026-001", status: "ACCEPTED", rabId: rab1.id,
      clientName: "PT Nusantara Realty Indonesia", clientCompany: "PT Nusantara Realty Indonesia",
      clientAddress: "Jl. Sudirman No. 45, Jakarta Selatan 12190",
      attentionTo: "Ir. Hendra Wijaya (Direksi)",
      subject: "Penawaran Pembangunan Gedung Perkantoran 4 Lantai",
      openingNote: "Dengan hormat,\n\nBerikut kami sampaikan penawaran harga untuk pembangunan gedung perkantoran sesuai dengan lingkup kerja yang telah disepakati.",
      closingNote: "Demikian penawaran ini kami sampaikan. Harga tersebut bersifat mengikat selama 30 hari kalender.\n\nHormat kami,\nPT Sanata Construction",
      terms: "Harga sudah termasuk PPN 11%|Pembayaran dilakukan secara termin|Sesi peninjauan harga dapat dilakukan dengan jadwal yang disepakati|Durasi pekerjaan 8 bulan kalender",
      paymentTerms: [
        { label: "Uang muka", percent: 20 },
        { label: "Progress 25%", percent: 25 },
        { label: "Progress 50%", percent: 25 },
        { label: "Progress 75%", percent: 20 },
        { label: "Serah terima", percent: 10 },
      ],
      validUntil: new Date("2026-09-15"), issuedAt: new Date("2026-08-01"),
      sentAt: new Date("2026-08-02"), decidedAt: new Date("2026-08-10"),
      signerName: "Ir. Hendra Kusuma", signerTitle: "Direktur Utama",
      signatoryId: hendraId,
      subtotal: 4_850_000_000, discountAmount: 0, taxAmount: 533_500_000, total: 5_383_500_000,
      snapshot: { sections: [
        { name: "Pekerjaan Struktur", items: [
          { description: "Pekerjaan pondasi Strauss pile D300", unit: "m'", volume: 120, unitPrice: 850_000, amount: 102_000_000 },
          { description: "Pekerjaan sloof 30x50 cm", unit: "m3", volume: 24, unitPrice: 2_500_000, amount: 60_000_000 },
          { description: "Pekerjaan kolom utama 40x40 cm", unit: "m3", volume: 48, unitPrice: 3_200_000, amount: 153_600_000 },
          { description: "Pekerjaan balok 30x50 cm", unit: "m3", volume: 36, unitPrice: 2_800_000, amount: 100_800_000 },
          { description: "Pekerjaan plat lantai tebal 12 cm", unit: "m2", volume: 960, unitPrice: 385_000, amount: 369_600_000 },
        ]},
        { name: "Pekerjaan Arsitektur", items: [
          { description: "Pasangan dinding bata merah 1PC:5PP", unit: "m2", volume: 1800, unitPrice: 95_000, amount: 171_000_000 },
          { description: "Plesteran dinding dalam", unit: "m2", volume: 3600, unitPrice: 65_000, amount: 234_000_000 },
          { description: "Pengecatan dinding dalam", unit: "m2", volume: 3600, unitPrice: 45_000, amount: 162_000_000 },
          { description: "Pemasangan kusen aluminium", unit: "unit", volume: 24, unitPrice: 3_500_000, amount: 84_000_000 },
          { description: "Pemasangan pintu triplek", unit: "unit", volume: 18, unitPrice: 850_000, amount: 15_300_000 },
        ]},
        { name: "Pekerjaan MEP", items: [
          { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 480_000_000, amount: 480_000_000 },
          { description: "Sistem plumbing & drainase", unit: "ls", volume: 1, unitPrice: 320_000_000, amount: 320_000_000 },
          { description: "AC split 1 PK", unit: "unit", volume: 16, unitPrice: 7_500_000, amount: 120_000_000 },
          { description: "Fire alarm system", unit: "ls", volume: 1, unitPrice: 180_000_000, amount: 180_000_000 },
        ]},
      ], total: "5.383.500.000" },
      createdById: adminId,
    },
    update: {},
  });
  const bill1 = await prisma.progressBilling.upsert({
    where: { number: "BILL-2026-001" },
    create: { number: "BILL-2026-001", status: "ISSUED", rabId: rab1.id, periodEnd: new Date("2026-04-30"), cumulativeValue: 2_050_000_000, previousValue: 0, currentValue: 2_050_000_000, retentionPct: 5, retentionAmount: 102_500_000, taxPct: 11, taxAmount: 214_225_000, netAmount: 2_161_725_000, snapshot: {}, createdById: adminId },
    update: {},
  });
  await prisma.progressBilling.upsert({
    where: { number: "BILL-2026-002" },
    create: { number: "BILL-2026-002", status: "DRAFT", rabId: rab1.id, periodEnd: new Date("2026-08-15"), cumulativeValue: 3_850_000_000, previousValue: 2_050_000_000, currentValue: 1_800_000_000, retentionPct: 5, retentionAmount: 90_000_000, taxPct: 11, taxAmount: 188_100_000, netAmount: 1_898_100_000, snapshot: {}, createdById: adminId },
    update: {},
  });
  const spk1 = await prisma.projectLetter.upsert({
    where: { number: "SPK-2026-001" },
    create: {
      number: "SPK-2026-001", rabId: rab1.id, quotationId: quot1.id,
      type: "SPK", status: "SIGNED",
      subject: "Surat Perjanjian Kerja Pembangunan gedung Perkantoran 4 Lantai",
      letterDate: new Date("2026-08-12"), issuedAt: new Date("2026-08-12"), signedAt: new Date("2026-08-14"),
      recipientName: "Ir. Hendra Wijaya", recipientCompany: "PT Nusantara Realty Indonesia",
      recipientAddress: "Jl. Sudirman No. 45, Jakarta Selatan 12190",
      attentionTo: "Direksi PT Nusantara Realty Indonesia",
      signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
      signatoryId: hendraId,
      counterSignerName: "Ir. Hendra Wijaya", counterSignerTitle: "Direksi PT Nusantara Realty Indonesia",
      amount: 5_383_500_000, retentionAmount: 0, taxPct: 11,
      taxAmount: 533_500_000, totalAmount: 5_383_500_000,
      amountInWords: "Lima miliar tiga ratus delapan puluh tiga juta lima ratus ribu rupiah",
      body: {
        clauses: [
          { title: "Pasal 1 — Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan pembangunan gedung perkantoran 4 lantai sesuai gambar kerja dan spesifikasi teknis yang telah disepakati." },
          { title: "Pasal 2 — Nilai Kontrak", text: "Nilai kontrak adalah Rp 5.383.500.000 (lima miliar tiga ratus delapan puluh tiga juta lima ratus ribu rupiah) termasuk PPN 11%." },
          { title: "Pasal 3 — Jadwal Pelaksanaan", text: "Jadwal pelaksanaan pekerjaan adalah 8 (delapan) bulan kalender terhitung sejak tanggal mulai kerja." },
          { title: "Pasal 4 — Sistem Pembayaran", text: "Pembayaran dilakukan secara termin sesuai dengan pencapaian progres pekerjaan." },
          { title: "Pasal 5 — Garansi", text: "Kontraktor memberikan garansi struktur selama 10 tahun dan garansi finishing selama 2 tahun." },
        ],
        opening: "Pada hari ini, tanggal dua belas Agustus dua ribu dua puluh enam, telah dijalin perjanjian kerja antara:",
        closing: "Demikian perjanjian ini dibuat dalam rangkap 2 (dua) dan memiliki kekuatan hukum yang sama.",
      },
      createdById: adminId,
    },
    update: {},
  });
  const inv1 = await prisma.projectLetter.upsert({
    where: { number: "INV-2026-001" },
    create: {
      number: "INV-2026-001", rabId: rab1.id, billingId: bill1.id,
      type: "INVOICE", status: "PAID",
      subject: "Invoice Termin 1 — Progress 25%",
      letterDate: new Date("2026-05-15"), issuedAt: new Date("2026-05-15"),
      paidAt: new Date("2026-05-28"), dueDate: new Date("2026-06-14"),
      recipientName: "Ir. Hendra Wijaya", recipientCompany: "PT Nusantara Realty Indonesia",
      recipientAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
      signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
      signatoryId: hendraId,
      amount: 2_050_000_000, retentionAmount: 102_500_000, taxPct: 11,
      taxAmount: 214_225_000, totalAmount: 2_161_725_000,
      amountInWords: "Dua miliar seratus enam puluh satu juta tujuh ratus dua puluh lima ribu rupiah",
      body: {
        lines: [
          { description: "Pekerjaan fondasi dan struktur basement", amount: 415_400_000 },
          { description: "Pekerjaan sloof dan kolom lantai 1-2", amount: 816_000_000 },
          { description: "Pekerjaan balok dan plat lantai 1-2", amount: 818_600_000 },
        ],
      },
      createdById: adminId,
    },
    update: {},
  });
  await prisma.projectLetter.upsert({
    where: { number: "KWIT-2026-001" },
    create: {
      number: "KWIT-2026-001", rabId: rab1.id, parentLetterId: inv1.id,
      type: "KWITANSI", status: "SIGNED",
      subject: "Kwitansi Pembayaran Termin 1",
      letterDate: new Date("2026-05-28"), issuedAt: new Date("2026-05-28"), signedAt: new Date("2026-05-28"),
      recipientName: "PT Nusantara Realty Indonesia", recipientCompany: "PT Nusantara Realty Indonesia",
      signerName: "Maya Anggraini", signerTitle: "Manajer Keuangan",
      amount: 2_161_725_000, retentionAmount: 0, taxPct: 0, taxAmount: 0, totalAmount: 2_161_725_000,
      amountInWords: "Dua miliar seratus enam puluh satu juta tujuh ratus dua puluh lima ribu rupiah",
      body: {},
      createdById: adminId,
    },
    update: {},
  });
  await prisma.projectLetter.upsert({
    where: { number: "BAPP-2026-001" },
    create: {
      number: "BAPP-2026-001", rabId: rab1.id,
      type: "BAPP", status: "SIGNED",
      subject: "Berita Acara Penyelesaian Pekerjaan Termin 1",
      letterDate: new Date("2026-05-10"), issuedAt: new Date("2026-05-10"), signedAt: new Date("2026-05-12"),
      recipientName: "Ir. Hendra Wijaya", recipientCompany: "PT Nusantara Realty Indonesia",
      signerName: "Ir. Dimas Nugroho", signerTitle: "Kepala Engineering",
      counterSignerName: "Tim Pengawas PT Nusantara Realty", counterSignerTitle: "Konsultan Pengawas",
      body: {
        clauses: [
          { title: "Pekerjaan yang Diselesaikan", text: "Pekerjaan fondasi, sloof, kolom, balok, dan plat lantai 1-2 telah diselesaikan pada tanggal 30 April 2026." },
          { title: "Hasil Pemeriksaan", text: "Hasil pemeriksaan visual dan pengujian menunjukkan pekerjaan fondasi dan struktur sesuai spesifikasi teknis." },
          { title: "Persetujuan", text: "Pihak pertama dan kedua menyetujui hasil pekerjaan ini untuk dijadikan dasar pembayaran termin." },
        ],
        opening: "Pada tanggal 10 Mei 2026, telah dilakukan pemeriksaan bersama terhadap pekerjaan konstruksi.",
        closing: "Hasil pemeriksaan ini disepakati dan ditandatangani oleh kedua belah pihak.",
      },
      createdById: adminId,
    },
    update: {},
  });
  const sub1 = await prisma.projectSubmission.upsert({
    where: { number: "SUB-2026-001" },
    create: {
      number: "SUB-2026-001", rabId: rab1.id, requestedById: adminId,
      type: "MATERIAL", status: "APPROVED_CLIENT",
      title: "Pengadaan Steel Beam WF 300",
      reason: "Perubahan desain struktural yang memerlukan penguatan kolom",
      neededDate: new Date("2026-09-01"), estimatedCost: 285_000_000,
      submittedAt: new Date("2026-08-05"), reviewedAt: new Date("2026-08-07"),
      reviewNote: "Disetujui dengan catatan pengukuran ulang di lapangan",
      forwardedAt: new Date("2026-08-08"), clientDecidedAt: new Date("2026-08-10"),
      clientNote: "Setuju, lanjutkan pengadaan",
    },
    update: {},
  });
  await prisma.projectSubmission.upsert({
    where: { number: "SUB-2026-002" },
    create: {
      number: "SUB-2026-002", rabId: rab1.id, requestedById: adminId,
      type: "WAKTU", status: "SUBMITTED",
      title: "Perpanjangan Waktu 14 Hari",
      reason: "Keterlambatan pengiriman material steel beam",
      neededDate: new Date("2026-10-15"), requestedDays: 14, estimatedCost: 0,
      submittedAt: new Date("2026-08-14"),
    },
    update: {},
  });
  await prisma.projectSubmission.upsert({
    where: { number: "SUB-2026-003" },
    create: {
      number: "SUB-2026-003", rabId: rab1.id, requestedById: adminId,
      type: "ALAT", status: "DRAFT",
      title: "Sewa Tower Crane untuk Lantai 3-4",
      reason: "Perlu crane tambahan untuk pekerjaan lantai atas",
      neededDate: new Date("2026-09-20"), estimatedCost: 95_000_000,
    },
    update: {},
  });
  const existingItems1 = await prisma.projectSubmissionItem.count({ where: { submissionId: sub1.id } });
  if (existingItems1 === 0) {
    await prisma.projectSubmissionItem.createMany({ data: [
      { submissionId: sub1.id, name: "Steel Beam WF 300x150x6.5x9", spec: "BS standard", unit: "ton", quantity: 8, unitPrice: 35_625_000, amount: 285_000_000, note: "Harga sesuai penawaran supplier" },
      { submissionId: sub1.id, name: "Baut koneksi WF 300", spec: "High tensile", unit: "kg", quantity: 240, unitPrice: 35_000, amount: 8_400_000, note: null },
    ]});
  }
  const existingLog1 = await prisma.logbookEntry.count({ where: { rabId: rab1.id } });
  if (existingLog1 === 0) {
    await prisma.logbookEntry.createMany({ data: [
      { rabId: rab1.id, date: new Date("2026-08-15"), timeOfDay: "09:30", category: "KUNJUNGAN_KONSULTAN", severity: "INFO", title: "Kunjungan Konsultan Pengawas", description: "Tim pengawas melakukan inspection rutin bersama tim lapangan. Hasil: fondasi siap untuk tahap selanjutnya.", actionTaken: "Koordinasi jadwal inspection selanjutnya", isResolved: true, resolvedAt: new Date("2026-08-15") },
      { rabId: rab1.id, date: new Date("2026-08-14"), timeOfDay: "14:00", category: "GANGGUAN_CUACA", severity: "RINGAN", title: "Hujan Deras Siang Ini", description: "Curah hujan tinggi mengganggu pekerjaan cor plat lantai 3. Pekerjaan dihentikan sementara.", actionTaken: "Cover area kerja dengan terpal, resume besok pagi", isResolved: false },
      { rabId: rab1.id, date: new Date("2026-08-13"), timeOfDay: "07:00", category: "INSTRUKSI_LAPANGAN", severity: "INFO", title: "Perubahan Detail Penulangan Balok B3", description: "Konsultan struktural mengeluarkan revised drawing untuk balok B3. Penyimpangan dari gambar semula: jarak sengkang diperketat.", actionTaken: "Sosialisasi ke tukang besi, penyesuaian fabrikasi", isResolved: true, resolvedAt: new Date("2026-08-13") },
      { rabId: rab1.id, date: new Date("2026-08-10"), timeOfDay: "08:00", category: "LAINNYA", severity: "INFO", title: "Rapat Progress Mingguan", description: "Rapat koordinasi progress mingguan. Capaian: fondasi dan sloof 100%, kolom lantai 1 mencapai 80%.", actionTaken: "Fokus percepatan kolom lantai 2", isResolved: true, resolvedAt: new Date("2026-08-10") },
      { rabId: rab1.id, date: new Date("2026-08-08"), timeOfDay: "10:00", category: "KUNJUNGAN_KONSULTAN", severity: "RINGAN", title: "Klarifikasi Detail Struktur", description: "Konsultan struktur meminta klarifikasi detail sambungan kolom K3. Perlu ditambahkan plat sambung 10mm.", actionTaken: "Menyiapkan detail sambungan tambahan sesuai instruksi konsultan", isResolved: true, resolvedAt: new Date("2026-08-09") },
    ]});
  }
  const existingMemos1 = await prisma.siteMemo.count({ where: { rabId: rab1.id } });
  if (existingMemos1 === 0) {
    await prisma.siteMemo.createMany({ data: [
      { number: "SM-IN-2026-001", rabId: rab1.id, direction: "INCOMING", category: "INSTRUKSI", status: "IN_PROGRESS", subject: "Perubahan Lokasi Ground Tank Air", body: "Mohon pemindahan lokasi ground water tank dari sisi barat ke sisi timur bangunan sesuai hasil value engineering.", fromParty: "PT Nusantara Realty Indonesia", toParty: "PT Sanata Construction", letterDate: new Date("2026-08-10"), dueDate: new Date("2026-08-20") },
      { number: "SM-OUT-2026-001", rabId: rab1.id, direction: "OUTGOING", category: "LAINNYA", status: "CLOSED", subject: "Jadwal Inspection Struktur Minggu Depan", body: "Kami menyampaikan jadwal inspection struktur yang akan dilakukan konsultan pengawas pada hari Kamis, 22 Agustus 2026 pukul 09.00 WIB.", fromParty: "PT Sanata Construction", toParty: "PT Nusantara Realty Indonesia", letterDate: new Date("2026-08-15"), closedAt: new Date("2026-08-15") },
    ]});
  }
  const existingDR1 = await prisma.dailyReport.count({ where: { rabId: rab1.id } });
  if (existingDR1 === 0) {
    await prisma.dailyReport.createMany({ data: [
      { rabId: rab1.id, date: new Date("2026-08-14"), weatherAfternoon: "HUJAN", workforce: { pekerja: 14 }, activities: "Pengecoran plat lantai 3 (area A-C)", notes: "Dihentikan hujan pk 14.00", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-13"), weatherAfternoon: "CERAH", workforce: { pekerja: 18 }, activities: "Pembesian plat lantai 3", notes: "Progress 85%", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-12"), weatherAfternoon: "BERAWAN", workforce: { pekerja: 16 }, activities: "Pembesian dan bekisting balok lantai 3", notes: "Baik", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-11"), weatherAfternoon: "CERAH", workforce: { pekerja: 12 }, activities: "Pemasangan bekisting plat lantai 3", notes: "Baik", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-10"), weatherAfternoon: "CERAH", workforce: { pekerja: 15 }, activities: "Pengecoran balok lantai 3 area B", notes: "Perlu tambahan finishing setelah curing", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-09"), weatherAfternoon: "CERAH", workforce: { pekerja: 14 }, activities: "Pembesian plat lantai 3 area A", notes: "Besi sudah siap 100%", createdById: adminId },
      { rabId: rab1.id, date: new Date("2026-08-08"), weatherAfternoon: "GERIMIS", workforce: { pekerja: 10 }, activities: "Pemasangan bekisting kolom lantai 4", notes: "Gerimis tidak mengganggu", createdById: adminId },
    ]});
  }
  const rab2 = await prisma.rab.upsert({
    where: { number: "RAB-2026-002" },
    create: {
      number: "RAB-2026-002",
      title: "Renovasi & Perluasan Rumah Tinggal Pak Budi",
      clientName: "Budi Santoso",
      location: "Jl. Melati No. 8, Jakarta Selatan 12345",
      projectDate: new Date("2026-06-01"),
      scheduleStart: new Date("2026-06-15"),
      taxPct: 11, subtotal: 765_000_000, discountAmount: 0,
      taxAmount: 84_150_000, total: 849_150_000, createdById: adminId,
    },
    update: { title: "Renovasi & Perluasan Rumah Tinggal Pak Budi" },
  });
  const existingSections2 = await prisma.rabSection.count({ where: { rabId: rab2.id } });
  if (existingSections2 === 0) {
    const s2a = await prisma.rabSection.create({ data: { rabId: rab2.id, name: "Pekerjaan Struktur & Pondasi", order: 1 } });
    const s2b = await prisma.rabSection.create({ data: { rabId: rab2.id, name: "Pekerjaan Finishing", order: 2 } });
    const s2c = await prisma.rabSection.create({ data: { rabId: rab2.id, name: "Pekerjaan Atap & Plumbing", order: 3 } });
    await prisma.rabItem.createMany({ data: [
      { sectionId: s2a.id, description: "Pekerjaan pembongkaran dinding lama", unit: "m2", volume: 45, unitPrice: 85_000, amount: 3_825_000 },
      { sectionId: s2a.id, description: "Pondasi footplat 60x60 cm", unit: "unit", volume: 8, unitPrice: 1_200_000, amount: 9_600_000 },
      { sectionId: s2a.id, description: "Kolom praktis 15x15 cm", unit: "m'", volume: 40, unitPrice: 150_000, amount: 6_000_000 },
      { sectionId: s2a.id, description: "Sloof 20x30 cm", unit: "m3", volume: 6, unitPrice: 2_800_000, amount: 16_800_000 },
      { sectionId: s2a.id, description: "Dinding batako 10x20x40 cm", unit: "m2", volume: 120, unitPrice: 95_000, amount: 11_400_000 },
      { sectionId: s2b.id, description: "Plesteran dinding baru", unit: "m2", volume: 240, unitPrice: 65_000, amount: 15_600_000 },
      { sectionId: s2b.id, description: "Pengecatan dinding interior", unit: "m2", volume: 320, unitPrice: 45_000, amount: 14_400_000 },
      { sectionId: s2b.id, description: "Pemasangan lantai keramik 60x60 cm", unit: "m2", volume: 95, unitPrice: 185_000, amount: 17_575_000 },
      { sectionId: s2b.id, description: "Pemasangan plafon gypsum 9mm", unit: "m2", volume: 95, unitPrice: 95_000, amount: 9_025_000 },
      { sectionId: s2b.id, description: "Pemasangan pintu aluminium", unit: "unit", volume: 5, unitPrice: 1_800_000, amount: 9_000_000 },
      { sectionId: s2c.id, description: "Rangka atap baja ringan", unit: "m2", volume: 80, unitPrice: 165_000, amount: 13_200_000 },
      { sectionId: s2c.id, description: "Penutup atap genteng beton", unit: "m2", volume: 80, unitPrice: 125_000, amount: 10_000_000 },
      { sectionId: s2c.id, description: "Talang air galvanized", unit: "m'", volume: 20, unitPrice: 85_000, amount: 1_700_000 },
      { sectionId: s2c.id, description: "Instalasi pipa air bersih", unit: "ls", volume: 1, unitPrice: 8_500_000, amount: 8_500_000 },
      { sectionId: s2c.id, description: "Instalasi pipa pembuangan", unit: "ls", volume: 1, unitPrice: 6_000_000, amount: 6_000_000 },
    ]});
  }
  const quot2 = await prisma.quotation.upsert({
    where: { number: "QUOT-2026-002" },
    create: {
      number: "QUOT-2026-002", status: "ACCEPTED", rabId: rab2.id,
      clientName: "Budi Santoso", clientCompany: null,
      clientAddress: "Jl. Melati No. 8, Jakarta Selatan 12345",
      attentionTo: "Budi Santoso (Pemilik)",
      subject: "Penawaran Renovasi & Perluasan Rumah Tinggal",
      openingNote: "Dengan hormat,\n\nBerikut kami sampaikan penawaran harga untuk renovasi dan perluasan rumah tinggal sesuai hasil survei yang telah dilakukan.",
      closingNote: "Demikian penawaran ini kami sampaikan. Harga bersifat mengikat selama 14 hari kalender.\n\nHormat kami,\nPT Sanata Construction",
      terms: "Harga termasuk PPN 11%|Pembayaran dilakukan 2 termin|Uang muka 50%|Serah terima 50%|Durasi pekerjaan 3 bulan kalender",
      paymentTerms: [{ label: "Uang muka", percent: 50 }, { label: "Serah terima", percent: 50 }],
      validUntil: new Date("2026-08-30"), issuedAt: new Date("2026-07-10"),
      sentAt: new Date("2026-07-12"), decidedAt: new Date("2026-07-15"),
      signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
      signatoryId: null,
      subtotal: 765_000_000, discountAmount: 0, taxAmount: 84_150_000, total: 849_150_000,
      snapshot: { sections: [{ name: "Renovasi Rumah", items: [] }], total: "849.150.000" },
      createdById: adminId,
    },
    update: {},
  });
  const bill2a = await prisma.progressBilling.upsert({
    where: { number: "BILL-2026-003" },
    create: { number: "BILL-2026-003", status: "PAID", rabId: rab2.id, periodEnd: new Date("2026-07-31"), cumulativeValue: 424_575_000, previousValue: 0, currentValue: 424_575_000, retentionPct: 5, retentionAmount: 21_228_750, taxPct: 11, taxAmount: 42_150_000, netAmount: 424_575_000, snapshot: {}, createdById: adminId },
    update: {},
  });
  const spk2 = await prisma.projectLetter.upsert({
    where: { number: "SPK-2026-002" },
    create: {
      number: "SPK-2026-002", rabId: rab2.id, quotationId: quot2.id,
      type: "SPK", status: "SIGNED",
      subject: "Surat Perjanjian Kerja Renovasi Rumah Tinggal",
      letterDate: new Date("2026-07-16"), issuedAt: new Date("2026-07-16"), signedAt: new Date("2026-07-18"),
      recipientName: "Budi Santoso", recipientCompany: null,
      recipientAddress: "Jl. Melati No. 8, Jakarta Selatan 12345",
      signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
      counterSignerName: "Budi Santoso", counterSignerTitle: "Pemilik Rumah",
      amount: 849_150_000, retentionAmount: 0, taxPct: 11,
      taxAmount: 84_150_000, totalAmount: 849_150_000,
      amountInWords: "Delapan ratus empat puluh sembilan juta seratus lima puluh ribu rupiah",
      body: {
        clauses: [
          { title: "Pasal 1 — Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan renovasi dan perluasan rumah tinggal sesuai gambar kerja yang telah disepakati." },
          { title: "Pasal 2 — Nilai Kontrak", text: "Nilai kontrak adalah Rp 849.150.000 (delapan ratus empat puluh sembilan juta seratus lima puluh ribu rupiah) termasuk PPN 11%." },
          { title: "Pasal 3 — Jadwal Pelaksanaan", text: "Jadwal pelaksanaan pekerjaan adalah 3 (tiga) bulan kalender terhitung sejak tanggal mulai kerja." },
          { title: "Pasal 4 — Sistem Pembayaran", text: "Pembayaran dilakukan 2 termin: uang muka 50% dan pelunasan saat serah terima." },
          { title: "Pasal 5 — Garansi", text: "Kontraktor memberikan garansi selama 1 tahun untuk seluruh pekerjaan." },
        ],
        opening: "Pada hari ini, tanggal enam belas Juli dua ribu dua puluh enam, telah dijalin perjanjian kerja antara:",
        closing: "Demikian perjanjian ini dibuat dalam rangkap 2 (dua) dan memiliki kekuatan hukum yang sama.",
      },
      createdById: adminId,
    },
    update: {},
  });
  const inv2 = await prisma.projectLetter.upsert({
    where: { number: "INV-2026-002" },
    create: {
      number: "INV-2026-002", rabId: rab2.id, billingId: bill2a.id,
      type: "INVOICE", status: "PAID",
      subject: "Invoice Uang Muka — Renovasi Rumah Tinggal",
      letterDate: new Date("2026-07-20"), issuedAt: new Date("2026-07-20"),
      paidAt: new Date("2026-07-25"),
      recipientName: "Budi Santoso",
      signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
      amount: 424_575_000, retentionAmount: 0, taxPct: 11,
      taxAmount: 42_150_000, totalAmount: 424_575_000,
      amountInWords: "Empat ratus dua puluh empat juta lima ratus tujuh puluh lima ribu rupiah",
      body: { lines: [{ description: "Uang muka 50% Renovasi Rumah Tinggal", amount: 424_575_000 }] },
      createdById: adminId,
    },
    update: {},
  });
  await prisma.projectLetter.upsert({
    where: { number: "KWIT-2026-002" },
    create: {
      number: "KWIT-2026-002", rabId: rab2.id, parentLetterId: inv2.id,
      type: "KWITANSI", status: "SIGNED",
      subject: "Kwitansi Uang Muka Renovasi",
      letterDate: new Date("2026-07-25"), issuedAt: new Date("2026-07-25"), signedAt: new Date("2026-07-25"),
      recipientName: "Budi Santoso",
      signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
      amount: 424_575_000, retentionAmount: 0, taxPct: 0, taxAmount: 0, totalAmount: 424_575_000,
      amountInWords: "Empat ratus dua puluh empat juta lima ratus tujuh puluh lima ribu rupiah",
      body: {},
      createdById: adminId,
    },
    update: {},
  });
  const sub2 = await prisma.projectSubmission.upsert({
    where: { number: "SUB-2026-004" },
    create: {
      number: "SUB-2026-004", rabId: rab2.id, requestedById: adminId,
      type: "MATERIAL", status: "APPROVED_CLIENT",
      title: "Perubahan Tipe Keramik Lantai",
      reason: "Tipe keramik yang disepakati di RAB tidak tersedia di supplier",
      neededDate: new Date("2026-08-05"), estimatedCost: 4_500_000,
      submittedAt: new Date("2026-08-01"), reviewedAt: new Date("2026-08-02"),
      reviewNote: "Disetujui dengan selisih harga ditanggung supplier",
      forwardedAt: new Date("2026-08-03"), clientDecidedAt: new Date("2026-08-04"),
      clientNote: "Setuju.",
    },
    update: {},
  });
  const existingItems2 = await prisma.projectSubmissionItem.count({ where: { submissionId: sub2.id } });
  if (existingItems2 === 0) {
    await prisma.projectSubmissionItem.createMany({ data: [
      { submissionId: sub2.id, name: "Keramik Platinum 60x60", spec: "Grade A", unit: "m2", quantity: 95, unitPrice: 185_000, amount: 17_575_000, note: "Sesuai RAB" },
    ]});
  }
  const existingLog2 = await prisma.logbookEntry.count({ where: { rabId: rab2.id } });
  if (existingLog2 === 0) {
    await prisma.logbookEntry.createMany({ data: [
      { rabId: rab2.id, date: new Date("2026-08-14"), timeOfDay: "08:30", category: "LAINNYA", severity: "INFO", title: "Rapat Koordinasi Progress", description: "Progress pekerjaan mencapai 45%. Pembongkaran selesai, fondasi dan sloof selesai 100%, dinding baru sudah 60%.", actionTaken: "Percepat pekerjaan dinding agar sesuai jadwal", isResolved: false },
      { rabId: rab2.id, date: new Date("2026-08-10"), timeOfDay: "09:00", category: "KUNJUNGAN_KONSULTAN", severity: "INFO", title: "Survey Lokasi oleh Klien", description: "Klien meninjau langsung progress di lokasi. Klien puas dengan kualitas pekerjaan fondasi.", actionTaken: "Melanjutkan pekerjaan sesuai jadwal", isResolved: true, resolvedAt: new Date("2026-08-10") },
      { rabId: rab2.id, date: new Date("2026-08-05"), timeOfDay: "07:30", category: "INSTRUKSI_LAPANGAN", severity: "RINGAN", title: "Perubahan Desain Plafond", description: "Pemilik menginginkan perubahan ketinggian plafond dari 2.8m menjadi 3.0m di area ruang tamu.", actionTaken: "Menyesuaikan detail pekerjaan plaster dan plafon", isResolved: true, resolvedAt: new Date("2026-08-07") },
    ]});
  }
  const existingMemos2 = await prisma.siteMemo.count({ where: { rabId: rab2.id } });
  if (existingMemos2 === 0) {
    await prisma.siteMemo.createMany({ data: [
      { number: "SM-IN-2026-002", rabId: rab2.id, direction: "INCOMING", category: "INSTRUKSI", status: "IN_PROGRESS", subject: "Penambahan Area Carport", body: "Mohon penambahan luasan carport dari 20 m2 menjadi 30 m2 sesuai kebutuhan pemilik.", fromParty: "Budi Santoso", toParty: "PT Sanata Construction", letterDate: new Date("2026-08-12"), dueDate: new Date("2026-08-18") },
    ]});
  }
  const existingDR2 = await prisma.dailyReport.count({ where: { rabId: rab2.id } });
  if (existingDR2 === 0) {
    await prisma.dailyReport.createMany({ data: [
      { rabId: rab2.id, date: new Date("2026-08-14"), weatherAfternoon: "CERAH", workforce: { pekerja: 8 }, activities: "Pemasangan dinding batako lantai 2", notes: "Progress 60%", createdById: adminId },
      { rabId: rab2.id, date: new Date("2026-08-13"), weatherAfternoon: "CERAH", workforce: { pekerja: 9 }, activities: "Pemasangan sloof perluasan", notes: "Sloof selesai 100%", createdById: adminId },
      { rabId: rab2.id, date: new Date("2026-08-12"), weatherAfternoon: "BERAWAN", workforce: { pekerja: 7 }, activities: "Pemasangan kolom praktis lantai 2", notes: "Kolom perluasan berdiri", createdById: adminId },
      { rabId: rab2.id, date: new Date("2026-08-11"), weatherAfternoon: "CERAH", workforce: { pekerja: 10 }, activities: "Pemasangan fondasi footplat perluasan", notes: "Fondasi footplat selesai", createdById: adminId },
      { rabId: rab2.id, date: new Date("2026-08-10"), weatherAfternoon: "CERAH", workforce: { pekerja: 6 }, activities: "Pembongkaran dinding lama area belakang", notes: "Pembersihan puing selesai", createdById: adminId },
      { rabId: rab2.id, date: new Date("2026-08-09"), weatherAfternoon: "HUJAN", workforce: { pekerja: 5 }, activities: "Persiapan perancah dan bekisting", notes: "Hujan setengah hari", createdById: adminId },
    ]});
  }
  await Promise.all([
    prisma.documentCounter.upsert({ where: { id: "SPK-2026" }, update: { lastSeq: 2, year: 2026 }, create: { id: "SPK-2026", series: "SPK", year: 2026, lastSeq: 2 } }),
    prisma.documentCounter.upsert({ where: { id: "INV-2026" }, update: { lastSeq: 2, year: 2026 }, create: { id: "INV-2026", series: "INV", year: 2026, lastSeq: 2 } }),
    prisma.documentCounter.upsert({ where: { id: "BILL-2026" }, update: { lastSeq: 3, year: 2026 }, create: { id: "BILL-2026", series: "BILL", year: 2026, lastSeq: 3 } }),
    prisma.documentCounter.upsert({ where: { id: "SUB-2026" }, update: { lastSeq: 4, year: 2026 }, create: { id: "SUB-2026", series: "SUB", year: 2026, lastSeq: 4 } }),
    prisma.documentCounter.upsert({ where: { id: "KWIT-2026" }, update: { lastSeq: 2, year: 2026 }, create: { id: "KWIT-2026", series: "KWIT", year: 2026, lastSeq: 2 } }),
    prisma.documentCounter.upsert({ where: { id: "BAPP-2026" }, update: { lastSeq: 1, year: 2026 }, create: { id: "BAPP-2026", series: "BAPP", year: 2026, lastSeq: 1 } }),
  ]);
  console.log("Seeded 2 RAB projects with full data (sections, items, quotations, billings, letters, submissions, logbook, memos, daily reports).");
}



/**
 * Konten situs awal — persis teks yang sebelumnya di-hardcode di komponen
 * halaman, kini dipindah ke database supaya bisa diedit dari admin.
 * Setiap item di-upsert agar perubahan setting langsung propagasi tanpa perlu
 * hapus manual terlebih dahulu.
 */
interface SeedContentItem {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  href?: string | null;
  /** Field pilihan & angka koleksi (mis. warna dan ukuran lantai model 3D). */
  meta?: Record<string, string | number>;
}

async function seedSiteContent() {
  const content: Record<string, SeedContentItem[]> = {
    home_hero_scenes: [
      {
        title: "Modular Skyscraper",
        subtitle: "Perakitan berbantuan drone dengan panel fasad adaptif.",
        href: "/projects",
      },
      {
        title: "Integrated Transit Hub",
        subtitle: "Sistem konstruksi tanpa jeda untuk infrastruktur mobilitas generasi baru.",
        href: "/services",
      },
      {
        title: "Coastal Urban Grid",
        subtitle: "Rekayasa hunian pesisir yang siap menghadapi beban lingkungan ekstrem.",
        href: "/about",
      },
    ],
    // Contoh agen widget WhatsApp. Nomor memakai contoh dokumentasi dan wajib
    // diganti dengan nomor tim sebelum situs dipublikasikan.
    whatsapp_agents: [
      {
        title: "Tim Penawaran",
        subtitle: "Estimasi & RAB",
        body: "Perhitungan biaya, penawaran harga, dan jadwal survei lokasi.",
        meta: { phone: "6285788882662", hours: "08:00-17:00", keywords: "harga biaya rab penawaran estimasi survei desain" },
      },
      {
        title: "Tim Proyek",
        subtitle: "Pelaksanaan Lapangan",
        body: "Progres pekerjaan, jadwal, dan koordinasi di lokasi proyek.",
        meta: { phone: "6285788882662", hours: "08:00-16:00", keywords: "progres pekerjaan lapangan jadwal termin garansi pemeliharaan" },
      },
    ],
    // Contoh gedung 5 lantai — urutan dari lantai paling bawah ke atas.
    // Ukuran memakai meter sungguhan; model menskalakan sendiri agar pas.
    building_floors: [
      {
        title: "Basement — Parkir & Utilitas",
        subtitle: "620 m²",
        body: "Area parkir 24 mobil, ruang pompa, panel listrik utama, dan tandon air bersih. Struktur dinding penahan tanah beton bertulang tebal 30 cm.",
        href: "/services",
        meta: { accent: "indigo", heightM: 3.2, widthM: 28, depthM: 22, startWeek: 0, durationWeeks: 6 },
      },
      {
        title: "Lantai 1 — Lobi & Ritel",
        subtitle: "540 m²",
        body: "Lobi utama double height, dua unit ritel, resepsionis, dan area drop-off. Fasad kaca tempered 12 mm dengan rangka aluminium.",
        href: "/projects",
        meta: { accent: "cyan", heightM: 4.5, widthM: 26, depthM: 21, startWeek: 4, durationWeeks: 7 },
      },
      {
        title: "Lantai 2 — Kantor Sewa",
        subtitle: "480 m²",
        body: "Ruang kerja terbuka untuk 60 orang, empat ruang rapat, dan pantry. Lantai raised floor untuk jalur kabel data.",
        href: "/services",
        meta: { accent: "cyan", heightM: 3.6, widthM: 24, depthM: 20, startWeek: 9, durationWeeks: 6 },
      },
      {
        title: "Lantai 3 — Kantor Sewa",
        subtitle: "480 m²",
        body: "Tata ruang sama dengan lantai 2, disiapkan untuk penyewa tunggal. Plafon akustik dan pencahayaan LED 350 lux.",
        href: "/services",
        meta: { accent: "cyan", heightM: 3.6, widthM: 24, depthM: 20, startWeek: 14, durationWeeks: 6 },
      },
      {
        title: "Rooftop — Mekanikal & Taman",
        subtitle: "300 m²",
        body: "Chiller, menara pendingin, panel surya 18 kWp, dan taman atap dengan lapisan waterproofing membran bakar.",
        href: "/about",
        meta: { accent: "emerald", heightM: 2.8, widthM: 20, depthM: 16, startWeek: 20, durationWeeks: 5 },
      },
    ],
    home_stats: [
      { title: "15", subtitle: "+", body: "Tahun Pengalaman" },
      { title: "120", subtitle: "+", body: "Proyek Selesai" },
      { title: "50", subtitle: "+", body: "Klien Puas" },
      { title: "30", subtitle: "+", body: "Engineer Ahli" },
    ],
          sanata_services: [
            { icon: "DraftingCompass", title: "Architecture & Engineering", subtitle: "Enterprise Design", body: "Masterplanning, BIM coordination, and parametric facade development.", href: "/services" },
            { icon: "Cable", title: "Civil Engineering", subtitle: "Execution System", body: "High-performance structural systems, utility corridors, and site execution control.", href: "/services" },
            { icon: "Compass", title: "Interior Design", subtitle: "Spatial Intelligence", body: "Spatial experiences with smart glass, adaptive lighting, and premium material strategy.", href: "/services" },
          ],
          rumahesra_services: [
            { icon: "Building2", title: "Structure Engineering", subtitle: "Residential Core", body: "Residential structure optimization with resilient framing and seismic readiness.", href: "/services" },
            { icon: "HardHat", title: "Civil Engineering", subtitle: "Integrated Utility", body: "Infrastructure, drainage, and efficient construction sequencing for modern living.", href: "/services" },
            { icon: "LayoutGrid", title: "Space Planning", subtitle: "Human-Centered Living", body: "Layouts that balance wellness, privacy, and long-term adaptability.", href: "/services" },
          ],
    home_services: [
      { icon: "Building2", title: "Konstruksi Bangunan", body: "Pembangunan rumah tinggal, ruko, hingga gedung komersial dari fondasi sampai serah terima." },
      { icon: "Hammer", title: "Renovasi & Interior", body: "Renovasi struktur, perluasan bangunan, dan penataan interior sesuai kebutuhan Anda." },
      { icon: "Ruler", title: "Desain Arsitektur", body: "Perencanaan desain dan gambar kerja yang matang sebelum proyek mulai dikerjakan." },
      { icon: "ClipboardList", title: "Manajemen Proyek", body: "Pengawasan jadwal, anggaran, dan kualitas kerja di setiap tahap pembangunan." },
    ],
    home_why: [
      { icon: "ShieldCheck", title: "Garansi Kualitas", body: "Material dan pengerjaan diawasi ketat sesuai standar konstruksi nasional." },
      { icon: "Clock", title: "Tepat Waktu", body: "Jadwal proyek yang realistis, dipantau ketat hingga hari serah terima." },
      { icon: "Award", title: "Legal & Bersertifikat", body: "Tim insinyur berpengalaman dengan sertifikasi keahlian konstruksi." },
      { icon: "Users2", title: "Tim Berdedikasi", body: "Project manager khusus mendampingi Anda dari awal hingga akhir proyek." },
    ],
    home_process: [
      { icon: "MessagesSquare", subtitle: "01", title: "Konsultasi", body: "Diskusi kebutuhan, lokasi, dan anggaran proyek Anda bersama tim kami." },
      { icon: "PenTool", subtitle: "02", title: "Desain & Perencanaan", body: "Penyusunan gambar kerja, RAB, dan jadwal pelaksanaan proyek." },
      { icon: "HardHat", subtitle: "03", title: "Konstruksi", body: "Pengerjaan di lapangan dengan pengawasan mutu dan keselamatan kerja." },
      { icon: "KeyRound", subtitle: "04", title: "Serah Terima", body: "Quality check akhir dan serah terima proyek sesuai kesepakatan." },
    ],
    certificates: [
      { icon: "BadgeCheck", title: "ISO 9001:2015" },
      { icon: "ShieldCheck", title: "Sertifikasi K3 Konstruksi" },
      { icon: "FileCheck2", title: "SBU Jasa Konstruksi" },
      { icon: "Award", title: "LPJK Terdaftar" },
    ],
    testimonials: [
      { title: "Budi Santoso", subtitle: "Pemilik Rumah, Jakarta Selatan", body: "Sanata mengerjakan renovasi rumah kami tepat waktu dan hasilnya jauh melebihi ekspektasi. Komunikasi tim sangat profesional." },
      { title: "Sinta Wijaya", subtitle: "Direktur Operasional, Retail Group", body: "Proyek ruko komersial kami ditangani dengan sangat rapi. Setiap tahap dilaporkan jelas, tidak ada biaya tersembunyi." },
      { title: "Ahmad Rahman", subtitle: "Pengembang Properti", body: "Tim engineering Sanata sangat kompeten dalam menangani struktur bangunan kompleks. Sangat merekomendasikan." },
    ],
    about_values: [
      { icon: "ShieldCheck", title: "Transparansi", body: "Quotation detail, breakdown lingkup & material yang jelas. Tidak ada proses tersembunyi." },
      { icon: "BadgeCheck", title: "Pendidikan Klien", body: "Panduan klien langkah demi langkah agar mereka memahami keputusan teknis dan alasan di baliknya." },
      { icon: "Target", title: "Kualitas Berbasis Engineering", body: "Implementasi SOP ketat berdasarkan standar SNI / ASTM dengan fokus pada durabilitas jangka panjang." },
      { icon: "TrendingUp", title: "Fleksibel", body: "Partial work (struktur saja, interior saja) hingga full project (0-100%). Kolaborasi adaptif sesuai kebutuhan." },
    ],
    about_timeline: [
      { title: "2010", subtitle: "Awal Berdiri", body: "Sanata memulai langkah sebagai kontraktor renovasi hunian di Jakarta." },
      { title: "2015", subtitle: "Ekspansi Komersial", body: "Mulai menangani proyek ruko dan gedung komersial skala menengah." },
      { title: "2020", subtitle: "Sertifikasi Nasional", body: "Memperoleh ISO 9001:2015 dan sertifikasi K3 konstruksi." },
      { title: "2026", subtitle: "120+ Proyek", body: "Melayani klien residensial, komersial, dan retail di seluruh Jabodetabek dan sekitarnya." },
    ],
    about_leadership: [
      { title: "Rangga Arya Madini Djasa", subtitle: "Founder and Director" },
      { title: "Ir. Marudut Sagala S.T.", subtitle: "Project Manager" },
      { title: "Radiansyah Hamdan", subtitle: "Site / QC Engineer" },
      { title: "Mesya Putri Zararosa S.E.", subtitle: "Business Development" },
      { title: "Sabiq Alfarisy", subtitle: "Visual Artist / Sculptor" },
      { title: "Nanda Rachmawan S.T.", subtitle: "Architect" },
      { title: "Desi Sri Sukmawati S.E.", subtitle: "Accounting & Finance" },
      { title: "Hadi Fathu Masykuri S.E.", subtitle: "Document Control & Technical Admin" },
    ],
    about_awards: [
      { title: "ISO 9001:2015" },
      { title: "Sertifikasi K3 Konstruksi" },
      { title: "SBU Jasa Konstruksi" },
      { title: "LPJK Terdaftar" },
      { title: "Anugerah Kontraktor Terbaik 2023" },
    ],
    faq: [
      { title: "Berapa lama proses pembangunan rumah tinggal?", body: "Untuk rumah tinggal 2 lantai umumnya 6–10 bulan, tergantung luas bangunan, kompleksitas desain, dan kesiapan lahan. Jadwal detail kami susun bersama RAB di tahap perencanaan." },
      { title: "Apakah Sanata menyediakan jasa desain?", body: "Ya. Kami menyediakan layanan desain arsitektur dan gambar kerja lengkap, yang bisa diambil terpisah maupun satu paket dengan pelaksanaan konstruksi." },
      { title: "Bagaimana sistem pembayarannya?", body: "Pembayaran dilakukan bertahap mengikuti progres pekerjaan (termin) yang disepakati di kontrak. Tidak ada biaya tersembunyi di luar RAB yang disetujui." },
      { title: "Apakah ada garansi setelah proyek selesai?", body: "Ada. Kami memberikan masa pemeliharaan setelah serah terima untuk menangani perbaikan yang menjadi tanggung jawab pelaksana." },
      { title: "Area mana saja yang dilayani?", body: "Fokus utama kami Jabodetabek. Untuk proyek di luar area tersebut, silakan hubungi tim kami untuk pembahasan lebih lanjut." },
    ],
        service_detail_advantages: [
          { icon: "BadgeCheck", title: "Tim Ahli Berpengalaman", body: "Tim insinyur dan pelaksana lapangan berpengalaman untuk proyek residensial maupun komersial." },
          { icon: "ShieldCheck", title: "Material Berkualitas", body: "Material dan metode kerja dipilih untuk menjaga mutu, keamanan, dan ketahanan bangunan." },
          { icon: "ClipboardList", title: "Pengawasan Transparan", body: "Setiap tahap dipantau dengan laporan progres dan koordinasi yang jelas bersama klien." },
          { icon: "Target", title: "Deliverable Presisi", body: "Target mutu, jadwal, dan biaya dikelola dengan standar eksekusi yang terukur." },
        ],
        service_detail_timeline: [
          { title: "Konsultasi & Survei Lokasi", subtitle: "1-3 hari", body: "Diskusi awal, peninjauan kebutuhan, dan survei kondisi eksisting." },
          { title: "Desain & Penyusunan RAB", subtitle: "3-7 hari", body: "Penyusunan konsep, gambar kerja, dan perhitungan biaya awal." },
          { title: "Pengerjaan Konstruksi", subtitle: "Sesuai skala proyek", body: "Pelaksanaan lapangan dengan pengawasan mutu, keselamatan, dan progres." },
          { title: "Quality Check & Serah Terima", subtitle: "1-2 hari", body: "Pemeriksaan akhir, punch list, dan serah terima hasil pekerjaan." },
        ],
        service_detail_faq: [
          { title: "Apakah harga sudah termasuk material?", body: "Estimasi harga yang ditampilkan adalah harga dasar jasa; rincian material dan RAB final diberikan setelah survei lokasi." },
          { title: "Berapa lama garansi pengerjaan?", body: "Kami memberikan garansi struktur dan pengerjaan sesuai kesepakatan kontrak, umumnya 1-3 tahun tergantung jenis layanan." },
          { title: "Apakah bisa custom sesuai kebutuhan?", body: "Tentu. Setiap proyek dimulai dengan konsultasi untuk menyesuaikan lingkup kerja dengan kebutuhan Anda." },
        ],
    career_benefits: [
      { icon: "HeartHandshake", title: "Lingkungan Suportif", body: "Tim yang saling mendukung dengan budaya kerja terbuka." },
      { icon: "TrendingUp", title: "Jenjang Karier", body: "Kesempatan berkembang lewat proyek yang makin menantang." },
      { icon: "GraduationCap", title: "Pelatihan Berkala", body: "Sertifikasi keahlian dan pelatihan teknis rutin." },
      { icon: "ShieldCheck", title: "Jaminan Kesehatan", body: "BPJS Kesehatan dan Ketenagakerjaan untuk seluruh karyawan." },
    ],
    career_positions: [
      { title: "Site Engineer", subtitle: "Full-time", body: "Jakarta Selatan" },
      { title: "Quantity Surveyor", subtitle: "Full-time", body: "Jakarta Selatan" },
      { title: "Drafter Arsitektur", subtitle: "Full-time", body: "Jakarta Selatan" },
      { title: "Project Manager", subtitle: "Full-time", body: "Jabodetabek" },
    ],
    client_sectors: [
      { icon: "Home", title: "Residensial", body: "Rumah tinggal, townhouse, dan renovasi hunian pribadi." },
      { icon: "Store", title: "Komersial", body: "Ruko, kantor, restoran, dan ruang ritel." },
      { icon: "Factory", title: "Industri", body: "Gudang, workshop, dan fasilitas produksi ringan." },
      { icon: "Landmark", title: "Institusi", body: "Fasilitas pendidikan, ibadah, dan layanan publik." },
    ],
    contact_info: [
      { icon: "MapPin", title: "Alamat", body: "Jalan Puring, Ciputat Timur, Tangerang Selatan 15419" },
      { icon: "Phone", title: "Telepon", body: "+62 8578 888 2662" },
      { icon: "Mail", title: "Email", body: "Rumamesra@santarasbc.com" },
      { icon: "Clock", title: "Jam Operasional", body: "Senin - Sabtu, 08.00 - 17.00 WIB" },
    ],
        privacy_sections: [
          { title: "1. Data yang Kami Kumpulkan", body: "Kami mengumpulkan data yang Anda berikan secara langsung melalui formulir kontak atau permintaan penawaran, meliputi nama, email, nomor telepon, dan kebutuhan proyek." },
          { title: "2. Penggunaan Data", body: "Data digunakan untuk menindaklanjuti konsultasi, penawaran, dan komunikasi layanan, serta tidak dibagikan kepada pihak ketiga tanpa dasar yang sah." },
          { title: "3. Penyimpanan Data", body: "Data disimpan pada sistem internal kami selama diperlukan untuk operasional bisnis dan kepatuhan hukum yang berlaku." },
          { title: "4. Hak Anda", body: "Anda berhak meminta akses, koreksi, atau penghapusan data pribadi melalui kanal kontak resmi kami." },
          { title: "5. Perubahan Kebijakan", body: "Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan akan dipublikasikan melalui halaman ini." },
        ],
        terms_sections: [
          { title: "1. Penerimaan Ketentuan", body: "Dengan mengakses situs ini atau menggunakan layanan kami, Anda dianggap menyetujui syarat dan ketentuan yang berlaku." },
          { title: "2. Lingkup Layanan", body: "Estimasi harga di situs bersifat indikatif dan dapat berubah setelah survei lokasi serta penyusunan RAB final." },
          { title: "3. Kontrak Kerja", body: "Setiap proyek konstruksi akan diikat dengan perjanjian kerja tertulis yang mengatur lingkup pekerjaan, jadwal, dan pembayaran." },
          { title: "4. Batasan Tanggung Jawab", body: "Sanata Construction tidak bertanggung jawab atas keterlambatan yang disebabkan force majeure atau perubahan lingkup dari klien." },
          { title: "5. Hukum yang Berlaku", body: "Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia." },
        ],
  };

  let created = 0;
  let updated = 0;

  // Upsert per-item: setiap judul unik di-{collection} mendapat update jika berbeda.
  // Ini membuat seed idempotent — run berkali-kali tetap konsisten.
  for (const [collection, items] of Object.entries(content)) {
    for (let order = 0; order < items.length; order++) {
      const item = items[order]!;
      const where = { collection_title: { collection, title: item.title } };

      const data = {
        collection,
        title: item.title,
        subtitle: item.subtitle ?? null,
        body: item.body ?? null,
        icon: item.icon ?? null,
        imageUrl: item.imageUrl ?? null,
        href: item.href ?? null,
        meta: item.meta ? (item.meta as Prisma.InputJsonValue) : Prisma.DbNull,
        order,
        isActive: true,
      };

      const existing = await prisma.siteCollectionItem.findUnique({ where });
      if (!existing) {
        await prisma.siteCollectionItem.create({ data });
        created++;
      } else {
        // update jika ada field yang berbeda
        const changed =
          existing.subtitle !== data.subtitle ||
          existing.body !== data.body ||
          existing.icon !== data.icon ||
          existing.imageUrl !== data.imageUrl ||
          existing.href !== data.href ||
          existing.order !== data.order;
        if (changed) {
          await prisma.siteCollectionItem.update({ where, data });
          updated++;
        }
      }
    }
  }

  // Sumber tunggal: daftar setting hidup di registry config, bukan disalin ke
  // sini. Salinan terpisah sempat membuat setting baru tidak ikut ter-seed.
  const settings = SITE_SETTING_DEFAULTS;

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { group: setting.group, label: setting.label, type: setting.type, order: setting.order },
      create: setting,
    });
  }

  console.log(`Seeded ${created} site content items (${updated} updated) and ${settings.length} settings.`);
}

/**
 * Data estimasi biaya: Harga Satuan Dasar -> AHSP -> RAB contoh.
 * Koefisien AHSP mengacu pola SNI/Permen PUPR 28/2016; harga satuan adalah
 * contoh untuk wilayah Jabodetabek dan perlu disesuaikan sebelum dipakai nyata.
 */
async function seedEstimation() {
  const priceItems = [
    // Upah (OH = orang hari)
    { code: "L.01", name: "Pekerja", type: "LABOR", unit: "OH", unitPrice: 150_000 },
    { code: "L.02", name: "Tukang batu", type: "LABOR", unit: "OH", unitPrice: 180_000 },
    { code: "L.03", name: "Kepala tukang", type: "LABOR", unit: "OH", unitPrice: 200_000 },
    { code: "L.04", name: "Mandor", type: "LABOR", unit: "OH", unitPrice: 220_000 },
    { code: "L.05", name: "Tukang kayu", type: "LABOR", unit: "OH", unitPrice: 180_000 },
    { code: "L.06", name: "Tukang besi", type: "LABOR", unit: "OH", unitPrice: 185_000 },
    // Bahan
    { code: "M.01", name: "Semen Portland", type: "MATERIAL", unit: "kg", unitPrice: 1_600 },
    { code: "M.02", name: "Pasir pasang", type: "MATERIAL", unit: "m3", unitPrice: 350_000 },
    { code: "M.03", name: "Pasir beton", type: "MATERIAL", unit: "m3", unitPrice: 380_000 },
    { code: "M.04", name: "Kerikil / split 2-3 cm", type: "MATERIAL", unit: "m3", unitPrice: 420_000 },
    { code: "M.05", name: "Batu belah 15/20 cm", type: "MATERIAL", unit: "m3", unitPrice: 320_000 },
    { code: "M.06", name: "Bata merah", type: "MATERIAL", unit: "bh", unitPrice: 900 },
    { code: "M.07", name: "Besi beton polos", type: "MATERIAL", unit: "kg", unitPrice: 14_000 },
    { code: "M.08", name: "Kayu bekisting", type: "MATERIAL", unit: "m3", unitPrice: 3_500_000 },
    { code: "M.09", name: "Pasir urug", type: "MATERIAL", unit: "m3", unitPrice: 250_000 },
    { code: "M.10", name: "Air kerja", type: "MATERIAL", unit: "liter", unitPrice: 50 },
    // Alat
    { code: "E.01", name: "Concrete mixer", type: "EQUIPMENT", unit: "jam", unitPrice: 85_000 },
    { code: "E.02", name: "Concrete vibrator", type: "EQUIPMENT", unit: "jam", unitPrice: 45_000 },
  ] as const;

  const priceByCode = new Map<string, string>();
  for (const item of priceItems) {
    const saved = await prisma.priceItem.upsert({
      where: { code: item.code },
      update: { name: item.name, type: item.type, unit: item.unit, unitPrice: item.unitPrice },
      create: { ...item, region: "Jabodetabek" },
    });
    priceByCode.set(item.code, saved.id);
  }

  const ahspList = [
    {
      code: "A.2.3.1.1",
      name: "Galian tanah biasa sedalam 1 m",
      unit: "m3",
      category: "Pekerjaan Tanah",
      components: [
        ["L.01", 0.75],
        ["L.04", 0.025],
      ],
    },
    {
      code: "A.2.3.2.1",
      name: "Urugan pasir bawah pondasi",
      unit: "m3",
      category: "Pekerjaan Tanah",
      components: [
        ["L.01", 0.3],
        ["L.04", 0.01],
        ["M.09", 1.2],
      ],
    },
    {
      code: "A.3.2.1.1",
      name: "Pasangan pondasi batu belah 1PC : 5PP",
      unit: "m3",
      category: "Pekerjaan Pondasi",
      components: [
        ["L.01", 1.5],
        ["L.02", 0.75],
        ["L.03", 0.075],
        ["L.04", 0.075],
        ["M.05", 1.2],
        ["M.01", 136],
        ["M.02", 0.544],
      ],
    },
    {
      code: "A.4.1.1.7",
      name: "Beton mutu K-250 (fc' 21,7 MPa)",
      unit: "m3",
      category: "Pekerjaan Beton",
      components: [
        ["L.01", 1.65],
        ["L.02", 0.275],
        ["L.03", 0.028],
        ["L.04", 0.083],
        ["M.01", 384],
        ["M.03", 0.692],
        ["M.04", 1.022],
        ["M.10", 215],
        ["E.01", 0.5],
        ["E.02", 0.3],
      ],
    },
    {
      code: "A.4.1.1.17",
      name: "Pembesian 10 kg dengan besi polos",
      unit: "kg",
      category: "Pekerjaan Beton",
      components: [
        ["L.01", 0.007],
        ["L.06", 0.007],
        ["L.03", 0.0007],
        ["L.04", 0.0004],
        ["M.07", 1.05],
      ],
    },
    {
      code: "A.4.4.1.1",
      name: "Pemasangan 1 m2 dinding bata merah 1PC : 5PP tebal 1/2 bata",
      unit: "m2",
      category: "Pekerjaan Dinding",
      components: [
        ["L.01", 0.3],
        ["L.02", 0.1],
        ["L.03", 0.01],
        ["L.04", 0.015],
        ["M.06", 70],
        ["M.01", 11.5],
        ["M.02", 0.043],
      ],
    },
    {
      code: "A.4.4.2.1",
      name: "Plesteran 1PC : 5PP tebal 15 mm",
      unit: "m2",
      category: "Pekerjaan Dinding",
      components: [
        ["L.01", 0.3],
        ["L.02", 0.15],
        ["L.03", 0.015],
        ["L.04", 0.015],
        ["M.01", 5.184],
        ["M.02", 0.026],
      ],
    },
  ] as const;

  for (const ahsp of ahspList) {
    const saved = await prisma.ahsp.upsert({
      where: { code: ahsp.code },
      update: { name: ahsp.name, unit: ahsp.unit, category: ahsp.category },
      create: { code: ahsp.code, name: ahsp.name, unit: ahsp.unit, category: ahsp.category, overheadPct: 10 },
    });
    // Komponen selalu ditulis ulang agar seed idempoten.
    await prisma.ahspComponent.deleteMany({ where: { ahspId: saved.id } });
    await prisma.ahspComponent.createMany({
      data: ahsp.components.map(([code, coefficient], order) => ({
        ahspId: saved.id,
        priceItemId: priceByCode.get(code)!,
        coefficient,
        order,
      })),
    });
  }

  console.log(`Seeded ${priceItems.length} price items and ${ahspList.length} AHSP entries.`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
