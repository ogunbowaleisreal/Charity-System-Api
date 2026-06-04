"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignCategoryController = void 0;
const campaignCategoryServices_1 = require("../../services/client/campaignCategoryServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const campaignCategoryServices = new campaignCategoryServices_1.CampaignCategoryServices();
class CampaignCategoryController {
    async campaignCategory(req, res, next) {
        try {
            const businessCategory = await campaignCategoryServices.getAllCategories(req.query);
            (0, helpers_1.sendSuccessResponse)(res, businessCategory, "campaign category fetched");
        }
        catch (err) {
            logger_1.default.error("campaign category fetch failed");
            next(err);
        }
    }
}
exports.CampaignCategoryController = CampaignCategoryController;
