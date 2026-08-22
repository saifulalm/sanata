import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { getAllAhsp } from "@/lib/adminResources";
import { RabEditor } from "../RabEditor";

export const metadata: Metadata = { title: "RAB Baru" };

export default async function NewRabPage() {
  await requireAdminRole("ADMIN", "EDITOR");
  const ahspOptions = await getAllAhsp();

  return <RabEditor rab={null} ahspOptions={ahspOptions} />;
}
