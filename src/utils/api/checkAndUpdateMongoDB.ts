import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { TokenCacheData } from "@/types";
import { updateMongoDBWithLock } from "@/utils";

// Constants
const REDIS_TIMESTAMP_KEY = CACHE_KEYS.LAST_MONGO_UPDATE;
const MONGO_UPDATE_INTERVAL_SECONDS = 60;

// Check if MongoDB update is needed and update if necessary
export async function checkAndUpdateMongoDB(
  newData: TokenCacheData
): Promise<void> {
  const currentTime = Date.now();
  let lastMongoUpdate = null;

  try {
    lastMongoUpdate = await redisClient.get(REDIS_TIMESTAMP_KEY);
  } catch (redisError) {
    console.error("Failed to get lastMongoUpdate from Redis", redisError);
  }

  let timeSinceLastUpdate = Infinity;
  if (lastMongoUpdate) {
    timeSinceLastUpdate = currentTime - parseInt(lastMongoUpdate as string);
  }

  // Update MongoDB if needed
  if (
    timeSinceLastUpdate >= MONGO_UPDATE_INTERVAL_SECONDS * 1000 ||
    !lastMongoUpdate
  ) {
    await updateMongoDBWithLock(newData, currentTime);
  }
}
