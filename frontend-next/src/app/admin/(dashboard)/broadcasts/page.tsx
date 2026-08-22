import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getBroadcastOverview } from "@/lib/adminResources";
import { BroadcastCenter } from "./BroadcastCenter";

export const metadata: Metadata = { title: "Broadcast Center" };

export default async function BroadcastsPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const overview = await getBroadcastOverview();

  return <BroadcastCenter overview={overview} />;
}
