// 导出工具函数

/**
 * 导出为CSV格式
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // 获取所有列名
  const headers = Object.keys(data[0]);
  
  // 生成CSV内容
  const csvContent = [
    // 表头
    headers.join(','),
    // 数据行
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 处理特殊字符和换行
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // 如果包含逗号、引号或换行，用引号包裹
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // 添加BOM头以支持中文
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * 导出为Excel格式（简化版，使用HTML table方式）
 */
export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const headers = Object.keys(data[0]);
  
  // 生成HTML table
  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // 使用Excel的XML格式
  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${tableHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + excelContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  downloadBlob(blob, `${filename}.xls`);
}

/**
 * 导出为JSON格式
 */
export function exportToJSON(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * 下载Blob文件
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 格式化菜单数据为可导出的扁平结构
 */
export function formatMenuForExport(menu: any) {
  const result: any[] = [];
  const menuItems = menu.menu_items_json?.days || [];

  menuItems.forEach((day: any) => {
    const dayLabel = day.day_label;
    const dishes = day.lunch || [];
    
    dishes.forEach((dish: any, index: number) => {
      const dishName = typeof dish === 'string' ? dish : (dish.dish_name || dish.name);
      const dishId = typeof dish === 'object' ? dish.dish_id : null;
      
      result.push({
        '门店': menu.store_name,
        '菜单标题': menu.title || '未命名',
        '日期': dayLabel,
        '序号': index + 1,
        '菜品名称': dishName,
        '菜品ID': dishId || '',
        '来源': menu.source_type === 'generated' ? 'AI生成' : '用户上传',
        '创建时间': new Date(menu.created_at).toLocaleString('zh-CN'),
      });
    });
  });

  return result;
}

/**
 * 格式化菜品数据为可导出的扁平结构
 */
export function formatDishesForExport(dishes: any[]) {
  return dishes.map(dish => ({
    '菜品名称': dish.dish_name,
    '门店': dish.store_name,
    '类型': dish.dish_type,
    '烹饪方式': dish.cook_method8,
    '刀工': dish.knife_skill || '',
    '菜系': dish.cuisine || '',
    '口味': dish.flavor || '',
    '食材特征': dish.ingredient_tags?.join('、') || '',
    '主料': dish.main_ingredients?.join('、') || '',
    '辅料': dish.sub_ingredients?.join('、') || '',
    '季节': dish.seasons?.join('、') || '',
    '状态': dish.is_active ? '有效' : '已删除',
    '创建时间': new Date(dish.created_at).toLocaleString('zh-CN'),
  }));
}

/**
 * 格式化门店数据为可导出的扁平结构
 */
export function formatStoresForExport(stores: any[]) {
  return stores.map(store => ({
    '门店名称': store.store_name,
    '账号': store.username,
    '状态': store.is_active ? '启用' : '禁用',
    '生成菜单数': store.generated_count || 0,
    '上传菜单数': store.uploaded_count || 0,
    '最后活跃': store.last_active_at ? new Date(store.last_active_at).toLocaleString('zh-CN') : '从未',
    '创建时间': new Date(store.created_at).toLocaleString('zh-CN'),
  }));
}



