import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 管理员登录请求
const AdminLoginSchema = z.object({
  username: z.string().min(1, '请输入管理员账号'),
  password: z.string().min(1, '请输入密码'),
});

// 管理员认证中间件
async function authenticateAdmin(request: any, reply: any) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.isAdmin) {
      return reply.status(403).send({ message: '权限不足' });
    }

    request.admin = decoded;
  } catch (error) {
    return reply.status(401).send({ message: '认证令牌无效或已过期' });
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {
  // 管理员登录
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = AdminLoginSchema.parse(request.body);

      // 查询管理员账号
      const result = await pool.query(
        `SELECT id, username, password_hash, full_name, email, created_at 
         FROM admin_users 
         WHERE username = $1 AND is_active = true`,
        [username]
      );

      if (result.rows.length === 0) {
        return reply.status(401).send({ message: '管理员账号或密码错误' });
      }

      const admin = result.rows[0];

      // 验证密码
      const isValid = await compare(password, admin.password_hash);
      if (!isValid) {
        return reply.status(401).send({ message: '管理员账号或密码错误' });
      }

      // 生成JWT令牌
      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.username,
          isAdmin: true,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 更新最后登录时间
      await pool.query(
        `UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`,
        [admin.id]
      );

      return reply.send({
        token,
        user: {
          id: admin.id,
          username: admin.username,
          fullName: admin.full_name,
          email: admin.email,
        },
      });
    } catch (error: any) {
      fastify.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: error.errors[0].message });
      }
      return reply.status(500).send({ message: '登录失败' });
    }
  });

  // 获取Dashboard统计数据
  fastify.get('/dashboard/stats', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { from, to } = request.query as { from?: string; to?: string };
      const dateFilter = from && to 
        ? `AND created_at BETWEEN $1 AND $2`
        : '';
      const params = from && to ? [from, to] : [];

      // 活跃门店数
      const activeStoresResult = await pool.query(
        `SELECT COUNT(DISTINCT store_id) as count 
         FROM menus 
         WHERE is_active = true ${dateFilter}`,
        params
      );

      // 新增门店数
      const newStoresResult = await pool.query(
        `SELECT COUNT(DISTINCT store_id) as count
         FROM (
           SELECT store_id, MIN(created_at) as first_action
           FROM menus
           WHERE is_active = true
           GROUP BY store_id
         ) first_actions
         WHERE first_action >= COALESCE($1::timestamptz, NOW() - INTERVAL '30 days')
           AND first_action <= COALESCE($2::timestamptz, NOW())`,
        params.length > 0 ? params : [null, null]
      );

      // 生成菜单数
      const generatedMenusResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM menus 
         WHERE source_type = 'generated' AND is_active = true ${dateFilter}`,
        params
      );

      // 上传菜单数
      const uploadedMenusResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM menus 
         WHERE source_type = 'uploaded' AND is_active = true ${dateFilter}`,
        params
      );

      // 计算留存率（W1周留存率）
      const retentionResult = await pool.query(`
        WITH last_week_stores AS (
          SELECT DISTINCT store_id
          FROM menus
          WHERE created_at >= NOW() - INTERVAL '14 days'
            AND created_at < NOW() - INTERVAL '7 days'
        ),
        this_week_active AS (
          SELECT DISTINCT m.store_id
          FROM menus m
          JOIN last_week_stores lws ON m.store_id = lws.store_id
          WHERE m.created_at >= NOW() - INTERVAL '7 days'
        )
        SELECT 
          COALESCE(
            ROUND(
              COUNT(DISTINCT twa.store_id) * 100.0 / NULLIF(COUNT(DISTINCT lws.store_id), 0),
              1
            ),
            0
          ) as retention_rate
        FROM last_week_stores lws
        LEFT JOIN this_week_active twa ON lws.store_id = twa.store_id
      `);

      // 计算失败率（仅从generation_events统计，parse_queue表可能不存在）
      let failureRate = 0;
      try {
        // 尝试查询是否有parse_queue表
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'parse_queue'
          ) as has_parse_queue
        `);
        
        const hasParseQueue = tableCheck.rows[0].has_parse_queue;
        
        if (hasParseQueue) {
          // 如果parse_queue表存在，同时统计两个表
          const failureResult = await pool.query(`
            WITH total_ops AS (
              SELECT 
                (SELECT COUNT(*) FROM parse_queue WHERE created_at >= NOW() - INTERVAL '30 days') +
                (SELECT COUNT(*) FROM generation_events WHERE created_at >= NOW() - INTERVAL '30 days') as count
            ),
            failed_ops AS (
              SELECT 
                (SELECT COUNT(*) FROM parse_queue WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '30 days') +
                (SELECT COUNT(*) FROM generation_events WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '30 days') as count
            )
            SELECT 
              COALESCE(
                ROUND(
                  (SELECT count FROM failed_ops) * 100.0 / 
                  NULLIF((SELECT count FROM total_ops), 0),
                  2
                ),
                0
              ) as failure_rate
          `);
          failureRate = parseFloat(failureResult.rows[0].failure_rate);
        } else {
          // 只统计generation_events表
          const failureResult = await pool.query(`
            SELECT 
              COALESCE(
                ROUND(
                  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / 
                  NULLIF(COUNT(*), 0),
                  2
                ),
                0
              ) as failure_rate
            FROM generation_events
            WHERE created_at >= NOW() - INTERVAL '30 days'
          `);
          failureRate = parseFloat(failureResult.rows[0].failure_rate);
        }
      } catch (error) {
        fastify.log.error('计算失败率时出错:', error);
        failureRate = 0;
      }

      return reply.send({
        activeStores: parseInt(activeStoresResult.rows[0].count),
        newStores: parseInt(newStoresResult.rows[0].count),
        generatedMenus: parseInt(generatedMenusResult.rows[0].count),
        uploadedMenus: parseInt(uploadedMenusResult.rows[0].count),
        retention: `${retentionResult.rows[0].retention_rate}%`,
        failureRate: `${failureRate}%`,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取统计数据失败' });
    }
  });

  // 获取菜单生成趋势数据
  fastify.get('/dashboard/menu-trend', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { days = 30 } = request.query as { days?: number };
      
      const result = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE source_type = 'generated') as generated_count,
          COUNT(*) FILTER (WHERE source_type = 'uploaded') as uploaded_count,
          COUNT(*) as total_count
        FROM menus
        WHERE created_at >= NOW() - INTERVAL '${parseInt(String(days))} days'
          AND is_active = true
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
      
      return reply.send({ 
        trend: result.rows.map(row => ({
          date: row.date,
          generated: parseInt(row.generated_count),
          uploaded: parseInt(row.uploaded_count),
          total: parseInt(row.total_count),
        }))
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取趋势数据失败' });
    }
  });

  // 获取八大烹饪法分布数据
  fastify.get('/dashboard/cook-methods', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const result = await pool.query(`
        SELECT 
          cook_method8,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM dishes_store
        WHERE is_active = true
        GROUP BY cook_method8
        ORDER BY count DESC
      `);
      
      return reply.send({ 
        distribution: result.rows.map(row => ({
          method: row.cook_method8,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        }))
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取烹饪法分布失败' });
    }
  });

  // 获取门店列表
  fastify.get('/stores', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 50, search = '' } = request.query as any;
      const offset = (page - 1) * pageSize;

      const searchFilter = search 
        ? `WHERE s.store_name ILIKE $3 OR u.username ILIKE $3`
        : '';
      const params = search 
        ? [pageSize, offset, `%${search}%`]
        : [pageSize, offset];

      const result = await pool.query(
        `SELECT 
          s.id, 
          s.name as store_name, 
          u.username,
          s.is_active,
          s.created_at,
          COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'generated') as generated_count,
          COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'uploaded') as uploaded_count,
          MAX(m.created_at) as last_active_at
         FROM stores s
         LEFT JOIN users u ON s.id = u.store_id
         LEFT JOIN menus m ON s.id = m.store_id
         ${searchFilter}
         GROUP BY s.id, s.name, u.username, s.is_active, s.created_at
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT s.id) as total
         FROM stores s
         LEFT JOIN users u ON s.id = u.store_id
         ${searchFilter}`,
        search ? [`%${search}%`] : []
      );

      return reply.send({
        stores: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取门店列表失败' });
    }
  });

  // 新增门店
  fastify.post('/stores', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { storeName, username, password, defaultConfig } = request.body as any;

      if (!storeName || !username || !password) {
        return reply.status(400).send({ message: '请提供门店名称、账号和密码' });
      }

      // 检查账号是否已存在
      const existingUser = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [username]
      );

      if (existingUser.rows.length > 0) {
        return reply.status(400).send({ message: '该账号已存在' });
      }

      // 生成密码哈希
      const passwordHash = await hash(password, 10);

      // 开始事务
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 创建门店
        const storeResult = await client.query(
          `INSERT INTO stores (name, is_active)
           VALUES ($1, true)
           RETURNING id, name as store_name, is_active, created_at`,
          [storeName]
        );

        const store = storeResult.rows[0];

        // 创建用户账号
        const userResult = await client.query(
          `INSERT INTO users (username, password_hash, store_id)
           VALUES ($1, $2, $3)
           RETURNING id, username`,
          [username, passwordHash, store.id]
        );

        const user = userResult.rows[0];

        // 如果提供了默认配置，保存到stores表（需要添加default_config字段）
        if (defaultConfig) {
          await client.query(
            `UPDATE stores SET default_config = $1 WHERE id = $2`,
            [JSON.stringify(defaultConfig), store.id]
          );
        }

        await client.query('COMMIT');

        return reply.send({
          store: {
            ...store,
            username: user.username,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '创建门店失败' });
    }
  });

  // 更新门店信息
  fastify.put('/stores/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { storeName, username, password, isActive } = request.body as any;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 更新门店名称和状态
        if (storeName !== undefined || isActive !== undefined) {
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (storeName !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(storeName);
          }
          if (isActive !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(isActive);
          }

          values.push(id);
          await client.query(
            `UPDATE stores SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
            values
          );
        }

        // 更新用户账号信息
        if (username !== undefined || password !== undefined) {
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (username !== undefined) {
            updates.push(`username = $${paramIndex++}`);
            values.push(username);
          }
          if (password !== undefined) {
            const passwordHash = await hash(password, 10);
            updates.push(`password_hash = $${paramIndex++}`);
            values.push(passwordHash);
          }

          values.push(id);
          await client.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE store_id = $${paramIndex}`,
            values
          );
        }

        await client.query('COMMIT');

        return reply.send({ message: '更新成功' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '更新门店失败' });
    }
  });

  // 删除门店（软删除）
  fastify.delete('/stores/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      await pool.query(
        `UPDATE stores SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [id]
      );

      return reply.send({ message: '删除成功' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '删除门店失败' });
    }
  });

  // 获取门店详情
  fastify.get('/stores/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      const result = await pool.query(
        `SELECT 
          s.id,
          s.name as store_name,
          s.is_active,
          s.default_config,
          s.created_at,
          s.updated_at,
          u.username,
          COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'generated') as generated_count,
          COUNT(DISTINCT m.id) FILTER (WHERE m.source_type = 'uploaded') as uploaded_count,
          MAX(m.created_at) as last_active_at
         FROM stores s
         LEFT JOIN users u ON s.id = u.store_id
         LEFT JOIN menus m ON s.id = m.store_id
         WHERE s.id = $1
         GROUP BY s.id, s.name, s.is_active, s.default_config, s.created_at, s.updated_at, u.username`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ message: '门店不存在' });
      }

      return reply.send({ store: result.rows[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取门店详情失败' });
    }
  });

  // 更新门店默认配置
  fastify.put('/stores/:id/config', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { defaultConfig } = request.body as any;

      await pool.query(
        `UPDATE stores SET default_config = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(defaultConfig), id]
      );

      return reply.send({ message: '配置更新成功' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '更新配置失败' });
    }
  });

  // ==================== 菜单库管理 ====================

  // 获取菜单列表
  fastify.get('/menus', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const {
        page = 1,
        pageSize = 50,
        search = '',
        storeId = '',
        sourceType = '',
        status = '',
        fromDate = '',
        toDate = '',
      } = request.query as any;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      // 构建WHERE条件
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // 搜索条件（标题或菜单ID）
      if (search) {
        conditions.push(`(m.title ILIKE $${paramIndex} OR m.id::text ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // 门店筛选
      if (storeId) {
        conditions.push(`m.store_id = $${paramIndex}`);
        params.push(storeId);
        paramIndex++;
      }

      // 来源筛选
      if (sourceType) {
        conditions.push(`m.source_type = $${paramIndex}`);
        params.push(sourceType);
        paramIndex++;
      }

      // 状态筛选（active）
      if (status === 'active') {
        conditions.push(`m.is_active = true`);
      } else if (status === 'inactive') {
        conditions.push(`m.is_active = false`);
      }

      // 时间区间筛选
      if (fromDate) {
        conditions.push(`m.created_at >= $${paramIndex}`);
        params.push(fromDate);
        paramIndex++;
      }
      if (toDate) {
        conditions.push(`m.created_at <= $${paramIndex}`);
        params.push(toDate);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 添加分页参数
      params.push(parseInt(pageSize), offset);

      // 查询菜单列表
      const result = await pool.query(
        `SELECT 
          m.id,
          m.store_id,
          s.name as store_name,
          m.source_type,
          m.title,
          m.days,
          m.meal_type,
          m.is_active,
          m.created_at,
          m.gen_options_json,
          m.menu_stats_json,
          m.meta_json
         FROM menus m
         LEFT JOIN stores s ON m.store_id = s.id
         ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      // 查询总数
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM menus m ${whereClause}`,
        params.slice(0, -2) // 移除分页参数
      );

      // 处理返回数据，提取关键信息
      const menus = result.rows.map((menu) => {
        const genOptions = menu.gen_options_json || {};
        const menuStats = menu.menu_stats_json || {};
        const metaJson = menu.meta_json || {};

        return {
          id: menu.id,
          store_id: menu.store_id,
          store_name: menu.store_name,
          source_type: menu.source_type,
          title: menu.title || '未命名菜单',
          days: menu.days,
          meal_type: menu.meal_type,
          is_active: menu.is_active,
          created_at: menu.created_at,
          // 解析状态
          parse_status: metaJson.pipeline_status || (menu.source_type === 'generated' ? 'generated' : 'pending_parse'),
          // 辣度档位
          spicy_ratio: genOptions.spicy_ratio_target || 0,
          // 八大烹饪法
          cook_methods: genOptions.cook_method8_used || [],
          // 口味多样性
          flavor_diversity: menuStats.passed_flavor_diversity || false,
          // 结构日均
          structure: {
            main_meat: menuStats.actual_main_meat_per_day || genOptions.main_meat_per_day || 0,
            half_meat: menuStats.actual_half_meat_per_day || genOptions.half_meat_per_day || 0,
            veggie: menuStats.actual_veggie_hot_per_day || genOptions.veggie_hot_per_day || 0,
            cold: menuStats.actual_cold_per_day || genOptions.cold_per_day || 0,
          },
        };
      });

      return reply.send({
        menus,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取菜单列表失败' });
    }
  });

  // 获取菜单详情
  fastify.get('/menus/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      const result = await pool.query(
        `SELECT 
          m.*,
          s.name as store_name
         FROM menus m
         LEFT JOIN stores s ON m.store_id = s.id
         WHERE m.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ message: '菜单不存在' });
      }

      return reply.send({ menu: result.rows[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取菜单详情失败' });
    }
  });

  // 删除菜单（软删除）
  fastify.delete('/menus/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      await pool.query(
        `UPDATE menus SET is_active = false WHERE id = $1`,
        [id]
      );

      return reply.send({ message: '删除成功' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '删除菜单失败' });
    }
  });

  // ==================== 菜品库管理 ====================

  // 获取菜品列表
  fastify.get('/dishes', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const {
        page = 1,
        pageSize = 50,
        search = '',
        storeId = '',
        dishType = '',
        cookMethod = '',
        season = '',
        isActive = '',
        source = 'store', // 新增：'common' 或 'store'
      } = request.query as any;

      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      // 根据source决定查询哪个表
      const tableName = source === 'common' ? 'dishes_common' : 'dishes_store';
      const needsStoreJoin = source === 'store'; // 只有查询store表时才需要JOIN

      // 构建WHERE条件
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // 搜索条件（菜名）
      if (search) {
        conditions.push(`d.dish_name ILIKE $${paramIndex}`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // 门店筛选（仅对 dishes_store 有效）
      if (storeId && source === 'store') {
        conditions.push(`d.store_id = $${paramIndex}`);
        params.push(storeId);
        paramIndex++;
      }

      // 菜品类型筛选
      if (dishType) {
        conditions.push(`d.dish_type = $${paramIndex}`);
        params.push(dishType);
        paramIndex++;
      }

      // 烹饪方式筛选
      if (cookMethod) {
        conditions.push(`d.cook_method8 = $${paramIndex}`);
        params.push(cookMethod);
        paramIndex++;
      }

      // 季节筛选
      if (season) {
        conditions.push(`$${paramIndex} = ANY(d.seasons)`);
        params.push(season);
        paramIndex++;
      }

      // 状态筛选
      if (isActive === 'true') {
        conditions.push(`d.is_active = true`);
      } else if (isActive === 'false') {
        conditions.push(`d.is_active = false`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 添加分页参数
      params.push(parseInt(pageSize), offset);

      // 构建查询SQL
      const selectFields = `
        d.id,
        ${needsStoreJoin ? 'd.store_id, s.name as store_name,' : 'NULL as store_id, NULL as store_name,'}
        d.dish_name,
        d.dish_type,
        d.ingredient_tags,
        d.knife_skill,
        d.cuisine,
        d.cook_method8,
        d.flavor,
        d.main_ingredients,
        d.sub_ingredients,
        d.seasons,
        d.is_active,
        d.created_at
      `;

      const joinClause = needsStoreJoin ? 'LEFT JOIN stores s ON d.store_id = s.id' : '';

      // 查询菜品列表
      const result = await pool.query(
        `SELECT ${selectFields}
         FROM ${tableName} d
         ${joinClause}
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      // 查询总数
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM ${tableName} d ${whereClause}`,
        params.slice(0, -2) // 移除分页参数
      );

      return reply.send({
        dishes: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        source,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取菜品列表失败' });
    }
  });

  // 获取菜品详情
  fastify.get('/dishes/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { source = 'store' } = request.query as any; // 默认查询门店菜库

      // 根据source决定查询哪个表
      const tableName = source === 'common' ? 'dishes_common' : 'dishes_store';
      const needsStoreJoin = source === 'store'; // 只有查询store表时才需要JOIN

      // 构建查询SQL
      const selectFields = `
        d.*,
        ${needsStoreJoin ? 's.name as store_name' : 'NULL as store_name'}
      `;
      const joinClause = needsStoreJoin ? 'LEFT JOIN stores s ON d.store_id = s.id' : '';

      const result = await pool.query(
        `SELECT ${selectFields}
         FROM ${tableName} d
         ${joinClause}
         WHERE d.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ message: '菜品不存在' });
      }

      return reply.send({ dish: result.rows[0] });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取菜品详情失败' });
    }
  });

  // 删除菜品（软删除）
  fastify.delete('/dishes/:id', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { source = 'store' } = request.query as any; // 默认删除门店菜库

      // 根据source决定操作哪个表
      const tableName = source === 'common' ? 'dishes_common' : 'dishes_store';

      await pool.query(
        `UPDATE ${tableName} SET is_active = false WHERE id = $1`,
        [id]
      );

      return reply.send({ message: '删除成功' });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '删除菜品失败' });
    }
  });

  // ==================== 通用菜库管理 ====================

  // 批量上传通用菜品（Excel导入）
  fastify.post('/dishes/common/bulk-upload', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const { dishes, duplicateStrategy = 'skip' } = request.body as any;
      // dishes: 解析后的菜品数组
      // duplicateStrategy: 'skip' | 'overwrite'

      if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        return reply.status(400).send({ message: '请提供有效的菜品数据' });
      }

      const results = {
        total: dishes.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as any[],
      };

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (let i = 0; i < dishes.length; i++) {
          const dish = dishes[i];
          const rowIndex = i + 2; // Excel行号（第1行是标题）

          try {
            // 为每个菜品创建保存点
            await client.query(`SAVEPOINT dish_${i}`);

            // 验证必填字段
            if (!dish.dish_name || !dish.dish_type || !dish.cook_method8) {
              results.failed++;
              results.errors.push({
                row: rowIndex,
                dish_name: dish.dish_name || '未知',
                error: '缺少必填字段：菜品名称、菜品类型、烹饪方式',
              });
              await client.query(`ROLLBACK TO SAVEPOINT dish_${i}`);
              continue;
            }

            // 检查是否存在重复菜品（包括软删除的）
            const existingResult = await client.query(
              `SELECT id, is_active FROM dishes_common WHERE dish_name = $1`,
              [dish.dish_name]
            );

            if (existingResult.rows.length > 0) {
              const existingDish = existingResult.rows[0];
              
              if (duplicateStrategy === 'skip') {
                results.skipped++;
                results.errors.push({
                  row: rowIndex,
                  dish_name: dish.dish_name,
                  error: existingDish.is_active ? '菜品已存在（已跳过）' : '菜品已存在但已删除（已跳过）',
                });
                await client.query(`RELEASE SAVEPOINT dish_${i}`);
                continue;
              } else if (duplicateStrategy === 'overwrite') {
                // 更新现有菜品（如果是软删除的，同时恢复）
                await client.query(
                  `UPDATE dishes_common SET
                    dish_type = $1,
                    ingredient_tags = $2,
                    knife_skill = $3,
                    cuisine = $4,
                    cook_method8 = $5,
                    flavor = $6,
                    main_ingredients = $7,
                    sub_ingredients = $8,
                    seasons = $9,
                    analysis = $10,
                    is_active = true,
                    updated_at = NOW()
                   WHERE dish_name = $11`,
                  [
                    dish.dish_type,
                    dish.ingredient_tags || [],
                    dish.knife_skill || null,
                    dish.cuisine || null,
                    dish.cook_method8,
                    dish.flavor || null,
                    dish.main_ingredients || [],
                    dish.sub_ingredients || [],
                    dish.seasons || [],
                    JSON.stringify({
                      auto_parsed: false,
                      confidence: 1.0,
                      status: 'human_verified',
                    }),
                    dish.dish_name,
                  ]
                );
                results.success++;
                await client.query(`RELEASE SAVEPOINT dish_${i}`);
                continue;
              }
            }

            // 插入新菜品
            await client.query(
              `INSERT INTO dishes_common (
                dish_name,
                dish_type,
                ingredient_tags,
                knife_skill,
                cuisine,
                cook_method8,
                flavor,
                main_ingredients,
                sub_ingredients,
                seasons,
                analysis
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                dish.dish_name,
                dish.dish_type,
                dish.ingredient_tags || [],
                dish.knife_skill || null,
                dish.cuisine || null,
                dish.cook_method8,
                dish.flavor || null,
                dish.main_ingredients || [],
                dish.sub_ingredients || [],
                dish.seasons || [],
                JSON.stringify({
                  auto_parsed: false,
                  confidence: 1.0,
                  status: 'human_verified',
                }),
              ]
            );
            results.success++;
            await client.query(`RELEASE SAVEPOINT dish_${i}`);
          } catch (error: any) {
            // 回滚到保存点，不影响其他菜品
            await client.query(`ROLLBACK TO SAVEPOINT dish_${i}`);
            results.failed++;
            results.errors.push({
              row: rowIndex,
              dish_name: dish.dish_name || '未知',
              error: error.message || '插入失败',
            });
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return reply.send({
        message: '导入完成',
        results,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '批量上传失败' });
    }
  });

  // 单个添加通用菜品
  fastify.post('/dishes/common', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      const dish = request.body as any;

      // 验证必填字段
      if (!dish.dish_name || !dish.dish_type || !dish.cook_method8) {
        return reply.status(400).send({ message: '缺少必填字段：菜品名称、菜品类型、烹饪方式' });
      }

      // 检查是否存在重复菜品
      const existingResult = await pool.query(
        `SELECT id FROM dishes_common WHERE dish_name = $1 AND is_active = true`,
        [dish.dish_name]
      );

      if (existingResult.rows.length > 0) {
        return reply.status(400).send({ message: '该菜品已存在于通用菜库' });
      }

      // 插入新菜品
      const result = await pool.query(
        `INSERT INTO dishes_common (
          dish_name,
          dish_type,
          ingredient_tags,
          knife_skill,
          cuisine,
          cook_method8,
          flavor,
          main_ingredients,
          sub_ingredients,
          seasons,
          analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          dish.dish_name,
          dish.dish_type,
          dish.ingredient_tags || [],
          dish.knife_skill || null,
          dish.cuisine || null,
          dish.cook_method8,
          dish.flavor || null,
          dish.main_ingredients || [],
          dish.sub_ingredients || [],
          dish.seasons || [],
          JSON.stringify({
            auto_parsed: false,
            confidence: 1.0,
            status: 'human_verified',
          }),
        ]
      );

      return reply.send({
        message: '添加成功',
        dish: result.rows[0],
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '添加菜品失败' });
    }
  });

  // 下载通用菜品Excel模板
  fastify.get('/dishes/common/template', { preHandler: authenticateAdmin }, async (request, reply) => {
    try {
      // 返回模板的列定义和示例数据
      const template = {
        columns: [
          { key: 'dish_name', label: '菜品名称*', required: true },
          { key: 'dish_type', label: '菜品类型*', required: true, options: ['热菜主荤', '热菜半荤', '热菜素菜', '凉菜', '主食', '风味小吃', '汤', '酱汁', '饮料', '手工'] },
          { key: 'cook_method8', label: '烹饪方式*', required: true, options: ['炒', '熘', '蒸', '烧', '烤', '炖', '煎', '烹'] },
          { key: 'ingredient_tags', label: '食材特征', required: false, note: '多个用逗号分隔，如：禽,蔬', options: ['肉', '禽', '鱼', '蛋', '豆', '菌', '筋', '蔬'] },
          { key: 'knife_skill', label: '刀工', required: false, options: ['片', '丁', '粒', '米', '末', '茸', '丝', '条', '段', '块', '球', '花刀'] },
          { key: 'cuisine', label: '菜系', required: false, note: '如：川菜、粤菜、鲁菜等' },
          { key: 'flavor', label: '口味', required: false, note: '如：辣、酸甜、清淡等' },
          { key: 'main_ingredients', label: '主料', required: false, note: '多个用逗号分隔，如：鸡胸肉,花生' },
          { key: 'sub_ingredients', label: '辅料', required: false, note: '多个用逗号分隔，如：青椒,干辣椒' },
          { key: 'seasons', label: '季节', required: false, note: '多个用逗号分隔，如：春,夏,秋,冬', options: ['春', '夏', '秋', '冬'] },
        ],
        exampleData: [
          {
            '菜品名称*': '宫保鸡丁',
            '菜品类型*': '热菜主荤',
            '烹饪方式*': '炒',
            '热菜食材特征': '禽,蔬',
            '刀工': '丁',
            '菜系': '川菜',
            '口味': '辣',
            '主料': '鸡胸肉,花生',
            '辅料': '青椒,干辣椒,葱,姜,蒜',
            '是否春季菜': '是',
            '是否夏季菜': '是',
            '是否秋季菜': '是',
            '是否冬季菜': '是',
          },
          {
            '菜品名称*': '清蒸鲈鱼',
            '菜品类型*': '热菜主荤',
            '烹饪方式*': '蒸',
            '热菜食材特征': '鱼',
            '刀工': '',
            '菜系': '粤菜',
            '口味': '清淡',
            '主料': '鲈鱼',
            '辅料': '姜,葱,料酒',
            '是否春季菜': '是',
            '是否夏季菜': '是',
            '是否秋季菜': '否',
            '是否冬季菜': '否',
          },
        ],
      };

      return reply.send(template);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: '获取模板失败' });
    }
  });
}
