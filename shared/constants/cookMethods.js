"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOK_METHOD_MAPPING = exports.COOK_METHOD_8 = void 0;
exports.normalizeCookMethod = normalizeCookMethod;
exports.COOK_METHOD_8 = [
    '炒',
    '熘',
    '蒸',
    '烧',
    '烤',
    '炖',
    '煎',
    '烹',
];
exports.COOK_METHOD_MAPPING = {
    '炒': '炒',
    '煸': '炒',
    '爆': '炒',
    '干煸': '炒',
    '急火快炒': '炒',
    '溜锅': '炒',
    '熘': '熘',
    '溜': '熘',
    '溜肉': '熘',
    '蒸': '蒸',
    '汆': '蒸',
    '灼': '蒸',
    '白灼': '蒸',
    '烧': '烧',
    '烩': '烧',
    '浇汁': '烧',
    '烹汁': '烧',
    '烤': '烤',
    '焗': '烤',
    '扒': '烤',
    '熏': '烤',
    '炖': '炖',
    '煲': '炖',
    '炖汤': '炖',
    '煨': '炖',
    '卤煮': '炖',
    '煎': '煎',
    '煎焖': '煎',
    '烹': '烹',
};
function normalizeCookMethod(method) {
    if (exports.COOK_METHOD_MAPPING[method]) {
        return exports.COOK_METHOD_MAPPING[method];
    }
    for (const [key, value] of Object.entries(exports.COOK_METHOD_MAPPING)) {
        if (method.includes(key) || key.includes(method)) {
            return value;
        }
    }
    return null;
}
//# sourceMappingURL=cookMethods.js.map