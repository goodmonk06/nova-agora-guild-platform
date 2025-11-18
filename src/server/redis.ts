import Redis from "ioredis";
import { env } from "~/env";

const getRedisUrl = () => {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }
  throw new Error("REDIS_URL is not defined");
};

const createRedisClient = () => {
  try {
    const redis = new Redis(getRedisUrl());
    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });
    return redis;
  } catch (error) {
    console.error("Failed to create Redis client:", error);
    // Return a mock client for development if Redis is not available
    return null;
  }
};

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Helper functions for common Redis operations
export const redisHelpers = {
  // Cache a value with expiration
  async setCache(key: string, value: string, expirationInSeconds = 3600) {
    if (!redis) return;
    await redis.setex(key, expirationInSeconds, value);
  },

  // Get cached value
  async getCache(key: string) {
    if (!redis) return null;
    return await redis.get(key);
  },

  // Delete cache
  async deleteCache(key: string) {
    if (!redis) return;
    await redis.del(key);
  },

  // Publish notification
  async publishNotification(channel: string, message: string) {
    if (!redis) return;
    await redis.publish(channel, message);
  },

  // Subscribe to channel
  subscribeToChannel(channel: string, callback: (message: string) => void) {
    if (!redis) return;
    const subscriber = redis.duplicate();
    subscriber.subscribe(channel);
    subscriber.on("message", (_channel, message) => {
      callback(message);
    });
    return subscriber;
  },
};
