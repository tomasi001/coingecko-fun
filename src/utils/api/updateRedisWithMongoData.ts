import redisClient, { CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { TokenCacheData } from "@/types";

// Update Redis with MongoDB data
export async function updateRedisWithMongoData(
  mongoData: TokenCacheData
): Promise<void> {
  if (mongoData.ethereum) {
    await redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, mongoData.ethereum, {
      ex: CACHE_TTL.PRICE,
    });
  }

  if (mongoData.aver) {
    await redisClient.set(CACHE_KEYS.AVER_PRICE, mongoData.aver, {
      ex: CACHE_TTL.PRICE,
    });
  }
}
