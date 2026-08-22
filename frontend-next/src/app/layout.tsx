import type { Metadata } from "next";
import { plusJakarta, inter, manrope } from "@/lib/fonts";
import { getSeoConfig } from "@/lib/seo";
import "./globals.css";

/**
 * Metadata dasar seluruh situs diambil dari menu SEO di panel admin, sehingga
 * judul, deskripsi, gambar sosial, dan kode verifikasi bisa diubah tanpa deploy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSeoConfig();
  const images = config.ogImage ? [{ url: config.ogImage }] : undefined;

  return {
    metadataBase: new URL(config.siteUrl),
    title: {
      default: config.defaultTitle,
      template: config.titleTemplate,
    },
    description: config.description,
    keywords: config.keywords,
    ...(config.allowIndexing ? {} : { robots: { index: false, follow: false } }),
    ...(config.googleVerification || config.bingVerification
      ? {
          verification: {
            ...(config.googleVerification ? { google: config.googleVerification } : {}),
            ...(config.bingVerification ? { other: { "msvalidate.01": config.bingVerification } } : {}),
          },
        }
      : {}),
    openGraph: {
      title: config.defaultTitle,
      description: config.description,
      siteName: config.companyName,
      url: config.siteUrl,
      locale: "id_ID",
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: config.defaultTitle,
      description: config.description,
      ...(images ? { images } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${inter.variable} ${manrope.variable}`}
    >
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
