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

    // Get the documents for each token
    const [ethereumDoc, averDoc] = await Promise.all([
      tokensCollection.findOne<
        { _id: any; token: string; timestamp: Date } & TokenData
      >({ token: "ethereum" }),
      tokensCollection.findOne<
        { _id: any; token: string; timestamp: Date } & TokenData
      >({ token: "aver-ai" }),
    ]);

    if (ethereumDoc) {
      // The document already contains both price and OHLC data
      // Remove MongoDB-specific fields
      const { _id, token, timestamp, ...ethereumData } = ethereumDoc;
      result.ethereum = ethereumData as TokenData;
    }

    if (averDoc) {
      // The document already contains both price and OHLC data
      // Remove MongoDB-specific fields
      const { _id, token, timestamp, ...averData } = averDoc;
      result.aver = averData as TokenData;
    }

    return result;
  } catch (error) {
    console.error("MongoDB fetch failed", error);
    return result;
  }
}
