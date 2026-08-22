import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { withCache, bumpCacheVersion } from "@/lib/cache";
import type { ProductInput, ProductUpdateInput } from "@/validators/product.validator";

type ListQuery = {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  categoryId?: string;
  isActive?: string;
};

export async function listProducts(query: ListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.ProductWhereInput = {
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
  };

  const cacheKey = JSON.stringify({ page, pageSize, ...query });

  return withCache("products", cacheKey, async () => {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { category: true, images: true },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, meta: buildMeta(page, pageSize, total) };
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true, images: true } });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true, images: true } });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let i = 1;
  while (await prisma.product.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createProduct(createdById: string, input: ProductInput) {
  const slug = await uniqueSlug(input.name);
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      sku: input.sku || null,
      stock: input.stock,
      isActive: input.isActive,
      categoryId: input.categoryId || null,
      createdById,
    },
  });
  await bumpCacheVersion("products");
  return product;
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const existing = await getProductById(id);
  const slug = input.name && input.name !== existing.name ? await uniqueSlug(input.name, id) : undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...input,
      sku: input.sku === "" ? null : input.sku,
      ...(slug ? { slug } : {}),
    },
  });
  await bumpCacheVersion("products");
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  await bumpCacheVersion("products");
}
