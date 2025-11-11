/**
 * 8大烹饪法 - 所有烹饪方式归一到这8种
 */
export const COOK_METHOD_8 = [
  '炒',
  '熘',
  '蒸',
  '烧',
  '烤',
  '炖',
  '煎',
  '烹',
] as const;

export type CookMethod8 = (typeof COOK_METHOD_8)[number];

/**
 * 烹饪方式映射表 - 将各种烹饪方式归一到8大类
 */
export const COOK_METHOD_MAPPING: Record<string, CookMethod8> = {
  // 炒系
  '炒': '炒',
  '煸': '炒',
  '爆': '炒',
  '干煸': '炒',
  '急火快炒': '炒',
  '溜锅': '炒',
  
  // 熘系
  '熘': '熘',
  '溜': '熘',
  '溜肉': '熘',
  
  // 蒸系
  '蒸': '蒸',
  '汆': '蒸',
  '灼': '蒸',
  '白灼': '蒸',
  
  // 烧系
  '烧': '烧',
  '烩': '烧',
  '浇汁': '烧',
  '烹汁': '烧',
  
  // 烤系
  '烤': '烤',
  '焗': '烤',
  '扒': '烤',
  '熏': '烤',
  
  // 炖系
  '炖': '炖',
  '煲': '炖',
  '炖汤': '炖',
  '煨': '炖',
  '卤煮': '炖',
  
  // 煎系
  '煎': '煎',
  '煎焖': '煎',
  
  // 烹系
  '烹': '烹',
};

/**
 * 将烹饪方式归一到8大类
 * @param method 原始烹饪方式
 * @returns 8大类之一，如果无法归类则返回null
 */
export function normalizeCookMethod(method: string): CookMethod8 | null {
  // 直接匹配
  if (COOK_METHOD_MAPPING[method]) {
    return COOK_METHOD_MAPPING[method];
  }
  
  // 模糊匹配（包含关系）
  for (const [key, value] of Object.entries(COOK_METHOD_MAPPING)) {
    if (method.includes(key) || key.includes(method)) {
      return value;
    }
  }
  
  // 无法归类
  return null;
}

