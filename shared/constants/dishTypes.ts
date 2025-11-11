/**
 * 菜品类型
 */
export const DISH_TYPES = [
  '热菜主荤',
  '热菜半荤',
  '热菜素菜',
  '凉菜',
  '主食',
  '风味小吃',
  '汤',
  '酱汁',
  '饮料',
  '手工',
] as const;

export type DishType = (typeof DISH_TYPES)[number];

/**
 * 午餐菜品类型（只涉及这4种）
 */
export const LUNCH_DISH_TYPES = [
  '热菜主荤',
  '热菜半荤',
  '热菜素菜',
  '凉菜',
] as const;

export type LunchDishType = (typeof LUNCH_DISH_TYPES)[number];

/**
 * 食材特征（8大类）- 仅热菜有意义
 */
export const INGREDIENT_TAGS = [
  '肉',
  '禽',
  '鱼',
  '蛋',
  '豆',
  '菌',
  '筋',
  '蔬',
] as const;

export type IngredientTag = (typeof INGREDIENT_TAGS)[number];

/**
 * 刀工类型（12种）
 */
export const KNIFE_SKILLS = [
  '片',
  '丁',
  '粒',
  '米',
  '末',
  '茸',
  '丝',
  '条',
  '段',
  '块',
  '球',
  '花刀',
] as const;

export type KnifeSkill = (typeof KNIFE_SKILLS)[number];

/**
 * 复杂刀工（用于判断人员配置）
 */
export const COMPLEX_KNIFE_SKILLS: KnifeSkill[] = [
  '片',
  '丁',
  '粒',
  '米',
  '末',
  '茸',
  '丝',
  '条',
  '段',
  '块',
  '球',
  '花刀',
];

/**
 * 季节
 */
export const SEASONS = ['春', '夏', '秋', '冬'] as const;

export type Season = (typeof SEASONS)[number];

/**
 * 成本等级
 */
export const COST_LEVELS = ['低', '中', '高'] as const;

export type CostLevel = (typeof COST_LEVELS)[number];

/**
 * 辣度要求
 */
export const SPICY_LEVELS = {
  NO_SPICY: 0.0,
  MILD: 0.15,
  MEDIUM: 0.30,
} as const;

export type SpicyLevel = (typeof SPICY_LEVELS)[keyof typeof SPICY_LEVELS];

/**
 * 餐次类型
 */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'supper'] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_CN = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  supper: '夜宵',
} as const;

/**
 * 原材料多样性要求
 */
export const INGREDIENT_DIVERSITY_REQUIREMENTS = [
  '无要求',
  '不少于4种',
  '不少于5种',
  '不少于6种',
] as const;

export type IngredientDiversityRequirement = 
  (typeof INGREDIENT_DIVERSITY_REQUIREMENTS)[number];

