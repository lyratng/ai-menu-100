import type { DishType, IngredientTag, KnifeSkill, CookMethod8, Season } from '../constants';
export interface DishAnalysis {
    auto_parsed: boolean;
    confidence: number;
    status: 'uploaded_by_user' | 'generated_by_system' | 'human_verified';
}
export interface DishCommon {
    id: string;
    dish_name: string;
    dish_type: DishType;
    ingredient_tags: IngredientTag[];
    knife_skill: KnifeSkill | null;
    cuisine: string | null;
    cook_method8: CookMethod8;
    flavor: string | null;
    main_ingredients: string[];
    sub_ingredients: string[];
    seasons: Season[];
    analysis: DishAnalysis;
    created_at: string;
    is_active: boolean;
}
export interface DishStore extends DishCommon {
    store_id: string;
    common_dish_id: string | null;
}
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
export interface UpdateDishRequest extends Partial<CreateDishRequest> {
    is_active?: boolean;
}
export interface DishQueryParams {
    store_id?: string;
    dish_type?: DishType;
    cook_method8?: CookMethod8;
    season?: Season;
    is_active?: boolean;
    keyword?: string;
    page?: number;
    page_size?: number;
}
export interface DishListResponse {
    dishes: DishStore[];
    total: number;
    page: number;
    page_size: number;
}
//# sourceMappingURL=dish.d.ts.map