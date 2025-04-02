import { CoinGeckoMarketToken, CoinGeckoOHLCRaw, TokenData } from "@/types";
import axios, { AxiosError } from "axios";

if (!process.env.COINGECKO_API_KEY) {
  throw new Error("Please add your CoinGecko API key to .env.local");
}

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = "https://pro-api.coingecko.com/api/v3";

// Add sleep utility function
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const coingeckoClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-cg-pro-api-key": COINGECKO_API_KEY,
  },
});

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// Add retry logic to OHLC endpoint as well
export const getTokenOHLC = async (
  tokenId: string,
  days: number = 7,
  retryCount = 0
): Promise<CoinGeckoOHLCRaw> => {
  try {
    const response = await coingeckoClient.get<CoinGeckoOHLCRaw>(
      `/coins/${tokenId}/ohlc`,
      {
        params: {
          vs_currency: "usd",
          days: days.toString(),
          precision: "full",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        await sleep(delay);
        return getTokenOHLC(tokenId, days, retryCount + 1);
      }
    }
    throw error;
  }
};

export const getTokensMarketData = async (
  tokenIds: string[],
  retryCount = 0
): Promise<TokenData[]> => {
  try {
    const response = await coingeckoClient.get<CoinGeckoMarketToken[]>(
      "/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: tokenIds.join(","),
          price_change_percentage: "1h,24h,7d",
          sparkline: true,
          precision: "full",
        },
      }
    );

    // Transform the response to match the TokenData interface
    return response.data.map(
      (coin: CoinGeckoMarketToken): TokenData => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        current_price: coin.current_price,
        price_change_percentage_1h:
          coin.price_change_percentage_1h_in_currency ?? 0,
        price_change_percentage_24h: coin.price_change_percentage_24h ?? 0,
        price_change_percentage_7d:
          coin.price_change_percentage_7d_in_currency ?? 0,
        total_volume: coin.total_volume,
        market_cap: coin.market_cap,
        sparkline_data: coin.sparkline_in_7d?.price ?? [],
      })
    );
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        await sleep(delay);
        return getTokensMarketData(tokenIds, retryCount + 1);
      }
    }
    throw error;
  }
};

export default coingeckoClient;
