import type { FastifyInstance } from 'fastify';
import { generateMenu } from '../services/menu';
import { uploadHistoryMenu, getUploadHistory, retryParsing, getParsingQueueStatus } from '../services/menuUpload';
import { pool, query } from '../db/pool';

interface GenerateMenuRequest {
  store_id: string;
  days: number;
  meal_type: 'lunch' | 'dinner';
  hot_dish_total_per_day: number;
  cold_per_day: number;
  main_meat_per_day: number;
  half_meat_per_day: number;
  veggie_hot_per_day: number;
  staffing_tight: boolean;
  cook_method8_available: string[];
  spicy_level: 'no_spicy' | 'mild' | 'medium';
  flavor_diversity_required: boolean;
  ingredient_diversity_requirement: string;
  used_history_ratio: number;
  model?: string;
}

export default async function menuRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/menu/generate
   * 生成菜单
   */
  fastify.post('/generate', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const userId = user?.id || 'system';
      const menuRequest = request.body as GenerateMenuRequest;
      
      if (!menuRequest.store_id || !menuRequest.days) {
        return reply.code(400).send({
          error: 'store_id和days是必填参数',
        });
      }
      
      const storeCheck = await query(
        'SELECT id FROM stores WHERE id = $1 AND is_active = TRUE',
        [menuRequest.store_id]
      );
      
      if (storeCheck.rows.length === 0) {
        return reply.code(404).send({ error: '门店不存在' });
      }
      
      const result = await generateMenu(menuRequest, userId);
      
      reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ 生成菜单失败 - 详细错误:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      fastify.log.error('生成菜单失败:', error.message);
      reply.code(500).send({
        error: error.message || '生成菜单失败',
      });
    }
  });

  /**
   * POST /api/menu/upload
   * 上传历史菜单Excel
   */
  fastify.post('/upload', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: '请上传文件' });
      }
      
      const buffer = await data.toBuffer();
      const fileName = data.filename;
      
      const fields = data.fields as any;
      const storeId = (fields.store_id as any)?.value;
      const mealType = (fields.meal_type as any)?.value || 'lunch';
      
      if (!storeId) {
        return reply.code(400).send({ error: 'store_id是必填参数' });
      }
      
      const user = (request as any).user;
      const userId = user?.id || null;
      
      const result = await uploadHistoryMenu(
        buffer,
        fileName,
        storeId,
        userId,
        mealType
      );
      
      reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error('上传菜单失败:', error);
      reply.code(500).send({
        error: error.message || '上传菜单失败',
      });
    }
  });

  /**
   * GET /api/menu/upload/history
   */
  fastify.get('/upload/history', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      const { store_id, page = '1', page_size = '20' } = query;
      
      if (!store_id) {
        return reply.code(400).send({ error: 'store_id是必填参数' });
      }
      
      const result = await getUploadHistory(
        store_id,
        parseInt(page),
        parseInt(page_size)
      );
      
      reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error('获取上传历史失败:', error);
      reply.code(500).send({
        error: error.message || '获取上传历史失败',
      });
    }
  });

  /**
   * POST /api/menu/upload/retry
   */
  fastify.post('/upload/retry', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const body = request.body as any;
      const { menu_id } = body;
      const user = (request as any).user;
      const storeId = user?.storeId || user?.store_id;
      
      if (!menu_id) {
        return reply.code(400).send({ error: 'menu_id是必填参数' });
      }
      
      if (!storeId) {
        return reply.code(403).send({ error: '无权限：用户未绑定门店' });
      }
      
      const result = await retryParsing(menu_id, storeId);
      
      reply.send({
        success: true,
        message: '重新解析任务已提交',
        job_id: result.job_id,
      });
    } catch (error: any) {
      fastify.log.error('重新解析失败:', error);
      reply.code(500).send({
        error: error.message || '重新解析失败',
      });
    }
  });

  /**
   * GET /api/menu/upload/queue-status
   */
  fastify.get('/upload/queue-status', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      const { store_id } = query;
      
      if (!store_id) {
        return reply.code(400).send({ error: 'store_id是必填参数' });
      }
      
      const status = await getParsingQueueStatus(store_id);
      
      reply.send({
        success: true,
        data: status,
      });
    } catch (error: any) {
      fastify.log.error('获取队列状态失败:', error);
      reply.code(500).send({
        error: error.message || '获取队列状态失败',
      });
    }
  });

  /**
   * GET /api/menu/list
   */
  fastify.get('/list', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const queryParams = request.query as any;
      const { store_id, page = '1', page_size = '20', source_type } = queryParams;
      
      if (!store_id) {
        return reply.code(400).send({ error: 'store_id是必填参数' });
      }
      
      const offset = (parseInt(page) - 1) * parseInt(page_size);
      
      let whereClause = 'WHERE store_id = $1 AND is_active = TRUE';
      const params: any[] = [store_id];
      
      if (source_type) {
        whereClause += ' AND source_type = $2';
        params.push(source_type);
      }
      
      const result = await query(
        `SELECT 
          id, title, days, meal_type, source_type,
          used_history_ratio, created_at, updated_at,
          menu_stats_json
        FROM menus
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, parseInt(page_size), offset]
      );
      
      const countResult = await query(
        `SELECT COUNT(*) as total FROM menus ${whereClause}`,
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
      fastify.log.error('获取菜单列表失败:', error);
      reply.code(500).send({
        error: error.message || '获取菜单列表失败',
      });
    }
  });

  /**
   * GET /api/menu/:id
   */
  fastify.get('/:id', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const params = request.params as any;
      const { id } = params;
      
      const result = await query(
        `SELECT 
          id, store_id, title, days, meal_type, source_type,
          menu_items_json, gen_options_json, menu_stats_json,
          used_history_ratio, created_at, updated_at
        FROM menus
        WHERE id = $1 AND is_active = TRUE`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: '菜单不存在' });
      }
      
      let menu = result.rows[0];
      
      // 如果是上传的菜单，补充菜品详细信息
      if (menu.source_type === 'uploaded' && menu.menu_items_json?.days) {
        const enrichedDays = await Promise.all(
          menu.menu_items_json.days.map(async (day: any) => {
            const enrichedLunch = await Promise.all(
              (day.lunch || []).map(async (item: any) => {
                if (item.dish_id) {
                  try {
                    const dishResult = await pool.query(
                      `SELECT 
                        dish_type, cook_method8, flavor, cuisine,
                        ingredient_tags, knife_skill, main_ingredients
                      FROM dishes_store
                      WHERE id = $1`,
                      [item.dish_id]
                    );
                    
                    if (dishResult.rows.length > 0) {
                      const dish = dishResult.rows[0];
                      
                      // 生成描述和烹饪方法
                      const dishTypeText = dish.dish_type || '特色';
                      const flavorText = dish.flavor || '美味';
                      const cuisineText = dish.cuisine ? `${dish.cuisine}风味，` : '';
                      const description = `${cuisineText}${dishTypeText}菜品，${flavorText}可口，营养丰富。`;
                      
                      const method = dish.cook_method8 || '烹制';
                      const cookingMethod = `采用${method}工艺精心制作，火候适中，口感上佳。`;
                      
                      return {
                        ...item,
                        dish_type: dish.dish_type,
                        tags: {
                          ingredient_tags: dish.ingredient_tags,
                          cook_method8: dish.cook_method8,
                          knife_skill: dish.knife_skill,
                          flavor: dish.flavor,
                        },
                        description,
                        cookingMethod,
                      };
                    }
                  } catch (err) {
                    console.error(`查询菜品详情失败 (dish_id: ${item.dish_id}):`, err);
                  }
                }
                
                return {
                  ...item,
                  description: item.description || '',
                  cookingMethod: item.cookingMethod || '',
                };
              })
            );
            
            return {
              ...day,
              lunch: enrichedLunch,
            };
          })
        );
        
        menu = {
          ...menu,
          menu_items_json: {
            ...menu.menu_items_json,
            days: enrichedDays,
          },
        };
      }
      
      reply.send({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      fastify.log.error('获取菜单详情失败:', error);
      reply.code(500).send({
        error: error.message || '获取菜单详情失败',
      });
    }
  });

  /**
   * DELETE /api/menu/:id
   * 删除菜单（软删除，验证用户权限）
   */
  fastify.delete('/:id', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const params = request.params as any;
      const { id } = params;
      
      // 验证菜单是否属于该用户
      const checkResult = await query(
        `SELECT id FROM menus WHERE id = $1 AND store_id = $2`,
        [id, user.store_id]
      );
      
      if (checkResult.rows.length === 0) {
        return reply.code(404).send({ error: '菜单不存在或无权限删除' });
      }
      
      // 软删除：设置is_active=false
      await query(
        'UPDATE menus SET is_active = FALSE WHERE id = $1',
        [id]
      );
      
      reply.send({
        success: true,
        message: '菜单删除成功',
      });
    } catch (error: any) {
      fastify.log.error('删除菜单失败:', error);
      reply.code(500).send({
        error: error.message || '删除菜单失败',
      });
    }
  });

  /**
   * GET /api/menu/history
   * 获取用户的历史菜单列表（生成的和上传的）
   */
  fastify.get('/history', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const user = (request as any).user;
    const { source_type, limit = '10' } = request.query as any;
    
    try {
      let queryStr = `
        SELECT 
          id,
          title,
          source_type,
          created_at,
          days,
          meal_type,
          menu_items_json,
          gen_options_json
        FROM menus
        WHERE store_id = $1 AND is_active = TRUE
      `;
      
      const params: any[] = [user.storeId];
      
      // 如果指定了source_type，则过滤
      if (source_type) {
        queryStr += ` AND source_type = $2`;
        params.push(source_type);
        queryStr += ` ORDER BY created_at DESC LIMIT $3`;
        params.push(parseInt(limit));
      } else {
        queryStr += ` ORDER BY created_at DESC LIMIT $2`;
        params.push(parseInt(limit));
      }
      
      const result = await pool.query(queryStr, params);
      
      // 对每个菜单，补充菜品的详细信息（description和cookingMethod）
      const enrichedMenus = await Promise.all(
        result.rows.map(async (menu: any) => {
          // 如果是上传的菜单，需要关联查询dishes_store补充信息
          if (menu.source_type === 'uploaded' && menu.menu_items_json?.days) {
            const enrichedDays = await Promise.all(
              menu.menu_items_json.days.map(async (day: any) => {
                const enrichedLunch = await Promise.all(
                  (day.lunch || []).map(async (item: any) => {
                    // 如果有dish_id，查询dishes_store获取详细信息
                    if (item.dish_id) {
                      try {
                        const dishResult = await pool.query(
                          `SELECT 
                            dish_type, cook_method8, flavor, cuisine,
                            ingredient_tags, knife_skill, main_ingredients
                          FROM dishes_store
                          WHERE id = $1`,
                          [item.dish_id]
                        );
                        
                        if (dishResult.rows.length > 0) {
                          const dish = dishResult.rows[0];
                          
                          // 生成描述（参考menu.ts的模板）
                          const dishTypeText = dish.dish_type || '特色';
                          const flavorText = dish.flavor || '美味';
                          const cuisineText = dish.cuisine ? `${dish.cuisine}风味，` : '';
                          const description = `${cuisineText}${dishTypeText}菜品，${flavorText}可口，营养丰富。`;
                          
                          // 生成烹饪方法
                          const method = dish.cook_method8 || '烹制';
                          const cookingMethod = `采用${method}工艺精心制作，火候适中，口感上佳。`;
                          
                          return {
                            ...item,
                            dish_type: dish.dish_type,
                            tags: {
                              ingredient_tags: dish.ingredient_tags,
                              cook_method8: dish.cook_method8,
                              knife_skill: dish.knife_skill,
                              flavor: dish.flavor,
                            },
                            description,
                            cookingMethod,
                          };
                        }
                      } catch (err) {
                        console.error(`查询菜品详情失败 (dish_id: ${item.dish_id}):`, err);
                      }
                    }
                    
                    // 如果没有dish_id或查询失败，返回原始数据
                    return {
                      ...item,
                      description: item.description || '',
                      cookingMethod: item.cookingMethod || '',
                    };
                  })
                );
                
                return {
                  ...day,
                  lunch: enrichedLunch,
                };
              })
            );
            
            return {
              ...menu,
              menu_items_json: {
                ...menu.menu_items_json,
                days: enrichedDays,
              },
            };
          }
          
          // 生成的菜单已经包含完整信息，直接返回
          return menu;
        })
      );
      
      reply.send({
        success: true,
        menus: enrichedMenus,
      });
    } catch (error: any) {
      console.error('=== 获取历史菜单失败 - 完整错误 ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('User:', JSON.stringify(user, null, 2));
      console.error('Store ID:', user?.storeId);
      console.error('Source type:', source_type);
      console.error('=====================================');
      
      reply.code(500).send({
        error: error.message || '获取历史菜单失败',
      });
    }
  });

  /**
   * GET /api/menu/parse-status
   * 获取解析队列状态（用于状态栏）
   */
  fastify.get('/parse-status', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const status = await getParsingQueueStatus(user.storeId);
      
      reply.send(status);
    } catch (error: any) {
      console.error('获取解析状态失败:', error);
      reply.code(500).send({
        error: error.message || '获取解析状态失败',
      });
    }
  });

  /**
   * POST /api/menu/:id/retry-parse
   * 重新解析失败的菜单
   */
  fastify.post('/:id/retry-parse', {
    preHandler: [(fastify as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as any;
      
      const result = await retryParsing(id, user.storeId);
      
      reply.send({
        success: true,
        job_id: result.job_id,
      });
    } catch (error: any) {
      console.error('重新解析失败:', error);
      reply.code(500).send({
        error: error.message || '重新解析失败',
      });
    }
  });

}
