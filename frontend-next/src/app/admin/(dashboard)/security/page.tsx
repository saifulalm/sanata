import type { Metadata } from "next";
import { adminFetch, getAdminSession } from "@/lib/adminApi";
import { SecurityPanel } from "./SecurityPanel";

export const metadata: Metadata = { title: "Keamanan" };

interface MeResponse {
  data: { twoFactorEnabled: boolean };
}

export default async function AdminSecurityPage() {
  await getAdminSession();
  const me = await adminFetch<MeResponse>("/auth/me");

  return <SecurityPanel twoFactorEnabled={me.data.twoFactorEnabled} />;
}
