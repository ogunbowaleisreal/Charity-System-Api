"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessCategoryController = void 0;
const businessCategoryServices_1 = require("../../services/client/businessCategoryServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const businessCategoryServices = new businessCategoryServices_1.BusinessCategoryServices();
class BusinessCategoryController {
    async businessCategory(req, res, next) {
        try {
            const businessCategory = await businessCategoryServices.getBusinessCategory();
            (0, helpers_1.sendSuccessResponse)(res, businessCategory, "business category fetched");
        }
        catch (err) {
            logger_1.default.error("business category fetch failed");
            next(err);
        }
    }
}
exports.BusinessCategoryController = BusinessCategoryController;
