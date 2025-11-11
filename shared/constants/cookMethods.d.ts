export declare const COOK_METHOD_8: readonly ["炒", "熘", "蒸", "烧", "烤", "炖", "煎", "烹"];
export type CookMethod8 = (typeof COOK_METHOD_8)[number];
export declare const COOK_METHOD_MAPPING: Record<string, CookMethod8>;
export declare function normalizeCookMethod(method: string): CookMethod8 | null;
//# sourceMappingURL=cookMethods.d.ts.map