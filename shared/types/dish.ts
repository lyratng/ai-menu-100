import type {
  DishType,
  IngredientTag,
  KnifeSkill,
  CookMethod8,
  Season,
} from '../constants';

/**
 * 菜品分析信息
 */
export interface DishAnalysis {
  auto_parsed: boolean; // 是否AI自动解析
  confidence: number; // 置信度 0.0-1.0
  status: 'uploaded_by_user' | 'generated_by_system' | 'human_verified';
}

/**
 * 通用菜品（dishes_common表）
 */
export interface DishCommon {
  id: string;
  dish_name: string;
  dish_type: DishType;
  ingredient_tags: IngredientTag[];
  knife_skill: KnifeSkill | null;
  cuisine: string | null; // 菜系
  cook_method8: CookMethod8;
  flavor: string | null;
  main_ingredients: string[];
  sub_ingredients: string[];
  seasons: Season[];
  analysis: DishAnalysis;
  created_at: string;
  is_active: boolean;
}

/**
 * 门店专属菜品（dishes_store表）
 */
export interface DishStore extends DishCommon {
  store_id: string;
  common_dish_id: string | null; // 关联到通用菜品库
}

/**
 * 创建菜品请求
 */
export interface CreateDishRequest {
  dish_name: string;
  dish_type: DishType;
  ingredient_tags?: IngredientTag[];
  knife_skill?: KnifeSkill | null;
  cuisine?: string | null;
  cook_method8: CookMethod8;
  flavor?: string | null;
  main_ingredients?: string[];
  sub_ingredients?: string[];
  seasons?: Season[];
}

/**
 * 更新菜品请求
 */
export interface UpdateDishRequest extends Partial<CreateDishRequest> {
  is_active?: boolean;
}

/**
 * 菜品查询条件
 */
export interface DishQueryParams {
  store_id?: string;
  dish_type?: DishType;
  cook_method8?: CookMethod8;
  season?: Season;
  is_active?: boolean;
  keyword?: string; // 菜名关键词搜索
  page?: number;
  page_size?: number;
}

/**
 * 菜品列表响应
 */
export interface DishListResponse {
  dishes: DishStore[];
  total: number;
  page: number;
  page_size: number;
}

