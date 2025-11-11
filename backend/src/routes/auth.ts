import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';

// 注册请求schema - 接受完整的菜品配置
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  confirm_password: z.string(),
  storeName: z.string().min(1).max(100),
  defaultConfig: z.object({
    breakfast: z.object({
      coldDish: z.number().int().min(0).max(50).optional(),
      pickle: z.number().int().min(0).max(50).optional(),
      westernDessert: z.number().int().min(0).max(50).optional(),
      soupPorridge: z.number().int().min(0).max(50).optional(),
      specialStaple: z.number().int().min(0).max(50).optional(),
      egg: z.number().int().min(0).max(50).optional(),
    }).optional(),
    lunch: z.object({
      coldDish: z.number().int().min(0).max(50),
      hotDish: z.number().int().min(1).max(50),
      soupPorridge: z.number().int().min(0).max(50).optional(),
      westernDessert: z.number().int().min(0).max(50).optional(),
      specialStaple: z.number().int().min(0).max(50).optional(),
      specialFood: z.number().int().min(0).max(50).optional(),
    }),
    dinner: z.object({
      coldDish: z.number().int().min(0).max(50).optional(),
      hotDish: z.number().int().min(0).max(50).optional(),
      soupPorridge: z.number().int().min(0).max(50).optional(),
      westernDessert: z.number().int().min(0).max(50).optional(),
      specialStaple: z.number().int().min(0).max(50).optional(),
      specialFood: z.number().int().min(0).max(50).optional(),
    }).optional(),
    lateNight: z.object({
      coldDish: z.number().int().min(0).max(50).optional(),
      hotDish: z.number().int().min(0).max(50).optional(),
      soupPorridge: z.number().int().min(0).max(50).optional(),
      specialStaple: z.number().int().min(0).max(50).optional(),
      specialFood: z.number().int().min(0).max(50).optional(),
    }).optional(),
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: '两次密码输入不一致',
  path: ['confirm_password'],
});

// 登录请求schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/register - 用户注册
   */
  fastify.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    
    try {
      // 检查用户名是否已存在
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1',
        [body.username]
      );
      
      if (existingUser.rows.length > 0) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '用户名已存在',
          },
        });
      }
      
      // 哈希密码
      const passwordHash = await hashPassword(body.password);
      
      // 创建门店和用户（使用事务）
      const client = await fastify.pg.connect();
      
      try {
        await client.query('BEGIN');
        
        // 创建门店
        const storeResult = await client.query(
          `INSERT INTO stores (name, default_config, is_active, created_at, updated_at)
           VALUES ($1, $2, TRUE, NOW(), NOW())
           RETURNING id, name`,
          [body.storeName, body.defaultConfig]
        );
        
        const store = storeResult.rows[0];
        
        // 创建用户
        const userResult = await client.query(
          `INSERT INTO users (store_id, username, password_hash, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, 'store_manager', TRUE, NOW(), NOW())
           RETURNING id, username, role, store_id`,
          [store.id, body.username, passwordHash]
        );
        
        const user = userResult.rows[0];
        
        await client.query('COMMIT');
        
        // 生成token
        const token = generateToken({
          userId: user.id,
          storeId: user.store_id,
          role: user.role,
        });
        
        return reply.send({
          success: true,
          data: {
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              storeId: user.store_id,
            },
            store: {
              id: store.id,
              name: store.name,
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('注册错误:', error);
      throw error;
    }
  });
  
  /**
   * POST /auth/login - 用户登录
   */
  fastify.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    try {
      // 查询用户
      const result = await query(
        `SELECT u.id, u.username, u.password_hash, u.role, u.store_id, u.is_active,
                s.id as store_id, s.name as store_name, s.default_config
         FROM users u
         LEFT JOIN stores s ON u.store_id = s.id
         WHERE u.username = $1`,
        [body.username]
      );
      
      if (result.rows.length === 0) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
          },
        });
      }
      
      const user = result.rows[0];
      
      // 检查用户是否被禁用
      if (!user.is_active) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '账号已被禁用',
          },
        });
      }
      
      // 验证密码
      const isValid = await verifyPassword(body.password, user.password_hash);
      
      if (!isValid) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
          },
        });
      }
      
      // 生成token
      const token = generateToken({
        userId: user.id,
        storeId: user.store_id,
        role: user.role,
      });
      
      // 记录登录事件
      await query(
        `INSERT INTO auth_events (user_id, type, ip, ua, created_at)
         VALUES ($1, 'login', $2, $3, NOW())`,
        [
          user.id,
          request.ip,
          request.headers['user-agent'] || 'unknown',
        ]
      );
      
      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            storeId: user.store_id,
          },
          store: user.store_id ? {
            id: user.store_id,
            name: user.store_name,
            defaultConfig: user.default_config,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  });
  
  /**
   * GET /auth/me - 获取当前用户信息
   */
  fastify.get('/auth/me', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const authUser = (request as any).user;
    const userId = authUser?.userId || authUser?.id;
    
    const result = await query(
      `SELECT u.id, u.username, u.role, u.store_id, u.is_active,
              s.name as store_name, s.default_config
       FROM users u
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在',
        },
      });
    }
    
    const user = result.rows[0];
    
    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          storeId: user.store_id,
          isActive: user.is_active,
        },
        store: user.store_id ? {
          id: user.store_id,
          name: user.store_name,
          defaultConfig: user.default_config,
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

