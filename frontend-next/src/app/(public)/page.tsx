import { FuturisticHomePage } from "@/components/home/FuturisticHomePage";
import { getFeaturedProjects, getLatestArticles } from "@/lib/api";
import { getSeoConfig, organizationJsonLd } from "@/lib/seo";
import { getSiteContent, setting } from "@/lib/siteContent";

export default async function HomePage() {
  const [projects, articles, content, seo] = await Promise.all([
    getFeaturedProjects().catch(() => []),
    getLatestArticles().catch(() => []),
    getSiteContent(),
    getSeoConfig(),
  ]);

  // Data organisasi untuk hasil kaya Google — nomor WhatsApp ikut disertakan
  // supaya pencari bisa langsung membuka percakapan.
  const jsonLd = organizationJsonLd(
    {
      phone: setting(content, "contact.phone"),
      email: setting(content, "contact.email"),
      address: setting(content, "contact.address"),
      whatsapp: setting(content, "contact.whatsapp"),
    },
    seo
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FuturisticHomePage projects={projects} articles={articles} content={content} />
    </>
  );
}
