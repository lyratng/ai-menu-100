import dotenv from 'dotenv';
import { z } from 'zod';

// 加载环境变量
dotenv.config();

// 环境变量schema验证
const envSchema = z.object({
  // 数据库
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  // 阿里云OSS
  OSS_REGION: z.string().default('oss-cn-beijing'),
  OSS_BUCKET: z.string(),
  OSS_ACCESS_KEY_ID: z.string(),
  OSS_ACCESS_KEY_SECRET: z.string(),
  OSS_ENDPOINT: z.string().url(),
  
  // AI服务
  DEEPSEEK_API_KEY: z.string(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com/v1'),
  EMBEDDING_MODEL: z.string().default('deepseek-embedder'),
  LLM_MODEL: z.string().default('deepseek-chat'),
  
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // 服务器
  PORT: z.string().default('8080').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  
  // 队列
  QUEUE_REDIS_URL: z.string().url(),
  
  // 日志
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
});

// 解析并导出环境变量
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ 环境变量配置错误:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

// 导出CORS origins数组
export const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());

