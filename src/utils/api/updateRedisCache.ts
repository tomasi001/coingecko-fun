import redisClient, { CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { TokenCacheData, TokenData } from "@/types";

// Helper Function: Update Redis Cache
export async function updateRedisCache(data: TokenCacheData): Promise<void> {
  const promises: Promise<TokenData | "OK" | null>[] = [];

  try {
    if (data.ethereum) {
      // Store the complete data object including ohlcData
      promises.push(
        redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, data.ethereum, {
          ex: CACHE_TTL.PRICE,
        })
      );
    }

    if (data.aver) {
      // Store the complete data object including ohlcData
      promises.push(
        redisClient.set(CACHE_KEYS.AVER_PRICE, data.aver, {
          ex: CACHE_TTL.PRICE,
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("Redis cache update failed", error);
    throw error;
  }
}
