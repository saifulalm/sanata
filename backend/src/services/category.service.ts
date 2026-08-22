import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { withCache, bumpCacheVersion } from "@/lib/cache";
import type { CategoryInput } from "@/validators/category.validator";

export async function listCategories() {
  return withCache("categories", "list", () => prisma.category.findMany({ orderBy: { name: "asc" } }), 300);
}

export async function createCategory(input: CategoryInput) {
  const slug = slugify(input.name, { lower: true, strict: true });
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw ApiError.conflict("Category with a similar name already exists");
  const category = await prisma.category.create({ data: { name: input.name, slug } });
  await bumpCacheVersion("categories");
  return category;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const slug = slugify(input.name, { lower: true, strict: true });
  const category = await prisma.category.update({ where: { id }, data: { name: input.name, slug } });
  await bumpCacheVersion("categories");
  return category;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  await bumpCacheVersion("categories");
}
