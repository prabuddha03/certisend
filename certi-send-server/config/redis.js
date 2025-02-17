// config/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  // Optional: key prefix for easier debugging
  keyPrefix: 'certisend:',
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (error) => {
    console.error('Redis Error:', error);
    // Continue without cache if Redis fails
  });
  
  redis.on('connect', () => {
    console.log('Redis Connected Successfully');
  });
  

module.exports = redis;