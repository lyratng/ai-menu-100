import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from '../config/env';

// 创建PostgreSQL连接池
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
});

// 连接池错误处理
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 设置时区为上海
pool.on('connect', async (client) => {
  await client.query("SET TIME ZONE 'Asia/Shanghai'");
});

/**
 * 执行查询
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (env.NODE_ENV === 'development') {
      console.log('[SQL]', {
        text,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }
    
    return res;
  } catch (error) {
    console.error('[SQL Error]', { text, params, error });
    throw error;
  }
}

/**
 * 获取客户端连接（用于事务）
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ 数据库连接成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('数据库连接池已关闭');
}

// 进程退出时关闭连接池
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

