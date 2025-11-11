import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_menu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkMenus() {
  try {
    console.log('=== 检查 menus 表数据 ===\n');
    
    // 1. 检查所有菜单
    const allMenusResult = await pool.query(`
      SELECT id, title, source_type, store_id, created_at, is_active
      FROM menus
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 总菜单数（最近10条）: ${allMenusResult.rows.length}`);
    allMenusResult.rows.forEach((menu, index) => {
      console.log(`\n${index + 1}. ${menu.title || '无标题'}`);
      console.log(`   ID: ${menu.id}`);
      console.log(`   类型: ${menu.source_type}`);
      console.log(`   门店ID: ${menu.store_id}`);
      console.log(`   创建时间: ${menu.created_at}`);
      console.log(`   是否激活: ${menu.is_active}`);
    });
    
    // 2. 按source_type分组统计
    console.log('\n=== 按类型统计 ===\n');
    const statsResult = await pool.query(`
      SELECT source_type, COUNT(*) as count
      FROM menus
      WHERE is_active = TRUE
      GROUP BY source_type
    `);
    
    statsResult.rows.forEach(row => {
      console.log(`${row.source_type}: ${row.count} 份`);
    });
    
    // 3. 检查用户的 store_id
    console.log('\n=== 检查用户表 ===\n');
    const usersResult = await pool.query(`
      SELECT id, username, store_id
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`用户数: ${usersResult.rows.length}`);
    usersResult.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Store ID: ${user.store_id})`);
    });
    
    // 4. 检查门店表
    console.log('\n=== 检查门店表 ===\n');
    const storesResult = await pool.query(`
      SELECT id, name, is_active
      FROM stores
      LIMIT 5
    `);
    
    console.log(`门店数: ${storesResult.rows.length}`);
    storesResult.rows.forEach(store => {
      console.log(`- ${store.name} (ID: ${store.id}, 激活: ${store.is_active})`);
    });
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await pool.end();
  }
}

checkMenus();


