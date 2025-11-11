import { query } from '../db/pool.js';
import { chatCompletion } from './ai/deepseek.js';

interface ParsedMenu {
  dishes_store_upserts: Array<{
    dish_name: string;
    dish_type: string;
    ingredient_tags: string[];
    cook_method8: string;
  }>;
  menu_items_json: {
    days: Array<{
      day_label: string;
      lunch: Array<{
        dish_name: string;
        dish_id: null;
      }>;
    }>;
  };
}

/**
 * 解析菜单并UPSERT菜品到dishes_store
 */
export async function parseMenuAndUpsertDishes(
  menuId: string,
  storeId: string,
  progressCallback?: (progress: number) => void
) {
  try {
    console.log(`\n🔍 开始解析菜单: ${menuId}`);
    
    // 1. 从数据库获取菜单数据
    progressCallback?.(10);
    const menuResult = await query(
      `SELECT menu_items_json FROM menus WHERE id = $1`,
      [menuId]
    );
    
    if (menuResult.rows.length === 0) {
      throw new Error(`菜单不存在: ${menuId}`);
    }
    
    const rawMenuItems = menuResult.rows[0].menu_items_json;
    console.log('📋 原始菜单数据:', rawMenuItems);
    
    // 2. 构建AI提示词
    progressCallback?.(20);
    const { systemPrompt, userPrompt } = buildParsePrompt(storeId, rawMenuItems);
    
    console.log('🤖 调用AI解析菜单...');
    console.log('📝 System Prompt长度:', systemPrompt.length);
    console.log('📝 User Prompt长度:', userPrompt.length);
    
    // 3. 调用DeepSeek AI解析
    progressCallback?.(30);
    const aiResponse = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.3, // 降低温度以获得更确定的结果
      max_tokens: 8192, // 降低到8192避免超出API限制（DeepSeek可能不支持16000）
    });
    
    console.log('✅ AI解析完成');
    console.log('📄 AI响应长度:', aiResponse.content.length);
    console.log('📊 Tokens使用:', aiResponse.usage);
    
    // 4. 解析AI返回的JSON
    progressCallback?.(50);
    let parsedData: ParsedMenu;
    try {
      const responseContent = aiResponse.content;
      console.log('🔍 响应内容（前200字符）:', responseContent.substring(0, 200));
      console.log('🔍 响应内容（后200字符）:', responseContent.substring(responseContent.length - 200));
      
      // 移除可能的markdown包裹
      let jsonStr = responseContent.trim();
      
      // 如果以```开头，移除markdown代码块标记
      if (jsonStr.startsWith('```')) {
        console.log('⚠️  检测到markdown代码块，正在移除...');
        // 移除开头的```json或```
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '');
        // 移除结尾的```
        jsonStr = jsonStr.replace(/\n?```\s*$/, '');
        console.log('✅ 移除markdown标记后（前100字符）:', jsonStr.substring(0, 100));
      }
      
      parsedData = JSON.parse(jsonStr);
      console.log('✅ JSON解析成功');
    } catch (error: any) {
      console.error('❌ JSON解析失败:', error.message);
      console.error('📄 AI原始响应（前500字符）:', aiResponse.content.substring(0, 500));
      throw new Error(`AI返回的JSON格式错误: ${error.message}`);
    }
    
    // 5. UPSERT菜品到dishes_store
    progressCallback?.(60);
    console.log(`📥 开始UPSERT ${parsedData.dishes_store_upserts.length} 道菜品...`);
    
    const dishIdMap = new Map<string, string>(); // 菜名 -> dish_id
    
    for (const dish of parsedData.dishes_store_upserts) {
      const dishResult = await query(
        `INSERT INTO dishes_store (
          store_id, dish_name, dish_type, ingredient_tags,
          cook_method8, analysis
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        ON CONFLICT (store_id, dish_name)
        DO UPDATE SET
          dish_type = EXCLUDED.dish_type,
          ingredient_tags = EXCLUDED.ingredient_tags,
          cook_method8 = EXCLUDED.cook_method8,
          analysis = EXCLUDED.analysis
        RETURNING id`,
        [
          storeId,
          dish.dish_name,
          dish.dish_type,
          dish.ingredient_tags,
          dish.cook_method8,
          JSON.stringify({ auto_parsed: true, confidence: 0.85, status: 'uploaded_by_user' }),
        ]
      );
      
      dishIdMap.set(dish.dish_name, dishResult.rows[0].id);
    }
    
    console.log(`✅ UPSERT完成，共${dishIdMap.size}道菜品`);
    
    // 6. 回填dish_id到menu_items_json
    progressCallback?.(80);
    const updatedMenuItems = parsedData.menu_items_json;
    for (const day of updatedMenuItems.days) {
      for (const item of day.lunch) {
        const dishId = dishIdMap.get(item.dish_name);
        if (dishId) {
          (item as any).dish_id = dishId;
        }
      }
    }
    
    // 7. 更新menus表
    progressCallback?.(90);
    await query(
      `UPDATE menus SET
        menu_items_json = $1,
        meta_json = jsonb_set(meta_json, '{pipeline_status}', '"parsed"')
      WHERE id = $2`,
      [
        JSON.stringify(updatedMenuItems),
        menuId,
      ]
    );
    
    console.log('✅ 菜单更新完成');
    progressCallback?.(100);
    
    return {
      success: true,
      dishCount: dishIdMap.size,
    };
    
  } catch (error: any) {
    console.error('❌ 菜单解析失败:', error);
    
    // 更新为失败状态
    await query(
      `UPDATE menus SET
        meta_json = jsonb_set(
          jsonb_set(meta_json, '{pipeline_status}', '"parse_failed"'),
          '{error}', $1
        )
      WHERE id = $2`,
      [JSON.stringify(error.message), menuId]
    );
    
    throw error;
  }
}

/**
 * 构建解析提示词
 */
function buildParsePrompt(storeId: string, menuItems: any): { systemPrompt: string; userPrompt: string } {
  // System Prompt - 固定（来自PRD）
  const systemPrompt = `你是一名团餐数据解析员，职责是：从"某食堂上传的一周午餐菜单"（仅有菜名）中，把每道菜解析成结构化标签，形成食堂专属菜库的数据。

【输出要求】
- 只输出一个简洁的JSON对象，无自然语言、注释、markdown标记。
- 所有枚举与字段名必须与Schema完全一致。

【字段规则】
- dish_name: 原始菜名
- dish_type: ["热菜主荤","热菜半荤","热菜素菜","凉菜","主食","风味小吃","汤","酱汁","饮料","手工"]其一
- ingredient_tags: ["肉","禽","鱼","蛋","豆","菌","筋","蔬"]多选
- cook_method8: ["炒","熘","蒸","烧","烤","炖","煎","烹"]其一，必填

【输出Schema】
{"dishes_store_upserts":[{"dish_name":"string","dish_type":"string","ingredient_tags":["string"],"cook_method8":"string"}],"menu_items_json":{"days":[{"day_label":"string","lunch":[{"dish_name":"string","dish_id":null}]}]}}`;

  // User Prompt - 包含实际菜单数据
  const userPrompt = `【门店信息】
store_id: ${storeId}

【一周午餐菜单（Excel已转成结构化，按天列出菜名数组）】
${JSON.stringify(menuItems, null, 2)}

请严格按照JSON格式输出。`;

  return { systemPrompt, userPrompt };
}

