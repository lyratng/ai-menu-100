import type {
  CookMethod8,
  MealType,
  SpicyLevel,
  IngredientDiversityRequirement,
} from '../constants';

/**
 * 菜单中的单个菜品项
 */
export interface MenuDishItem {
  dish_name: string;
  dish_id: string | null; // 初始可为null，解析后回填
}

/**
 * 一天的菜单
 */
export interface DayMenu {
  day_label: string; // 周一、周二...
  lunch: MenuDishItem[];
  breakfast?: MenuDishItem[]; // 预留
  dinner?: MenuDishItem[]; // 预留
  supper?: MenuDishItem[]; // 预留
}

/**
 * 菜单项JSON结构（menu_items_json字段）
 */
export interface MenuItemsJson {
  days: DayMenu[];
}

/**
 * 生成选项JSON（gen_options_json字段）
 * 对生成菜单：用户当时选择的参数
 * 对上传菜单：AI推导的等价参数
 */
export interface GenOptionsJson {
  hot_dish_total_per_day: number; // 每天热菜总数
  main_meat_per_day: number; // 每天主荤数量
  half_meat_per_day: number; // 每天半荤数量
  veggie_hot_per_day: number; // 每天素菜数量
  cold_per_day: number; // 每天凉菜数量
  
  staffing_tight: boolean; // 人员配置是否紧缺
  cook_method8_used: CookMethod8[]; // 使用的烹饪方法
  spicy_ratio_target: SpicyLevel; // 辣味占比目标
  flavor_diversity_required: boolean; // 是否要求每餐口味≥5种
  ingredient_diversity_requirement: IngredientDiversityRequirement; // 原材料多样性要求
  used_history_ratio: number; // 历史菜占比 0/0.3/0.5/0.7/1
  
  analysis: {
    auto_parsed: boolean;
    confidence: number;
    status: 'uploaded_by_user' | 'generated_by_system';
  };
}

/**
 * 菜单统计JSON（menu_stats_json字段）
 * 实际观测的统计数据
 */
export interface MenuStatsJson {
  actual_main_meat_per_day: number;
  actual_half_meat_per_day: number;
  actual_veggie_hot_per_day: number;
  actual_cold_per_day: number;
  
  actual_spicy_ratio: number; // 实际辣菜占比 0.0-1.0
  methods_used8: CookMethod8[]; // 实际使用的8大烹饪法
  passed_flavor_diversity: boolean; // 是否通过口味多样性检查
  ingredient_diversity_actual: '无' | '≥4' | '≥5' | '≥6'; // 实际原材料多样性
  
  analysis: {
    auto_parsed: boolean;
    confidence: number;
    status: 'uploaded_by_user' | 'generated_by_system' | 'human_verified';
  };
}

/**
 * 菜单（menus表）
 */
export interface Menu {
  id: string;
  org_id: string | null;
  store_id: string;
  source_type: 'uploaded' | 'generated';
  title: string | null;
  days: number; // 默认5天
  meal_type: MealType; // 'lunch'
  
  menu_items_json: MenuItemsJson;
  gen_options_json: GenOptionsJson | null;
  menu_stats_json: MenuStatsJson | null;
  
  embedding_menu: number[] | null; // Vector embedding (预留)
  used_history_ratio: number | null; // 实际历史菜占比
  
  created_by_user_id: string | null;
  created_at: string;
  is_active: boolean;
  meta_json: Record<string, any>; // pipeline_status等
}

/**
 * 生成菜单请求
 */
export interface GenerateMenuRequest {
  store_id: string;
  meal_type: MealType;
  days: number; // 默认5天
  
  // 用户选项
  hot_dish_total_per_day: number;
  main_meat_per_day: number;
  half_meat_per_day: number;
  veggie_hot_per_day: number;
  cold_per_day: number;
  
  staffing_tight: boolean;
  cook_method8_available: CookMethod8[]; // 可使用的烹饪方法
  spicy_level: 'no_spicy' | 'mild' | 'medium';
  flavor_diversity_required: boolean;
  ingredient_diversity_requirement: IngredientDiversityRequirement;
  used_history_ratio: number; // 0/0.3/0.5/0.7/1
  
  model?: 'deepseek-chat' | 'gpt-5-chat'; // 模型选择
}

/**
 * 上传菜单请求
 */
export interface UploadMenuRequest {
  store_id: string;
  title?: string;
  meal_type: MealType;
  menuItems: {
    days: {
      day_label: string;
      lunch: string[]; // 菜名数组
    }[];
  };
}

/**
 * AI生成的菜品详情（用于前端展示）
 */
export interface GeneratedDishDetail {
  name: string;
  description: string; // 简介
  cookingMethod: string; // 烹饪步骤
}

/**
 * 生成菜单响应
 */
export interface GenerateMenuResponse {
  menu_id: string;
  menu_items_json: MenuItemsJson;
  gen_options_json: GenOptionsJson;
  menu_stats_json: MenuStatsJson;
  
  // AI返回的详细信息
  generated_details: {
    [dishName: string]: GeneratedDishDetail;
  };
}

/**
 * 菜单查询参数
 */
export interface MenuQueryParams {
  store_id?: string;
  source_type?: 'uploaded' | 'generated';
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

/**
 * 菜单列表响应
 */
export interface MenuListResponse {
  menus: Menu[];
  total: number;
  page: number;
  page_size: number;
}

