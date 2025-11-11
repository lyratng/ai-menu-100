import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool';

export default async function dishRoutes(fastify: FastifyInstance) {
  // 获取门店专属菜库列表
  fastify.get('/store', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const q = request.query as any;
      const {
        store_id,
        page = '1',
        page_size = '50',
        keyword,
        dish_type,
        cook_method8,
      } = q;
      
      if (!store_id) {
        return reply.code(400).send({ error: 'store_id是必填参数' });
      }
      
      const offset = (parseInt(page) - 1) * parseInt(page_size);
      
      let whereClause = 'WHERE store_id = $1 AND is_active = TRUE';
      const params: any[] = [store_id];
      let paramIndex = 2;
      
      if (keyword) {
        whereClause += ` AND dish_name LIKE $${paramIndex}`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      if (dish_type) {
        whereClause += ` AND dish_type = $${paramIndex}`;
        params.push(dish_type);
        paramIndex++;
      }
      
      if (cook_method8) {
        whereClause += ` AND cook_method8 = $${paramIndex}`;
        params.push(cook_method8);
        paramIndex++;
      }
      
      const result = await query(
        `SELECT 
          id, dish_name, dish_type, cook_method8, ingredient_tags,
          knife_skill, flavor, is_spicy, source_upload_id, created_at
        FROM dishes_store
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, parseInt(page_size), offset]
      );
      
      const countResult = await query(
        `SELECT COUNT(*) as total FROM dishes_store ${whereClause}`,
        params
      );
      
      reply.send({
        success: true,
        data: {
          items: result.rows,
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          page_size: parseInt(page_size),
        },
      });
    } catch (error: any) {
      fastify.log.error('获取专属菜库失败:', error);
      reply.code(500).send({
        error: error.message || '获取专属菜库失败',
      });
    }
  });

  // 其他路由类似简化...
  fastify.get('/common', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    reply.send({ success: true, data: { items: [], total: 0 } });
  });
  
  fastify.post('/store', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    reply.send({ success: true });
  });
  
  fastify.put('/store/:id', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    reply.send({ success: true });
  });
  
  fastify.delete('/store/:id', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    reply.send({ success: true });
  });
  
  fastify.get('/store/stats', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
    reply.send({ success: true, data: { total: 0 } });
  });
}
