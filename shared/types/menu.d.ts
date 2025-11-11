import type { CookMethod8, MealType, SpicyLevel, IngredientDiversityRequirement } from '../constants';
export interface MenuDishItem {
    dish_name: string;
    dish_id: string | null;
}
export interface DayMenu {
    day_label: string;
    lunch: MenuDishItem[];
    breakfast?: MenuDishItem[];
    dinner?: MenuDishItem[];
    supper?: MenuDishItem[];
}
export interface MenuItemsJson {
    days: DayMenu[];
}
export interface GenOptionsJson {
    hot_dish_total_per_day: number;
    main_meat_per_day: number;
    half_meat_per_day: number;
    veggie_hot_per_day: number;
    cold_per_day: number;
    staffing_tight: boolean;
    cook_method8_used: CookMethod8[];
    spicy_ratio_target: SpicyLevel;
    flavor_diversity_required: boolean;
    ingredient_diversity_requirement: IngredientDiversityRequirement;
    used_history_ratio: number;
    analysis: {
        auto_parsed: boolean;
        confidence: number;
        status: 'uploaded_by_user' | 'generated_by_system';
    };
}
export interface MenuStatsJson {
    actual_main_meat_per_day: number;
    actual_half_meat_per_day: number;
    actual_veggie_hot_per_day: number;
    actual_cold_per_day: number;
    actual_spicy_ratio: number;
    methods_used8: CookMethod8[];
    passed_flavor_diversity: boolean;
    ingredient_diversity_actual: '无' | '≥4' | '≥5' | '≥6';
    analysis: {
        auto_parsed: boolean;
        confidence: number;
        status: 'uploaded_by_user' | 'generated_by_system' | 'human_verified';
    };
}
export interface Menu {
    id: string;
    org_id: string | null;
    store_id: string;
    source_type: 'uploaded' | 'generated';
    title: string | null;
    days: number;
    meal_type: MealType;
    menu_items_json: MenuItemsJson;
    gen_options_json: GenOptionsJson | null;
    menu_stats_json: MenuStatsJson | null;
    embedding_menu: number[] | null;
    used_history_ratio: number | null;
    created_by_user_id: string | null;
    created_at: string;
    is_active: boolean;
    meta_json: Record<string, any>;
}
export interface GenerateMenuRequest {
    store_id: string;
    meal_type: MealType;
    days: number;
    hot_dish_total_per_day: number;
    main_meat_per_day: number;
    half_meat_per_day: number;
    veggie_hot_per_day: number;
    cold_per_day: number;
    staffing_tight: boolean;
    cook_method8_available: CookMethod8[];
    spicy_level: 'no_spicy' | 'mild' | 'medium';
    flavor_diversity_required: boolean;
    ingredient_diversity_requirement: IngredientDiversityRequirement;
    used_history_ratio: number;
    model?: 'deepseek-chat' | 'gpt-5-chat';
}
export interface UploadMenuRequest {
    store_id: string;
    title?: string;
    meal_type: MealType;
    menuItems: {
        days: {
            day_label: string;
            lunch: string[];
        }[];
    };
}
export interface GeneratedDishDetail {
    name: string;
    description: string;
    cookingMethod: string;
}
export interface GenerateMenuResponse {
    menu_id: string;
    menu_items_json: MenuItemsJson;
    gen_options_json: GenOptionsJson;
    menu_stats_json: MenuStatsJson;
    generated_details: {
        [dishName: string]: GeneratedDishDetail;
    };
}
export interface MenuQueryParams {
    store_id?: string;
    source_type?: 'uploaded' | 'generated';
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
}
export interface MenuListResponse {
    menus: Menu[];
    total: number;
    page: number;
    page_size: number;
}
//# sourceMappingURL=menu.d.ts.map