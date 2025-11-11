import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAllDishes() {
  try {
    // 查询通用菜库数量
    const commonResult = await pool.query('SELECT COUNT(*) as count FROM dishes_common WHERE is_active = TRUE');
    const commonCount = parseInt(commonResult.rows[0].count);
    console.log('\n📊 通用菜库（dishes_common）数量:', commonCount, '道');
    
    // 查询食堂专属菜库数量
    const storeResult = await pool.query('SELECT COUNT(*) as count FROM dishes_store WHERE is_active = TRUE');
    const storeCount = parseInt(storeResult.rows[0].count);
    console.log('📊 食堂专属菜库（dishes_store）数量:', storeCount, '道');
    
    console.log('\n🎯 总计:', commonCount + storeCount, '道菜');
    console.log('='.repeat(60));
    
    // 查询通用菜库的菜品类型分布
    const typeResult = await pool.query(`
      SELECT dish_type, COUNT(*) as count 
      FROM dishes_common 
      WHERE is_active = TRUE 
      GROUP BY dish_type 
      ORDER BY count DESC
    `);
    console.log('\n📋 通用菜库 - 菜品类型分布:');
    typeResult.rows.forEach(row => {
      console.log(`   ${row.dish_type}: ${row.count}道`);
    });
    
    // 查询烹饪方式分布
    const methodResult = await pool.query(`
      SELECT cook_method8, COUNT(*) as count 
      FROM dishes_common 
      WHERE is_active = TRUE 
      GROUP BY cook_method8 
      ORDER BY count DESC
    `);
    console.log('\n🔥 通用菜库 - 烹饪方式分布:');
    methodResult.rows.forEach(row => {
      console.log(`   ${row.cook_method8}: ${row.count}道`);
    });
    
    // 查询食材特征分布（热菜）
    const ingredientResult = await pool.query(`
      SELECT unnest(ingredient_tags) as ingredient, COUNT(*) as count
      FROM dishes_common 
      WHERE is_active = TRUE AND dish_type LIKE '热菜%'
      GROUP BY ingredient
      ORDER BY count DESC
    `);
    console.log('\n🥩 通用菜库 - 食材特征分布（热菜）:');
    ingredientResult.rows.forEach(row => {
      console.log(`   ${row.ingredient}: ${row.count}道`);
    });
    
    // 随机显示20道菜作为示例
    const sampleResult = await pool.query(`
      SELECT dish_name, dish_type, cook_method8, flavor 
      FROM dishes_common 
      WHERE is_active = TRUE 
      ORDER BY RANDOM() 
      LIMIT 20
    `);
    console.log('\n🍜 通用菜库 - 随机示例（20道）:');
    sampleResult.rows.forEach((row, idx) => {
      const dishTypeShort = row.dish_type.replace('热菜', '');
      console.log(`   ${String(idx + 1).padStart(2, ' ')}. ${row.dish_name}（${row.cook_method8}·${dishTypeShort}）${row.flavor ? ' - ' + row.flavor : ''}`);
    });
    
    // 按类型展示一些具体的菜
    console.log('\n🎨 各类型代表菜品:');
    const types = ['热菜主荤', '热菜半荤', '热菜素菜', '凉菜'];
    for (const type of types) {
      const typeResult = await pool.query(`
        SELECT dish_name, cook_method8
        FROM dishes_common 
        WHERE is_active = TRUE AND dish_type = $1
        ORDER BY RANDOM()
        LIMIT 5
      `, [type]);
      if (typeResult.rows.length > 0) {
        console.log(`\n   【${type}】:`);
        typeResult.rows.forEach((dish, idx) => {
          console.log(`     ${idx + 1}. ${dish.dish_name}（${dish.cook_method8}）`);
        });
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllDishes();



