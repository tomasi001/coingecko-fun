import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { TokenCacheData, TokenData } from "@/types";

// Helper Function: Fetch from Redis
export async function fetchFromRedis(): Promise<TokenCacheData> {
  const result: TokenCacheData = {
    ethereum: null,
    aver: null,
  };

  try {
    // Get complete data objects (price + OHLC)
    const [ethereumData, averData] = await Promise.all([
      redisClient.get<TokenData>(CACHE_KEYS.ETHEREUM_PRICE),
      redisClient.get<TokenData>(CACHE_KEYS.AVER_PRICE),
    ]);

    if (ethereumData) {
      result.ethereum = ethereumData;
    }
    if (averData) {
      result.aver = averData;
    }

    return result;
  } catch (error) {
    console.error("Redis fetch failed", error);
    return result;
  }
}
