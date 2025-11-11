"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorCode = void 0;
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ApiErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    ApiErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ApiErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ApiErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ApiErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ApiErrorCode["USER_EXISTS"] = "USER_EXISTS";
    ApiErrorCode["STORE_NOT_FOUND"] = "STORE_NOT_FOUND";
    ApiErrorCode["MENU_NOT_FOUND"] = "MENU_NOT_FOUND";
    ApiErrorCode["DISH_NOT_FOUND"] = "DISH_NOT_FOUND";
    ApiErrorCode["INSUFFICIENT_DISHES"] = "INSUFFICIENT_DISHES";
    ApiErrorCode["GENERATION_FAILED"] = "GENERATION_FAILED";
    ApiErrorCode["PARSING_FAILED"] = "PARSING_FAILED";
    ApiErrorCode["FILE_UPLOAD_FAILED"] = "FILE_UPLOAD_FAILED";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
//# sourceMappingURL=api.js.map