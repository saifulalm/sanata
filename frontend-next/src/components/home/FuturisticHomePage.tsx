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
    accentClass: "from-desert-400/45 via-desert-500/20 to-transparent",
  },
  {
    title: "Integrated Transit Hub",
    subtitle: "Sistem konstruksi tanpa jeda untuk infrastruktur mobilitas generasi baru.",
    href: "/services",
    accentClass: "from-desert-300/35 via-desert-400/20 to-transparent",
  },
  {
    title: "Coastal Urban Grid",
    subtitle: "Rekayasa hunian pesisir yang siap menghadapi beban lingkungan ekstrem.",
    href: "/about",
    accentClass: "from-desert-200/25 via-desert-300/15 to-transparent",
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

  // Stats dari CMS atau fallback
  const cmsStats = normalizeStats(collection(content, "home_stats"));
  const cmsTestimonials = normalizeTestimonials(collection(content, "testimonials"));
  const cmsFAQs = normalizeFAQs(collection(content, "faq"));

  return (
    <div className="overflow-hidden bg-[#1A1F22] text-white">
      {/* SANATA Brand: Hero Section */}
      <section id="homepage" className="relative isolate min-h-screen overflow-hidden">
        {/* SANATA Brand: Desert Charcoal background with Desert radial */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,173,130,0.15),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(201,173,130,0.1),_transparent_24%),linear-gradient(180deg,_#1A1F22_0%,_#12181B_52%,_#1A1F22_100%)]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,173,130,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,130,0.12) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* SANATA Brand: Desert accent line */}
        <div className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-desert-400/60 to-transparent" />
        <div className="absolute left-1/2 top-36 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-desert-400/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-16 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="max-w-3xl">
            {/* SANATA Brand: Professional eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-desert-400/25 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-desert-200 shadow-[0_0_40px_rgba(201,173,130,0.1)] backdrop-blur-xl">
              <Orbit size={14} className="text-desert-400" />
              Your Building Partner
            </div>
            {/* SANATA Brand: Professional construction headline */}
            <h1 className="mt-6 max-w-4xl text-3xl font-semibold uppercase leading-none tracking-[0.08em] text-white xs:text-4xl sm:text-5xl lg:text-7xl">
              PROFESSIONAL
              <span className="mt-2 block bg-gradient-to-r from-white via-desert-200 to-desert-400 bg-clip-text text-transparent">
                CONSTRUCTION EXCELLENCE
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-charcoal-200 sm:text-lg">
              {companyName.toUpperCase()} menghadirkan pengalaman konstruksi profesional melalui sistem desain,
              rekayasa, dan eksekusi yang berpusat pada kebutuhan dan kebahagiaan klien.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* SANATA Brand: Desert CTA */}
              <Link
                href="#about-us"
                className="inline-flex items-center gap-2 rounded-full border border-desert-400/50 bg-desert-400/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-desert-200 shadow-[0_0_25px_rgba(201,173,130,0.15)] transition hover:-translate-y-0.5 hover:bg-desert-400/20"
              >
                Learn More <ArrowRight size={16} />
              </Link>
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm uppercase tracking-[0.18em] text-charcoal-200 backdrop-blur-xl">
                {tagline}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Years Experience", value: sinceYear + "+" },
                { label: "Projects Completed", value: "120+" },
                { label: "Happy Clients", value: "98%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
                >
                  {/* SANATA Brand: Desert value text */}
                  <p className="text-2xl font-semibold tracking-[0.16em] text-desert-400">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-charcoal-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            {/* SANATA Brand: Desert glow */}
            <div className="absolute -inset-8 rounded-[2rem] bg-desert-400/10 blur-3xl" />
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

      {/* SANATA Brand: About Section */}
      <section id="about-us" className="relative border-t border-white/10 bg-[linear-gradient(180deg,rgba(26,31,34,0.96),rgba(26,31,34,0.88))] py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
            {/* SANATA Brand: Professional about */}
            <p className="text-xs uppercase tracking-[0.28em] text-desert-400">SANATA Your Building Partner</p>
            <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
              INNOVATING SINCE {sinceYear}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal-200 sm:text-base">
              {/* SANATA Brand: Professional construction voice */}
              Kami membangun ruang yang tidak hanya kokoh secara struktural, tetapi juga bermakna bagi setiap penghuninya.
              Dengan pendekatan yang berpusat pada kebutuhan klien, kami menghadirkan hasil yang bertahan lama.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {/* SANATA Brand: Desert icon accents */}
              {[
                { icon: Cpu, label: "Technical Excellence", value: "Precision engineering" },
                { icon: Orbit, label: "Project Management", value: "Disciplined execution" },
                { icon: Blocks, label: "Design Coordination", value: "Integrated approach" },
                { icon: BadgeCheck, label: "Quality Assured", value: "SNI/ASTM standards" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-[#0C1012]/60 p-4">
                  <item.icon size={18} className="text-desert-400" />
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-charcoal-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SANATA Brand: Professional blueprint panel */}
          <div className="relative rounded-[2rem] border border-desert-400/15 bg-[#0C1012]/70 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            {/* SANATA Brand: Desert radial */}
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(201,173,130,0.12),_transparent_32%)]" />
            <div className="relative">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-charcoal-300">
                <span>Professional Approach</span>
                <span>Quality Framework</span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                    {/* SANATA Brand: Desert text */}
                    <p className="text-sm uppercase tracking-[0.18em] text-desert-200">Engineering Excellence</p>
                    <p className="mt-2 text-sm text-charcoal-300">Structural integrity with thoughtful design coordination.</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-desert-200">Human-Centered</p>
                    <p className="mt-2 text-sm text-charcoal-300">Spaces that serve their purpose beautifully.</p>
                  </div>
                </div>
                <div className="relative h-[22rem] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0C1012]/70">
                  {/* SANATA Brand: Desert accent */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(201,173,130,0.1),_transparent_55%)]" />
                  <BuildingSceneCanvas accent="#C9AD82" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SANATA Brand: Services Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* SANATA Brand: Desert accent */}
              <p className="text-xs uppercase tracking-[0.28em] text-desert-400">Dual Service Ecosystem</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                SANATA &amp; RUMAMESRA Services
              </h2>
            </div>
            {/* SANATA Brand: Professional description */}
            <p className="max-w-2xl text-sm leading-7 text-charcoal-200">
              Dua panel layanan yang dikelola secara profesional untuk memenuhi kebutuhan konstruksi dan interior Anda dengan standar tertinggi.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ServicePanel
              id="sanata-services"
              title="SANATA SERVICES"
              eyebrow="Engineering Excellence"
              items={sanataServices}
              accent="desert"
              description="Platform engineering, konstruksi skala besar, dan lingkungan interior profesional."
            />
            <ServicePanel
              id="rumamesra-services"
              title="RUMAMESRA SERVICES"
              eyebrow="Human-Centered Design"
              items={rumamesraServices}
              accent="desert"
              description="Hunian modern dengan keseimbangan struktur, kenyamanan ruang, dan finishing premium."
            />
          </div>
        </div>
      </section>

      {/* SANATA Brand: Projects Section */}
      <section id="projects" className="border-y border-white/10 bg-[#0C1012]/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* SANATA Brand: Desert accent */}
              <p className="text-xs uppercase tracking-[0.28em] text-desert-400">FEATURED PROJECTS</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                Professional Portfolio
              </h2>
            </div>
            {/* SANATA Brand: Desert link */}
            <Link href="/projects" className="text-sm uppercase tracking-[0.2em] text-desert-300 transition hover:text-desert-200">
              Explore all projects
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {showcaseProjects.map((project, index) => (
              <article
                key={project.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:-translate-y-1 hover:border-desert-400/35"
              >
                {/* SANATA Brand: Desert gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,173,130,0.12),_transparent_28%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-charcoal-300">
                    <span>{project.category?.name ?? "Featured"}</span>
                    <span>0{index + 1}</span>
                  </div>
                  {/* SANATA Brand: Project visualization */}
                  <div className="relative mt-6 h-52 rounded-[1.6rem] border border-white/10 bg-[#0C1012]/70 p-5 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
                    {/* SANATA Brand: Desert accent bars */}
                    <div className="absolute inset-x-5 bottom-4 h-2 rounded-full bg-desert-400/20 blur-md" />
                    <div className="absolute bottom-6 left-8 flex items-end gap-3">
                      {[72, 124, 96, 164].map((height, barIndex) => (
                        <div
                          key={height}
                          className="rounded-t-[1rem] border border-desert-400/15 bg-gradient-to-b from-charcoal-200/10 via-desert-200/10 to-desert-400/25"
                          style={{ height: `${height}px`, width: `${40 - barIndex * 3}px` }}
                        />
                      ))}
                    </div>
                    {/* SANATA Brand: Desert badge */}
                    <div className="absolute right-7 top-7 rounded-full border border-desert-400/20 bg-desert-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-desert-200">
                      Project
                    </div>
                    <div className="absolute inset-x-5 bottom-5 rounded-[1rem] border border-desert-400/15 bg-desert-400/5 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-desert-200 opacity-0 transition group-hover:opacity-100">
                      View project details
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{project.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-charcoal-200">{project.description}</p>
                  {/* SANATA Brand: Desert price text */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                    <span className="text-charcoal-300">Start from</span>
                    <span className="font-semibold uppercase tracking-[0.16em] text-desert-300">
                      Rp {Number(project.price).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SANATA Brand: Insights Section */}
      <section id="insights" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* SANATA Brand: Desert accent */}
              <p className="text-xs uppercase tracking-[0.28em] text-desert-400">LATEST NEWS &amp; INSIGHTS</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
                Knowledge &amp; Updates
              </h2>
            </div>
            {/* SANATA Brand: Desert link */}
            <Link href="/journal" className="text-sm uppercase tracking-[0.2em] text-desert-300 transition hover:text-desert-200">
              View all insights
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {showcaseArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/journal/${article.slug}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:-translate-y-1 hover:border-desert-400/35"
              >
                {/* SANATA Brand: Desert gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    index === 0 ? "from-desert-400/14 via-transparent to-transparent" : "from-desert-300/10 via-transparent to-transparent"
                  }`}
                />
                <div className="relative">
                  <div className="rounded-[1.6rem] border border-white/10 bg-[#0C1012]/70 p-5">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-charcoal-300">
                      <span>{article.category?.name ?? "Insight"}</span>
                      <span>Article</span>
                    </div>
                    <div className="mt-5 flex items-end gap-3">
                      {/* SANATA Brand: Desert accents */}
                      <div className="h-20 w-20 rounded-[1.4rem] border border-desert-400/20 bg-gradient-to-br from-desert-300/30 to-transparent" />
                      <div className="h-28 flex-1 rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-white/8 to-transparent" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{article.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-charcoal-200">
                    {article.excerpt ?? "Insight terbaru dari ekosistem profesional Sanata Construction."}
                  </p>
                  {/* SANATA Brand: Desert link */}
                  <span className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-desert-300">
                    Read insight <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Track Record dari CMS */}
      <StatsSection stats={cmsStats} />

      {/* Testimonials Section dari CMS */}
      <TestimonialsSection testimonials={cmsTestimonials} />

      {/* FAQ Section dari CMS */}
      <FAQSection faqs={cmsFAQs} />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* CTA Section */}
      <CTASection />

      {/* End of page - SANATA Brand */}
      <div className="border-t border-white/10 bg-[#0C1012]/60 py-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-charcoal-400">
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

// Default stats fallback
const defaultStats = [
  { value: 120, suffix: "+", label: "Proyek Selesai", icon: "Briefcase" as const },
  { value: 14, suffix: "+", label: "Tahun Pengalaman", icon: "Award" as const },
  { value: 80, suffix: "+", label: "Klien Puas", icon: "Users" as const },
  { value: 98, suffix: "%", label: "Tingkat Kepuasan", icon: "TrendingUp" as const },
];

function normalizeStats(items: SiteContentItem[]) {
  const icons: Record<string, typeof defaultStats[number]["icon"]> = {
    Briefcase: "Briefcase",
    Users: "Users",
    Award: "Award",
    TrendingUp: "TrendingUp",
  };

  if (items.length > 0) {
    return items.map((item, index) => {
      // Parse value from title (e.g., "120" -> 120, "150+" -> 150)
      const rawValue = parseInt(item.title?.replace(/\D/g, "") ?? "0", 10);
      const suffix = item.subtitle ?? defaultStats[index % defaultStats.length].suffix;
      return {
        value: rawValue || defaultStats[index % defaultStats.length].value,
        suffix,
        label: item.body ?? defaultStats[index % defaultStats.length].label,
        icon: (icons[item.icon ?? ""] ?? defaultStats[index % defaultStats.length].icon) as typeof defaultStats[number]["icon"],
      };
    });
  }
  return defaultStats;
}

// Default testimonials fallback
const defaultTestimonials = [
  {
    id: "1",
    name: "Ir. Ahmad Wijaya",
    role: "Direksi PT Nusantara Realty",
    content: "Sanata Construction menghadirkan solusi konstruksi yang inovatif dan efisien. Tim mereka sangat profesional dalam mengelola proyek kompleks kami.",
    rating: 5,
  },
  {
    id: "2",
    name: "Dr. Sarah Putri",
    role: "Rektor Universitas Teknologi Mandiri",
    content: "Implementasi sistem BIM dan pendekatan modular dari Sanata membuat proyek kampus kami selesai lebih cepat dari jadwal dengan kualitas premium.",
    rating: 5,
  },
  {
    id: "3",
    name: "Hendra Kusuma",
    role: "CEO PT Green Habitat Indonesia",
    content: "Komitmen Sanata terhadap keberlanjutan dan penggunaan material ramah lingkungan sejalan dengan visi perusahaan kami untuk hunian masa depan.",
    rating: 5,
  },
];

function normalizeTestimonials(items: SiteContentItem[]) {
  if (items.length > 0) {
    return items.map((item) => ({
      id: item.id,
      name: item.title ?? "Klien",
      role: item.subtitle ?? "",
      content: item.body ?? "",
      rating: 5,
    }));
  }
  return defaultTestimonials;
}

// Default FAQ fallback
const defaultFAQs = [
  {
    question: "Bagaimana proses perencanaan proyek di Sanata?",
    answer: "Kami memulai dengan analisis kebutuhan klien secara mendalam, kemudian membuat desain menggunakan teknologi BIM 4D yang memungkinkan visualisasi proyek secara real-time sebelum konstruksi dimulai.",
  },
  {
    question: "Berapa lama biasanya waktu pengerjaan proyek?",
    answer: "Waktu pengerjaan bervariasi tergantung skala dan kompleksitas proyek. Proyek residensial biasanya 6-12 bulan, sementara proyek komersial bisa 12-24 bulan atau lebih.",
  },
  {
    question: "Apakah Sanata memberikan garansi untuk proyek?",
    answer: "Ya, semua proyek kami dilengkapi dengan garansi struktural 10 tahun dan garansi finishing 2 tahun. Kami juga menyediakan layanan maintenance berkala.",
  },
  {
    question: "Bagaimana sistem pembayaran di Sanata?",
    answer: "Kami menerapkan sistem pembayaran berbasis milestone, di mana pembayaran dilakukan sesuai dengan tahapan penyelesaian proyek yang telah disepakati bersama.",
  },
];

function normalizeFAQs(items: SiteContentItem[]) {
  if (items.length > 0) {
    return items.map((item) => ({
      question: item.title ?? "",
      answer: item.body ?? "",
    }));
  }
  return defaultFAQs;
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
  accent: "desert";
}) {
  // SANATA Brand: Desert accent colors
  const accentBorder = "border-desert-400/20";
  const accentText = "text-desert-200";
  const accentGlow = "bg-desert-400/10";
  const accentSoft = "from-desert-400/12";

  return (
    <article
      id={id}
      className={`relative overflow-hidden rounded-[2rem] border ${accentBorder} bg-white/[0.04] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl`}
    >
      {/* SANATA Brand: Desert gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentSoft} via-transparent to-transparent`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* SANATA Brand: Desert eyebrow */}
            <p className={`text-xs uppercase tracking-[0.24em] ${accentText}`}>{eyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{title}</h3>
          </div>
          <div className={`rounded-full border ${accentBorder} ${accentGlow} px-4 py-2 text-[11px] uppercase tracking-[0.22em] ${accentText}`}>
            Services
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-charcoal-200">{description}</p>
        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="grid gap-4 rounded-[1.6rem] border border-white/10 bg-[#0C1012]/65 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              {/* SANATA Brand: Desert icon */}
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${accentBorder} ${accentGlow}`}>
                <item.icon size={22} className={accentText} />
              </div>
              <div>
                {/* SANATA Brand: Desert subtitle */}
                <p className={`text-[11px] uppercase tracking-[0.24em] ${accentText}`}>{item.subtitle}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-charcoal-300">{item.body}</p>
                {item.href ? (
                  <Link href={item.href} className={`mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${accentText}`}>
                    Explore <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
              {/* SANATA Brand: Desert accent decoration */}
              <div className="hidden h-20 w-24 rounded-[1.2rem] border border-white/10 bg-gradient-to-br from-desert-400/10 to-transparent sm:block">
                <div
                  className="mx-auto mt-4 rounded-t-[0.8rem] border border-desert-400/20 bg-desert-400/10"
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
