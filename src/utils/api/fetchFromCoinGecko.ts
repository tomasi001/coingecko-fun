import { getTokenOHLC, getTokensMarketData } from "@/lib/coingecko";
import { OHLCData, TokenCacheData } from "@/types";

const TOKEN_IDS = ["ethereum", "aver-ai"] as const;

// Helper Function: Fetch from CoinGecko
export async function fetchFromCoinGecko(): Promise<TokenCacheData> {
  try {
    // Use our coingecko.ts utility to fetch data with proper error handling
    const priceData = await getTokensMarketData(
      TOKEN_IDS as unknown as string[]
    );

    // Fetch OHLC data for each token
    const ethereumOHLC = await getTokenOHLC("ethereum", 7);

    const averOHLC = await getTokenOHLC("aver-ai", 7);

    // Transform to our expected OHLCData format
    const transformedEthereumOHLC: OHLCData = ethereumOHLC.map(
      ([timestamp, open, high, low, close, volume]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      })
    );

    const transformedAverOHLC: OHLCData = averOHLC.map(
      ([timestamp, open, high, low, close, volume]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      })
    );

    // Combine price and OHLC data
    const result: TokenCacheData = {
      ethereum: null,
      aver: null,
    };

    const ethereumData = priceData.find((item) => item.id === "ethereum");
    if (ethereumData) {
      result.ethereum = {
        ...ethereumData,
        ohlcData: transformedEthereumOHLC,
      };
    }
    const averData = priceData.find((item) => item.id === "aver-ai");
    if (averData) {
      result.aver = {
        ...averData,
        ohlcData: transformedAverOHLC,
      };
    }

    return result;
  } catch (error) {
    console.error("CoinGecko fetch failed", error);
    throw error; // Re-throw to be handled by the main handler
  }
}
