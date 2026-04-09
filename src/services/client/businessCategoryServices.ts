import { BusinessCategory } from "../../models/BusinessCategory";

export class BusinessCategoryServices {
    async getBusinessCategory() {
        return await BusinessCategory.find({ isDeleted: false });
    }
}