/**
 * Marketing System Seed Data
 * Seeds demo data for marketing campaigns, contacts, templates, and offers
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("MARKETING SYSTEM SEED DATA");
  console.log("======================================================================");
  console.log("");

  // Seed Marketing Contacts
  console.log("STEP 1: Creating Marketing Contacts...");
  const contacts = [
    { name: "Ahmad Wijaya", email: "ahmad.wijaya@email.com", phone: "081234567890", tags: ["VIP", "Konstruksi"] },
    { name: "Budi Santoso", email: "budi.santoso@email.com", phone: "081298765432", tags: ["Regular"] },
    { name: "Siti Rahayu", email: "siti.rahayu@email.com", phone: "081345678901", tags: ["Hot Lead"] },
    { name: "Dewi Lestari", email: "dewi.lestari@email.com", phone: "081212345678", tags: ["Konstruksi", "New"] },
    { name: "Hendra Wijaya", email: "hendra.wijaya@email.com", phone: "081287654321", tags: ["High Value"] },
    { name: "Rina Hartati", email: "rina.hartati@email.com", phone: "081355678901", tags: ["Regular"] },
    { name: "Joko Pramono", email: "joko.pramono@email.com", phone: "081367890123", tags: ["Konstruksi"] },
    { name: "Maya Sari", email: "maya.sari@email.com", phone: "081378901234", tags: ["VIP", "New"] },
    { name: "Fajar Nugroho", email: "fajar.nugroho@email.com", phone: "081389012345", tags: ["Hot Lead"] },
    { name: "Ani Wijayanti", email: "ani.wijayanti@email.com", phone: "081390123456", tags: ["Regular"] },
    { name: "Rudi Hermawan", email: "rudi.hermawan@email.com", phone: "081301234567", tags: ["Konstruksi", "High Value"] },
    { name: "Wati Susilowati", email: "wati.susilowati@email.com", phone: "081312345678", tags: ["New"] },
  ];

  const createdContacts = [];
  for (const contact of contacts) {
    const existing = await prisma.marketingContact.findFirst({
      where: { email: contact.email },
    });

    if (existing) {
      console.log(`  Skipping ${contact.email} - already exists`);
      createdContacts.push(existing);
      continue;
    }

    const created = await prisma.marketingContact.create({
      data: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        tags: contact.tags,
        source: "Website",
        leadScore: Math.floor(Math.random() * 100),
        status: "ACTIVE",
        consentMarketing: true,
        consentDate: new Date(),
      },
    });
    console.log(`  ✅ Created: ${created.name} (${created.email})`);
    createdContacts.push(created);
  }

  // Seed Marketing Templates
  console.log("");
  console.log("STEP 2: Creating Marketing Templates...");
  const templates = [
    {
      name: "Pesan Sambutan",
      type: "WHATSAPP",
      content: "Halo {{name}}! Terima kasih sudah menghubungi kami di PT Sanata Construction. Ada yang bisa kami bantu? 😊",
      category: "Sambutan",
    },
    {
      name: "Follow-up Proyek",
      type: "WHATSAPP",
      content: "Hallo {{name}}, sudah melihat proposal proyek yang kami kirimkan? Jika ada pertanyaan, jangan ragu untuk bertanya ya! 🏗️",
      category: "Follow-up",
    },
    {
      name: "Newsletter Bulanan",
      type: "EMAIL",
      subject: "Newsletter PT Sanata Construction - {{bulan}}",
      content: "Halo {{name}},\n\nBerikut newsletter bulan ini dari PT Sanata Construction:\n\n📊 Update Proyek:\n- Gedung Perkantoran Jakarta: Progress 85%\n- Renovasi Rumah Bandung: Selesai 100%\n\n📰 Tips Konstruksi:\n{{tips}}\n\nSalam hangat,\nTim Sanata Construction",
      category: "Newsletter",
    },
    {
      name: "Promo中秋特惠",
      type: "WHATSAPP",
      content: "🌙 中秋节快乐！{{name}}!\n\nPT Sanata Construction 推出特别优惠！\n\n🎁 Discount hingga 15% untuk proyek renovasi\n📅 Valid hingga 30 September 2026\n\nHubungi kami sekarang! 📞",
      category: "Promosi",
    },
    {
      name: "Instagram Post - Project Complete",
      type: "INSTAGRAM",
      content: "🏗️ Alhamdulillah! Proyek {{project_name}} telah selesai!\n\nTerima kasih {{client_name}} atas kepercayaan nya!\n\n#SanataConstruction #ProyekSelesai #KonstruksiIndonesia",
      category: "Post",
    },
  ];

  for (const template of templates) {
    const existing = await prisma.marketingTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      console.log(`  Skipping ${template.name} - already exists`);
      continue;
    }

    const created = await prisma.marketingTemplate.create({
      data: {
        name: template.name,
        type: template.type as any,
        subject: template.subject,
        content: template.content,
        variables: ["{{name}}", "{{project_name}}", "{{client_name}}", "{{bulan}}", "{{tips}}"],
        category: template.category,
        description: `Template ${template.category} untuk channel ${template.type}`,
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${created.name}`);
  }

  // Seed Marketing Campaigns
  console.log("");
  console.log("STEP 3: Creating Sample Campaigns...");
  const campaigns = [
    {
      name: "Promo中秋特惠",
      type: "WHATSAPP",
      status: "SENT",
      sentAt: new Date("2026-09-10"),
      statsSent: 1200,
      statsDelivered: 1185,
      statsClicked: 450,
      statsConverted: 25,
    },
    {
      name: "中秋節優惠",
      type: "EMAIL",
      status: "SENDING",
      scheduledAt: new Date("2026-09-15"),
      statsSent: 800,
      statsDelivered: 450,
    },
    {
      name: "中秋活動邀請",
      type: "INSTAGRAM",
      status: "SCHEDULED",
      scheduledAt: new Date("2026-09-20"),
      statsSent: 0,
    },
    {
      name: "Newsletter September 2026",
      type: "EMAIL",
      status: "DRAFT",
      statsSent: 0,
    },
    {
      name: "Promo Renovasi Ramadan",
      type: "WHATSAPP",
      status: "SENT",
      sentAt: new Date("2026-08-15"),
      statsSent: 2500,
      statsDelivered: 2450,
      statsClicked: 980,
      statsConverted: 45,
    },
  ];

  for (const campaign of campaigns) {
    const existing = await prisma.marketingCampaign.findFirst({
      where: { name: campaign.name },
    });

    if (existing) {
      console.log(`  Skipping ${campaign.name} - already exists`);
      continue;
    }

    const template = await prisma.marketingTemplate.findFirst({
      where: { type: campaign.type as any },
    });

    const created = await prisma.marketingCampaign.create({
      data: {
        name: campaign.name,
        type: campaign.type as any,
        status: campaign.status as any,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        statsSent: campaign.statsSent,
        statsDelivered: campaign.statsDelivered,
        statsClicked: campaign.statsClicked || 0,
        statsConverted: campaign.statsConverted || 0,
        templateId: template?.id,
        content: template?.content,
        targetAudience: { tags: ["Konstruksi"] },
      },
    });
    console.log(`  ✅ Created: ${created.name} (${created.status})`);
  }

  // Seed Broadcast Lists
  console.log("");
  console.log("STEP 4: Creating Broadcast Lists...");
  const broadcastLists = [
    { name: "VIP Clients", description: "Client prioritas tinggi" },
    { name: "Hot Leads", description: "Leads yang siap dit转化" },
    { name: "Newsletter Subscribers", description: "Pelanggan newsletter bulanan" },
    { name: "Konstruksi Indonesia", description: "Kontak industri konstruksi" },
  ];

  for (const list of broadcastLists) {
    const existing = await prisma.broadcastList.findFirst({
      where: { name: list.name },
    });

    if (existing) {
      console.log(`  Skipping ${list.name} - already exists`);
      continue;
    }

    const created = await prisma.broadcastList.create({
      data: {
        name: list.name,
        description: list.description,
        contactIds: createdContacts.slice(0, Math.floor(Math.random() * 5) + 2).map((c) => c.id),
        contactCount: Math.floor(Math.random() * 5) + 2,
      },
    });
    console.log(`  ✅ Created: ${created.name}`);
  }

  // Seed Offers
  console.log("");
  console.log("STEP 5: Creating Sample Offers...");
  const offers = [
    {
      title: "Diskon 15% Renovasi",
      description: "Dapatkan diskon 15% untuk proyek renovasi rumah dan gedung",
      discountType: "PERCENTAGE",
      discountValue: 15,
      offerCode: "RENOVASI15",
      validUntil: new Date("2026-12-31"),
      terms: "Minimal nilai proyek Rp 50.000.000\nBerlaku untuk semua jenis renovasi\nTidak dapat digabungkan dengan promo lain",
      status: "ACTIVE",
    },
    {
      title: "Cashback 5%",
      description: "Cashback 5% untuk pembayaran via transfer bank",
      discountType: "FIXED_AMOUNT",
      discountValue: 5,
      offerCode: "CASHBACK5",
      validUntil: new Date("2026-11-30"),
      terms: "Pembayaran via transfer bank\nMaksimal cashback Rp 5.000.000\n Berlaku sekali per client",
      status: "ACTIVE",
    },
    {
      title: "Free Konsultasi",
      description: "Konsultasi gratis untuk proyek di atas Rp 100.000.000",
      discountType: "FREE_SERVICE",
      discountValue: 0,
      offerCode: "FREEKONSULTASI",
      validUntil: new Date("2026-12-31"),
      terms: "Minimal nilai proyek Rp 100.000.000\nKonsultasi 1x 30 menit\nHarus appointment sebelumnya",
      status: "ACTIVE",
    },
    {
      title: "Paket Bundling",
      description: "Paket lengkap arsitektur + konstruksi dengan harga spesial",
      discountType: "BUNDLE",
      discountValue: 20,
      offerCode: "BUNDLING20",
      validUntil: new Date("2026-10-31"),
      terms: "Paket arsitektur + konstruksi\nMinimal luas 150m2\nTidak berlaku untuk proyek individu",
      status: "DRAFT",
    },
  ];

  for (const offer of offers) {
    const existing = await prisma.offer.findFirst({
      where: { offerCode: offer.offerCode! },
    });

    if (existing) {
      console.log(`  Skipping ${offer.title} - already exists`);
      continue;
    }

    const created = await prisma.offer.create({
      data: {
        title: offer.title,
        description: offer.description,
        discountType: offer.discountType as any,
        discountValue: offer.discountValue,
        offerCode: offer.offerCode,
        validFrom: new Date(),
        validUntil: offer.validUntil,
        terms: offer.terms,
        status: offer.status as any,
        usageCount: Math.floor(Math.random() * 30),
        targetAudience: { tags: ["Konstruksi"] },
      },
    });
    console.log(`  ✅ Created: ${created.title}`);
  }

  // Summary
  console.log("");
  console.log("======================================================================");
  console.log("MARKETING SEEDING COMPLETE");
  console.log("======================================================================");
  console.log("");
  console.log("📊 Summary:");
  console.log(`   - Contacts: ${createdContacts.length}`);
  console.log(`   - Templates: ${templates.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Broadcast Lists: ${broadcastLists.length}`);
  console.log(`   - Offers: ${offers.length}`);
  console.log("");
  console.log("======================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
