import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { withCache, bumpCacheVersion } from "@/lib/cache";
import { COLLECTION_KEYS, SITE_SETTING_DEFAULTS, isCollectionKey } from "@/config/siteContent";
import type {
  CollectionItemInput,
  CollectionItemUpdateInput,
  SettingsUpdateInput,
} from "@/validators/siteContent.validator";

const CACHE_NS = "site-content";

/**
 * `meta` kosong disimpan sebagai SQL NULL, bukan JSON `null`.
 *
 * Di PostgreSQL keduanya nilai berbeda pada kolom JSONB, jadi pilihannya harus
 * eksplisit — sama seperti yang dilakukan service broadcast.
 */
function metaValue(meta: CollectionItemInput["meta"]) {
  return meta && Object.keys(meta).length > 0 ? (meta as Prisma.InputJsonValue) : Prisma.DbNull;
}

/**
 * Seluruh konten publik dalam satu payload, dikelompokkan per koleksi.
 * Satu request saja untuk semua halaman — jauh lebih murah daripada memanggil
 * endpoint terpisah per blok, dan hasilnya di-cache.
 */
export async function getPublicSiteContent() {
  return withCache(
    CACHE_NS,
    "public",
    async () => {
      const [items, settings] = await Promise.all([
        prisma.siteCollectionItem.findMany({
          where: { isActive: true },
          orderBy: [{ collection: "asc" }, { order: "asc" }],
        }),
        prisma.siteSetting.findMany(),
      ]);

      const collections: Record<string, typeof items> = {};
      for (const key of COLLECTION_KEYS) collections[key] = [];
      for (const item of items) {
        (collections[item.collection] ??= []).push(item);
      }

      const settingMap: Record<string, string> = {};
      for (const s of settings) settingMap[s.key] = s.value;

      return { collections, settings: settingMap };
    },
    300
  );
}

export async function listCollectionItems(collection: string) {
  if (!isCollectionKey(collection)) throw ApiError.badRequest(`Unknown collection "${collection}"`);
  return prisma.siteCollectionItem.findMany({ where: { collection }, orderBy: { order: "asc" } });
}

export async function createCollectionItem(input: CollectionItemInput) {
  // Item baru ditempatkan di urutan terakhir bila `order` tidak dikirim.
  const last = await prisma.siteCollectionItem.findFirst({
    where: { collection: input.collection },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.siteCollectionItem.create({
    data: {
      collection: input.collection,
      title: input.title ?? null,
      subtitle: input.subtitle ?? null,
      body: input.body ?? null,
      icon: input.icon ?? null,
      imageUrl: input.imageUrl ?? null,
      href: input.href ?? null,
      meta: metaValue(input.meta),
      order: input.order ?? (last ? last.order + 1 : 0),
      isActive: input.isActive ?? true,
    },
  });
  await bumpCacheVersion(CACHE_NS);
  return item;
}

export async function updateCollectionItem(id: string, input: CollectionItemUpdateInput) {
  const existing = await prisma.siteCollectionItem.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Content item not found");

  const item = await prisma.siteCollectionItem.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.href !== undefined ? { href: input.href } : {}),
      ...(input.meta !== undefined ? { meta: metaValue(input.meta) } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  await bumpCacheVersion(CACHE_NS);
  return item;
}

export async function deleteCollectionItem(id: string) {
  const existing = await prisma.siteCollectionItem.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Content item not found");
  await prisma.siteCollectionItem.delete({ where: { id } });
  await bumpCacheVersion(CACHE_NS);
}

/** Geser satu item ke atas/bawah dengan menukar `order` bersama tetangganya. */
export async function moveCollectionItem(id: string, direction: "up" | "down") {
  const item = await prisma.siteCollectionItem.findUnique({ where: { id } });
  if (!item) throw ApiError.notFound("Content item not found");

  const neighbour = await prisma.siteCollectionItem.findFirst({
    where: {
      collection: item.collection,
      order: direction === "up" ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return item; // sudah di ujung

  await prisma.$transaction([
    prisma.siteCollectionItem.update({ where: { id: item.id }, data: { order: neighbour.order } }),
    prisma.siteCollectionItem.update({ where: { id: neighbour.id }, data: { order: item.order } }),
  ]);
  await bumpCacheVersion(CACHE_NS);
  return prisma.siteCollectionItem.findUnique({ where: { id } });
}

export async function listSettings() {
  // Pastikan setting bawaan selalu ada, supaya admin tidak melihat form kosong.
  const existing = await prisma.siteSetting.findMany();
  const existingKeys = new Set(existing.map((s) => s.key));
  const missing = SITE_SETTING_DEFAULTS.filter((d) => !existingKeys.has(d.key));

  if (missing.length > 0) {
    await prisma.siteSetting.createMany({ data: missing });
    await bumpCacheVersion(CACHE_NS);
  }

  return prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { order: "asc" }] });
}

export async function updateSettings(input: SettingsUpdateInput) {
  const known = new Set(SITE_SETTING_DEFAULTS.map((d) => d.key));
  const unknown = input.settings.filter((s) => !known.has(s.key));
  if (unknown.length > 0) {
    throw ApiError.badRequest(`Unknown setting key(s): ${unknown.map((s) => s.key).join(", ")}`);
  }

  await prisma.$transaction(
    input.settings.map((s) => prisma.siteSetting.update({ where: { key: s.key }, data: { value: s.value } }))
  );
  await bumpCacheVersion(CACHE_NS);
  return listSettings();
}
