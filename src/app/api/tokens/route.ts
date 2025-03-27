import { TokenCacheData, TokenResponse } from "@/types";
import {
  fetchAndProcessCoinGeckoData,
  fetchAndProcessMongoDBData,
  fetchFromRedis,
  formatResponseData,
} from "@/utils";
import { NextResponse } from "next/server";

// Main API handler
export async function GET(): Promise<
  NextResponse<TokenResponse[] | { message: string }>
> {
  try {
    // Step 1: Attempt to fetch cached data from Redis
    const cachedData: TokenCacheData = await fetchFromRedis();

    // If Redis cache hit, use this data
    if (cachedData.ethereum && cachedData.aver) {
      return NextResponse.json(formatResponseData(cachedData));
    }

    // Redis cache miss - try CoinGecko with MongoDB fallback
    try {
      // Step 2: Fetch fresh data from CoinGecko
      const responseData = await fetchAndProcessCoinGeckoData();
      return NextResponse.json(responseData);
    } catch (coingeckoError) {
      // Step 3: Only fallback to MongoDB if CoinGecko fails
      console.error(
        "CoinGecko fetch failed, falling back to MongoDB",
        coingeckoError
      );

      try {
        const responseData = await fetchAndProcessMongoDBData();
        return NextResponse.json(responseData);
      } catch (mongoError) {
        // Both Redis, CoinGecko, and MongoDB failed - return error
        console.error("MongoDB fallback failed", mongoError);
        return NextResponse.json(
          { message: "Unable to retrieve token data from any source" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("API request failed", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
