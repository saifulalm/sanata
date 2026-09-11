import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/Surface";
import { getSiteContent, setting } from "@/lib/siteContent";
import { RotateCcw, Clock, CreditCard, FileCheck, AlertTriangle, Phone, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Pengembalian Dana",
  description: "Kebijakan pengembalian dana dan refund Sanata Construction untuk proyek yang dibatalkan.",
};

const defaultSections = [
  {
    title: "1. Umum",
    body: "Kebijakan pengembalian dana ini mengatur prosedur dan syarat-syarat pengembalian dana yang telah dibayarkan kepada Sanata Construction dalam konteks proyek konstruksi dan jasa terkait.",
    icon: FileCheck,
  },
  {
    title: "2. Down Payment (Uang Muka)",
    body: "Down payment (DP) yang telah dibayarkan akan dikembalikan dengan ketentuan: (a) Pengembalian 100% jika pembatalan dilakukan sebelum mobilisasi tim ke lokasi; (b) Pengembalian 70% jika pembatalan dilakukan setelah mobilisasi tetapi sebelum 25% progres tercapai; (c) Pengembalian tidak berlaku setelah progres melebihi 25%.",
    icon: CreditCard,
  },
  {
    title: "3. Durasi Proses Refund",
    body: "Proses pengembalian dana memerlukan waktu 14-30 hari kerja setelah pengajuan refund disetujui. Dana akan dikembalikan ke rekening sumber pembayaran atau rekening yang angegeben oleh klien.",
    icon: Clock,
  },
  {
    title: "4. Potongan Biaya",
    body: "Pada pengembalian dana, akan dikenakan potongan untuk biaya admin bank dan biaya lain yang telah dikeluarkan terkait proyek, termasuk namun tidak terbatas pada: biaya survei, biaya desain awal, dan biaya konsultasi yang telah dilakukan.",
    icon: AlertTriangle,
  },
  {
    title: "5. Proyek yang Sudah Berjalan",
    body: "Untuk proyek yang telah berjalan, pengembalian dana dihitung berdasarkan pekerjaan yang telah diselesaikan dikurangi dengan biaya material yang telah dibeli dan tidak dapat dikembalikan, serta biaya tenaga kerja sesuai progres.",
    icon: RotateCcw,
  },
  {
    title: "6. Pembatalan oleh Sanata",
    body: "Jika proyek dibatalkan oleh Sanata Construction karena alasan tertentu, maka akan dilakukan pengembalian dana penuh untuk pembayaran yang belum digunakan. Klien tidak akan dikenakan biaya apapun dalam kondisi ini.",
    icon: FileCheck,
  },
  {
    title: "7. Force Majeure",
    body: "Dalam kondisi force majeure (bencana alam, pandemi, kebijakan pemerintah, dll), pengembalian dana akan dihitung secara proporsional berdasarkan pekerjaan yang telah diselesaikan. Kedua belah pihak akan bernegosiasi untuk mencapai kesepakatan yang adil.",
    icon: AlertTriangle,
  },
  {
    title: "8. Cara Mengajukan Refund",
    body: "Pengajuan refund dapat dilakukan melalui: (1) Mengirimkan surat pengajuan refund tertulis ke kantor Sanata Construction; (2) Menghubungi tim customer service melalui telepon atau WhatsApp; (3) Mengisi formulir pengajuan refund yang tersedia di website.",
    icon: MessageCircle,
  },
];

export default async function RefundPolicyPage() {
  const content = await getSiteContent();
  const sections = defaultSections;

  return (
    <>
      <PageHero
        eyebrow={setting(content, "refund.hero.eyebrow", "Kebijakan")}
        title={setting(content, "refund.hero.title", "Kebijakan Pengembalian Dana")}
        description={setting(
          content,
          "refund.hero.description",
          "Informasi lengkap tentang prosedur dan syarat pengembalian dana di Sanata Construction."
        )}
      />

      <section className="py-20">
        <Container className="max-w-4xl space-y-8">
          {/* Info Banner */}
          <GlassPanel className="p-6 border-l-4 border-l-cyan-400">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/20">
                <MessageCircle className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Butuh Bantuan?</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Jika Anda memiliki pertanyaan tentang kebijakan pengembalian dana, silakan hubungi kami:
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href="tel:+6285788882662"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    <Phone className="h-4 w-4" />
                    +62 8578 888 2662
                  </a>
                  <a
                    href="mailto:Rumamesra@santarasbc.com"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                  >
                    <Mail className="h-4 w-4" />
                    Rumamesra@santarasbc.com
                  </a>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Sections */}
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <GlassPanel key={section.title} className="p-7">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    index % 2 === 0
                      ? "bg-gradient-to-br from-cyan-400/20 to-blue-500/20"
                      : "bg-gradient-to-br from-purple-400/20 to-pink-500/20"
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      index % 2 === 0 ? "text-cyan-300" : "text-pink-300"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-semibold text-white">{section.title}</h2>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-slate-300 whitespace-pre-line">
                      {section.body.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            );
          })}

          {/* Bottom Note */}
          <GlassPanel className="p-6 text-center border border-amber-400/20 bg-amber-400/5">
            <p className="text-sm text-slate-400">
              <strong className="text-amber-300">Catatan:</strong> Kebijakan ini dapat berubah sewaktu-waktu dengan pemberitahuan terlebih dahulu.
              Versi terbaru selalu tersedia di website ini. Terakhir diperbarui: September 2026.
            </p>
          </GlassPanel>
        </Container>
      </section>
    </>
  );
}
