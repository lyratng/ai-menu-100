import { query } from '../src/db/pool';

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

/**
 * 获取所有可用菜品
 */
async function fetchAllAvailableDishes(
  storeId: string,
  historyRatio: number,
  totalDishesNeeded: number
): Promise<any[]> {
  // 配置参数：余量倍数
  const DISH_POOL_MULTIPLIER = 10;
  
  // 计算菜品池大小
  const poolSize = totalDishesNeeded * DISH_POOL_MULTIPLIER;
  const historyTarget = Math.round(poolSize * historyRatio);
  const commonTarget = poolSize - historyTarget;
  
  console.log('\n📊 ===== 菜品获取策略 =====');
  console.log(`每周需要菜品: ${totalDishesNeeded}道`);
  console.log(`菜品池大小: ${poolSize}道 (${DISH_POOL_MULTIPLIER}倍余量)`);
  console.log(`历史菜占比: ${(historyRatio * 100).toFixed(0)}%`);
  console.log(`目标从专属菜库取: ${historyTarget}道`);
  console.log(`目标从通用菜库取: ${commonTarget}道`);
  console.log('============================\n');
  
  const allDishes: any[] = [];
  
  // 从专属菜库随机取菜
  if (historyTarget > 0) {
    console.log(`🔍 从专属菜库随机取 ${historyTarget} 道菜...`);
    const storeDishes = await query(
      `SELECT id, dish_name, dish_type, ingredient_tags, knife_skill, 
              cuisine, cook_method8, flavor, main_ingredients, sub_ingredients, seasons
       FROM dishes_store
       WHERE store_id = $1 AND is_active = TRUE
       ORDER BY RANDOM()
       LIMIT $2`,
      [storeId, historyTarget]
    );
    
    // 标记为历史菜品
    storeDishes.rows.forEach((dish: any) => {
      dish.from_history = true;
    });
    
    allDishes.push(...storeDishes.rows);
    console.log(`✅ 实际取到专属菜库: ${storeDishes.rows.length}道`);
  }
  
  // 从通用菜库随机取菜
  if (commonTarget > 0) {
    console.log(`🔍 从通用菜库随机取 ${commonTarget} 道菜...`);
    const commonDishes = await query(
      `SELECT id, dish_name, dish_type, ingredient_tags, knife_skill, 
              cuisine, cook_method8, flavor, main_ingredients, sub_ingredients, seasons
       FROM dishes_common
       WHERE is_active = TRUE
       ORDER BY RANDOM()
       LIMIT $1`,
      [commonTarget]
    );
    
    allDishes.push(...commonDishes.rows);
    console.log(`✅ 实际取到通用菜库: ${commonDishes.rows.length}道`);
  }
  
  // 随机打乱顺序，避免位置偏好
  console.log(`\n🔀 混合并打乱菜品顺序...`);
  allDishes.sort(() => Math.random() - 0.5);
  
  console.log(`\n📊 ===== 最终菜品统计 =====`);
  console.log(`总菜品数: ${allDishes.length}道`);
  console.log(`历史菜品: ${allDishes.filter(d => d.from_history === true).length}道`);
  console.log(`通用菜品: ${allDishes.filter(d => !d.from_history).length}道`);
  
  // 按类型统计
  const typeCounts: Record<string, number> = {};
  allDishes.forEach(dish => {
    if (dish.dish_type) {
      typeCounts[dish.dish_type] = (typeCounts[dish.dish_type] || 0) + 1;
    }
  });
  console.log('菜品类型分布:', typeCounts);
  console.log('============================\n');
  
  return allDishes;
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
 */
function formatDishesForPrompt(dishes: any[], historyRatio: number): string {
  // 按菜品类型分组（不再区分历史/通用）
  const grouped: Record<string, any[]> = {
    '热菜主荤': [],
    '热菜半荤': [],
    '热菜素菜': [],
    '凉菜': []
  };
  
  // 直接按类型分组，不区分来源
  dishes.forEach(dish => {
    if (grouped[dish.dish_type]) {
      grouped[dish.dish_type].push(dish);
    }
  });
  
  let result = '';
  const maxPerType = 100; // 增加到100道，因为不再分组
  
  for (const [type, dishList] of Object.entries(grouped)) {
    if (dishList.length === 0) continue;
    
    result += `\n【${type}】（共${dishList.length}道可选）：\n`;
    
    // 随机打乱顺序，避免位置偏好
    const shuffled = [...dishList].sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, maxPerType);
    
    limited.forEach((dish, idx) => {
      const tags = [
        dish.cook_method8 ? dish.cook_method8 : null,
        dish.ingredient_tags && dish.ingredient_tags.length > 0 ? dish.ingredient_tags.join(',') : null,
        dish.knife_skill ? dish.knife_skill : null
      ].filter(Boolean).join('·');
      
      result += `  ${idx + 1}. ${dish.dish_name}`;
      if (tags) {
        result += `（${tags}）`;
      }
      result += '\n';
    });
    
    if (dishList.length > maxPerType) {
      result += `  ... （还有${dishList.length - maxPerType}道${type}）\n`;
    }
  }
  
  return result;
}

/**
 * 构建菜单生成Prompt
 */
function buildMenuGenerationPrompt(
  request: GenerateMenuRequest,
  dishes: any[]
): { systemPrompt: string; userPrompt: string } {
  
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

  const totalDishesPerDay = request.hot_dish_total_per_day + request.cold_per_day;
  const historyDishesPerDay = Math.round(totalDishesPerDay * request.used_history_ratio);
  const commonDishesPerDay = totalDishesPerDay - historyDishesPerDay;
  
  const historyDishes = dishes.filter(d => d.from_history === true);
  const commonDishes = dishes.filter(d => !d.from_history);
  
  const dishesInfo = formatDishesForPrompt(dishes, request.used_history_ratio);
  
  // 🔴 临时注释：测试不限制历史菜占比的效果
  const historyRatioText = ''; // request.used_history_ratio > 0 
    // ? `\n【历史菜占比要求】：
// - 目标历史菜占比：${(request.used_history_ratio * 100).toFixed(0)}%
// - 建议每天包含约 ${historyDishesPerDay} 道历史菜品（标记为🔴【历史】）
// - 建议每天包含约 ${commonDishesPerDay} 道通用菜品（标记为🔵【通用】）
// - 历史菜品数量：${historyDishes.length} 道
// - 通用菜品数量：${commonDishes.length} 道
// 
// 注意：在满足其他开菜规则的前提下，尽量接近上述历史菜占比目标。`
    // : '\n【历史菜占比】：0%，全部使用通用菜品';
  
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

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('开始模拟菜单生成流程并构建完整Prompt');
    console.log('='.repeat(80));
    console.log();
    
    // 通过用户名获取store_id
    console.log('📋 步骤1: 通过用户名查询门店ID...');
    const username = 'tang111103';
    console.log(`🔍 查询用户: ${username}`);
    
    const userResult = await query(
      'SELECT id, username, store_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`❌ 用户 ${username} 不存在`);
      process.exit(1);
    }
    
    const storeId = userResult.rows[0].store_id;
    console.log(`✅ 用户ID: ${userResult.rows[0].id}`);
    console.log(`✅ 门店ID: ${storeId}`);
    
    // 获取门店信息
    const storesResult = await query(
      'SELECT id, name FROM stores WHERE id = $1',
      [storeId]
    );
    
    if (storesResult.rows.length === 0) {
      console.error('❌ 门店不存在');
      process.exit(1);
    }
    
    const storeName = storesResult.rows[0].name;
    console.log(`✅ 使用门店: ${storeName} (ID: ${storeId})`);
    console.log();
    
    // 模拟一个真实的请求参数
    const request: GenerateMenuRequest = {
      store_id: storeId,
      days: 5,
      meal_type: 'lunch',
      hot_dish_total_per_day: 9,
      cold_per_day: 1,
      main_meat_per_day: 3,
      half_meat_per_day: 3,
      veggie_hot_per_day: 3,
      staffing_tight: false,
      cook_method8_available: ['炒', '蒸', '烧', '炖', '烤', '煎'],
      spicy_level: 'mild',
      flavor_diversity_required: true,
      ingredient_diversity_requirement: '不少于5种',
      used_history_ratio: 0.5, // 50%历史菜
      model: 'deepseek-chat',
    };
    
    console.log('📋 步骤2: 请求参数');
    console.log(JSON.stringify(request, null, 2));
    console.log();
    
    // 计算需要的菜品数量
    const totalDishesNeeded = (request.hot_dish_total_per_day + request.cold_per_day) * request.days;
    console.log(`📊 一周需要菜品: ${totalDishesNeeded}道 (${request.hot_dish_total_per_day}热+${request.cold_per_day}凉) × ${request.days}天`);
    console.log();
    
    // 获取菜品数据
    console.log('📋 步骤3: 获取菜品数据...');
    const dishes = await fetchAllAvailableDishes(storeId, request.used_history_ratio, totalDishesNeeded);
    console.log();
    
    // 构建Prompt
    console.log('📋 步骤4: 构建Prompt...');
    const { systemPrompt, userPrompt } = buildMenuGenerationPrompt(request, dishes);
    console.log();
    
    // 输出完整的Prompt
    console.log('='.repeat(80));
    console.log('✅ 完整的 SYSTEM PROMPT:');
    console.log('='.repeat(80));
    console.log(systemPrompt);
    console.log();
    console.log('='.repeat(80));
    console.log('✅ 完整的 USER PROMPT:');
    console.log('='.repeat(80));
    console.log(userPrompt);
    console.log();
    
    // 统计信息
    console.log('='.repeat(80));
    console.log('📊 Prompt统计信息:');
    console.log('='.repeat(80));
    console.log(`System Prompt 长度: ${systemPrompt.length} 字符`);
    console.log(`User Prompt 长度: ${userPrompt.length} 字符`);
    console.log(`总长度: ${systemPrompt.length + userPrompt.length} 字符`);
    const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 2);
    console.log(`预估 Tokens: ${estimatedTokens}`);
    console.log();
    
    console.log('✅ 完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

main();

