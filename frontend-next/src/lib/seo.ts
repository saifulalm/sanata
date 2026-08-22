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
