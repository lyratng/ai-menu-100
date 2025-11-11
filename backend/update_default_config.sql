-- 更新所有stores的default_config为默认值
UPDATE stores 
SET default_config = jsonb_build_object(
  'breakfast', jsonb_build_object(
    'coldDish', 5,
    'pickle', 5,
    'westernDessert', 3,
    'soupPorridge', 5,
    'specialStaple', 15,
    'egg', 2
  ),
  'lunch', jsonb_build_object(
    'coldDish', 4,
    'hotDish', 18,
    'soupPorridge', 4,
    'westernDessert', 3,
    'specialStaple', 7,
    'specialFood', 6
  ),
  'dinner', jsonb_build_object(
    'coldDish', 4,
    'hotDish', 18,
    'soupPorridge', 4,
    'westernDessert', 2,
    'specialStaple', 6,
    'specialFood', 7
  ),
  'lateNight', jsonb_build_object(
    'coldDish', 4,
    'hotDish', 3,
    'soupPorridge', 3,
    'specialStaple', 6,
    'specialFood', 2
  )
)
WHERE default_config IS NULL OR default_config = '{}'::jsonb;

-- 查看更新结果
SELECT id, name, default_config FROM stores;

