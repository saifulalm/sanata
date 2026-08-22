import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/Surface";
import { collection, getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan Sanata Construction.",
};

const defaultSections = [
  { title: "1. Penerimaan Ketentuan", body: "Dengan mengakses situs ini atau menggunakan layanan kami, Anda dianggap menyetujui syarat dan ketentuan yang berlaku." },
  { title: "2. Lingkup Layanan", body: "Estimasi harga yang ditampilkan di situs bersifat indikatif dan dapat berubah setelah survei lokasi dan penyusunan RAB final." },
  { title: "3. Kontrak Kerja", body: "Setiap proyek konstruksi akan diikat dengan perjanjian kerja tertulis yang mengatur lingkup pekerjaan, jadwal, dan pembayaran." },
  { title: "4. Batasan Tanggung Jawab", body: "Sanata Construction tidak bertanggung jawab atas keterlambatan yang disebabkan force majeure atau perubahan lingkup dari klien." },
  { title: "5. Hukum yang Berlaku", body: "Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia." },
];

export default async function TermsPage() {
  const content = await getSiteContent();
  const items = collection(content, "terms_sections");
  const sections =
    items.length > 0 ? items.map((item) => ({ title: item.title ?? "", body: item.body ?? "" })) : defaultSections;

  return (
    <>
      <PageHero
        eyebrow={setting(content, "terms.hero.eyebrow", "Legal")}
        title={setting(content, "terms.hero.title", "Syarat & Ketentuan")}
        description={setting(content, "terms.hero.description", "Terakhir diperbarui: 1 Agustus 2026")}
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
