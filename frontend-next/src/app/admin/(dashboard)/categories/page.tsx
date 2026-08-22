import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { getAdminSession } from "@/lib/adminApi";
import { CategoriesTable } from "./CategoriesTable";

export const metadata: Metadata = { title: "Kategori" };

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  const categories = await getCategories();

  return <CategoriesTable categories={categories} canManage={session.role !== "USER"} isAdmin={session.role === "ADMIN"} />;
}
