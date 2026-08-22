import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

export interface StoredFile {
  /** Kunci internal (nama berkas lokal atau object key di S3). */
  key: string;
  /** URL untuk dipakai klien: relatif pada disk lokal, absolut pada S3/R2. */
  url: string;
}

interface StorageDriver {
  put(buffer: Buffer, key: string, mimeType: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}

/** Nama berkas diacak agar tidak bisa ditebak dan tidak bentrok antar-unggahan. */
export function buildObjectKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${crypto.randomUUID()}${ext}`;
}

// --- Disk lokal (bawaan) -----------------------------------------------------

const localDir = path.resolve(process.cwd(), env.uploadDir);

/** Dipakai Express untuk menyajikan berkas saat driver lokal aktif. */
export const localUploadDir = localDir;

const localDriver: StorageDriver = {
  async put(buffer, key) {
    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(path.join(localDir, key), buffer);
    return { key, url: `/uploads/${key}` };
  },
  async remove(key) {
    // Cegah path traversal: hanya nama berkas polos yang boleh dihapus.
    const safe = path.basename(key);
    await fs.rm(path.join(localDir, safe), { force: true });
  },
};

// --- S3 / Cloudflare R2 ------------------------------------------------------

let s3Client: S3Client | null = null;

function getS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.storage.region,
      // R2 dan S3-compatible lain memerlukan endpoint eksplisit.
      ...(env.storage.endpoint ? { endpoint: env.storage.endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: env.storage.accessKeyId, secretAccessKey: env.storage.secretAccessKey },
    });
  }
  return s3Client;
}

const s3Driver: StorageDriver = {
  async put(buffer, key, mimeType) {
    const objectKey = env.storage.keyPrefix ? `${env.storage.keyPrefix}/${key}` : key;

    await getS3().send(
      new PutObjectCommand({
        Bucket: env.storage.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return { key: objectKey, url: `${env.storage.publicBaseUrl.replace(/\/$/, "")}/${objectKey}` };
  },
  async remove(key) {
    await getS3().send(new DeleteObjectCommand({ Bucket: env.storage.bucket, Key: key }));
  },
};

// --- Pemilihan driver --------------------------------------------------------

function isS3Configured(): boolean {
  const { bucket, accessKeyId, secretAccessKey, publicBaseUrl } = env.storage;
  return Boolean(bucket && accessKeyId && secretAccessKey && publicBaseUrl);
}

/**
 * Driver dipilih dari env. Disk lokal tetap default tanpa konfigurasi apa pun;
 * S3/R2 dipakai hanya bila kredensialnya lengkap — jadi salah konfigurasi
 * sebagian tidak diam-diam menulis ke tempat yang salah.
 */
export function getStorageDriver(): StorageDriver {
  if (env.storage.driver === "s3") {
    if (!isS3Configured()) {
      throw new Error(
        "STORAGE_DRIVER=s3 tetapi konfigurasi belum lengkap (butuh S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL)"
      );
    }
    return s3Driver;
  }
  return localDriver;
}

export function storageDriverName(): string {
  return env.storage.driver === "s3" ? "s3" : "local";
}

export async function putFile(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
  return getStorageDriver().put(buffer, buildObjectKey(originalName), mimeType);
}

/** Menghapus berkas fisik; kegagalan dicatat saja agar baris database tetap bisa dihapus. */
export async function removeFileQuietly(key: string): Promise<void> {
  try {
    await getStorageDriver().remove(key);
  } catch (err) {
    logger.warn("Failed to remove stored file", { key, err });
  }
}
