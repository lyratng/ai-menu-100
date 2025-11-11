import { query } from '../src/db/pool.js';
import { addMenuParseJob } from '../src/queue/menuParseQueue.js';

async function retryFailedMenus() {
  console.log('🔄 开始重新解析失败的菜单...\n');

  // 获取所有pending_parse的菜单
  const result = await query(
    `SELECT 
      id, 
      store_id, 
      title,
      meta_json->>'file_name' as file_name
    FROM menus
    WHERE meta_json->>'pipeline_status' = 'pending_parse'
      AND source_type = 'uploaded'
    ORDER BY created_at DESC`
  );

  console.log(`📋 找到 ${result.rows.length} 个待解析菜单\n`);

  for (const menu of result.rows) {
    console.log(`📤 加入队列: ${menu.title || menu.file_name || menu.id}`);
    
    try {
      const job = await addMenuParseJob({
        menuId: menu.id,
        storeId: menu.store_id,
        fileName: menu.file_name || menu.title || '未命名',
      });
      
      console.log(`✅ 任务ID: ${job.id}\n`);
    } catch (error: any) {
      console.error(`❌ 失败: ${error.message}\n`);
    }
  }

  console.log('🎉 所有任务已重新加入队列！');
  console.log('💡 请查看后端日志，观察解析进度。\n');
  
  process.exit(0);
}

retryFailedMenus().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

