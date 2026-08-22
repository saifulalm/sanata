import multer from "multer";
import { ApiError } from "@/utils/ApiError";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Berkas ditahan di memori, bukan langsung ditulis ke disk, supaya driver
 * penyimpanan (disk lokal atau S3/R2) yang menentukan tujuannya. Batas 5 MB
 * membuat pemakaian memori tetap terkendali.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      // ApiError agar error handler membalas 400 dengan pesan yang jelas,
      // bukan 500 generik.
      return cb(ApiError.badRequest("Format berkas harus JPEG, PNG, WEBP, atau GIF"));
    }
    cb(null, true);
  },
});
