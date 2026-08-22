import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Building2,
  Cable,
  Compass,
  Cpu,
  DraftingCompass,
  HardHat,
  LayoutGrid,
  Orbit,
} from "lucide-react";
import type { ContentItem, ProductItem } from "@/lib/api";
import { mediaSrc } from "@/lib/media";
import { collection, resolveIcon, setting, type SiteContent, type SiteContentItem } from "@/lib/siteContent";
import { HeroSceneCarousel, type HeroCarouselScene } from "@/components/home/HeroSceneCarousel";
import { EnhancedHeroCarousel } from "@/components/home/EnhancedHeroCarousel";
import { BuildingSceneCanvas } from "@/components/home/BuildingSceneCanvas";
import { isSceneVariant, sceneAccentClass, sceneVariantAt } from "@/components/home/SceneArtwork";
import { ExplodedFloorSection } from "@/components/home/ExplodedFloorSection";
import type { ExplodedFloor } from "@/components/home/ExplodedBuildingView";
import {
  StatsSection,
  TestimonialsSection,
  FAQSection,
  NewsletterSection,
  CTASection,
} from "@/components/home/EnhancedSections";

const defaultHeroScenes = [
  {
    title: "Modular Skyscraper",
    subtitle: "Perakitan berbantuan drone dengan panel fasad adaptif.",
    href: "/projects",
    accentClass: "from-cyan-400/45 via-sky-500/20 to-transparent",
  },
  {
    title: "Integrated Transit Hub",
    subtitle: "Sistem konstruksi tanpa jeda untuk infrastruktur mobilitas generasi baru.",
    href: "/services",
    accentClass: "from-blue-400/35 via-indigo-500/20 to-transparent",
  },
  {
    title: "Coastal Urban Grid",
    subtitle: "Rekayasa hunian pesisir yang siap menghadapi beban lingkungan ekstrem.",
    href: "/about",
    accentClass: "from-amber-300/25 via-cyan-500/15 to-transparent",
  },
] as const;

const fallbackProjects = [
  {
    id: "smart-campus",
    slug: "smart-campus-complex",
    name: "Smart Campus Complex",
    description: "Connected learning spaces with autonomous building control.",
    price: "5200000000",
    category: { id: "1", name: "Innovation", slug: "innovation" },
    images: [],
  },
  {
    id: "modular-tower",
    slug: "modular-residential-tower",
    name: "Modular Residential Tower",
    description: "Vertical housing with factory-built precision modules.",
    price: "7400000000",
    category: { id: "2", name: "Residential", slug: "residential" },
    images: [],
  },
  {
    id: "green-infra",
    slug: "green-infra-city",
    name: "Green Infra-City",
    description: "Low-carbon public infrastructure with integrated urban systems.",
    price: "9800000000",
    category: { id: "3", name: "Infrastructure", slug: "infrastructure" },
    images: [],
  },
] satisfies ProductItem[];

const fallbackArticles = [
  {
    id: "materials",
    title: "Sustainable Materials 2.0",
    slug: "sustainable-materials-2-0",
    excerpt: "Bagaimana komposit baru, panel pintar, dan material daur ulang mengubah standar bangunan masa depan.",
    body: "",
    type: "POST",
    status: "PUBLISHED",
    coverImage: null,
    views: 0,
    publishedAt: null,
    createdAt: "",
    category: { id: "1", name: "Innovation", slug: "innovation" },
  },
  {
    id: "ai-pm",
    title: "AI in Project Management",
    slug: "ai-in-project-management",
    excerpt: "Pemanfaatan AI untuk penjadwalan, estimasi biaya, dan mitigasi bottleneck di proyek konstruksi modern.",
    body: "",
    type: "POST",
    status: "PUBLISHED",
    coverImage: null,
    views: 0,
    publishedAt: null,
    createdAt: "",
    category: { id: "2", name: "Technology", slug: "technology" },
  },
] satisfies ContentItem[];

const defaultSanataServices = [
  {
    title: "Perencanaan & Survei",
    subtitle: "Survey & Design",
    body: "Survey lokasi, investigasi tanah, desain arsitektur (2D & 3D), dan analisis struktural.",
    icon: DraftingCompass,
  },
  {
    title: "Konstruksi Struktural",
    subtitle: "Structure & Foundation",
    body: "Pondasi, struktur sipil, dinding & roofing. Presisi, durabilitas, dan keselamatan adalah prioritas utama.",
    icon: Cable,
  },
  {
    title: "Supervisi & QC",
    subtitle: "Quality Control",
    body: "Pengawasan mutu, kontrol SOP, dan transparansi progres. Standar SNI / ASTM diterapkan di setiap tahap.",
    icon: HardHat,
  },
] as const;

const defaultRumamesraServices = [
  {
    title: "Desain Interior",
    subtitle: "Interior Design",
    body: "Desain & styling interior yang menggabungkan kenyamanan, fungsi, dan pengalaman emosional.",
    icon: Compass,
  },
  {
    title: "Material & Finishing",
    subtitle: "Finishing Work",
    body: "Pilihan material berkualitas dan finishing presisi untuk hunian dan ruang komersial yang nyaman.",
    icon: Building2,
  },
  {
    title: "Craftsmanship",
    subtitle: "Artisanal Work",
    body: "Karya interior dibuat oleh seniman terampil, dikerjalan dengan presisi dan profesionalisme.",
    icon: LayoutGrid,
  },
] as const;

export function FuturisticHomePage({
  projects,
  articles,
  content,
}: {
  projects: ProductItem[];
  articles: ContentItem[];
  content: SiteContent;
}) {
  const companyName = setting(content, "site.company_name", "Sanata Construction");
  const tagline = setting(content, "site.tagline", "Your Building Partner");
  const sinceYear = setting(content, "site.since_year", "2010");
  const showcaseProjects = (projects.length > 0 ? projects : fallbackProjects).slice(0, 3);
  const showcaseArticles = (articles.length > 0 ? articles : fallbackArticles).slice(0, 2);
  const heroScenes = normalizeHeroScenes(collection(content, "home_hero_scenes"));
  const heroCarouselLabel = setting(content, "home.hero.carousel_label", "Live 4D Carousel");
  // Nilai non-angka atau negatif diperlakukan sebagai "pakai bawaan"; 0 tetap
  // dihormati karena itu cara admin mematikan pergantian otomatis.
  const heroIntervalRaw = Number(setting(content, "home.hero.carousel_interval_ms", "4500"));
  const heroCarouselInterval = Number.isFinite(heroIntervalRaw) && heroIntervalRaw >= 0 ? heroIntervalRaw : 4500;

  const explodedFloors = normalizeFloors(collection(content, "building_floors"));
  const explodedEnabled = setting(content, "home.exploded.enabled", "true") !== "false";
  const explodedRaw = Number(setting(content, "home.exploded.explode", "40"));
  const explodedDefault = Number.isFinite(explodedRaw) ? Math.min(100, Math.max(0, explodedRaw)) : 40;
  const sanataServices = normalizeServices(collection(content, "sanata_services"), defaultSanataServices);
  const rumamesraServices = normalizeServices(
    collection(content, "rumamesra_services").length > 0
      ? collection(content, "rumamesra_services")
      : collection(content, "rumahesra_services"),
    defaultRumamesraServices
  );

  return (
    <div className="overflow-hidden bg-[#06111f] text-white">
      <section id="homepage" className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,201,240,0.22),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(205,127,50,0.18),_transparent_24%),linear-gradient(180deg,_#081120_0%,_#06111f_52%,_#04101b_100%)]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(116,184,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(116,184,255,0.18) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <div className="absolute left-1/2 top-36 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-16 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-xl">
              <Orbit size={14} className="text-cyan-300" />
              Futurisme Arsitektur Lanjutan
            </div>
            <h1 className="mt-6 max-w-4xl text-3xl font-semibold uppercase leading-none tracking-[0.08em] text-white xs:text-4xl sm:text-5xl lg:text-7xl">
              WELCOME TO THE
              <span className="mt-2 block bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                FUTURE OF CONSTRUCTION
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {companyName.toUpperCase()} menghadirkan pengalaman konstruksi generasi baru melalui sistem desain,
              rekayasa, dan eksekusi yang terasa seperti blueprint 4D interaktif.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#about-us"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-300/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_25px_rgba(56,189,248,0.2)] transition hover:-translate-y-0.5 hover:bg-cyan-300/20"
              >
                Learn More <ArrowRight size={16} />
              </Link>
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm uppercase tracking-[0.18em] text-slate-300 backdrop-blur-xl">
                {tagline}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Autonomous Build Ops", value: "24/7" },
                { label: "Digital Twin Ready", value: "4D" },
                { label: "Material Intelligence", value: "AI+" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
                >
                  <p className="text-2xl font-semibold tracking-[0.16em] text-white">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -inset-8 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
            <EnhancedHeroCarousel
              scenes={heroScenes}
              label={heroCarouselLabel}
              intervalMs={heroCarouselInterval}
            />
          </div>
        </div>
      </section>

      {explodedEnabled && explodedFloors.length > 0 && (
        <ExplodedFloorSection
          eyebrow={setting(content, "home.exploded.eyebrow", "Model 3D Interaktif")}
          title={setting(content, "home.exploded.title", "Exploded Floor View")}
          description={setting(
            content,
            "home.exploded.description",
            "Geser pemisah lantai untuk membedah bangunan lapis demi lapis, lalu pilih satu lantai untuk melihat rinciannya."
          )}
          floors={explodedFloors}
          defaultExplode={explodedDefault}
          defaultAutoRotate={setting(content, "home.exploded.autorotate", "true") !== "false"}
        />
      )}

      <section id="about-us" className="relative border-t border-white/10 bg-[linear-gradient(180deg,_rgba(6,17,31,0.96),_rgba(6,17,31,0.88))] py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">SANATA Your Building Partner</p>
            <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
              INNOVATING SINCE {sinceYear}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Blueprint tidak lagi statis. Kami mengubah ide menjadi ruang yang tumbuh, merespons data, dan tampil seperti
              prototipe masa depan yang siap dibangun.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Cpu, label: "Digital Twin", value: "Real-time coordination" },
                { icon: Orbit, label: "4D Sequencing", value: "Time-aware build simulation" },
                { icon: Blocks, label: "Material Logic", value: "Carbon-smart assembly" },
                { icon: BadgeCheck, label: "Precision Delivery", value: "Design to field continuity" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-4">
                  <item.icon size={18} className="text-cyan-300" />
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-cyan-300/15 bg-slate-950/70 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_32%)]" />
            <div className="relative">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>Interactive Blueprint</span>
                <span>WebGL Structural Model</span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">Framework Layer</p>
                    <p className="mt-2 text-sm text-slate-300">Carbon-fiber composite frame with responsive facade logic.</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">Smart Envelope</p>
                    <p className="mt-2 text-sm text-slate-300">Frosted glass panels and adaptive thermal skins.</p>
                  </div>
                </div>
                <div className="relative h-[22rem] overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/70">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.1),_transparent_55%)]" />
                  <BuildingSceneCanvas accent="#67e8f9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Dual Service Ecosystem</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                SANATA &amp; RUMAMESRA Services
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              Dua panel layanan kini tersinkron ke CMS terpisah agar tim bisa mengelola positioning brand dan layanan kedua
              entitas secara mandiri.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ServicePanel
              id="sanata-services"
              title="SANATA SERVICES"
              eyebrow="Blue Spectrum"
              items={sanataServices}
              accent="cyan"
              description="Platform engineering, konstruksi skala besar, dan lingkungan interior masa depan."
            />
            <ServicePanel
              id="rumamesra-services"
              title="RUMAMESRA SERVICES"
              eyebrow="Copper Spectrum"
              items={rumamesraServices}
              accent="amber"
              description="Hunian modern dengan keseimbangan struktur, kenyamanan ruang, dan efisiensi eksekusi."
            />
          </div>
        </div>
      </section>

      <section id="projects" className="border-y border-white/10 bg-slate-950/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">FEATURED PROJECTS</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                Interactive Portfolio Grid
              </h2>
            </div>
            <Link href="/projects" className="text-sm uppercase tracking-[0.2em] text-cyan-200 transition hover:text-white">
              Explore all projects
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {showcaseProjects.map((project, index) => (
              <article
                key={project.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                    <span>{project.category?.name ?? "Featured"}</span>
                    <span>0{index + 1}</span>
                  </div>
                  <div className="relative mt-6 h-52 rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
                    <div className="absolute inset-x-5 bottom-4 h-2 rounded-full bg-cyan-300/20 blur-md" />
                    <div className="absolute bottom-6 left-8 flex items-end gap-3">
                      {[72, 124, 96, 164].map((height, barIndex) => (
                        <div
                          key={height}
                          className="rounded-t-[1rem] border border-cyan-300/15 bg-gradient-to-b from-slate-200/10 via-cyan-200/10 to-cyan-300/25"
                          style={{ height: `${height}px`, width: `${40 - barIndex * 3}px` }}
                        />
                      ))}
                    </div>
                    <div className="absolute right-7 top-7 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                      3D Model
                    </div>
                    <div className="absolute inset-x-5 bottom-5 rounded-[1rem] border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-amber-100 opacity-0 transition group-hover:opacity-100">
                      Exploded floor-view preview
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{project.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{project.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                    <span className="text-slate-400">Start from</span>
                    <span className="font-semibold uppercase tracking-[0.16em] text-cyan-100">
                      Rp {Number(project.price).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">LATEST NEWS &amp; INSIGHTS</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                Research, Strategy, and Construction Intelligence
              </h2>
            </div>
            <Link href="/journal" className="text-sm uppercase tracking-[0.2em] text-cyan-200 transition hover:text-white">
              View all insights
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {showcaseArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/journal/${article.slug}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    index === 0 ? "from-cyan-400/14 via-transparent to-transparent" : "from-amber-300/10 via-transparent to-transparent"
                  }`}
                />
                <div className="relative">
                  <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                      <span>{article.category?.name ?? "Insight"}</span>
                      <span>Depth Card</span>
                    </div>
                    <div className="mt-5 flex items-end gap-3">
                      <div className="h-20 w-20 rounded-[1.4rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/30 to-transparent" />
                      <div className="h-28 flex-1 rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-white/8 to-transparent" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{article.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {article.excerpt ?? "Insight terbaru dari ekosistem inovasi konstruksi Sanata."}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-cyan-100">
                    Read insight <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Track Record */}
      <StatsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* CTA Section */}
      <CTASection />

      {/* End of page */}
      <div className="border-t border-white/10 bg-slate-950/60 py-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/**
 * Lantai model 3D dari CMS.
 *
 * Ukuran diambil dari `meta`, dengan nilai bawaan yang masuk akal bila admin
 * belum mengisinya — satu lantai tanpa ukuran tidak boleh membuat seluruh
 * model gagal digambar.
 */
function normalizeFloors(items: SiteContentItem[]): ExplodedFloor[] {
  const positive = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

  return items.map((item, index) => ({
    id: item.id,
    title: item.title ?? `Lantai ${index + 1}`,
    subtitle: item.subtitle,
    body: item.body,
    imageUrl: item.imageUrl?.trim() ? mediaSrc(item.imageUrl.trim()) : null,
    href: item.href,
    accent: item.meta?.accent ?? "cyan",
    heightM: positive(item.meta?.heightM, 3.5),
    widthM: positive(item.meta?.widthM, 24),
    depthM: positive(item.meta?.depthM, 16),
    // Minggu ke-0 sah, jadi hanya nilai negatif/kosong yang jatuh ke bawaan.
    startWeek:
      typeof item.meta?.startWeek === "number" && item.meta.startWeek >= 0
        ? item.meta.startWeek
        : index * 3,
    durationWeeks: positive(item.meta?.durationWeeks, 4),
  }));
}

function normalizeHeroScenes(items: SiteContentItem[]): HeroCarouselScene[] {
  if (items.length > 0) {
    return items.map((item, index) => {
      const fallback = defaultHeroScenes[index % defaultHeroScenes.length];
      return {
        title: item.title ?? fallback.title,
        subtitle: item.subtitle ?? item.body ?? fallback.subtitle,
        imageUrl: item.imageUrl?.trim() ? mediaSrc(item.imageUrl.trim()) : null,
        // Pilihan admin menang; urutan slide hanya jadi cadangan agar data
        // lama yang belum punya `meta` tetap tampil seperti sebelumnya.
        variant: isSceneVariant(item.meta?.variant) ? item.meta.variant : sceneVariantAt(index),
        href: item.href ?? fallback.href,
        accentClass: sceneAccentClass(item.meta?.accent, fallback.accentClass),
      };
    });
  }

  return defaultHeroScenes.map((scene, index) => ({
    title: scene.title,
    subtitle: scene.subtitle,
    imageUrl: null,
    variant: sceneVariantAt(index),
    href: scene.href,
    accentClass: scene.accentClass,
  }));
}

function normalizeServices(
  items: SiteContentItem[],
  fallback: readonly { title: string; subtitle: string; body: string; icon: LucideIcon }[]
) {
  if (items.length > 0) {
    return items.map((item, index) => ({
      title: item.title ?? fallback[index % fallback.length].title,
      subtitle: item.subtitle ?? fallback[index % fallback.length].subtitle,
      body: item.body ?? fallback[index % fallback.length].body,
      icon: resolveIcon(item.icon, fallback[index % fallback.length].icon),
      href: item.href,
    }));
  }

  return fallback.map((item) => ({ ...item, href: null }));
}

function ServicePanel({
  id,
  title,
  eyebrow,
  description,
  items,
  accent,
}: {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  items: { title: string; subtitle: string; body: string; icon: LucideIcon; href?: string | null }[];
  accent: "cyan" | "amber";
}) {
  const accentBorder = accent === "cyan" ? "border-cyan-300/20" : "border-amber-300/20";
  const accentText = accent === "cyan" ? "text-cyan-200" : "text-amber-100";
  const accentGlow = accent === "cyan" ? "bg-cyan-300/10" : "bg-amber-300/10";
  const accentSoft = accent === "cyan" ? "from-cyan-400/12" : "from-amber-300/12";

  return (
    <article
      id={id}
      className={`relative overflow-hidden rounded-[2rem] border ${accentBorder} bg-white/[0.04] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentSoft} via-transparent to-transparent`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-xs uppercase tracking-[0.24em] ${accentText}`}>{eyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{title}</h3>
          </div>
          <div className={`rounded-full border ${accentBorder} ${accentGlow} px-4 py-2 text-[11px] uppercase tracking-[0.22em] ${accentText}`}>
            3D Panel
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="grid gap-4 rounded-[1.6rem] border border-white/10 bg-slate-950/65 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${accentBorder} ${accentGlow}`}>
                <item.icon size={22} className={accentText} />
              </div>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.24em] ${accentText}`}>{item.subtitle}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                {item.href ? (
                  <Link href={item.href} className={`mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${accentText}`}>
                    Explore <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
              <div className="hidden h-20 w-24 rounded-[1.2rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent sm:block">
                <div
                  className="mx-auto mt-4 rounded-t-[0.8rem] border border-white/10 bg-white/10"
                  style={{ height: `${32 + index * 10}px`, width: `${28 + index * 8}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
