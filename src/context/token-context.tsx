"use client";

import { OHLCData, TokenData } from "@/types";
import { useGetTokensData } from "@/utils/api/queries";
import { createContext, useContext, useMemo, useState } from "react";

interface TokenContextType {
  tokens: TokenData[];
  ethereumOHLC: OHLCData | undefined;
  averOHLC: OHLCData | undefined;
  isLoading: boolean;
  isOHLCLoading: boolean;
  error: Error | null;
  ohlcError: Error | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (perPage: number) => void;
  paginatedTokens: TokenData[];
}

interface TokenProviderProps {
  children: React.ReactNode;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider = ({ children }: TokenProviderProps) => {
  // Consolidated fetch for both market data and OHLC data
  const { data: tokenData, isLoading, error } = useGetTokensData();

  // Extract market data and OHLC data from the consolidated response
  const marketData = useMemo((): TokenData[] => {
    if (!tokenData) return [];
    return tokenData.map((item) => item.tokenData);
  }, [tokenData]);

  const ethereumOHLC = useMemo((): OHLCData | undefined => {
    if (!tokenData) return undefined;
    const ethereum = tokenData.find((item) => item.tokenId === "ethereum");
    return ethereum?.tokenData?.ohlcData;
  }, [tokenData]);

  const averOHLC = useMemo((): OHLCData | undefined => {
    if (!tokenData) return undefined;
    const aver = tokenData.find((item) => item.tokenId === "aver-ai");
    return aver?.tokenData?.ohlcData;
  }, [tokenData]);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Calculate paginated data
  const paginatedTokens = useMemo((): TokenData[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return (marketData ?? []).slice(startIndex, endIndex);
  }, [marketData, currentPage, itemsPerPage]);

  const contextValue = useMemo(
    (): TokenContextType => ({
      tokens: marketData ?? [],
      ethereumOHLC,
      averOHLC,
      isLoading,
      isOHLCLoading: isLoading, // Since we now fetch everything in one go
      error,
      ohlcError: error, // Same error handling for everything
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
      paginatedTokens,
    }),
    [
      marketData,
      ethereumOHLC,
      averOHLC,
      isLoading,
      error,
      currentPage,
      itemsPerPage,
      paginatedTokens,
    ]
  );

  return (
    <TokenContext.Provider value={contextValue}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
};
