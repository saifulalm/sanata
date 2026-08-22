import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/Surface";
import { collection, getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi Sanata Construction terkait pengumpulan dan penggunaan data pengguna.",
};

const defaultSections = [
  { title: "1. Data yang Kami Kumpulkan", body: "Kami mengumpulkan data yang Anda berikan secara langsung melalui formulir kontak/penawaran, meliputi nama, alamat email, nomor telepon, dan detail kebutuhan proyek." },
  { title: "2. Penggunaan Data", body: "Data yang Anda berikan digunakan semata untuk menindaklanjuti permintaan konsultasi atau penawaran, dan tidak dibagikan kepada pihak ketiga tanpa persetujuan Anda." },
  { title: "3. Penyimpanan Data", body: "Data disimpan pada sistem internal kami selama diperlukan untuk keperluan bisnis dan kepatuhan hukum yang berlaku." },
  { title: "4. Hak Anda", body: "Anda berhak meminta akses, koreksi, atau penghapusan data pribadi Anda dengan menghubungi kami melalui halaman kontak." },
  { title: "5. Perubahan Kebijakan", body: "Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan akan dipublikasikan pada halaman ini beserta tanggal pembaruan." },
];

export default async function PrivacyPage() {
  const content = await getSiteContent();
  const items = collection(content, "privacy_sections");
  const sections =
    items.length > 0 ? items.map((item) => ({ title: item.title ?? "", body: item.body ?? "" })) : defaultSections;

  return (
    <>
      <PageHero
        eyebrow={setting(content, "privacy.hero.eyebrow", "Legal")}
        title={setting(content, "privacy.hero.title", "Kebijakan Privasi")}
        description={setting(content, "privacy.hero.description", "Terakhir diperbarui: 1 Agustus 2026")}
      />
      <section className="py-20">
        <Container className="max-w-3xl space-y-6">
          {sections.map((s) => (
            <GlassPanel key={s.title} className="p-7">
              <h2 className="font-display text-xl font-semibold text-white">{s.title}</h2>
              <p className="mt-3 leading-8 text-slate-300">{s.body}</p>
            </GlassPanel>
          ))}
        </Container>
      </section>
    </>
  );
}
