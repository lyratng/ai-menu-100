import { query, getClient } from '../db/pool';
import { chatCompletion as deepseekChat } from './ai/deepseek';
import { chatCompletion as openaiChat } from './ai/openai';

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

interface GeneratedDishDetail {
  name: string;
  description: string;
  cookingMethod: string;
}

/**
 * 生成菜单 - 核心业务逻辑
 */
export async function generateMenu(
  request: GenerateMenuRequest,
  userId: string
) {
  console.log('🍳 开始生成菜单...', {
    store_id: request.store_id,
    days: request.days,
    used_history_ratio: request.used_history_ratio,
  });
  
  // 1. 检查历史菜品是否充足（专属菜库 + 历史菜单）
  if (request.used_history_ratio > 0) {
    console.log('📊 检查历史菜品...');
    
    // 检查专属菜库
    const storeDishCountResult = await query(
      'SELECT COUNT(*) as count FROM dishes_store WHERE store_id = $1 AND is_active = TRUE',
      [request.store_id]
    );
    const storeDishCount = parseInt(storeDishCountResult.rows[0].count);
    console.log(`专属菜库数量: ${storeDishCount}道`);
    
    // 检查历史菜单中的菜品
    const historyMenusResult = await query(
      `SELECT menu_items_json
       FROM menus
       WHERE store_id = $1 AND is_active = TRUE AND source_type = 'uploaded'
       ORDER BY created_at DESC
       LIMIT 10`,
      [request.store_id]
    );
    
    const historyDishNames = new Set<string>();
    historyMenusResult.rows.forEach((menu: any) => {
      const menuData = menu.menu_items_json;
      if (menuData && menuData.days && Array.isArray(menuData.days)) {
        menuData.days.forEach((day: any) => {
          const dishes = day.lunch || [];
          dishes.forEach((dish: any) => {
            const dishName = typeof dish === 'string' ? dish : dish.dish_name;
            if (dishName) {
              historyDishNames.add(dishName);
            }
          });
        });
      }
    });
    
    const historyDishCount = historyDishNames.size;
    console.log(`历史菜单菜品数量: ${historyDishCount}道`);
    
    const totalHistoryDishes = storeDishCount + historyDishCount;
    console.log(`历史菜品总数: ${totalHistoryDishes}道（专属菜库 + 历史菜单）`);
    
    const minRequired = 50;
    if (totalHistoryDishes < minRequired) {
      throw new Error(
        `您的历史菜品数量不足（当前${totalHistoryDishes}道，建议至少${minRequired}道），` +
        `建议先上传更多历史菜单或将历史菜占比设为0%`
      );
    }
  }
  
  // 2. 计算需要检索的菜品数量
  const totalDishesPerWeek = (request.hot_dish_total_per_day + request.cold_per_day) * request.days;
  const historyDishCount = Math.round(totalDishesPerWeek * request.used_history_ratio);
  const commonDishCount = totalDishesPerWeek - historyDishCount;
  console.log(`需要菜品: ${totalDishesPerWeek}道 (专属${historyDishCount}, 通用${commonDishCount})`);
  
  // 3. 简化检索策略 - 直接获取所有可用菜品
  console.log('🔍 获取菜品数据...');
  const dishes = await fetchAllAvailableDishes(
    request.store_id,
    request.used_history_ratio
  );
  console.log(`✅ 获取到 ${dishes.length} 道菜品`);
  
  // 4. 构建Prompt并调用AI
  console.log('🤖 构建AI Prompt...');
  console.log(`⏱️  [时间戳] ${new Date().toISOString()} - 开始构建Prompt`);
  
  const prompt = buildMenuGenerationPrompt(request, dishes);
  
  console.log(`⏱️  [时间戳] ${new Date().toISOString()} - Prompt构建完成`);
  console.log(`📏 Prompt长度: system=${prompt.systemPrompt.length}字符, user=${prompt.userPrompt.length}字符`);
  console.log(`📏 总长度: ${prompt.systemPrompt.length + prompt.userPrompt.length}字符`);
  console.log(`📝 System Prompt (前300字):\n${prompt.systemPrompt.substring(0, 300)}...`);
  console.log(`📝 User Prompt (前500字):\n${prompt.userPrompt.substring(0, 500)}...`);
  console.log(`📝 User Prompt (后500字):\n...${prompt.userPrompt.substring(prompt.userPrompt.length - 500)}`);
  
  // 估算tokens (中文约1.5字符=1token, 英文约4字符=1token)
  const estimatedTokens = Math.ceil((prompt.systemPrompt.length + prompt.userPrompt.length) / 2);
  console.log(`💰 预估tokens: ${estimatedTokens} (实际可能略有差异)`);
  
  if (estimatedTokens > 8000) {
    console.warn(`⚠️  警告：预估tokens(${estimatedTokens})可能超过模型限制，可能导致超时`);
  }
  
  const aiFunction = request.model === 'gpt-5-chat' ? openaiChat : deepseekChat;
  
  console.log(`🚀 调用${request.model}，请耐心等待...`);
  console.log(`⏱️  [时间戳] ${new Date().toISOString()} - 开始调用AI`);
  const startTime = Date.now();
  
  let aiResponse: any;
  let latency = 0; // 在外部定义，确保作用域正确
  
  try {
    aiResponse = await Promise.race([
      aiFunction(
        [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt },
        ],
        {
          temperature: 0.7,
          max_tokens: 4000, // 增加到4000以确保完整输出
        }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI调用超时（90秒）')), 90000)
      )
    ]) as any;
    
    latency = Date.now() - startTime;
    console.log(`⏱️  [时间戳] ${new Date().toISOString()} - AI响应完成`);
    console.log(`✅ AI响应成功，耗时: ${latency}ms (${(latency/1000).toFixed(1)}秒)`);
    console.log(`📊 AI响应tokens: prompt=${aiResponse.usage?.prompt_tokens}, completion=${aiResponse.usage?.completion_tokens}, total=${aiResponse.usage?.total_tokens}`);
  } catch (error: any) {
    console.error(`⏱️  [时间戳] ${new Date().toISOString()} - AI调用失败`);
    console.error('❌ AI调用失败:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0],
    });
    
    // 根据错误类型提供更友好的错误信息
    if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
      throw new Error('AI服务连接中断，请检查网络或稍后重试');
    } else if (error.message.includes('超时')) {
      throw new Error('AI服务响应超时，请稍后重试');
    } else {
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }
  
  // 5. 解析AI返回的JSON
  console.log('📝 AI原始返回内容（前1000字符）:');
  console.log(aiResponse.content.substring(0, 1000));
  console.log('📝 AI原始返回内容（后500字符）:');
  console.log(aiResponse.content.substring(Math.max(0, aiResponse.content.length - 500)));
  
  let generatedMenu: any;
  try {
    // 移除可能的markdown包裹（```json ... ```）
    let cleanContent = aiResponse.content.trim();
    if (cleanContent.startsWith('```')) {
      // 移除开头的```json或```
      cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '');
      // 移除结尾的```
      cleanContent = cleanContent.replace(/\n?```\s*$/, '');
    }
    
    console.log('🔍 清理后的内容（前500字符）:');
    console.log(cleanContent.substring(0, 500));
    console.log('🔍 清理后的内容（后500字符）:');
    console.log(cleanContent.substring(Math.max(0, cleanContent.length - 500)));
    
    // 尝试直接解析
    try {
      generatedMenu = JSON.parse(cleanContent);
      console.log('✅ JSON解析成功（直接解析）');
    } catch (directError) {
      console.log('⚠️  直接解析失败，尝试提取JSON...');
      // 提取JSON（可能被其他文本包裹）
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ 未找到JSON格式的内容');
        throw new Error('AI返回格式错误：未找到JSON');
      }
      
      console.log('🔍 提取到的JSON（前500字符）:');
      console.log(jsonMatch[0].substring(0, 500));
      
      generatedMenu = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON解析成功（提取后解析）');
    }
    
    console.log('📊 生成的菜单结构:', Object.keys(generatedMenu));
    
    // 处理AI可能返回的嵌套格式（AI有时会按菜品类型分组）
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      const dayData = generatedMenu[day];
      
      // 如果是对象（嵌套格式），需要扁平化
      if (dayData && typeof dayData === 'object' && !Array.isArray(dayData)) {
        console.log(`⚠️  ${day} 是嵌套对象，正在扁平化...`);
        const flatDishes: string[] = [];
        
        // 遍历所有菜品类型的数组
        Object.values(dayData).forEach(dishArray => {
          if (Array.isArray(dishArray)) {
            flatDishes.push(...dishArray);
          }
        });
        
        generatedMenu[day] = flatDishes;
        console.log(`✅ ${day} 扁平化完成: ${flatDishes.length} 道菜`);
      }
    });
    
    // 再次检查每天的菜品数量
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      const dayDishes = generatedMenu[day];
      
      if (Array.isArray(dayDishes)) {
        console.log(`   ${day}: ${dayDishes.length} 道菜`);
        if (dayDishes.length > 0) {
          const firstDish = dayDishes[0];
          const dishName = typeof firstDish === 'string' ? firstDish : (firstDish.name || JSON.stringify(firstDish));
          console.log(`     第1道: ${dishName}`);
        }
      } else {
        console.log(`   ❌ ${day}: 不是数组`);
      }
    });
  } catch (error: any) {
    console.error('❌ 解析AI返回失败:', error.message);
    console.log('⚠️  使用兜底策略生成空菜单');
    // 使用兜底策略
    generatedMenu = await fallbackMenuGeneration(request, dishes);
  }
  
  // 6. 匹配菜名到dish_id
  const menuWithIds = await matchDishIds(generatedMenu, request.store_id, dishes);
  
  // 7. 计算统计数据
  const stats = calculateMenuStats(menuWithIds, request);
  
  // 8. 保存到数据库
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 插入菜单记录
    console.log('💾 保存菜单到数据库...');
    const menuResult = await client.query(
      `INSERT INTO menus (
        store_id, source_type, title, days, meal_type,
        menu_items_json, gen_options_json, menu_stats_json,
        used_history_ratio, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`,
      [
        request.store_id,
        'generated',
        `${request.days}天${request.meal_type}菜单`,
        request.days,
        request.meal_type,
        JSON.stringify(menuWithIds.menu_items_json),
        JSON.stringify({
          hot_dish_total_per_day: request.hot_dish_total_per_day,
          main_meat_per_day: request.main_meat_per_day,
          half_meat_per_day: request.half_meat_per_day,
          veggie_hot_per_day: request.veggie_hot_per_day,
          cold_per_day: request.cold_per_day,
          staffing_tight: request.staffing_tight,
          cook_method8_used: request.cook_method8_available,
          spicy_ratio_target: request.spicy_level === 'no_spicy' ? 0 : request.spicy_level === 'mild' ? 0.15 : 0.30,
          flavor_diversity_required: request.flavor_diversity_required,
          ingredient_diversity_requirement: request.ingredient_diversity_requirement,
          used_history_ratio: request.used_history_ratio,
          analysis: {
            auto_parsed: false,
            confidence: 1.0,
            status: 'generated_by_system',
          },
        }),
        JSON.stringify(stats),
        request.used_history_ratio,
      ]
    );
    console.log('✅ 菜单记录已保存，ID:', menuResult.rows[0].id);
    
    const menuId = menuResult.rows[0].id;
    
    // 记录生成事件
    console.log('📝 记录生成事件...');
    await client.query(
      `INSERT INTO generation_events (
        store_id, menu_id, latency_ms,
        model_used, prompt_tokens, completion_tokens, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        request.store_id,
        menuId,
        latency,
        request.model || 'deepseek-chat',
        aiResponse.usage.prompt_tokens,
        aiResponse.usage.completion_tokens,
        JSON.stringify({
          request_params: request,
          dish_count: dishes.length,
          user_id: userId,
        }),
      ]
    );
    console.log('✅ 生成事件已记录');
    
    await client.query('COMMIT');
    
    // 转换为前端需要的格式
    console.log('🔄 开始转换菜单格式...');
    console.log('📊 menu_items_json:', JSON.stringify(menuWithIds.menu_items_json, null, 2));
    console.log('📊 generated_details:', JSON.stringify(menuWithIds.generated_details, null, 2));
    
    const frontendMenu: any = {};
    const dayMapping: Record<string, string> = {
      '周一': 'monday',
      '周二': 'tuesday',
      '周三': 'wednesday',
      '周四': 'thursday',
      '周五': 'friday',
    };
    
    if (menuWithIds.menu_items_json && menuWithIds.menu_items_json.days) {
      menuWithIds.menu_items_json.days.forEach((day: any, dayIndex: number) => {
        console.log(`🔍 处理第 ${dayIndex + 1} 天:`, day.day_label);
        console.log(`   lunch数组长度: ${day.lunch?.length || 0}`);
        
        const dayKey = dayMapping[day.day_label] || day.day_label.toLowerCase();
        
        if (day.lunch && Array.isArray(day.lunch)) {
          frontendMenu[dayKey] = day.lunch.map((dishItem: any, dishIndex: number) => {
            const dishName = dishItem.dish_name || dishItem.name || dishItem;
            console.log(`     菜品 ${dishIndex + 1}: ${dishName}`);
            
            const details = menuWithIds.generated_details?.[dishName] || {};
            return {
              name: dishName,
              description: details.description || '',
              cookingMethod: details.cookingMethod || '',
            };
          });
          console.log(`   ✅ ${dayKey} 转换完成，菜品数: ${frontendMenu[dayKey].length}`);
        } else {
          console.log(`   ⚠️ ${dayKey} 没有lunch数组`);
          frontendMenu[dayKey] = [];
        }
      });
    } else {
      console.error('❌ menu_items_json.days 不存在！');
    }
    
    console.log('✅ 转换完成，frontendMenu:', JSON.stringify(frontendMenu, null, 2));
    
    return {
      menu_id: menuId,
      menu: frontendMenu, // 前端期望的格式
      menu_items_json: menuWithIds.menu_items_json, // 保留原始格式
      gen_options_json: stats,
      generated_details: menuWithIds.generated_details,
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ 数据库保存失败:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack?.split('\n').slice(0, 3),
    });
    throw error;
  } finally {
    client.release();
  }
  
  console.log('🎉 菜单生成完成！');
}

/**
 * 获取所有可用菜品（按菜品类型分组，确保每种类型都有充足菜品）
 */
async function fetchAllAvailableDishes(
  storeId: string,
  historyRatio: number
): Promise<any[]> {
  const allDishes: any[] = [];
  
  // 从专属菜库和历史菜单获取
  if (historyRatio > 0) {
    console.log('查询专属菜库...');
    const storeDishes = await query(
      `SELECT id, dish_name, dish_type, ingredient_tags, knife_skill, 
              cuisine, cook_method8, flavor, main_ingredients, sub_ingredients, seasons
       FROM dishes_store
       WHERE store_id = $1 AND is_active = TRUE
       ORDER BY RANDOM()`,
      [storeId]
    );
    allDishes.push(...storeDishes.rows);
    console.log(`专属菜库: ${storeDishes.rows.length}道`);
    
    // 从历史菜单中提取菜品（特别是上传的菜单）
    console.log('🔍 查询历史菜单...');
    const historyMenus = await query(
      `SELECT id, title, menu_items_json
       FROM menus
       WHERE store_id = $1 AND is_active = TRUE AND source_type = 'uploaded'
       ORDER BY created_at DESC
       LIMIT 10`,
      [storeId]
    );
    
    console.log(`✅ 找到 ${historyMenus.rows.length} 份历史上传菜单`);
    if (historyMenus.rows.length > 0) {
      console.log('📋 历史菜单列表:');
      historyMenus.rows.forEach((menu: any, idx: number) => {
        console.log(`  ${idx + 1}. ${menu.title} (ID: ${menu.id})`);
      });
    }
    
    // 从历史菜单中提取所有菜品名称
    const historyDishNames = new Set<string>();
    historyMenus.rows.forEach((menu: any, menuIdx: number) => {
      const menuData = menu.menu_items_json;
      console.log(`📖 解析菜单 ${menuIdx + 1}: ${menu.title}`);
      console.log(`   menu_items_json 类型: ${typeof menuData}`);
      console.log(`   是否有days字段: ${menuData && 'days' in menuData}`);
      
      if (menuData && menuData.days && Array.isArray(menuData.days)) {
        console.log(`   days数组长度: ${menuData.days.length}`);
        menuData.days.forEach((day: any, dayIdx: number) => {
          const dishes = day.lunch || [];
          console.log(`   第${dayIdx + 1}天 (${day.day_label}) 菜品数: ${dishes.length}`);
          dishes.forEach((dish: any, dishIdx: number) => {
            // 兼容两种格式：字符串或对象
            const dishName = typeof dish === 'string' ? dish : dish.dish_name;
            if (dishName) {
              historyDishNames.add(dishName);
              if (dishIdx < 3) { // 只显示前3个作为示例
                console.log(`     - ${dishName} (${typeof dish})`);
              }
            }
          });
        });
      } else {
        console.log(`   ⚠️  菜单数据格式不符合预期`);
      }
    });
    
    console.log(`\n✅ 从历史菜单中提取到 ${historyDishNames.size} 道不重复的菜品`);
    if (historyDishNames.size > 0) {
      const sampleDishes = Array.from(historyDishNames).slice(0, 10);
      console.log(`📝 示例菜品（前10个）:`);
      sampleDishes.forEach((name, idx) => {
        console.log(`  ${idx + 1}. ${name}`);
      });
    }
    
    // 🔑 关键修复：优先使用dishes_store中已打好标签的菜品
    console.log(`\n🏷️  标记历史菜品并使用已解析的标签...`);
    
    // 创建专属菜库的菜名Map，用于快速查找
    const storeDishMap = new Map<string, any>();
    storeDishes.rows.forEach((dish: any) => {
      storeDishMap.set(dish.dish_name, dish);
    });
    console.log(`   专属菜库Map大小: ${storeDishMap.size}道`);
    
    // 标记专属菜库中的菜品为from_history
    let fromStoreCount = 0;
    storeDishes.rows.forEach((dish: any) => {
      if (historyDishNames.has(dish.dish_name)) {
        dish.from_history = true; // ✅ 标记为历史菜品
        fromStoreCount++;
      }
    });
    console.log(`   ✅ 专属菜库中有 ${fromStoreCount} 道菜在历史菜单中出现，已标记为历史菜品`);
    
    // 对于历史菜单中的菜，但不在专属菜库中的，才创建新对象
    let newHistoryCount = 0;
    historyDishNames.forEach((dishName) => {
      if (!storeDishMap.has(dishName)) {
        // ⚠️ 这道菜在历史菜单中，但dishes_store中没有（可能解析失败或跳过）
        // 创建一个占位对象，稍后尝试从通用菜库匹配
        allDishes.push({
          id: null,
          dish_name: dishName,
          dish_type: null,
          ingredient_tags: null,
          knife_skill: null,
          cuisine: null,
          cook_method8: null,
          flavor: null,
          main_ingredients: null,
          sub_ingredients: null,
          seasons: null,
          from_history: true,
        });
        newHistoryCount++;
      }
    });
    
    console.log(`   ⚠️  有 ${newHistoryCount} 道历史菜品不在专属菜库中（可能未解析），将尝试从通用菜库匹配`);
    console.log(`📊 当前allDishes数组长度: ${allDishes.length}道`);
    console.log(`📊 其中标记为from_history的: ${allDishes.filter(d => d.from_history === true).length}道`);
  }
  
  // 从通用菜库获取所有菜品
  console.log('查询通用菜库...');
  const commonDishes = await query(
    `SELECT id, dish_name, dish_type, ingredient_tags, knife_skill, 
            cuisine, cook_method8, flavor, main_ingredients, sub_ingredients, seasons
     FROM dishes_common
     WHERE is_active = TRUE
     ORDER BY RANDOM()`
  );
  
  // 为历史菜品补充完整信息（如果在通用菜库中能找到匹配的）
  if (historyRatio > 0) {
    console.log('\n🔗 尝试为历史菜品补充完整信息...');
    const commonDishMap = new Map<string, any>();
    commonDishes.rows.forEach((dish: any) => {
      commonDishMap.set(dish.dish_name, dish);
    });
    console.log(`   通用菜库Map大小: ${commonDishMap.size}`);
    
    let matchedCount = 0;
    let unmatchedDishes: string[] = [];
    allDishes.forEach((dish: any) => {
      if (dish.from_history && dish.dish_type === null) {
        const matchedDish = commonDishMap.get(dish.dish_name);
        if (matchedDish) {
          // 用通用菜库的完整信息替换
          Object.assign(dish, matchedDish);
          dish.from_history = true; // 🔖 保留历史标记（关键！）
          matchedCount++;
        } else {
          unmatchedDishes.push(dish.dish_name);
        }
      }
    });
    
    console.log(`✅ 成功匹配 ${matchedCount} 道历史菜品的完整信息`);
    if (unmatchedDishes.length > 0) {
      console.log(`⚠️  未匹配到 ${unmatchedDishes.length} 道历史菜品（通用菜库中不存在）:`);
      unmatchedDishes.slice(0, 5).forEach(name => {
        console.log(`     - ${name}`);
      });
      if (unmatchedDishes.length > 5) {
        console.log(`     ... 还有${unmatchedDishes.length - 5}道`);
      }
      
      // 为未匹配的历史菜品推断菜品类型
      console.log(`\n🤖 开始为未匹配的历史菜品推断类型...`);
      let inferredCount = 0;
      allDishes.forEach((dish: any) => {
        if (dish.from_history && dish.dish_type === null) {
          const inferredType = inferDishType(dish.dish_name);
          if (inferredType) {
            dish.dish_type = inferredType;
            inferredCount++;
          }
        }
      });
      console.log(`✅ 成功推断 ${inferredCount} 道历史菜品的类型`);
    }
  }
  
  allDishes.push(...commonDishes.rows);
  console.log(`通用菜库: ${commonDishes.rows.length}道`);
  console.log(`最终可用菜品总数: ${allDishes.length}道`);
  
  // 统计各类型菜品数量
  const typeCounts: Record<string, number> = {};
  const historyTypeCounts: Record<string, number> = {};
  const commonTypeCounts: Record<string, number> = {};
  
  allDishes.forEach(dish => {
    if (dish.dish_type) {
      typeCounts[dish.dish_type] = (typeCounts[dish.dish_type] || 0) + 1;
      
      if (dish.from_history === true) {
        historyTypeCounts[dish.dish_type] = (historyTypeCounts[dish.dish_type] || 0) + 1;
      } else {
        commonTypeCounts[dish.dish_type] = (commonTypeCounts[dish.dish_type] || 0) + 1;
      }
    }
  });
  
  console.log('\n📊 ===== 最终菜品统计 =====');
  console.log(`总菜品数: ${allDishes.length}道`);
  
  const historyDishes = allDishes.filter(d => d.from_history === true);
  console.log(`🔴 历史菜品: ${historyDishes.length}道`);
  console.log(`🔵 通用菜品: ${allDishes.filter(d => !d.from_history).length}道`);
  
  console.log('\n📊 菜品类型总分布:', typeCounts);
  console.log('🔴 历史菜品类型分布:', historyTypeCounts);
  console.log('🔵 通用菜品类型分布:', commonTypeCounts);
  console.log('============================\n');
  
  return allDishes;
}

/**
 * 构建菜单生成Prompt - 完整版：生成一周5天菜单
 */
function buildMenuGenerationPrompt(
  request: GenerateMenuRequest,
  dishes: any[]
): { systemPrompt: string; userPrompt: string } {
  
  // System Prompt - 完整版，包含9条开菜规则
  const systemPrompt = `你是一位在中国团餐行业工作多年的经验丰富的厨师长。请严格按照以下【开菜规则】，为团餐食堂生成一周五天的午餐菜谱。

【重要】菜名使用规则：
你必须严格使用下文【菜品来源】中提供的菜名，不得自行创造或修改菜名。输出的菜名必须与菜品来源中的某一道菜完全一致（逐字匹配）。如果菜品来源中没有合适的菜，优先调整其他约束条件，而不是修改菜名。

【开菜规则】：
1. 设备可实现性：可以使用的烹饪方式是【${request.cook_method8_available.join('、')}】，严禁出现其他烹饪方式的菜
2. 成本控制：一餐避免重复出现高成本食材/菜品，如水产品、牛羊肉
3. 食材多样性：一餐内，主要食材不得重复（例如：鸡翅、鸡腿、鸡胸、鸡爪是不同食材）
4. 原材料多样性：${getIngredientDiversityRequirement(request.ingredient_diversity_requirement)}
5. 辣味菜数量要求：${getSpicyRequirement(request.spicy_level)}
6. 刀工多样性：${getKnifeSkillRequirement(request.staffing_tight)}
7. 调味品多样性：${getFlavorRequirement(request.flavor_diversity_required)}
8. 烹饪方式多样性：每周菜单必须出现炒、熘、蒸、烧、烤、炖、煎、烹8种烹饪方法中的至少六种
9. 口感多样性：一餐不要出现超过两个勾芡菜

【输出要求】：
严格按照JSON格式输出，包含周一到周五的菜单。只需要输出菜名即可（菜品详情将从数据库查询）：
{
  "monday": ["菜品1", "菜品2", "菜品3", ...],
  "tuesday": ["菜品1", "菜品2", "菜品3", ...],
  "wednesday": ["菜品1", "菜品2", "菜品3", ...],
  "thursday": ["菜品1", "菜品2", "菜品3", ...],
  "friday": ["菜品1", "菜品2", "菜品3", ...]
}

注意：
1. 每个数组只包含菜名字符串，不需要对象格式
2. 菜名必须从【菜品来源】中精确选择
3. 确保满足每日菜品数量要求`;

  // User Prompt - 包含完整菜品信息和历史菜占比要求
  const totalDishesPerDay = request.hot_dish_total_per_day + request.cold_per_day;
  const historyDishesPerDay = Math.round(totalDishesPerDay * request.used_history_ratio);
  const commonDishesPerDay = totalDishesPerDay - historyDishesPerDay;
  
  // 分别统计历史菜品和通用菜品
  const historyDishes = dishes.filter(d => d.from_history === true);
  const commonDishes = dishes.filter(d => !d.from_history);
  
  const dishesInfo = formatDishesForPrompt(dishes, request.used_history_ratio);
  
  const historyRatioText = request.used_history_ratio > 0 
    ? `\n【🔴 PRIMARY要求 - 历史菜占比】：
这是最重要的约束！必须严格遵守！
- 历史菜占比：${(request.used_history_ratio * 100).toFixed(0)}%
- 每天必须包含 ${historyDishesPerDay} 道历史菜品（标记为【历史】）
- 每天必须包含 ${commonDishesPerDay} 道通用菜品（标记为【通用】）
- 历史菜品数量：${historyDishes.length} 道
- 通用菜品数量：${commonDishes.length} 道

‼️ 强制要求：严格按照上述比例从【历史】和【通用】菜品中选择，不得偏离！`
    : '\n【历史菜占比】：0%，全部使用通用菜品';
  
  const userPrompt = `请从以下【菜品来源】中选取菜品，为团餐食堂生成一周五天的午餐菜谱。
${historyRatioText}

【每日菜品要求】：
- 每天包含 ${request.hot_dish_total_per_day} 个热菜和 ${request.cold_per_day} 个凉菜
- 热菜中：${request.main_meat_per_day} 个主荤菜、${request.half_meat_per_day} 个半荤菜、${request.veggie_hot_per_day} 个素菜

【菜品来源】：
${dishesInfo}

请严格按照JSON格式输出一周五天的完整菜单（monday, tuesday, wednesday, thursday, friday）。`;

  return { systemPrompt, userPrompt };
}

function getSpicyRequirement(level: string): string {
  if (level === 'no_spicy') return '不要出现辣菜';
  if (level === 'mild') return '微辣，辣菜在总数量占比约15%';
  return '中辣，辣菜在总数量占比约30%';
}

function getIngredientDiversityRequirement(requirement: string): string {
  if (requirement === '不少于4种') return '一餐出品的原材料不少于4种';
  if (requirement === '不少于5种') return '一餐出品的原材料不少于5种';
  if (requirement === '不少于6种') return '一餐出品的原材料不少于6种';
  return '无要求';
}

function getKnifeSkillRequirement(tight: boolean): string {
  if (tight) {
    return '切丝/丁/片的菜品不超过10%（人员配置紧缺）';
  }
  return '切丝/丁/片的菜品占比10%-30%（人员配置宽裕）';
}

function getFlavorRequirement(required: boolean): string {
  if (required) {
    return '在酸、甜、苦、辣、咸、鲜、麻、香、清淡9种风味之中，每餐出现风味不少于5种';
  }
  return '无要求';
}

/**
 * 将菜品格式化为适合Prompt的字符串
 * 包含菜名和关键标签信息，并明确标记历史菜品和通用菜品
 * 为避免Prompt过长，限制每种类型最多传递50道菜
 */
function formatDishesForPrompt(dishes: any[], historyRatio: number): string {
  // 按菜品类型和来源分组
  const grouped: Record<string, { history: any[], common: any[] }> = {
    '热菜主荤': { history: [], common: [] },
    '热菜半荤': { history: [], common: [] },
    '热菜素菜': { history: [], common: [] },
    '凉菜': { history: [], common: [] }
  };
  
  dishes.forEach(dish => {
    if (grouped[dish.dish_type]) {
      if (dish.from_history === true) {
        grouped[dish.dish_type].history.push(dish);
      } else {
        grouped[dish.dish_type].common.push(dish);
      }
    }
  });
  
  let result = '';
  const maxPerType = 50; // 每种类型最多50道菜，避免Prompt过长
  
  for (const [type, { history, common }] of Object.entries(grouped)) {
    if (history.length === 0 && common.length === 0) continue;
    
    result += `\n【${type}】：\n`;
    
    // 如果有历史菜品，优先列出
    if (historyRatio > 0 && history.length > 0) {
      const limitedHistory = history.slice(0, maxPerType);
      result += `  🔴 【历史】菜品（共${limitedHistory.length}道，必须优先从此处选择以满足${(historyRatio * 100).toFixed(0)}%占比）：\n`;
      limitedHistory.forEach((dish, idx) => {
        const tags = [
          dish.cook_method8 ? dish.cook_method8 : null,
          dish.ingredient_tags && dish.ingredient_tags.length > 0 ? dish.ingredient_tags.join(',') : null,
          dish.knife_skill ? dish.knife_skill : null
        ].filter(Boolean).join('·');
        
        result += `    ${idx + 1}. ${dish.dish_name}`;
        if (tags) {
          result += `（${tags}）`;
        }
        result += '\n';
      });
      
      if (history.length > maxPerType) {
        result += `    ... （还有${history.length - maxPerType}道历史${type}）\n`;
      }
    }
    
    // 列出通用菜品
    if (common.length > 0) {
      const limitedCommon = common.slice(0, maxPerType);
      result += `  🔵 【通用】菜品（共${limitedCommon.length}道）：\n`;
      limitedCommon.forEach((dish, idx) => {
        const tags = [
          dish.cook_method8 ? dish.cook_method8 : null,
          dish.ingredient_tags && dish.ingredient_tags.length > 0 ? dish.ingredient_tags.join(',') : null,
          dish.knife_skill ? dish.knife_skill : null
        ].filter(Boolean).join('·');
        
        result += `    ${idx + 1}. ${dish.dish_name}`;
        if (tags) {
          result += `（${tags}）`;
        }
        result += '\n';
      });
      
      if (common.length > maxPerType) {
        result += `    ... （还有${common.length - maxPerType}道通用${type}）\n`;
      }
    }
  }
  
  console.log(`📝 格式化后菜品信息长度: ${result.length}字符`);
  console.log(`📊 历史菜品总数: ${dishes.filter(d => d.from_history === true).length}道`);
  console.log(`📊 通用菜品总数: ${dishes.filter(d => !d.from_history).length}道`);
  
  return result;
}

/**
 * 兜底策略 - 规则驱动生成菜单
 */
async function fallbackMenuGeneration(
  request: GenerateMenuRequest,
  dishes: any[]
): Promise<any> {
  console.log('使用兜底策略生成菜单');
  
  // TODO: 实现规则驱动的菜单生成逻辑
  // 这里简单返回一个基础结构
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
}

/**
 * 匹配菜名到dish_id
 */
async function matchDishIds(
  generatedMenu: any,
  storeId: string,
  availableDishes: any[]
): Promise<any> {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayLabels = ['周一', '周二', '周三', '周四', '周五'];
  
  const menuItemsJson = {
    days: [] as any[],
  };
  
  const generatedDetails: Record<string, GeneratedDishDetail> = {};
  
  // 创建菜品名称到菜品对象的映射，用于查找来源
  const dishNameMap = new Map<string, any>();
  availableDishes.forEach(dish => {
    if (dish.dish_name) {
      dishNameMap.set(dish.dish_name, dish);
    }
  });
  
  for (let i = 0; i < days.length; i++) {
    const dayKey = days[i];
    const dayLabel = dayLabels[i];
    const dayDishes = generatedMenu[dayKey] || [];
    
    const lunchItems = [];
    
    for (const dish of dayDishes) {
      // 支持两种格式：字符串（新）或对象（旧）
      const dishName = typeof dish === 'string' ? dish : dish.name;
      const dishDescription = typeof dish === 'object' ? dish.description : '';
      const dishCookingMethod = typeof dish === 'object' ? dish.cookingMethod : '';
      
      // 检查该菜品是否来自历史菜单
      const originalDish = dishNameMap.get(dishName);
      const isFromHistory = originalDish?.from_history === true;
      
      // 先查专属菜库
      let dishResult = await query(
        'SELECT id, dish_type, ingredient_tags, cook_method8, knife_skill, flavor, cuisine FROM dishes_store WHERE store_id = $1 AND dish_name = $2 AND is_active = TRUE',
        [storeId, dishName]
      );
      
      // 再查通用菜库
      if (dishResult.rows.length === 0) {
        dishResult = await query(
          'SELECT id, dish_type, ingredient_tags, cook_method8, knife_skill, flavor, cuisine FROM dishes_common WHERE dish_name = $1 AND is_active = TRUE',
          [dishName]
        );
      }
      
      const dishData = dishResult.rows.length > 0 ? dishResult.rows[0] : null;
      
      // 生成默认描述（如果AI没提供）
      let finalDescription = dishDescription;
      let finalCookingMethod = dishCookingMethod;
      
      if (!finalDescription && dishData) {
        // 基于菜品属性生成通用描述
        const dishTypeText = dishData.dish_type || '特色';
        const flavorText = dishData.flavor || '美味';
        const cuisineText = dishData.cuisine ? `${dishData.cuisine}风味，` : '';
        finalDescription = `${cuisineText}${dishTypeText}菜品，${flavorText}可口，营养丰富。`;
      }
      
      if (!finalCookingMethod && dishData) {
        const method = dishData.cook_method8 || '烹制';
        finalCookingMethod = `采用${method}工艺精心制作，火候适中，口感上佳。`;
      }
      
      // 如果没有找到菜品数据，使用推断类型
      const dishType = dishData?.dish_type || inferDishType(dishName) || '热菜主荤';
      
      lunchItems.push({
        dish_name: dishName,
        dish_id: dishData?.id || null,
        dish_type: dishType,
        tags: dishData ? {
          ingredient_tags: dishData.ingredient_tags,
          cook_method8: dishData.cook_method8,
          knife_skill: dishData.knife_skill,
          flavor: dishData.flavor,
        } : null,
        description: finalDescription || '',
        cookingMethod: finalCookingMethod || '',
        from_history: isFromHistory, // 🔖 添加来源标记（测试用）
      });
      
      // 保存生成的详细信息
      generatedDetails[dishName] = {
        name: dishName,
        description: finalDescription || '',
        cookingMethod: finalCookingMethod || '',
      };
    }
    
    menuItemsJson.days.push({
      day_label: dayLabel,
      lunch: lunchItems,
    });
  }
  
  return {
    menu_items_json: menuItemsJson,
    generated_details: generatedDetails,
  };
}

/**
 * 根据菜名推断菜品类型
 * 用于历史菜品无法在通用菜库中找到匹配时的兜底方案
 */
function inferDishType(dishName: string): string | null {
  if (!dishName) return null;
  
  // 凉菜关键词
  const coldKeywords = ['凉拌', '拍', '泡', '醉', '腌', '卤', '酱', '盐水', '白灼', '凉'];
  if (coldKeywords.some(keyword => dishName.includes(keyword))) {
    return '凉菜';
  }
  
  // 主荤关键词（肉类、鱼类、虾类等）
  const mainMeatKeywords = [
    '猪', '牛', '羊', '鸡', '鸭', '鹅', '鱼', '虾', '蟹', '贝', 
    '肉', '排骨', '蹄', '翅', '腿', '柳', '里脊', '五花', '大排',
    '鱿鱼', '墨鱼', '章鱼', '鲍', '海参', '蚝', '蛤', '螺', '鳝',
    '肥牛', '牛柳', '牛腩', '仔排', '猪肝', '猪心', '鸡块', '鸭块',
    '生蚝', '巴沙鱼', '鲫鱼', '鱼片', '鱼块', '鱼柳', '目鱼'
  ];
  
  // 半荤关键词（豆制品+肉、蛋类）
  const halfMeatKeywords = ['豆腐', '腐竹', '豆皮', '千张', '蛋', '香干'];
  
  // 素菜关键词
  const veggieKeywords = [
    '青菜', '白菜', '包菜', '菠菜', '油菜', '芹菜', '韭菜', '蒜苗', '蒜苔',
    '土豆', '萝卜', '冬瓜', '南瓜', '丝瓜', '苦瓜', '黄瓜', '茄子', '青椒',
    '西兰花', '花菜', '西红柿', '番茄', '木耳', '香菇', '蘑菇', '金针菇',
    '笋', '芽', '豆角', '海带', '紫菜', '莴笋', '藕'
  ];
  
  // 判断是否包含主荤关键词
  const hasMainMeat = mainMeatKeywords.some(keyword => dishName.includes(keyword));
  
  // 判断是否包含半荤关键词
  const hasHalfMeat = halfMeatKeywords.some(keyword => dishName.includes(keyword));
  
  // 判断是否包含素菜关键词
  const hasVeggie = veggieKeywords.some(keyword => dishName.includes(keyword));
  
  // 优先级判断
  if (hasMainMeat && !hasHalfMeat) {
    return '热菜主荤';
  }
  
  if (hasHalfMeat || (hasMainMeat && hasVeggie)) {
    return '热菜半荤';
  }
  
  if (hasVeggie) {
    return '热菜素菜';
  }
  
  // 默认返回主荤（因为历史菜单大部分是荤菜）
  return '热菜主荤';
}

/**
 * 计算菜单统计数据
 */
function calculateMenuStats(menuWithIds: any, request: GenerateMenuRequest): any {
  // TODO: 实现详细的统计逻辑
  return {
    actual_main_meat_per_day: request.main_meat_per_day,
    actual_half_meat_per_day: request.half_meat_per_day,
    actual_veggie_hot_per_day: request.veggie_hot_per_day,
    actual_cold_per_day: request.cold_per_day,
    actual_spicy_ratio: 0,
    methods_used8: request.cook_method8_available,
    passed_flavor_diversity: false,
    ingredient_diversity_actual: '无',
    analysis: {
      auto_parsed: false,
      confidence: 1.0,
      status: 'generated_by_system',
    },
  };
}

