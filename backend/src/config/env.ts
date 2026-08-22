import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 5000),
  clientUrl: required("CLIENT_URL", "http://localhost:5001"),
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7),
  },
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  // Penyimpanan berkas: "local" (bawaan) atau "s3" untuk S3/Cloudflare R2.
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3",
    bucket: process.env.S3_BUCKET ?? "",
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
    keyPrefix: process.env.S3_KEY_PREFIX ?? "",
  },
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  // Gateway WhatsApp berbasis Baileys. Diisi sekali di server supaya admin cukup
  // memberi nama perangkat lalu memindai QR — tanpa menyentuh JSON konfigurasi.
  baileys: {
    gatewayUrl: (process.env.BAILEYS_GATEWAY_URL ?? "").replace(/\/+$/, ""),
    apiKey: process.env.BAILEYS_API_KEY ?? "",
  },
  // Opsional: bila kosong, notifikasi email dilewati tanpa mengganggu API.
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "Sanata Construction <no-reply@sanata.id>",
    notifyTo: process.env.INQUIRY_NOTIFY_TO ?? "",
  },
};
