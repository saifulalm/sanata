import type { Metadata } from "next";
import { CheckCircle2, FileText, Handshake, Building, ClipboardCheck, Wrench, Phone } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/Surface";
import { collection, getSiteContent, setting } from "@/lib/siteContent";
import Link from "next/link";

// Process steps from PDF
const defaultProcessSteps = [
  {
    phase: "01",
    title: "Konsultasi Awal",
    subtitle: "Initial Consultation",
    description: "Kami mendengarkan kebutuhan Anda, memahami visi proyek, dan memberikan gambaran awal tentang solusi yang mungkin.",
    icon: Phone,
    duration: "1-2 hari",
  },
  {
    phase: "02",
    title: "Konsep & Anggaran",
    subtitle: "Concept & Budget",
    description: "Tim kami membuat konsep desain awal dan perhitungan anggaran detail untuk memastikan proyek sesuai dengan kemampuan finansial.",
    icon: FileText,
    duration: "3-7 hari",
  },
  {
    phase: "03",
    title: "Proposal & Kontrak",
    subtitle: "Proposal & Contract",
    description: "Penawaran resmi mencakup ruang lingkup kerja, timeline, spesifikasi material, dan ketentuan pembayaran yang transparan.",
    icon: Handshake,
    duration: "1-3 hari",
  },
  {
    phase: "04",
    title: "Perencanaan & Engineering",
    subtitle: "Detailed Planning",
    description: "Persiapan teknis meliputi survey lokasi, investigasi tanah, desain detail, dan penyusunan jadwal kerja.",
    icon: Building,
    duration: "1-2 minggu",
  },
  {
    phase: "05",
    title: "Eksekusi Konstruksi",
    subtitle: "Construction Execution",
    description: "Pembangunan dimulai dengan supervisi ketat, kontrol kualitas, dan pelaporan progres berkala kepada klien.",
    icon: Wrench,
    duration: "Berkisar",
  },
  {
    phase: "06",
    title: "Quality Assurance",
    subtitle: "Quality Assurance",
    description: "Inspeksi menyeluruh di setiap tahapan untuk memastikan hasil akhir sesuai standar SNI/ASTM dan ekspektasi klien.",
    icon: ClipboardCheck,
    duration: "Setiap tahap",
  },
  {
    phase: "07",
    title: "Serah Terima",
    subtitle: "Project Handover",
    description: "Proyek diselesaikan dengan dokumentasi lengkap, serah terima formal, dan panduan pemeliharaan.",
    icon: CheckCircle2,
    duration: "1-2 hari",
  },
  {
    phase: "08",
    title: "Dukungan Pasca Konstruksi",
    subtitle: "Post-Construction Support",
    description: "Layanan maintenance dan konsultasi teknis setelah proyek selesai untuk memastikan bangunan berfungsi optimal.",
    icon: Phone,
    duration: "Ongoing",
  },
];

// Value included items from PDF
const defaultValueIncluded = [
  {
    title: "Analisis Struktural",
    description: "Memastikan integritas bangunan dan mencegah kegagalan struktural.",
    category: "Commercial & Residential",
  },
  {
    title: "Penilaian Geoteknik",
    description: "Menentukan sistem fondasi yang paling cocok dan terpercaya.",
    category: "Commercial & Residential",
  },
  {
    title: "Koneksi Struktur Baja",
    description: "Presisi teknik untuk kekuatan dan performa jangka panjang.",
    category: "Commercial & Residential",
  },
  {
    title: "Desain Drainase Presisi",
    description: "Sistem yang dihitung dengan akurat untuk mencegah kebocoran air dan cipratan hujan.",
    category: "Commercial & Residential",
  },
  {
    title: "Desain Kompleks & Kesulitan Tinggi",
    description: "Menghadirkan proyek yang menantang secara teknis dan artistik.",
    category: "Commercial & Residential",
  },
  {
    title: "Kerajinan Interior Artisanal",
    description: "Karya interior dibuat oleh seniman terampil dengan presisi dan profesionalisme.",
    category: "Commercial & Residential",
  },
];

export const metadata: Metadata = {
  title: "Cara Kerja Kami",
  description: "Proses dan metodologi kerja SANATA GROUP dari konsultasi hingga serah terima proyek.",
};

export default async function ProcessPage() {
  const content = await getSiteContent();

  // Get process steps from CMS or use default
  const cmsProcessSteps = collection(content, "home_process");
  const processSteps = cmsProcessSteps.length > 0
    ? cmsProcessSteps.map((item, index) => ({
        phase: String(index + 1).padStart(2, "0"),
        title: item.title ?? defaultProcessSteps[index]?.title ?? "",
        subtitle: item.subtitle ?? "",
        description: item.body ?? defaultProcessSteps[index]?.description ?? "",
        icon: defaultProcessSteps[index]?.icon ?? CheckCircle2,
        duration: item.meta?.variant ?? "",
      }))
    : defaultProcessSteps;

  return (
    <>
      <PageHero
        eyebrow="Metodologi Kerja"
        title="Cara Kami Bekerja"
        description="Proses yang transparan dan terstruktur dari awal hingga akhir proyek."
      />

      <section className="py-24">
        <Container>
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Project Delivery Process</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Delapan Tahap Menuju Proyek Sukses
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Setiap proyek kami jalani dengan metodologi yang telah teruji, memastikan kualitas dan transparansi di setiap tahap.
            </p>
          </div>

          {/* Process Steps */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/20 hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={step.phase}
                    className={`relative lg:grid lg:grid-cols-2 lg:gap-12 ${
                      isEven ? '' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 top-8 hidden lg:block -translate-x-1/2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950">
                        <span className="text-xs font-bold text-cyan-300">{step.phase}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <GlassPanel
                      className={`p-6 lg:relative ${
                        isEven ? 'lg:text-right lg:pr-12' : 'lg:col-start-2 lg:text-left lg:pl-12'
                      }`}
                    >
                      <div className={`flex items-start gap-4 lg:block ${
                        isEven ? 'lg:flex-row-reverse' : ''
                      }`}>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                          <Icon size={24} className="text-cyan-300" />
                        </div>
                        <div className={isEven ? 'lg:text-right' : ''}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Tahap {step.phase}
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-white">
                            {step.title}
                          </h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {step.subtitle}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-slate-400">
                            {step.description}
                          </p>
                          {step.duration && (
                            <p className={`mt-3 text-xs text-slate-500 ${
                              isEven ? 'lg:text-right' : ''
                            }`}>
                              <span className="text-cyan-400">Durasi:</span> {step.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </GlassPanel>

                    {/* Empty space for odd items on desktop */}
                    <div className={`hidden lg:block ${isEven ? '' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Value Included Section */}
      <section className="border-y border-white/10 bg-slate-950/60 py-24">
        <Container>
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Nilai Tambah</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Yang Termasuk dalam Setiap Proyek
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Layanan komprehensif yang memastikan hasil akhir berkualitas tinggi dan tahan lama.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {defaultValueIncluded.map((item, index) => (
              <GlassPanel key={index} className="p-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300/60">
                  {item.category}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>
              </GlassPanel>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Mengapa Memilih Kami</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Pendekatan yang Membedakan Kami
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                    <CheckCircle2 size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Transparansi Penuh</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Quotation detail dengan breakdown lingkup kerja dan material yang jelas. Tidak ada proses tersembunyi.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                    <CheckCircle2 size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Pendidikan Klien</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Kami memandu klien langkah demi langkah agar memahami keputusan teknis dan alasan di baliknya.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                    <CheckCircle2 size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Kualitas Berbasis Engineering</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Implementasi SOP ketat berdasarkan standar SNI/ASTM dengan fokus pada durabilitas jangka panjang.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                    <CheckCircle2 size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Engagement Fleksibel</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Partial work (struktur saja, interior saja) hingga full project (0-100%). Kolaborasi adaptif sesuai kebutuhan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <GlassPanel className="p-8">
              <h3 className="text-xl font-semibold text-white">
                Siap Memulai Proyek Anda?
              </h3>
              <p className="mt-3 text-slate-400">
                Hubungi kami untuk konsultasi gratis dan diskusi tentang kebutuhan konstruksi Anda.
              </p>
              <div className="mt-6 space-y-4">
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-6 py-3.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
                >
                  Hubungi Kami Sekarang
                </Link>
                <Link
                  href="/projects"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Portofolio
                </Link>
              </div>
            </GlassPanel>
          </div>
        </Container>
      </section>
    </>
  );
}
