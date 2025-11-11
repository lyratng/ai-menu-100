-- 修复dish_type字段值，使其符合PRD要求
-- PRD要求：热菜主荤 / 热菜半荤 / 热菜素菜 / 凉菜

-- ============================================
-- 1. 更新dishes_common表
-- ============================================

-- 拍黄瓜 - 凉菜
UPDATE dishes_common SET 
  dish_type = '凉菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '拍黄瓜';

-- 手撕包菜 - 热菜素菜
UPDATE dishes_common SET 
  dish_type = '热菜素菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '手撕包菜';

-- 麻婆豆腐 - 热菜半荤（豆腐+少量猪肉）
UPDATE dishes_common SET 
  dish_type = '热菜半荤',
  ingredient_tags = ARRAY['豆', '肉']
WHERE dish_name = '麻婆豆腐';

-- 青椒肉丝 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['肉', '蔬']
WHERE dish_name = '青椒肉丝';

-- 鱼香肉丝 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['肉', '蔬']
WHERE dish_name = '鱼香肉丝';

-- 红烧肉 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['肉']
WHERE dish_name = '红烧肉';

-- 水煮鱼 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['鱼', '蔬']
WHERE dish_name = '水煮鱼';

-- 凉拌海带丝 - 凉菜
UPDATE dishes_common SET 
  dish_type = '凉菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '凉拌海带丝';

-- 干煸豆角 - 热菜半荤
UPDATE dishes_common SET 
  dish_type = '热菜半荤',
  ingredient_tags = ARRAY['蔬', '肉']
WHERE dish_name = '干煸豆角';

-- 糖醋里脊 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['肉']
WHERE dish_name = '糖醋里脊';

-- 蒜蓉西兰花 - 热菜素菜
UPDATE dishes_common SET 
  dish_type = '热菜素菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '蒜蓉西兰花';

-- 清蒸鲈鱼 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['鱼']
WHERE dish_name = '清蒸鲈鱼';

-- 黄焖鸡 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['禽']
WHERE dish_name = '黄焖鸡';

-- 宫保鸡丁 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['禽']
WHERE dish_name = '宫保鸡丁';

-- 回锅肉 - 热菜主荤
UPDATE dishes_common SET 
  dish_type = '热菜主荤',
  ingredient_tags = ARRAY['肉', '蔬']
WHERE dish_name = '回锅肉';

-- 地三鲜 - 热菜素菜
UPDATE dishes_common SET 
  dish_type = '热菜素菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '地三鲜';

-- 西红柿炒蛋 - 热菜半荤
UPDATE dishes_common SET 
  dish_type = '热菜半荤',
  ingredient_tags = ARRAY['蛋', '蔬']
WHERE dish_name = '西红柿炒蛋';

-- 清炒时蔬 - 热菜素菜
UPDATE dishes_common SET 
  dish_type = '热菜素菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '清炒时蔬';

-- 红烧茄子 - 热菜素菜
UPDATE dishes_common SET 
  dish_type = '热菜素菜',
  ingredient_tags = ARRAY['蔬']
WHERE dish_name = '红烧茄子';

-- 凉拌木耳 - 凉菜
UPDATE dishes_common SET 
  dish_type = '凉菜',
  ingredient_tags = ARRAY['菌']
WHERE dish_name = '凉拌木耳';

-- ============================================
-- 2. 验证修改结果
-- ============================================
SELECT 
  dish_type, 
  COUNT(*) as count,
  array_agg(dish_name ORDER BY dish_name) as dishes
FROM dishes_common
WHERE is_active = TRUE
GROUP BY dish_type
ORDER BY dish_type;

-- ============================================
-- 3. 显示详细信息
-- ============================================
SELECT 
  dish_name,
  dish_type,
  ingredient_tags,
  knife_skill,
  cook_method8,
  flavor
FROM dishes_common
WHERE is_active = TRUE
ORDER BY dish_type, dish_name;

