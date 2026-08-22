import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ApiError } from "@/utils/ApiError";
import { logger } from "@/lib/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: `Duplicate value for field: ${err.meta?.target}` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.details });
  }

  // Batas ukuran/jumlah berkas dari multer adalah kesalahan klien, bukan server.
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran berkas melebihi batas 5 MB" : `Upload gagal: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  logger.error(err instanceof Error ? err.stack : String(err));
  return res.status(500).json({ success: false, message: "Internal server error" });
}
