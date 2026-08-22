import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getWorkforceRoles, getSignatories } from "@/lib/adminResources";
import { RolesDashboard } from "./RolesDashboard";

export const metadata: Metadata = { title: "Jabatan & Penanda Tangan" };

export default async function RolesPage() {
  await requireAdminRole("ADMIN");

  const [roles, { data: signatories, meta: signatoriesMeta }] =
    await Promise.all([
      getWorkforceRoles(),
      getSignatories({}),
    ]);

  return (
    <RolesDashboard
      initialRoles={roles}
      signatories={signatories}
      signatoriesMeta={signatoriesMeta}
    />
  );
}
