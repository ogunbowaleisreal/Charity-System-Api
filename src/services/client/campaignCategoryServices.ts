import { CampaignCategory } from "../../models/campaignCategory";

export class CampaignCategoryServices {
    async getCampaignCategory() {
        return await CampaignCategory.find({ isDeleted: false });
    }
}