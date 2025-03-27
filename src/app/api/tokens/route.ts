import { getTokenOHLC, getTokensMarketData } from "@/lib/coingecko";
import clientPromise from "@/lib/mongodb";
import redisClient, { CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { OHLCData, TokenCacheData, TokenData, TokenResponse } from "@/types";
import { NextResponse } from "next/server";

// Constants
const REDIS_TIMESTAMP_KEY = CACHE_KEYS.LAST_MONGO_UPDATE;
const REDIS_LOCK_KEY = CACHE_KEYS.MONGO_LOCK;
const MONGO_UPDATE_INTERVAL_SECONDS = 60;
const TOKEN_IDS = ["ethereum", "aver-ai"] as const;
// Logging utilities
const logColor = {
  info: "\x1b[36m%s\x1b[0m", // Cyan
  success: "\x1b[32m%s\x1b[0m", // Green
  warning: "\x1b[33m%s\x1b[0m", // Yellow
  error: "\x1b[31m%s\x1b[0m", // Red
  debug: "\x1b[35m%s\x1b[0m", // Magenta
};

const logger = {
  info: (message: string, data?: any) => {
    console.log(logColor.info, `ℹ️ INFO: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  success: (message: string, data?: any) => {
    console.log(logColor.success, `✅ SUCCESS: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  warning: (message: string, data?: any) => {
    console.log(logColor.warning, `⚠️ WARNING: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  error: (message: string, error?: any) => {
    console.log(logColor.error, `❌ ERROR: ${message}`);
    if (error) console.error(error);
  },
  debug: (message: string, data?: any) => {
    console.log(logColor.debug, `🔍 DEBUG: ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
};

// Main API handler - modified to prioritize fresh data from CoinGecko
export async function GET(): Promise<
  NextResponse<TokenResponse[] | { message: string }>
> {
  try {
    const startTime = Date.now();
    logger.info(`API Request started at ${new Date().toISOString()}`);
    let responseData: TokenResponse[] | null = null;
    let dataSource = "unknown";

    // First, verify Redis connection
    try {
      logger.debug("Testing Redis connection");
      const testKey = "redis-test-key";
      const testValue = "test-value-" + Date.now();

      await redisClient.set(testKey, testValue, { ex: 10 });
      const retrievedValue = await redisClient.get(testKey);

      if (retrievedValue === testValue) {
        logger.debug("Redis connection is working properly");
      } else {
        logger.warning(
          `Redis test failed: expected ${testValue}, got ${retrievedValue}`
        );
      }
    } catch (redisError) {
      logger.error("Redis connection test failed", redisError);
    }

    // Step 1: Attempt to fetch cached data from Redis
    logger.info("Step 1: Attempting to fetch data from Redis cache");
    const cachedData: TokenCacheData = await fetchFromRedis();

    if (cachedData.ethereum && cachedData.aver) {
      // Redis cache hit - use this data for response
      logger.success("Redis cache hit! Using cached data");
      responseData = [
        { tokenId: "ethereum", tokenData: cachedData.ethereum },
        { tokenId: "aver-ai", tokenData: cachedData.aver },
      ];
      dataSource = "redis";
    } else {
      // Redis cache miss - fetch fresh data from CoinGecko
      logger.info("Redis cache incomplete. Fetching fresh data from CoinGecko");

      try {
        // Step 2: Fetch fresh data from CoinGecko
        const coingeckoStartTime = Date.now();
        const newData = await fetchFromCoinGecko();
        const coingeckoTime = Date.now() - coingeckoStartTime;
        logger.success(
          `CoinGecko data fetched successfully in ${coingeckoTime}ms`
        );

        // Update Redis cache with fresh data
        logger.info("Updating Redis cache with fresh CoinGecko data");
        await updateRedisCache(newData);

        // Use CoinGecko data for response
        responseData = [
          { tokenId: "ethereum", tokenData: newData.ethereum! },
          { tokenId: "aver-ai", tokenData: newData.aver! },
        ];
        dataSource = "coingecko";

        // Step 3: Check if MongoDB update is needed
        const currentTime = Date.now();
        let lastMongoUpdate = null;

        try {
          lastMongoUpdate = await redisClient.get(REDIS_TIMESTAMP_KEY);
          logger.debug(
            `Last MongoDB update timestamp: ${lastMongoUpdate || "never"}`
          );
        } catch (redisError) {
          logger.error("Failed to get lastMongoUpdate from Redis", redisError);
        }

        let timeSinceLastUpdate = Infinity;
        if (lastMongoUpdate) {
          timeSinceLastUpdate =
            currentTime - parseInt(lastMongoUpdate as string);
          logger.info(
            `Time since last MongoDB update: ${timeSinceLastUpdate}ms (threshold: ${
              MONGO_UPDATE_INTERVAL_SECONDS * 1000
            }ms)`
          );
        } else {
          logger.info(
            "No previous MongoDB update found, will perform first update"
          );
        }

        // Update MongoDB if needed
        if (
          timeSinceLastUpdate >= MONGO_UPDATE_INTERVAL_SECONDS * 1000 ||
          !lastMongoUpdate
        ) {
          logger.info("MongoDB update needed, attempting update with lock");
          await updateMongoDBWithLock(newData, currentTime);
        } else {
          logger.info(
            `MongoDB update skipped, next update in ${
              MONGO_UPDATE_INTERVAL_SECONDS * 1000 - timeSinceLastUpdate
            }ms`
          );
        }
      } catch (coingeckoError) {
        // Step 3: Only fallback to MongoDB if CoinGecko fails
        logger.error(
          "CoinGecko fetch failed, falling back to MongoDB",
          coingeckoError
        );

        const mongoData = await fetchFromMongoDB();

        if (mongoData.ethereum && mongoData.aver) {
          logger.info("Using MongoDB data as fallback");

          // Update Redis with MongoDB data
          logger.info("Updating Redis cache with MongoDB fallback data");
          if (mongoData.ethereum) {
            await redisClient.set(
              CACHE_KEYS.ETHEREUM_PRICE,
              mongoData.ethereum,
              {
                ex: CACHE_TTL.PRICE,
              }
            );
          }

          if (mongoData.aver) {
            await redisClient.set(CACHE_KEYS.AVER_PRICE, mongoData.aver, {
              ex: CACHE_TTL.PRICE,
            });
          }

          responseData = [
            { tokenId: "ethereum", tokenData: mongoData.ethereum },
            { tokenId: "aver-ai", tokenData: mongoData.aver },
          ];
          dataSource = "mongodb-fallback";
        } else {
          // Both Redis, CoinGecko, and MongoDB failed - return error
          logger.error("All data sources failed");
          return NextResponse.json(
            { message: "Unable to retrieve token data from any source" },
            { status: 500 }
          );
        }
      }
    }

    // Return the data to the client
    const responseTime = Date.now() - startTime;
    logger.success(
      `API request completed, returning ${dataSource} data. Total response time: ${responseTime}ms`
    );

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("API request failed", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper Function: Fetch from Redis
async function fetchFromRedis(): Promise<TokenCacheData> {
  const startTime = Date.now();
  logger.info("Fetching data from Redis");

  const result: TokenCacheData = {
    ethereum: null,
    aver: null,
  };

  try {
    // Get complete data objects (price + OHLC)
    logger.debug("Fetching data from Redis");
    const [ethereumData, averData] = await Promise.all([
      redisClient.get<TokenData>(CACHE_KEYS.ETHEREUM_PRICE),
      redisClient.get<TokenData>(CACHE_KEYS.AVER_PRICE),
    ]);

    if (ethereumData) {
      logger.debug("Ethereum data found in Redis", {
        price: ethereumData.current_price,
        hasOHLC: !!ethereumData.ohlcData,
        ohlcPoints: ethereumData.ohlcData?.length || 0,
      });
      result.ethereum = ethereumData;
    } else {
      logger.warning("Ethereum data not found in Redis");
    }

    if (averData) {
      logger.debug("Aver data found in Redis", {
        price: averData.current_price,
        hasOHLC: !!averData.ohlcData,
        ohlcPoints: averData.ohlcData?.length || 0,
      });
      result.aver = averData;
    } else {
      logger.warning("Aver data not found in Redis");
    }

    const fetchTime = Date.now() - startTime;
    logger.success(`Redis fetch completed in ${fetchTime}ms`, {
      ethereumFound: !!result.ethereum,
      averFound: !!result.aver,
      ethereumOHLCFound: !!result.ethereum?.ohlcData,
      averOHLCFound: !!result.aver?.ohlcData,
    });

    return result;
  } catch (error) {
    logger.error("Redis fetch failed", error);
    return result;
  }
}

// Helper Function: Fetch from MongoDB
async function fetchFromMongoDB(): Promise<TokenCacheData> {
  const startTime = Date.now();
  logger.info("Fetching data from MongoDB");

  const result: TokenCacheData = {
    ethereum: null,
    aver: null,
  };

  try {
    const client = await clientPromise;
    const db = client.db("aver");
    const tokensCollection = db.collection("tokens");

    // Get the documents for each token
    logger.debug("Querying MongoDB for token documents");
    const [ethereumDoc, averDoc] = await Promise.all([
      tokensCollection.findOne<
        { _id: any; token: string; timestamp: Date } & TokenData
      >({ token: "ethereum" }),
      tokensCollection.findOne<
        { _id: any; token: string; timestamp: Date } & TokenData
      >({ token: "aver-ai" }),
    ]);

    if (ethereumDoc) {
      logger.debug("Ethereum document found in MongoDB", {
        timestamp: ethereumDoc.timestamp,
        hasOHLC: !!ethereumDoc.ohlcData,
      });
      // The document already contains both price and OHLC data
      // Remove MongoDB-specific fields
      const { _id, token, timestamp, ...ethereumData } = ethereumDoc;
      result.ethereum = ethereumData as TokenData;
    } else {
      logger.warning("Ethereum document not found in MongoDB");
    }

    if (averDoc) {
      logger.debug("Aver document found in MongoDB", {
        timestamp: averDoc.timestamp,
        hasOHLC: !!averDoc.ohlcData,
      });
      // The document already contains both price and OHLC data
      // Remove MongoDB-specific fields
      const { _id, token, timestamp, ...averData } = averDoc;
      result.aver = averData as TokenData;
    } else {
      logger.warning("Aver document not found in MongoDB");
    }

    const fetchTime = Date.now() - startTime;
    logger.success(`MongoDB fetch completed in ${fetchTime}ms`, {
      ethereumFound: !!result.ethereum,
      averFound: !!result.aver,
    });

    return result;
  } catch (error) {
    logger.error("MongoDB fetch failed", error);
    return result;
  }
}

// Helper Function: Fetch from CoinGecko
async function fetchFromCoinGecko(): Promise<TokenCacheData> {
  const startTime = Date.now();
  logger.info("Fetching data from CoinGecko API");

  try {
    // Use our coingecko.ts utility to fetch data with proper error handling
    logger.debug("Fetching market data from CoinGecko");
    const marketStartTime = Date.now();
    const priceData = await getTokensMarketData(
      TOKEN_IDS as unknown as string[]
    );
    const marketTime = Date.now() - marketStartTime;
    logger.success(`Market data fetched successfully in ${marketTime}ms`);

    // Fetch OHLC data for each token
    logger.debug("Fetching OHLC data for Ethereum");
    const ethOhlcStartTime = Date.now();
    const ethereumOHLC = await getTokenOHLC("ethereum", 7);
    const ethTime = Date.now() - ethOhlcStartTime;
    logger.success(
      `Ethereum OHLC data fetched in ${ethTime}ms (${ethereumOHLC.length} data points)`
    );

    logger.debug("Fetching OHLC data for Aver AI");
    const averOhlcStartTime = Date.now();
    const averOHLC = await getTokenOHLC("aver-ai", 7);
    const averTime = Date.now() - averOhlcStartTime;
    logger.success(
      `Aver AI OHLC data fetched in ${averTime}ms (${averOHLC.length} data points)`
    );

    // Transform to our expected OHLCData format
    logger.debug("Transforming OHLC data to application format");
    const transformedEthereumOHLC: OHLCData = ethereumOHLC.map(
      ([timestamp, open, high, low, close, volume]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      })
    );

    const transformedAverOHLC: OHLCData = averOHLC.map(
      ([timestamp, open, high, low, close, volume]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      })
    );

    // Combine price and OHLC data
    logger.debug("Combining price and OHLC data");
    const result: TokenCacheData = {
      ethereum: null,
      aver: null,
    };

    const ethereumData = priceData.find((item) => item.id === "ethereum");
    if (ethereumData) {
      result.ethereum = {
        ...ethereumData,
        ohlcData: transformedEthereumOHLC,
      };
      logger.debug("Ethereum data combined successfully", {
        price: ethereumData.current_price,
        ohlcPoints: transformedEthereumOHLC.length,
      });
    } else {
      logger.warning("Ethereum market data not found in CoinGecko response");
    }

    const averData = priceData.find((item) => item.id === "aver-ai");
    if (averData) {
      result.aver = {
        ...averData,
        ohlcData: transformedAverOHLC,
      };
      logger.debug("Aver data combined successfully", {
        price: averData.current_price,
        ohlcPoints: transformedAverOHLC.length,
      });
    } else {
      logger.warning("Aver AI market data not found in CoinGecko response");
    }

    const fetchTime = Date.now() - startTime;
    logger.success(
      `CoinGecko data fetch and transform completed in ${fetchTime}ms`,
      {
        ethereumPrice: result.ethereum?.current_price,
        averPrice: result.aver?.current_price,
      }
    );

    return result;
  } catch (error) {
    logger.error("CoinGecko fetch failed", error);
    throw error; // Re-throw to be handled by the main handler
  }
}

// Helper Function: Update Redis Cache
async function updateRedisCache(data: TokenCacheData): Promise<void> {
  const startTime = Date.now();
  logger.info("Updating Redis cache");

  const promises: Promise<any>[] = [];

  try {
    if (data.ethereum) {
      // Store the complete data object including ohlcData
      logger.debug("Setting Ethereum data in Redis (with OHLC data)", {
        price: data.ethereum.current_price,
        ohlcPoints: data.ethereum.ohlcData?.length || 0,
        ttl: CACHE_TTL.PRICE,
      });

      promises.push(
        redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, data.ethereum, {
          ex: CACHE_TTL.PRICE,
        })
      );
    } else {
      logger.warning("No Ethereum data to cache");
    }

    if (data.aver) {
      // Store the complete data object including ohlcData
      logger.debug("Setting Aver data in Redis (with OHLC data)", {
        price: data.aver.current_price,
        ohlcPoints: data.aver.ohlcData?.length || 0,
        ttl: CACHE_TTL.PRICE,
      });

      promises.push(
        redisClient.set(CACHE_KEYS.AVER_PRICE, data.aver, {
          ex: CACHE_TTL.PRICE,
        })
      );
    } else {
      logger.warning("No Aver data to cache");
    }

    await Promise.all(promises);
    const cacheTime = Date.now() - startTime;
    logger.success(`Redis cache updated successfully in ${cacheTime}ms`);
  } catch (error) {
    logger.error("Redis cache update failed", error);
    throw error;
  }
}

// Helper Function: Update MongoDB with Lock
async function updateMongoDBWithLock(
  data: TokenCacheData,
  currentTime: number
): Promise<void> {
  const startTime = Date.now();
  logger.info("Attempting to acquire lock for MongoDB update");

  try {
    // First, check the current value of the timestamp key
    const currentStoredTimestamp = await redisClient.get(REDIS_TIMESTAMP_KEY);
    logger.debug(
      `Current value of ${REDIS_TIMESTAMP_KEY} before update: ${
        currentStoredTimestamp || "not set"
      }`
    );

    const lockAcquired = await redisClient.set(REDIS_LOCK_KEY, "locked", {
      nx: true,
      ex: 1,
    });

    if (lockAcquired) {
      logger.success("Lock acquired for MongoDB update");

      try {
        const client = await clientPromise;
        const db = client.db("aver");
        const tokensCollection = db.collection("tokens");

        const promises: Promise<any>[] = [];

        if (data.ethereum) {
          // Prepare a single document with both price and OHLC data
          const ethereumDocument = {
            token: "ethereum",
            timestamp: new Date(),
            ...data.ethereum,
          };

          logger.debug("Updating Ethereum document in MongoDB", {
            price: data.ethereum.current_price,
            timestamp: new Date().toISOString(),
          });

          // Update (or insert if not exists) the document in the collection
          promises.push(
            tokensCollection
              .updateOne(
                { token: "ethereum" },
                { $set: ethereumDocument },
                { upsert: true }
              )
              .then((result) => {
                logger.debug("Ethereum MongoDB update result", {
                  matchedCount: result.matchedCount,
                  modifiedCount: result.modifiedCount,
                  upsertedCount: result.upsertedCount,
                });
                return result;
              })
          );
        } else {
          logger.warning("No Ethereum data to update in MongoDB");
        }

        if (data.aver) {
          // Prepare a single document with both price and OHLC data
          const averDocument = {
            token: "aver-ai",
            timestamp: new Date(),
            ...data.aver,
          };

          logger.debug("Updating Aver AI document in MongoDB", {
            price: data.aver.current_price,
            timestamp: new Date().toISOString(),
          });

          // Update (or insert if not exists) the document in the collection
          promises.push(
            tokensCollection
              .updateOne(
                { token: "aver-ai" },
                { $set: averDocument },
                { upsert: true }
              )
              .then((result) => {
                logger.debug("Aver MongoDB update result", {
                  matchedCount: result.matchedCount,
                  modifiedCount: result.modifiedCount,
                  upsertedCount: result.upsertedCount,
                });
                return result;
              })
          );
        } else {
          logger.warning("No Aver data to update in MongoDB");
        }

        await Promise.all(promises);

        // *** CRITICAL FIX ***
        // Update the timestamp in Redis with extra debugging and verification
        logger.debug(
          `Attempting to set ${REDIS_TIMESTAMP_KEY} to ${currentTime.toString()}`
        );
        try {
          // Explicitly use a direct Redis SET operation
          await redisClient.set(REDIS_TIMESTAMP_KEY, currentTime.toString());

          // Verify the timestamp was set correctly
          const newTimestamp = await redisClient.get(REDIS_TIMESTAMP_KEY);
          logger.debug(
            `Verification: ${REDIS_TIMESTAMP_KEY} is now set to: ${
              newTimestamp || "not set"
            }`
          );

          if (
            newTimestamp &&
            newTimestamp.toString() === currentTime.toString()
          ) {
            logger.debug(`Timestamp verification successful: ${newTimestamp}`);
          } else {
            logger.warning(
              `Timestamp verification failed - expected ${currentTime.toString()} but got ${newTimestamp}`
            );
          }
        } catch (redisError) {
          logger.error(
            `Failed to set Redis timestamp: ${REDIS_TIMESTAMP_KEY}`,
            redisError
          );
        }

        const updateTime = Date.now() - startTime;
        logger.success(
          `MongoDB updated successfully in ${updateTime}ms - single document per token`
        );
      } finally {
        logger.debug("Releasing MongoDB update lock");
        await redisClient.del(REDIS_LOCK_KEY);
      }
    } else {
      logger.warning(
        "MongoDB update skipped due to active lock (another process is updating)"
      );
    }
  } catch (error) {
    logger.error("MongoDB update failed", error);
    // Don't throw from here to allow the API to continue
  }
}
