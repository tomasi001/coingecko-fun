import { TokenCacheData, TokenResponse } from "@/types";

// Convert cache data to response format
export function formatResponseData(
  cachedData: TokenCacheData
): TokenResponse[] {
  return [
    { tokenId: "ethereum", tokenData: cachedData.ethereum! },
    { tokenId: "aver-ai", tokenData: cachedData.aver! },
  ];
}
