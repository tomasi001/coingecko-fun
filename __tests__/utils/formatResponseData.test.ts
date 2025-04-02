import { formatResponseData } from "@/utils/api/formatResponseData";
import { TokenCacheData, TokenData } from "@/types";

describe("formatResponseData", () => {
  it("should format cached token data into response format", () => {
    // Arrange
    const mockDate = new Date().toISOString();
    const ethereumData: TokenData = {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      image: "https://example.com/eth.png",
      current_price: 3200.42,
      price_change_percentage_1h: 0.5,
      price_change_percentage_24h: 2.3,
      price_change_percentage_7d: -1.2,
      total_volume: 20000000000,
      market_cap: 380000000000,
      sparkline_data: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
    };

    const averData: TokenData = {
      id: "aver-ai",
      name: "Aver AI",
      symbol: "AVER",
      image: "https://example.com/aver.png",
      current_price: 0.0534,
      price_change_percentage_1h: 1.2,
      price_change_percentage_24h: 5.7,
      price_change_percentage_7d: 12.3,
      total_volume: 500000,
      market_cap: 20000000,
      sparkline_data: [0.049, 0.051, 0.052, 0.053, 0.0525, 0.0534],
    };

    const cachedData: TokenCacheData = {
      ethereum: ethereumData,
      aver: averData,
    };

    // Act
    const result = formatResponseData(cachedData);

    // Assert
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        tokenId: "ethereum",
        tokenData: ethereumData,
      },
      {
        tokenId: "aver-ai",
        tokenData: averData,
      },
    ]);
  });

  it("should handle missing data with null-assertion", () => {
    // Arrange - test with partial data
    const ethereumData: TokenData = {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      image: "https://example.com/eth.png",
      current_price: 3200.42,
      price_change_percentage_1h: 0.5,
      price_change_percentage_24h: 2.3,
      price_change_percentage_7d: -1.2,
      total_volume: 20000000000,
      market_cap: 380000000000,
      sparkline_data: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
    };

    const partialData: TokenCacheData = {
      ethereum: ethereumData,
      aver: null,
    };

    // Act - Should work with the null assertion operator
    const result = formatResponseData(partialData);

    // Assert - aver should be null but function uses ! operator
    expect(result).toHaveLength(2);
    expect(result[0].tokenId).toBe("ethereum");
    expect(result[0].tokenData).toEqual(ethereumData);
    expect(result[1].tokenId).toBe("aver-ai");
    expect(result[1].tokenData).toBe(null);
  });
});
