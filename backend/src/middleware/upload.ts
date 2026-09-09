import multer from "multer";
import { ApiError } from "@/utils/ApiError";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Excel MIME types
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream"
]);

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
      return cb(ApiError.badRequest("Format berkas harus JPEG, PNG, WEBP, GIF, atau Excel (.xlsx, .xls)"));
    }
    cb(null, true);
  },
});

/**
 * Multer configuration for Excel file uploads
 * Larger file size limit for Excel files (10 MB)
 */
export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls"];
    const allowedMimeTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream"
    ];

    const fileExt = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));

    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExt)) {
      return cb(ApiError.badRequest("Format berkas harus Excel (.xlsx atau .xls)"));
    }
    cb(null, true);
  },
});
