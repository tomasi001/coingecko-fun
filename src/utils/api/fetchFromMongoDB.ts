import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { TokenCacheData, TokenData } from "@/types";

// Helper Function: Fetch from MongoDB
export async function fetchFromMongoDB(): Promise<TokenCacheData> {
  const result: TokenCacheData = {
    ethereum: null,
    aver: null,
  };

  try {
    const client = await clientPromise;
    const db = client.db("aver");
    const tokensCollection = db.collection("tokens");

    // Define a type for the MongoDB document
    type TokenDocument = TokenData & {
      _id: ObjectId;
      token: string;
      timestamp: Date;
    };

    // Helper function to extract TokenData
    function extractTokenData(doc: TokenDocument | null): TokenData | null {
      if (!doc) return null;

      // Create a new object with only TokenData properties
      return {
        id: doc.id,
        name: doc.name,
        symbol: doc.symbol,
        image: doc.image,
        current_price: doc.current_price,
        price_change_percentage_1h: doc.price_change_percentage_1h,
        price_change_percentage_24h: doc.price_change_percentage_24h,
        price_change_percentage_7d: doc.price_change_percentage_7d,
        total_volume: doc.total_volume,
        market_cap: doc.market_cap,
        sparkline_data: doc.sparkline_data,
        ohlcData: doc.ohlcData,
      };
    }

    // Get the documents for each token
    const [ethereumDoc, averDoc] = await Promise.all([
      tokensCollection.findOne<TokenDocument>({ token: "ethereum" }),
      tokensCollection.findOne<TokenDocument>({ token: "aver-ai" }),
    ]);

    result.ethereum = extractTokenData(ethereumDoc);
    result.aver = extractTokenData(averDoc);

    return result;
  } catch (error) {
    console.error("MongoDB fetch failed", error);
    return result;
  }
}
