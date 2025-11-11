import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';

// Redis连接配置
const redisConnection = new Redis(env.QUEUE_REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis连接失败:', err);
});

export { redisConnection };

