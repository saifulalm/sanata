import { redis, isRedisAvailable } from "@/lib/redis";

const DEFAULT_TTL_SECONDS = 60;

async function getVersion(namespace: string): Promise<number> {
  const key = `cache:${namespace}:version`;
  const raw = await redis.get(key);
  if (raw) return Number(raw);
  await redis.setnx(key, "1");
  return 1;
}

export async function bumpCacheVersion(namespace: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await redis.incr(`cache:${namespace}:version`);
  } catch {
    // cache is best-effort; ignore failures
  }
}

export async function withCache<T>(namespace: string, key: string, fn: () => Promise<T>, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<T> {
  if (!isRedisAvailable()) return fn();

  try {
    const version = await getVersion(namespace);
    const cacheKey = `cache:${namespace}:v${version}:${key}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as T;

    const result = await fn();
    await redis.set(cacheKey, JSON.stringify(result), "EX", ttlSeconds);
    return result;
  } catch {
    return fn();
  }
}
