import { CampaignCategory, } from "../../models/campaignCategory";
import { Category, ICategory } from "../../models/Category";

interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
    //status?: string;
}
export class CampaignCategoryServices {
    async getCampaignCategory() {
        return await Category.find({ status: "active" });
    }

    async getAllCategories(query: QueryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            search,
            //  status,
        } = query;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }


        filter.status = "active";

        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        const skip = (Number(page) - 1) * Number(limit);

        const [categories, totalCount] = await Promise.all([
            CampaignCategory.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Category.countDocuments(filter),
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