import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { prisma } from "@/lib/prisma";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { putFile, removeFileQuietly } from "@/lib/storage";

/**
 * Pustaka media: berkas yang sudah diunggah bisa dicari dan dipakai ulang,
 * bukan hanya diunggah sekali lalu hilang dari jangkauan admin.
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const search = (req.query.search as string | undefined)?.trim();
  const type = req.query.type as string | undefined;

  const where: Prisma.MediaWhereInput = {
    ...(search ? { filename: { contains: search, mode: "insensitive" } } : {}),
    ...(type === "image" ? { mimeType: { startsWith: "image/" } } : {}),
    ...(type === "file" ? { NOT: { mimeType: { startsWith: "image/" } } } : {}),
  };

  const [items, total, aggregate] = await Promise.all([
    prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.media.count({ where }),
    prisma.media.aggregate({ _sum: { size: true }, _count: { _all: true } }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      ...buildMeta(page, pageSize, total),
      totalFiles: aggregate._count._all,
      totalSize: aggregate._sum.size ?? 0,
    },
  });
});

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const stored = await putFile(req.file.buffer, req.file.originalname, req.file.mimetype);

  const media = await prisma.media.create({
    data: {
      url: stored.url,
      storageKey: stored.key,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      productId: req.body.productId || null,
    },
  });

  res.status(201).json({ success: true, data: media });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw ApiError.notFound("Media not found");

  await prisma.media.delete({ where: { id: req.params.id } });

  // Berkas fisik dihapus setelah barisnya hilang; kegagalannya tidak
  // membatalkan penghapusan (ditangani di dalam removeFileQuietly).
  if (media.storageKey) await removeFileQuietly(media.storageKey);

  res.json({ success: true, data: null });
});
