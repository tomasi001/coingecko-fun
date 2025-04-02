import { UpdateResult } from "mongodb";
import clientPromise from "@/lib/mongodb";
import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { TokenCacheData } from "@/types";

// Constants
const REDIS_TIMESTAMP_KEY = CACHE_KEYS.LAST_MONGO_UPDATE;
const REDIS_LOCK_KEY = CACHE_KEYS.MONGO_LOCK;

// Helper Function: Update MongoDB with Lock
export async function updateMongoDBWithLock(
  data: TokenCacheData,
  currentTime: number
): Promise<void> {
  try {
    // First, check the current value of the timestamp key
    const lockAcquired = await redisClient.set(REDIS_LOCK_KEY, "locked", {
      nx: true,
      ex: 1,
    });

    if (lockAcquired) {
      try {
        const client = await clientPromise;
        const db = client.db("aver");
        const tokensCollection = db.collection("tokens");

        const promises: Promise<UpdateResult>[] = [];

        if (data.ethereum) {
          // Prepare a single document with both price and OHLC data
          const ethereumDocument = {
            token: "ethereum",
            timestamp: new Date(),
            ...data.ethereum,
          };

          // Update (or insert if not exists) the document in the collection
          promises.push(
            tokensCollection
              .updateOne(
                { token: "ethereum" },
                { $set: ethereumDocument },
                { upsert: true }
              )
              .then((result) => {
                return result;
              })
          );
        }

        if (data.aver) {
          // Prepare a single document with both price and OHLC data
          const averDocument = {
            token: "aver-ai",
            timestamp: new Date(),
            ...data.aver,
          };

          // Update (or insert if not exists) the document in the collection
          promises.push(
            tokensCollection
              .updateOne(
                { token: "aver-ai" },
                { $set: averDocument },
                { upsert: true }
              )
              .then((result) => {
                return result;
              })
          );
        }
        await Promise.all(promises);

        // *** CRITICAL FIX ***
        // Update the timestamp in Redis with extra debugging and verification

        try {
          // Explicitly use a direct Redis SET operation
          await redisClient.set(REDIS_TIMESTAMP_KEY, currentTime.toString());

          // Verify the timestamp was set correctly
        } catch (redisError) {
          console.error(
            `Failed to set Redis timestamp: ${REDIS_TIMESTAMP_KEY}`,
            redisError
          );
        }
      } finally {
        await redisClient.del(REDIS_LOCK_KEY);
      }
    }
  } catch (error) {
    console.error("MongoDB update failed", error);
    // Don't throw from here to allow the API to continue
  }
}
