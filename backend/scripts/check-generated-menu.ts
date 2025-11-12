import { query } from '../src/db/pool';

async function main() {
  try {
    // 获取tang111103用户的最新生成菜单
    const username = 'tang111103';
    
    const userResult = await query(
      'SELECT id, store_id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.error('用户不存在');
      process.exit(1);
    }
    
    const storeId = userResult.rows[0].store_id;
    console.log(`门店ID: ${storeId}`);
    
    // 获取最新生成的菜单
    const menuResult = await query(
      `SELECT id, title, menu_items_json, created_at
       FROM menus
       WHERE store_id = $1 AND source_type = 'generated'
       ORDER BY created_at DESC
       LIMIT 1`,
      [storeId]
    );
    
    if (menuResult.rows.length === 0) {
      console.log('❌ 没有找到生成的菜单');
      process.exit(0);
    }
    
    const menu = menuResult.rows[0];
    console.log(`\n菜单: ${menu.title}`);
    console.log(`创建时间: ${menu.created_at}`);
    
    const menuData = menu.menu_items_json;
    
    // 收集所有菜名
    const allDishNames = new Set<string>();
    if (menuData && menuData.days) {
      menuData.days.forEach((day: any) => {
        const dishes = day.lunch || [];
        dishes.forEach((dish: any) => {
          const dishName = dish.dish_name || dish.name;
          if (dishName) {
            allDishNames.add(dishName);
          }
        });
      });
    }
    
    console.log(`\n📊 菜单中共有 ${allDishNames.size} 道不重复的菜`);
    
    // 检查每道菜的来源
    let storeCount = 0;
    let commonCount = 0;
    let notFoundCount = 0;
    
    for (const dishName of allDishNames) {
      // 先查专属菜库
      const storeResult = await query(
        'SELECT id FROM dishes_store WHERE store_id = $1 AND dish_name = $2',
        [storeId, dishName]
      );
      
      if (storeResult.rows.length > 0) {
        storeCount++;
        console.log(`🔴 【专属】${dishName}`);
        continue;
      }
      
      // 再查通用菜库
      const commonResult = await query(
        'SELECT id FROM dishes_common WHERE dish_name = $1',
        [dishName]
      );
      
      if (commonResult.rows.length > 0) {
        commonCount++;
        console.log(`🔵 【通用】${dishName}`);
        continue;
      }
      
      notFoundCount++;
      console.log(`⚠️  【未找到】${dishName}`);
    }
    
    console.log(`\n📊 统计结果：`);
    console.log(`🔴 专属菜库: ${storeCount} 道 (${(storeCount/allDishNames.size*100).toFixed(1)}%)`);
    console.log(`🔵 通用菜库: ${commonCount} 道 (${(commonCount/allDishNames.size*100).toFixed(1)}%)`);
    console.log(`⚠️  未找到: ${notFoundCount} 道`);
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

main();
