import XLSX from 'xlsx';

export interface ParsedMenuDay {
  day_label: string;
  lunch: string[]; // 菜名数组
}

export interface ParsedMenu {
  days: ParsedMenuDay[];
}

/**
 * 解析Excel文件，提取菜单数据
 * 支持两种格式：
 * 1. 有表头：第一行是"周一"、"周二"等，后续行是菜品
 * 2. 无表头：第一行直接是菜品，5列分别对应周一到周五
 */
export function parseMenuExcel(buffer: Buffer): ParsedMenu {
  try {
    // 读取Excel文件
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // 获取第一个sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 Excel原始数据（前5行）:', jsonData.slice(0, 5));
    
    if (jsonData.length < 1) {
      throw new Error('Excel文件格式错误：文件为空');
    }
    
    // 第一行
    const firstRow: string[] = jsonData[0];
    console.log('📋 第一行:', firstRow);
    
    // 初始化结果
    const days: ParsedMenuDay[] = [];
    const dayLabels = ['周一', '周二', '周三', '周四', '周五'];
    
    // 检测是否有表头（第一行包含"周一"、"周二"等关键字）
    const hasHeader = firstRow.some(cell => 
      cell && dayLabels.some(label => cell.toString().includes(label))
    );
    
    console.log(`📌 检测到${hasHeader ? '有表头' : '无表头'}格式`);
    
    if (hasHeader) {
      // 格式1：有表头
      return parseWithHeader(jsonData, dayLabels);
    } else {
      // 格式2：无表头，假设前5列分别是周一到周五
      return parseWithoutHeader(jsonData, dayLabels);
    }
    
  } catch (error: any) {
    console.error('❌ Excel解析失败:', error);
    throw new Error(`Excel解析失败: ${error.message}`);
  }
}

/**
 * 解析带表头的Excel
 */
function parseWithHeader(jsonData: any[], dayLabels: string[]): ParsedMenu {
  const headers: string[] = jsonData[0];
  const days: ParsedMenuDay[] = [];
  
  // 找到每个天对应的列索引
  const dayIndices: number[] = dayLabels.map(label => {
    const index = headers.findIndex(h => h && h.toString().includes(label));
    return index;
  });
  
  console.log('📍 天的列索引:', dayIndices);
  
  // 遍历每一天
  for (let i = 0; i < dayLabels.length; i++) {
    const dayLabel = dayLabels[i];
    const colIndex = dayIndices[i];
    
    if (colIndex === -1) {
      console.warn(`⚠️  未找到${dayLabel}列`);
      continue;
    }
    
    const dishes: string[] = [];
    
    // 从第二行开始提取菜名
    for (let row = 1; row < jsonData.length; row++) {
      const cellValue = jsonData[row][colIndex];
      if (cellValue && cellValue.toString().trim()) {
        dishes.push(cellValue.toString().trim());
      }
    }
    
    if (dishes.length > 0) {
      days.push({
        day_label: dayLabel,
        lunch: dishes,
      });
    }
  }
  
  console.log(`✅ 解析完成（有表头）: ${days.length}天，共${days.reduce((sum, d) => sum + d.lunch.length, 0)}道菜`);
  
  if (days.length === 0) {
    throw new Error('未能从Excel中提取到任何菜单数据');
  }
  
  return { days };
}

/**
 * 解析无表头的Excel（假设前5列分别是周一到周五）
 */
function parseWithoutHeader(jsonData: any[], dayLabels: string[]): ParsedMenu {
  const days: ParsedMenuDay[] = [];
  
  // 确定列数（取前5列或实际列数）
  const numCols = Math.min(5, jsonData[0].length);
  console.log(`📍 检测到${numCols}列菜品`);
  
  // 遍历每一列（每列是一天）
  for (let col = 0; col < numCols; col++) {
    const dayLabel = dayLabels[col] || `第${col + 1}天`;
    const dishes: string[] = [];
    
    // 从第一行开始提取菜名
    for (let row = 0; row < jsonData.length; row++) {
      const cellValue = jsonData[row][col];
      if (cellValue && cellValue.toString().trim()) {
        dishes.push(cellValue.toString().trim());
      }
    }
    
    if (dishes.length > 0) {
      days.push({
        day_label: dayLabel,
        lunch: dishes,
      });
    }
  }
  
  console.log(`✅ 解析完成（无表头）: ${days.length}天，共${days.reduce((sum, d) => sum + d.lunch.length, 0)}道菜`);
  
  if (days.length === 0) {
    throw new Error('未能从Excel中提取到任何菜单数据');
  }
  
  return { days };
}

/**
 * 验证解析后的菜单数据
 */
export function validateParsedMenu(menu: ParsedMenu): boolean {
  if (!menu || !menu.days || menu.days.length === 0) {
    return false;
  }
  
  for (const day of menu.days) {
    if (!day.day_label || !day.lunch || day.lunch.length === 0) {
      return false;
    }
  }
  
  return true;
}

