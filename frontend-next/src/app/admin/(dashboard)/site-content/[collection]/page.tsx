import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getSiteCollectionItems, getSiteCollections } from "@/lib/adminResources";
import { CollectionEditor } from "./CollectionEditor";

export const metadata: Metadata = { title: "Konten Situs" };

export default async function SiteCollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { collection } = await params;

  const collections = await getSiteCollections();
  const def = collections[collection];
  if (!def) notFound();

  let items: Awaited<ReturnType<typeof getSiteCollectionItems>>;
  try {
    items = await getSiteCollectionItems(collection);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 400) notFound();
    throw err;
  }

  return <CollectionEditor collection={collection} def={def} items={items} />;
}
