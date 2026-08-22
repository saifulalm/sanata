import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/seo";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getSeoConfig();

  // Saklar dari panel admin: dipakai saat staging atau situs belum siap rilis.
  if (!config.allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: config.siteUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Panel admin dan berkas unggahan mentah tidak perlu diindeks.
        disallow: ["/admin", "/admin/", "/uploads/"],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}
