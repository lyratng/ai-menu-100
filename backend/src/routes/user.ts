import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool';
import * as bcrypt from 'bcrypt';

export default async function userRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/user/profile
   * 获取用户信息和默认配置
   */
  fastify.get('/profile', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      
      // 获取用户和门店信息
      const result = await query(
        `SELECT 
          u.id,
          u.username,
          s.id as store_id,
          s.name as store_name,
          s.default_config
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.id = $1`,
        [user.userId]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: '用户不存在' });
      }
      
      const userData = result.rows[0];
      
      reply.send({
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          store_id: userData.store_id,
          store_name: userData.store_name,
          default_config: userData.default_config || {
            breakfast: { cold: 5, pickles: 5, western: 3, soup: 5, staple: 15, egg: 2 },
            lunch: { cold: 4, hot: 18, soup: 4, western: 3, staple: 7, special: 6 },
            dinner: { cold: 4, hot: 18, soup: 4, western: 2, staple: 6, special: 7 },
            supper: { cold: 4, hot: 3, soup: 3, staple: 6, special: 2 },
          },
        },
      });
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      reply.code(500).send({
        error: error.message || '获取用户信息失败',
      });
    }
  });

  /**
   * POST /api/user/update-config
   * 更新用户的默认配置
   */
  fastify.post('/update-config', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { default_config } = request.body as any;
      
      if (!default_config) {
        return reply.code(400).send({ error: '缺少配置数据' });
      }
      
      // 更新门店的默认配置
      await query(
        `UPDATE stores 
         SET default_config = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(default_config), user.storeId]
      );
      
      console.log(`✅ 用户 ${user.userId} 更新了默认配置`);
      
      reply.send({
        success: true,
        message: '配置更新成功',
      });
    } catch (error: any) {
      console.error('更新配置失败:', error);
      reply.code(500).send({
        error: error.message || '更新配置失败',
      });
    }
  });

  /**
   * POST /api/user/change-password
   * 修改密码
   */
  fastify.post('/change-password', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { current_password, new_password } = request.body as any;
      
      if (!current_password || !new_password) {
        return reply.code(400).send({ error: '缺少必要参数' });
      }
      
      if (new_password.length < 6) {
        return reply.code(400).send({ error: '新密码长度至少6位' });
      }
      
      // 验证当前密码
      const userResult = await query(
        `SELECT password FROM users WHERE id = $1`,
        [user.userId]
      );
      
      if (userResult.rows.length === 0) {
        return reply.code(404).send({ error: '用户不存在' });
      }
      
      const currentHashedPassword = userResult.rows[0].password;
      const isPasswordValid = await bcrypt.compare(current_password, currentHashedPassword);
      
      if (!isPasswordValid) {
        return reply.code(401).send({ error: '当前密码错误' });
      }
      
      // 生成新密码的hash
      const newHashedPassword = await bcrypt.hash(new_password, 10);
      
      // 更新密码
      await query(
        `UPDATE users 
         SET password = $1, updated_at = NOW()
         WHERE id = $2`,
        [newHashedPassword, user.userId]
      );
      
      console.log(`✅ 用户 ${user.userId} 修改了密码`);
      
      reply.send({
        success: true,
        message: '密码修改成功',
      });
    } catch (error: any) {
      console.error('修改密码失败:', error);
      reply.code(500).send({
        error: error.message || '修改密码失败',
      });
    }
  });
}

