// services/cacheService.js
const redis = require('../config/redis');

class CacheService {
    constructor() {
        this.redis = redis;
        this.DEFAULT_EXP = 3600; // Redis TTL: 1 hour
        this.isConnected = false;
        
        // Local cache settings
        this.localCache = new Map();
        this.LOCAL_CACHE_MAX_SIZE = 100;  // Maximum items in local cache
        this.LOCAL_CACHE_TTL = 30 * 1000; // Local TTL: 30 seconds
        this.CLEAN_INTERVAL = 60 * 2000;  // Clean every 1 minute

        // Setup Redis connection monitoring
        this.redis.on('connect', () => {
          this.isConnected = true;
          console.log('Cache Service Ready ✅');
        });

        this.redis.on('error', () => {
          this.isConnected = false;
          console.warn('Cache Service Disabled ⚠️');
        });

        // Start periodic cleanup
        setInterval(() => this.cleanLocalCache(), this.CLEAN_INTERVAL);
    }

    // Get data from cache
    async get(key) {
        try {
            // Check local cache first
            const localData = this.localCache.get(key);
            if (localData && Date.now() - localData.timestamp < this.LOCAL_CACHE_TTL) {
                console.log(`🚀 Local cache hit for ${key}`);
                return localData.data;
            }

            // If local cache missed or expired, try Redis
            if (!this.isConnected) return null;
            
            const start = Date.now();
            const data = await this.redis.get(key);
            const timing = Date.now() - start;

            if (data) {
                const parsed = JSON.parse(data);
                // Update local cache if space available
                if (this.localCache.size < this.LOCAL_CACHE_MAX_SIZE) {
                    this.localCache.set(key, {
                        data: parsed,
                        timestamp: Date.now()
                    });
                }
                
                console.log(`📦 Redis cache hit for ${key}: ${timing}ms`);
                return parsed;
            }
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, data, expiry = this.DEFAULT_EXP) {
        try {
            if (!this.isConnected || !data) return;

            // Set in Redis
            const start = Date.now();
            const stringified = JSON.stringify(data);
            await this.redis.set(key, stringified, 'EX', expiry);

            // Update local cache if space available
            if (this.localCache.size < this.LOCAL_CACHE_MAX_SIZE) {
                this.localCache.set(key, {
                    data,
                    timestamp: Date.now()
                });
            }

            console.log(`💾 Cache set ${key}: ${Date.now() - start}ms`);
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

     cleanLocalCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.localCache.entries()) {
            if (now - value.timestamp > this.LOCAL_CACHE_TTL) {
                this.localCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} items from local cache`);
        }
    }

    // Method to manually clear local cache
    clearLocalCache() {
        const size = this.localCache.size;
        this.localCache.clear();
        console.log(`🗑️ Manually cleared ${size} items from local cache`);
    }

    // Get cache stats
    getCacheStats() {
        return {
            localCacheSize: this.localCache.size,
            localCacheMaxSize: this.LOCAL_CACHE_MAX_SIZE,
            localCacheTTL: this.LOCAL_CACHE_TTL,
            redisConnected: this.isConnected
        };
    }

    // Delete cache
    async del(key) {
        try {
            // Clear from Redis
            if (this.isConnected) {
                await this.redis.del(key);
            }
            
            // Clear from local cache
            this.localCache.delete(key);
            
            console.log(`🗑️ Cleared cache for ${key}`);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    // Increment view count
    async incrementViews(eventId) {
        try {
            if (!this.isConnected) return;
            const key = `event:${eventId}:views`;
            this.redis.incr(key).catch(console.error); // Don't await
        } catch (error) {
            console.error('View Increment Error:', error);
        }
    }
    async keys(pattern) {
        try {
            if (!this.isConnected) return [];
            const start = Date.now();
            const keys = await this.redis.keys(pattern);
            console.log(`🔑 Redis keys for ${pattern}: ${Date.now() - start}ms`);
            return keys;
        } catch (error) {
            console.error('Cache keys error:', error);
            return [];
        }
    }

    // Get popular events (by views)
    async getPopularEvents() {
        const keys = await this.redis.keys('event:*:views');
        const pipeline = this.redis.pipeline();
        
        keys.forEach(key => {
            pipeline.get(key);
        });

        const results = await pipeline.exec();
        return results.map((result, index) => ({
            eventId: keys[index].split(':')[1],
            views: parseInt(result[1])
        }));
    }
}

module.exports = new CacheService();