import { query } from '../src/db/pool';

async function main() {
  try {
    const username = 'tang111103';
    
    const userResult = await query(
      'SELECT store_id FROM users WHERE username = $1',
      [username]
    );
    
    const storeId = userResult.rows[0].store_id;
    
    // 从prompt中提取一些菜名进行检查
    const testDishes = [
      '徽式烧鸡',
      '回锅肉',
      '秘制大块肉',
      '徐州地锅鸡',
      '豉油王煎封鲈鱼',
      '蒜香猪仔骨',
      '土豆鸡块',
      '屯溪醉蟹',
      '芋儿鸡',
      '口味虾',
      '小炒肉',
      '萝卜烧牛肉',
      '啤酒鸭',
      '沸腾鱼',
    ];
    
    console.log('检查prompt中的菜品来源：\n');
    
    let storeCount = 0;
    let commonCount = 0;
    
    for (const dishName of testDishes) {
      // 查专属菜库
      const storeResult = await query(
        'SELECT id FROM dishes_store WHERE store_id = $1 AND dish_name = $2',
        [storeId, dishName]
      );
      
      if (storeResult.rows.length > 0) {
        console.log(`✅ ${dishName} - 来自专属菜库`);
        storeCount++;
        continue;
      }
      
      // 查通用菜库
      const commonResult = await query(
        'SELECT id FROM dishes_common WHERE dish_name = $1',
        [dishName]
      );
      
      if (commonResult.rows.length > 0) {
        console.log(`🔵 ${dishName} - 来自通用菜库`);
        commonCount++;
        continue;
      }
      
      console.log(`❌ ${dishName} - 未找到`);
    }
    
    console.log(`\n📊 统计：`);
    console.log(`专属菜库: ${storeCount}/${testDishes.length}`);
    console.log(`通用菜库: ${commonCount}/${testDishes.length}`);
    console.log(`\n✅ 菜品已混合！AI无法区分来源。`);
    
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

main();
