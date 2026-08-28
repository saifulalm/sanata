import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { ScraperPanel } from './ScraperPanel';

export const metadata: Metadata = { title: "Article Scraper" };

export default async function ScraperPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  return <ScraperPanel />;
}
