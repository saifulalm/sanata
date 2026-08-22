import type { MetadataRoute } from "next";
import { getIndexableProducts, getSeoConfig, getSitemapEntries } from "@/lib/seo";

/** Halaman statis beserta prioritas relatifnya. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/journal", priority: 0.8, changeFrequency: "weekly" },
  { path: "/clients", priority: 0.6, changeFrequency: "monthly" },
  { path: "/testimonials", priority: 0.6, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.6, changeFrequency: "monthly" },
  { path: "/career", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const config = await getSeoConfig();

  // Situs yang sengaja ditutup dari mesin pencari tidak perlu menerbitkan peta.
  if (!config.allowIndexing) return [];

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${config.siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Konten yang ditandai noIndex sudah disaring di backend.
  const [contents, products] = await Promise.all([getSitemapEntries(), getIndexableProducts()]);

  const contentEntries = contents.map((c) => ({
    url: `${config.siteUrl}/journal/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Layanan dan proyek memakai sumber data produk yang sama; keduanya punya
  // halaman detail sendiri sehingga wajib ada di sitemap.
  const productEntries = products.flatMap((product) => {
    const lastModified = new Date(product.updatedAt);
    return [
      {
        url: `${config.siteUrl}/services/${product.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${config.siteUrl}/projects/${product.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
    ];
  });

  return [...staticEntries, ...contentEntries, ...productEntries];
}
