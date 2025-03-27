import { TokenResponse } from "@/types";
import {
  fetchFromMongoDB,
  formatResponseData,
  updateRedisWithMongoData,
} from "@/utils";

// Fetch and process data from MongoDB (fallback)
export async function fetchAndProcessMongoDBData(): Promise<TokenResponse[]> {
  const mongoData = await fetchFromMongoDB();

  if (!mongoData.ethereum || !mongoData.aver) {
    throw new Error("MongoDB data incomplete");
  }

  // Update Redis with MongoDB data
  await updateRedisWithMongoData(mongoData);

  return formatResponseData(mongoData);
}
