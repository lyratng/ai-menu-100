import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDishes() {
  try {
    // 检查菜品总数
    const dishesCount = await pool.query('SELECT COUNT(*) as total FROM dishes_store');
    console.log(`\n📊 dishes_store 表中的菜品数量: ${dishesCount.rows[0].total}`);

    // 检查菜单总数
    const menusCount = await pool.query('SELECT COUNT(*) as total FROM menus');
    console.log(`📊 menus 表中的菜单数量: ${menusCount.rows[0].total}`);

    // 检查是否有已解析的菜单
    const parsedMenus = await pool.query(
      `SELECT COUNT(*) as total FROM menus WHERE meta_json->>'pipeline_status' = 'parsed'`
    );
    console.log(`✅ 已完成解析的菜单数量: ${parsedMenus.rows[0].total}`);

    // 检查解析失败的菜单
    const failedMenus = await pool.query(
      `SELECT COUNT(*) as total FROM menus WHERE meta_json->>'pipeline_status' = 'parse_failed'`
    );
    console.log(`❌ 解析失败的菜单数量: ${failedMenus.rows[0].total}`);

    // 检查等待解析的菜单
    const pendingMenus = await pool.query(
      `SELECT COUNT(*) as total FROM menus WHERE meta_json->>'pipeline_status' = 'pending_parse'`
    );
    console.log(`⏳ 等待解析的菜单数量: ${pendingMenus.rows[0].total}`);

    // 如果有菜品，显示一些示例
    if (parseInt(dishesCount.rows[0].total) > 0) {
      const sampleDishes = await pool.query(
        'SELECT id, dish_name, dish_type, cook_method8 FROM dishes_store LIMIT 5'
      );
      console.log('\n📝 示例菜品:');
      sampleDishes.rows.forEach((dish, index) => {
        console.log(`  ${index + 1}. ${dish.dish_name} (${dish.dish_type}, ${dish.cook_method8})`);
      });
    }

    // 如果有菜单，显示解析状态详情
    if (parseInt(menusCount.rows[0].total) > 0) {
      const menuStatus = await pool.query(`
        SELECT 
          id, 
          title, 
          source_type,
          meta_json->>'pipeline_status' as status,
          meta_json->>'error_message' as error
        FROM menus 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log('\n📋 最近的菜单状态:');
      menuStatus.rows.forEach((menu, index) => {
        console.log(`  ${index + 1}. ${menu.title || '未命名'} (${menu.source_type}): ${menu.status || 'unknown'}`);
        if (menu.error) {
          console.log(`     错误: ${menu.error.substring(0, 100)}...`);
        }
      });
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await pool.end();
  }
}

checkDishes();



