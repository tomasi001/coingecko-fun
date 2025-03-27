import { TokenResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

// This consolidated API handler now replaces the separate API calls
export const getTokensData = async (): Promise<TokenResponse[]> => {
  const response = await fetch("/api/tokens");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch token data");
  }

  const data = await response.json();
  return data;
};

export const useGetTokensData = () => {
  return useQuery<TokenResponse[], Error>({
    queryKey: ["getTokensData"],
    queryFn: () => getTokensData(),
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true, // Refresh even when tab is not focused
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};
