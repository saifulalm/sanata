import { FuturisticHomePage } from "@/components/home/FuturisticHomePage";
import { getFeaturedProjects, getLatestArticles } from "@/lib/api";
import {
  getSeoConfig,
  organizationJsonLd,
  localBusinessJsonLd,
  SITE_URL,
} from "@/lib/seo";
import { getSiteContent, setting } from "@/lib/siteContent";

export default async function HomePage() {
  const [projects, articles, content, seo] = await Promise.all([
    getFeaturedProjects().catch(() => []),
    getLatestArticles().catch(() => []),
    getSiteContent(),
    getSeoConfig(),
  ]);

  // Data organisasi untuk hasil kaya Google
  const jsonLd = organizationJsonLd(
    {
      phone: setting(content, "contact.phone"),
      email: setting(content, "contact.email"),
      address: setting(content, "contact.address"),
      whatsapp: setting(content, "contact.whatsapp"),
    },
    seo
  );

  // Local Business schema untuk SEO lokal
  const localBusinessJson = localBusinessJsonLd(seo, {
    phone: setting(content, "contact.phone") || undefined,
    email: setting(content, "contact.email") || undefined,
    address: setting(content, "contact.address") || undefined,
    whatsapp: setting(content, "contact.whatsapp") || undefined,
  });

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Local Business Schema untuk SEO Lokal */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJson) }}
      />
      <FuturisticHomePage projects={projects} articles={articles} content={content} />
    </>
  );
}
