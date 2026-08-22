import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  reconnectOnError: () => false,
});

let available = false;
let warned = false;

export function isRedisAvailable() {
  return available;
}

redis
  .connect()
  .then(() => {
    available = true;
    logger.info("Redis cache connected");
  })
  .catch(() => {
    if (!warned) {
      logger.warn("Redis unavailable — running without cache (degraded but functional)");
      warned = true;
    }
  });

redis.on("error", () => {
  available = false;
});

redis.on("connect", () => {
  available = true;
});
