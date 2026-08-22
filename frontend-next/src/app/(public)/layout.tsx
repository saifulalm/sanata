import { EnhancedHeader } from "@/components/layout/EnhancedHeader";
import { EnhancedFooter } from "@/components/layout/EnhancedFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EnhancedHeader />
      <main className="public-theme flex-1">{children}</main>
      <EnhancedFooter />
      <WhatsAppFloat />
    </>
  );
}
