"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignCategoryServices = void 0;
const Category_1 = require("../../models/Category");
class CampaignCategoryServices {
    async getCampaignCategory() {
        return await Category_1.Category.find({ status: "active" });
    }
    async getAllCategories(query = {}) {
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search,
        //  status,
         } = query;
        const filter = {};
        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        filter.status = "active";
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        const [categories, totalCount] = await Promise.all([
            Category_1.Category.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Category_1.Category.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(totalCount / Number(limit));
        const hasNext = Number(page) < totalPages;
        const hasPrev = Number(page) > 1;
        return {
            data: categories,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems: totalCount,
                itemsPerPage: Number(limit),
                hasNext,
                hasPrev,
            },
        };
    }
}
exports.CampaignCategoryServices = CampaignCategoryServices;
