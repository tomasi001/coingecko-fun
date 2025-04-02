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

  // Check if MongoDB update is needed - wrapped in try/catch to prevent errors from stopping execution
  try {
    await checkAndUpdateMongoDB(newData);
  } catch (error) {
    // MongoDB errors shouldn't stop the API from returning data
    console.error("MongoDB update failed", error);
  }

  return formatResponseData(newData);
}
