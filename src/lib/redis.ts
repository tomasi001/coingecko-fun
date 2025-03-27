import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error("Please add your Upstash Redis credentials to .env.local");
}

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache key constants
export const CACHE_KEYS = {
  ETHEREUM_PRICE: "ethereum:price",
  AVER_PRICE: "aver:price",
  LAST_MONGO_UPDATE: "lastMongoUpdate",
  MONGO_LOCK: "mongoUpdateLock",
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PRICE: 30, // 30 seconds
} as const;

export default redisClient;
