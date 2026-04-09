import { FAQ } from "../../models/FAQ";
import { Types } from "mongoose";
//import { SubcategoryRepository } from "./subCategoryRepository";

export interface CreateFAQData {
    question: string;
    answer: string;
    category: string;
    isPublished?: boolean;
}

export interface UpdateFAQData {
    question?: string;
    answer?: string;
    category?: string;
    isPublished?: boolean;
}

export interface FAQQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    isPublished?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
}

export class FAQRepository {
    //private subcategoryRepository = new SubcategoryRepository();

    async adminfindAllWithFilters(params: FAQQueryParams) {
        const {
            page = 1,
            limit = 10,
            category,
            isPublished,
            sortBy = "createdAt",
            sortOrder = "desc",
            search,
        } = params;

        const filter: any = {};

        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }

        if (typeof isPublished === "boolean") {
            filter.isPublished = isPublished;
        }

        if (search) {
            filter.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        const [faqs, total] = await Promise.all([
            FAQ.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            FAQ.countDocuments(filter),
        ]);

        return {
            faqs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }




    async findAllWithFilters(params: FAQQueryParams) {
        const {
            page = 1,
            limit = 10,
            category,
            isPublished,
            sortBy = "createdAt",
            sortOrder = "desc",
            search,
        } = params;

        const filter: any = {};

        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }

        if (typeof isPublished === "boolean") {
            filter.isPublished = isPublished;
        }

        if (search) {
            filter.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        const [faqs, total] = await Promise.all([
            FAQ.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            FAQ.countDocuments(filter),
        ]);

        // 🔹 Group by category
        const grouped = faqs.reduce((acc: Record<string, any[]>, faq) => {
            if (!acc[faq.category]) acc[faq.category] = [];
            acc[faq.category].push(faq);
            return acc;
        }, {});

        return {
            success: true,
            message: "FAQs retrieved successfully",
            data: {
                faqsByCategory: grouped,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        };
    }



    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        return await FAQ.findById(id).lean();
    }

    async create(data: CreateFAQData) {
        // const subcategoryExists =
        //   await this.subcategoryRepository.getSubcategoryByName(data.category);
        // if (!subcategoryExists) {
        //   throw { message: "Category not found", statusCode: 404 };
        // }
        const faq = new FAQ(data);
        return await faq.save();
    }

    async findByIdAndUpdate(id: string, data: UpdateFAQData) {
        if (!Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        // if (data.category) {
        //   const subcategoryExists =
        //     await this.subcategoryRepository.getSubcategoryByName(data.category);
        //   if (!subcategoryExists) {
        //     throw { message: "Category not found", statusCode: 404 };
        //   }
        // }
        return await FAQ.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async findByIdAndDelete(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        return await FAQ.findByIdAndDelete(id).lean();
    }

    async getStatistics() {
        const [total, published, unpublished, categoriesStats, recentFAQs] =
            await Promise.all([
                FAQ.countDocuments(),
                FAQ.countDocuments({ isPublished: true }),
                FAQ.countDocuments({ isPublished: false }),
                FAQ.aggregate([
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 },
                            published: {
                                $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
                            },
                            unpublished: {
                                $sum: { $cond: [{ $eq: ["$isPublished", false] }, 1, 0] },
                            },
                        },
                    },
                    { $sort: { count: -1 } },
                ]),
                FAQ.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select("question category isPublished createdAt")
                    .lean(),
            ]);

        return {
            overview: {
                total,
                published,
                unpublished,
            },
            categories: categoriesStats,
            recentFAQs,
        };
    }

    async getCategories() {
        return await FAQ.distinct("category");
    }
}
