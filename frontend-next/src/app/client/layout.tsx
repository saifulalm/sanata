import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Klien - Sanata Construction",
  description: "Pantau progress proyek pembangunan Anda",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
