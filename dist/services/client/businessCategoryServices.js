"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessCategoryServices = void 0;
const campaignCategory_1 = require("../../models/campaignCategory");
class BusinessCategoryServices {
    async getBusinessCategory() {
        return await campaignCategory_1.CampaignCategory.find({ isDeleted: false });
    }
}
exports.BusinessCategoryServices = BusinessCategoryServices;
