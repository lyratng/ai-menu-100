export declare const DISH_TYPES: readonly ["热菜主荤", "热菜半荤", "热菜素菜", "凉菜", "主食", "风味小吃", "汤", "酱汁", "饮料", "手工"];
export type DishType = (typeof DISH_TYPES)[number];
export declare const LUNCH_DISH_TYPES: readonly ["热菜主荤", "热菜半荤", "热菜素菜", "凉菜"];
export type LunchDishType = (typeof LUNCH_DISH_TYPES)[number];
export declare const INGREDIENT_TAGS: readonly ["肉", "禽", "鱼", "蛋", "豆", "菌", "筋", "蔬"];
export type IngredientTag = (typeof INGREDIENT_TAGS)[number];
export declare const KNIFE_SKILLS: readonly ["片", "丁", "粒", "米", "末", "茸", "丝", "条", "段", "块", "球", "花刀"];
export type KnifeSkill = (typeof KNIFE_SKILLS)[number];
export declare const COMPLEX_KNIFE_SKILLS: KnifeSkill[];
export declare const SEASONS: readonly ["春", "夏", "秋", "冬"];
export type Season = (typeof SEASONS)[number];
export declare const COST_LEVELS: readonly ["低", "中", "高"];
export type CostLevel = (typeof COST_LEVELS)[number];
export declare const SPICY_LEVELS: {
    readonly NO_SPICY: 0;
    readonly MILD: 0.15;
    readonly MEDIUM: 0.3;
};
export type SpicyLevel = (typeof SPICY_LEVELS)[keyof typeof SPICY_LEVELS];
export declare const MEAL_TYPES: readonly ["breakfast", "lunch", "dinner", "supper"];
export type MealType = (typeof MEAL_TYPES)[number];
export declare const MEAL_TYPE_CN: {
    readonly breakfast: "早餐";
    readonly lunch: "午餐";
    readonly dinner: "晚餐";
    readonly supper: "夜宵";
};
export declare const INGREDIENT_DIVERSITY_REQUIREMENTS: readonly ["无要求", "不少于4种", "不少于5种", "不少于6种"];
export type IngredientDiversityRequirement = (typeof INGREDIENT_DIVERSITY_REQUIREMENTS)[number];
//# sourceMappingURL=dishTypes.d.ts.map