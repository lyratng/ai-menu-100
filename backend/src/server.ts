import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { env, corsOrigins } from './config/env';
import { testConnection, pool } from './db/pool';
import { testOSSConnection } from './utils/oss';
import { testDeepSeekConnection } from './services/ai/deepseek';
import { testOpenAIConnection } from './services/ai/openai';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authMiddleware, adminMiddleware, storeManagerMiddleware } from './middleware/auth';

// 导入路由
import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import dishRoutes from './routes/dish';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';

// 导入Worker（启动异步任务处理）
import './queue/menuParseQueue';

// 创建Fastify实例
const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// 注册插件
fastify.register(cors, {
  origin: corsOrigins,
  credentials: true,
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 注册JWT插件
fastify.register(jwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: env.JWT_EXPIRES_IN,
  },
});

// 注册认证装饰器
fastify.decorate('authMiddleware', authMiddleware);
fastify.decorate('adminMiddleware', adminMiddleware);
fastify.decorate('storeManagerMiddleware', storeManagerMiddleware);
fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// 注册数据库连接池
fastify.decorate('pg', pool);

// 注册路由
fastify.register(authRoutes);
fastify.register(menuRoutes, { prefix: '/api/menu' });
fastify.register(dishRoutes, { prefix: '/api/dish' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(userRoutes, { prefix: '/api/user' });

// 健康检查路由
fastify.get('/health', async (request, reply) => {
  const dbOk = await testConnection();
  const ossOk = await testOSSConnection();
  
  const status = dbOk && ossOk ? 'ok' : 'degraded';
  
  return reply.send({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'ok' : 'down',
      oss: ossOk ? 'ok' : 'down',
    },
  });
});

// 注册错误处理器
fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);

// 启动服务器
async function start() {
  try {
    console.log('🚀 炊语智能菜单生成系统 - 后端API');
    console.log('=====================================');
    
    // 测试数据库连接
    console.log('\n📊 检查服务连接...');
    await testConnection();
    await testOSSConnection();
    await testDeepSeekConnection();
    
    if (env.OPENAI_API_KEY) {
      await testOpenAIConnection();
    }
    
    console.log('\n🎯 启动服务器...');
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    });
    
    console.log(`\n✅ 服务器启动成功!`);
    console.log(`📍 地址: http://${env.HOST}:${env.PORT}`);
    console.log(`🌍 环境: ${env.NODE_ENV}`);
    console.log(`📝 日志级别: ${env.LOG_LEVEL}`);
    console.log('\n=====================================\n');
  } catch (err) {
    console.error('❌ 服务器启动失败:', err);
    process.exit(1);
  }
}

// 优雅关闭
async function shutdown() {
  console.log('\n\n🛑 正在关闭服务器...');
  
  try {
    await fastify.close();
    await pool.end();
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  } catch (err) {
    console.error('❌ 关闭服务器时出错:', err);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 启动
start();

// 导出fastify实例（用于测试）
export default fastify;

