import { EnhancedHeader } from "@/components/layout/EnhancedHeader";
import { EnhancedFooter } from "@/components/layout/EnhancedFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { isMaintenanceMode } from "@/lib/maintenance";
import { headers } from "next/headers";

/**
 * Layout untuk route public.
 *
 * CATATAN: Maintenance page (/under-construction) adalah full-page standalone design
 * yang TIDAK menggunakan header/footer ini. Kami deteksi via URL untuk skip
 * wrapper EnhancedHeader+EnhancedFooter+WhatsAppFloat agar tidak double render.
 *
 * Maintenance mode juga bisa diaktifkan via flag di lib/maintenance.ts.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-pathname") || headersList.get("x-matched-path") || "";
  const isMaintenance = isMaintenanceMode || pathname.includes("/under-construction");

  if (isMaintenance) {
    // Maintenance page: standalone full-page design, no header/footer
    return <>{children}</>;
  }

  return (
    <div className="public-layout min-h-screen flex flex-col">
      <EnhancedHeader />
      <main className="public-theme flex-1">{children}</main>
      <EnhancedFooter />
      <WhatsAppFloat />
    </div>
  );
}
