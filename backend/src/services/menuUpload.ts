import { query } from '../db/pool';
import { parseMenuExcel, validateParsedMenu } from '../utils/excelParser';
import { addMenuParseJob } from '../queue/menuParseQueue';

/**
 * 上传历史菜单Excel并解析
 */
export async function uploadHistoryMenu(
  file: Buffer,
  fileName: string,
  storeId: string,
  userId: string | null,
  mealType: 'lunch' | 'dinner'
): Promise<{ menu_id: string; job_id: string; status: string; days: number }> {
  console.log(`\n📤 开始处理上传: ${fileName}`);
  console.log(`📊 文件大小: ${(file.length / 1024).toFixed(2)} KB`);
  console.log(`🏪 门店ID: ${storeId}`);
  
  // 1. 解析Excel文件
  console.log('🔍 开始解析Excel...');
  const parsedMenu = parseMenuExcel(file);
  
  if (!validateParsedMenu(parsedMenu)) {
    throw new Error('Excel文件格式错误：无法提取菜单数据');
  }
  
  console.log(`✅ Excel解析成功，共${parsedMenu.days.length}天菜单`);
  
  // 2. 立即落库menus表（source_type='uploaded', pipeline_status='pending_parse'）
  const menuResult = await query(
    `INSERT INTO menus (
      store_id, source_type, title, days, meal_type,
      menu_items_json, meta_json, created_by_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      storeId,
      'uploaded',
      fileName,
      parsedMenu.days.length,
      mealType,
      JSON.stringify(parsedMenu),
      JSON.stringify({ 
        pipeline_status: 'pending_parse',
        file_name: fileName,
        file_size: file.length,
      }),
      userId,
    ]
  );
  
  const menuId = menuResult.rows[0].id;
  console.log(`✅ 菜单已入库: ${menuId}`);
  
  // 3. 推送异步解析任务到队列
  const job = await addMenuParseJob({
    menuId,
    storeId,
    fileName,
  });
  
  console.log(`✅ 解析任务已加入队列: ${job.id}`);
  
  return {
    menu_id: menuId,
    job_id: job.id!,
    status: 'pending_parse',
    days: parsedMenu.days.length,
  };
}


/**
 * 获取上传历史列表
 */
export async function getUploadHistory(
  storeId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<any> {
  const offset = (page - 1) * pageSize;
  
  const result = await query(
    `SELECT 
      id, title as original_filename, meal_type,
      meta_json->>'pipeline_status' as parsing_status,
      meta_json->>'error' as error_message,
      created_at
    FROM menus
    WHERE store_id = $1 AND source_type = 'uploaded'
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,
    [storeId, pageSize, offset]
  );
  
  const countResult = await query(
    `SELECT COUNT(*) as total 
     FROM menus 
     WHERE store_id = $1 AND source_type = 'uploaded'`,
    [storeId]
  );
  
  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    page_size: pageSize,
  };
}

/**
 * 重新解析失败的上传
 */
export async function retryParsing(menuId: string, storeId: string): Promise<{ job_id: string }> {
  // 检查菜单是否属于该门店
  const menuResult = await query(
    `SELECT id, store_id, title, meta_json->>'file_name' as file_name
    FROM menus
    WHERE id = $1 AND store_id = $2`,
    [menuId, storeId]
  );
  
  if (menuResult.rows.length === 0) {
    throw new Error('菜单不存在或无权限');
  }
  
  const menu = menuResult.rows[0];
  
  // 更新状态为pending_parse
  await query(
    `UPDATE menus 
    SET meta_json = jsonb_set(meta_json, '{pipeline_status}', '"pending_parse"')
    WHERE id = $1`,
    [menuId]
  );
  
  // 重新推送到队列
  const job = await addMenuParseJob({
    menuId,
    storeId,
    fileName: menu.file_name || menu.title,
  });
  
  console.log(`🔄 重新解析任务已加入队列: ${job.id}`);
  
  return {
    job_id: job.id!,
  };
}

/**
 * 获取解析队列状态（详细版本，用于前端状态栏）
 */
export async function getParsingQueueStatus(storeId: string): Promise<any> {
  // 获取最近1小时内的菜单详细信息
  const result = await query(
    `SELECT 
      id as "menuId",
      title as "fileName",
      meta_json->>'pipeline_status' as status,
      meta_json->>'error' as error,
      created_at
    FROM menus
    WHERE store_id = $1 
      AND source_type = 'uploaded'
      AND created_at > NOW() - INTERVAL '1 hour'
      AND meta_json->>'pipeline_status' IN ('pending_parse', 'parsing', 'parsed', 'parse_failed')
    ORDER BY created_at DESC`,
    [storeId]
  );
  
  const queue = result.rows.map((row: any) => {
    // 根据状态计算进度
    let progress = 0;
    if (row.status === 'pending_parse') progress = 0;
    else if (row.status === 'parsing') progress = 50;
    else if (row.status === 'parsed') progress = 100;
    else if (row.status === 'parse_failed') progress = 0;
    
    return {
      menuId: row.menuId,
      fileName: row.fileName,
      status: row.status,
      progress,
      error: row.error || undefined,
    };
  });
  
  // 检查是否有最近完成的（3秒内）
  const recentlyCompleted = queue.some(item => 
    item.status === 'parsed' && 
    new Date().getTime() - new Date(result.rows.find((r: any) => r.menuId === item.menuId)?.created_at).getTime() < 3000
  );
  
  return {
    queue,
    recentlyCompleted,
  };
}

