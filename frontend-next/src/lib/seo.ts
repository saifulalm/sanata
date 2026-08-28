import { getSiteContent, setting } from "@/lib/siteContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/**
 * Basis URL kanonik bawaan. Nilai dari CMS (`seo.site_url`) menimpanya lewat
 * `getSeoConfig()`; konstanta ini tetap ada sebagai cadangan untuk pemanggil
 * sinkron dan saat API konten tidak dapat dihubungi.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sanata.id").replace(/\/$/, "");

export interface SeoConfig {
  siteUrl: string;
  companyName: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  ogImage: string | null;
  allowIndexing: boolean;
  googleVerification: string | null;
  bingVerification: string | null;
  organizationType: string;
  areaServed: string;
}

function boolSetting(value: string, fallback: boolean) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  return !["false", "0", "no", "off"].includes(normalized);
}

/**
 * Setelan SEO global dari CMS. Semua kunci punya cadangan, sehingga situs tetap
 * punya metadata yang benar sebelum admin pernah membuka menu SEO.
 */
export async function getSeoConfig(): Promise<SeoConfig> {
  const content = await getSiteContent();
  const companyName = setting(content, "site.company_name", "Sanata Construction");
  const siteUrl = (setting(content, "seo.site_url", SITE_URL) || SITE_URL).replace(/\/$/, "");
  const ogImage = setting(content, "seo.default_og_image").trim();

  return {
    siteUrl,
    companyName,
    defaultTitle: setting(
      content,
      "seo.default_title",
      `${companyName} — Mitra Konstruksi Terpercaya`
    ),
    titleTemplate: setting(content, "seo.title_template", `%s | ${companyName}`),
    description: setting(
      content,
      "seo.default_description",
      "Sanata Construction adalah kontraktor konstruksi, renovasi, dan desain arsitektur kelas enterprise yang mengutamakan kualitas, keselamatan kerja, dan ketepatan waktu."
    ),
    keywords: setting(content, "seo.keywords", "konstruksi, kontraktor, renovasi, arsitektur")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    ogImage: ogImage ? (ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`) : null,
    allowIndexing: boolSetting(setting(content, "seo.allow_indexing", "true"), true),
    googleVerification: setting(content, "seo.google_site_verification").trim() || null,
    bingVerification: setting(content, "seo.bing_site_verification").trim() || null,
    organizationType: setting(content, "seo.organization_type", "GeneralContractor"),
    areaServed: setting(content, "seo.area_served", "Jabodetabek"),
  };
}

export interface SitemapEntry {
  slug: string;
  type: "PAGE" | "POST";
  updatedAt: string;
  publishedAt: string | null;
}

/**
 * Konten terindeks untuk sitemap. Kegagalan API tidak boleh membuat
 * `/sitemap.xml` balas 500 — lebih baik sitemap berisi halaman statis saja.
 */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_URL}/contents/sitemap-data`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as SitemapEntry[]) ?? [];
  } catch {
    return [];
  }
}

export interface SeoFields {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  excerpt?: string | null;
  ogImage?: string | null;
  coverImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
}

/**
 * Metadata Next dari field SEO konten, dengan urutan jatuh-balik yang sama
 * seperti yang dipakai mesin analisis di backend supaya pratinjau skor dan
 * keluaran nyata tidak pernah berbeda.
 */
export function buildContentMetadata(content: SeoFields, path: string) {
  const title = content.metaTitle?.trim() || content.title;
  const description = content.metaDescription?.trim() || content.excerpt?.trim() || undefined;
  const image = content.ogImage || content.coverImage || undefined;
  const url = content.canonicalUrl?.trim() || `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(content.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: "article" as const,
      ...(image ? { images: [{ url: image.startsWith("http") ? image : `${SITE_URL}${image}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

/** JSON-LD Article — membantu Google menampilkan hasil kaya. */
export function articleJsonLd(content: {
  title: string;
  metaDescription?: string | null;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  ogImage?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: { name: string } | null;
}) {
  const image = content.ogImage || content.coverImage;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: content.metaDescription || content.excerpt || undefined,
    ...(image ? { image: [image.startsWith("http") ? image : `${SITE_URL}${image}`] } : {}),
    datePublished: content.publishedAt ?? undefined,
    dateModified: content.updatedAt ?? content.publishedAt ?? undefined,
    author: { "@type": "Organization", name: content.author?.name ?? "Sanata Construction" },
    publisher: {
      "@type": "Organization",
      name: "Sanata Construction",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/journal/${content.slug}` },
  };
}

/** JSON-LD organisasi — dipasang sekali di beranda. */
export function organizationJsonLd(
  contact: { phone?: string; email?: string; address?: string; whatsapp?: string },
  config?: SeoConfig
) {
  const siteUrl = config?.siteUrl ?? SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": config?.organizationType || "GeneralContractor",
    name: config?.companyName ?? "Sanata Construction",
    url: siteUrl,
    ...(config?.description ? { description: config.description } : {}),
    ...(config?.ogImage ? { image: config.ogImage } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.address ? { address: { "@type": "PostalAddress", streetAddress: contact.address } } : {}),
    // Nomor WhatsApp diekspos sebagai kanal kontak khusus supaya hasil pencarian
    // bisa menawarkan aksi chat langsung.
    ...(contact.whatsapp
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: `+${contact.whatsapp.replace(/\D/g, "")}`,
              availableLanguage: ["id", "en"],
              url: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
            },
          ],
        }
      : {}),
    areaServed: config?.areaServed ?? "Jabodetabek",
  };
}

export interface IndexableProduct {
  slug: string;
  updatedAt: string;
}

/**
 * Slug layanan & proyek untuk sitemap. Keduanya memakai sumber data yang sama
 * (produk aktif) dan sebelumnya sama sekali tidak masuk sitemap.
 */
export async function getIndexableProducts(): Promise<IndexableProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products?isActive=true&pageSize=200&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.data as Array<{ slug?: string; updatedAt?: string }>) ?? [];
    return rows
      .filter((row): row is { slug: string; updatedAt?: string } => Boolean(row.slug))
      .map((row) => ({ slug: row.slug, updatedAt: row.updatedAt ?? new Date().toISOString() }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BREADCRUMBS JSON-LD
// Memudahkan Google memahami struktur hierarki halaman
// ─────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate BreadcrumbList schema untuk halaman detail
 * @example
 * breadcrumbsJsonLd([
 *   { name: "Beranda", url: "/" },
 *   { name: "Layanan", url: "/services" },
 *   { name: "Renovasi Rumah", url: "/services/renovasi-rumah" }
 * ])
 */
export function breadcrumbsJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate breadcrumb items untuk Journal article
 */
export function articleBreadcrumbs(categoryName?: string | null) {
  const items: BreadcrumbItem[] = [
    { name: "Beranda", url: "/" },
    { name: "Insight", url: "/journal" },
  ];
  if (categoryName) {
    items.push({ name: categoryName, url: `/journal?category=${categoryName.toLowerCase().replace(/\s+/g, '-')}` });
  }
  return items;
}

/**
 * Generate breadcrumb items untuk Services/Projects listing
 */
export function listingBreadcrumbs(type: "services" | "projects", categoryName?: string | null) {
  const typeName = type === "services" ? "Layanan" : "Proyek";
  const typeUrl = type === "services" ? "/services" : "/projects";

  const items: BreadcrumbItem[] = [
    { name: "Beranda", url: "/" },
    { name: typeName, url: typeUrl },
  ];
  if (categoryName) {
    items.push({ name: categoryName, url: `${typeUrl}?category=${categoryName.toLowerCase().replace(/\s+/g, '-')}` });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ SCHEMA
// Membantu Google menampilkan FAQ di hasil pencarian
// ─────────────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage schema untuk halaman FAQ
 */
export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE/PRODUCT OFFER SCHEMA
// Untuk rich results pada layanan dengan harga
// ─────────────────────────────────────────────────────────────────────────────

export interface OfferData {
  price: string | number;
  priceCurrency?: string;
  availability?: string;
}

/**
 * Generate Offer schema untuk layanan
 */
export function offerJsonLd(offer: OfferData) {
  return {
    "@type": "Offer",
    "priceCurrency": offer.priceCurrency ?? "IDR",
    "price": offer.price,
    "availability": offer.availability ?? "https://schema.org/InStock",
    "url": SITE_URL, // Will be overridden by caller
  };
}

/**
 * Generate Product/Service schema untuk layanan
 */
export function serviceJsonLd(service: {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  price?: string | number;
  category?: string | null;
}) {
  const url = `${SITE_URL}/services/${service.slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "url": url,
    ...(service.image ? { image: service.image.startsWith("http") ? service.image : `${SITE_URL}${service.image}` } : {}),
    ...(service.category ? { "serviceType": service.category } : {}),
  };

  // Add price specification if available
  if (service.price) {
    schema["hasOfferCatalog"] = {
      "@type": "OfferCatalog",
      "name": service.name,
      "hasOffer": {
        "@type": "Offer",
        "price": service.price,
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
        "url": url,
      },
    };
  }

  // Add provider
  schema["provider"] = {
    "@type": "Organization",
    "name": "Sanata Construction",
    "url": SITE_URL,
  };

  return schema;
}

/**
 * Generate Product schema untuk proyek (portofolio)
 */
export function projectJsonLd(project: {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  category?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": project.name,
    "description": project.description,
    "url": `${SITE_URL}/projects/${project.slug}`,
    ...(project.image ? { image: project.image.startsWith("http") ? project.image : `${SITE_URL}${project.image}` } : {}),
    "brand": {
      "@type": "Organization",
      "name": "Sanata Construction",
    },
    ...(project.category ? { "category": project.category } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT PAGE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
}

/**
 * Generate ContactPage schema
 */
export function contactJsonLd(contact?: ContactInfo) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Hubungi Sanata Construction",
    "description": "Hubungi kami untuk konsultasi dan permintaan penawaran proyek konstruksi.",
    "url": `${SITE_URL}/contact`,
  };

  if (contact) {
    const contactPoints = [];

    if (contact.phone) {
      contactPoints.push({
        "@type": "ContactPoint",
        "telephone": contact.phone,
        "contactType": "customer service",
        "availableLanguage": ["Indonesian", "English"],
      });
    }

    if (contact.whatsapp) {
      contactPoints.push({
        "@type": "ContactPoint",
        "telephone": `+${contact.whatsapp.replace(/\D/g, "")}`,
        "contactType": "customer service",
        "description": "WhatsApp",
        "url": `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
      });
    }

    if (contact.email) {
      contactPoints.push({
        "@type": "ContactPoint",
        "email": contact.email,
        "contactType": "customer service",
      });
    }

    if (contactPoints.length > 0) {
      schema["contactPoint"] = contactPoints;
    }
  }

  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL BUSINESS SCHEMA
// Untuk SEO lokal (perbaikan visibilitas地图)
// ─────────────────────────────────────────────────────────────────────────────

export function localBusinessJsonLd(config?: SeoConfig, contact?: ContactInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "name": config?.companyName ?? "Sanata Construction",
    "description": config?.description,
    "url": config?.siteUrl ?? SITE_URL,
    ...(config?.ogImage ? { image: config.ogImage } : {}),
    "priceRange": "$$",
    ...(contact?.address ? {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": contact.address,
        "addressLocality": "Jakarta",
        "addressRegion": "DKI Jakarta",
        "postalCode": "12345",
        "addressCountry": "ID"
      }
    } : {}),
    ...(contact?.phone ? { "telephone": contact.phone } : {}),
    ...(contact?.email ? { "email": contact.email } : {}),
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:00",
      "closes": "17:00"
    },
    "areaServed": config?.areaServed ?? "Jabodetabek",
    "hasMap": `${SITE_URL}/contact#map`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT PAGE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export function aboutJsonLd(leadership?: Array<{ name: string; role: string }>) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Tentang Sanata Construction",
    "description": "Profil, visi misi, dan tim Sanata Construction - kontraktor konstruksi terpercaya.",
    "url": `${SITE_URL}/about`,
  };

  if (leadership && leadership.length > 0) {
    schema["mainEntity"] = {
      "@type": "Organization",
      "name": "Sanata Construction",
      "employee": leadership.map((person) => ({
        "@type": "Person",
        "name": person.name,
        "jobTitle": person.role,
      })),
    };
  }

  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION PAGE SCHEMA (Services, Projects, Journal listing)
// ─────────────────────────────────────────────────────────────────────────────

export interface CollectionItem {
  name: string;
  slug: string;
}

export function collectionPageJsonLd(
  type: "services" | "projects" | "journal",
  items: CollectionItem[]
) {
  const typeMap = {
    services: { type: "Service", name: "Layanan Konstruksi" },
    projects: { type: "Product", name: "Proyek" },
    journal: { type: "Blog", name: "Insight & Artikel" },
  };

  const { type: itemType, name } = typeMap[type];

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": name,
    "description": `Kumpulan ${name.toLowerCase()} dari Sanata Construction`,
    "url": `${SITE_URL}/${type}`,
    "mainEntity": {
      "@type": `ItemList`,
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${SITE_URL}/${type}/${item.slug}`,
        "name": item.name,
      })),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED ARTICLE SCHEMA WITH BREADCRUMBS
// ─────────────────────────────────────────────────────────────────────────────

export function enhancedArticleJsonLd(article: {
  title: string;
  metaDescription?: string | null;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  ogImage?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: { name: string } | null;
  category?: { name: string } | null;
  body?: string;
}) {
  const image = article.ogImage || article.coverImage;
  const breadcrumbUrl = `${SITE_URL}/journal/${article.slug}`;

  // Estimate reading time from body
  let estimatedReadingTime = 5; // default minutes
  if (article.body) {
    const wordCount = article.body.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    estimatedReadingTime = Math.max(1, Math.round(wordCount / 200));
  }

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription || article.excerpt || undefined,
    ...(image ? {
      image: {
        "@type": "ImageObject",
        "url": image.startsWith("http") ? image : `${SITE_URL}${image}`,
        "width": 1200,
        "height": 630,
      }
    } : {}),
    "datePublished": article.publishedAt ?? undefined,
    "dateModified": article.updatedAt ?? article.publishedAt ?? undefined,
    "author": {
      "@type": "Organization",
      "name": article.author?.name ?? "Sanata Construction",
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sanata Construction",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon`,
        "width": 200,
        "height": 60,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": breadcrumbUrl,
    },
    "wordCount": article.body ? article.body.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length : undefined,
    "timeRequired": `PT${estimatedReadingTime}M`,
    ...(article.category ? {
      "articleSection": article.category.name,
      "keywords": article.category.name,
    } : {}),
  };
}
