import { TokenResponse } from "@/types";
import {
  checkAndUpdateMongoDB,
  fetchFromCoinGecko,
  formatResponseData,
  updateRedisCache,
} from "@/utils";

// Fetch and process data from CoinGecko
export async function fetchAndProcessCoinGeckoData(): Promise<TokenResponse[]> {
  const newData = await fetchFromCoinGecko();

  // Update Redis cache with fresh data
  await updateRedisCache(newData);

  // Check if MongoDB update is needed
  await checkAndUpdateMongoDB(newData);

  return formatResponseData(newData);
}
