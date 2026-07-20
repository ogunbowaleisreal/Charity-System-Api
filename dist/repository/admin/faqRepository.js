"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQRepository = void 0;
const FAQ_1 = require("../../models/FAQ");
const mongoose_1 = require("mongoose");
const Category_1 = require("../../models/Category");
class FAQRepository {
    //private subcategoryRepository = new SubcategoryRepository();
    async adminfindAllWithFilters(params) {
        const { page = 1, limit = 10, category, isPublished, sortBy = "createdAt", sortOrder = "desc", search, } = params;
        const filter = {};
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
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const [faqs, total] = await Promise.all([
            FAQ_1.FAQ.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            FAQ_1.FAQ.countDocuments(filter),
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
    async findAllWithFilters(params) {
        const { page = 1, limit = 10, category, isPublished, sortBy = "createdAt", sortOrder = "desc", search, } = params;
        const filter = {};
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
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
        const [faqs, total] = await Promise.all([
            FAQ_1.FAQ.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            FAQ_1.FAQ.countDocuments(filter),
        ]);
        // 🔹 Group by category
        const grouped = faqs.reduce((acc, faq) => {
            if (!acc[faq.category])
                acc[faq.category] = [];
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
    async findById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        return await FAQ_1.FAQ.findById(id).lean();
    }
    async create(data) {
        // const subcategoryExists =
        //   await this.subcategoryRepository.getSubcategoryByName(data.category);
        // if (!subcategoryExists) {
        //   throw { message: "Category not found", statusCode: 404 };
        // }
        const existingFAQ = await FAQ_1.FAQ.findOne({ question: data.question });
        if (existingFAQ) {
            throw { message: "FAQ already exists", statusCode: 400 };
        }
        const isValidCategory = await Category_1.Category.exists({ categoryName: data.category });
        if (!isValidCategory) {
            throw { message: "Category not found", statusCode: 404 };
        }
        const faq = new FAQ_1.FAQ(data);
        return await faq.save();
    }
    async findByIdAndUpdate(id, data) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        // if (data.category) {
        //   const subcategoryExists =
        //     await this.subcategoryRepository.getSubcategoryByName(data.category);
        //   if (!subcategoryExists) {
        //     throw { message: "Category not found", statusCode: 404 };
        //   }
        // }
        return await FAQ_1.FAQ.findByIdAndUpdate(id, data, { new: true }).lean();
    }
    async findByIdAndDelete(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw { message: "Invalid FAQ ID", statusCode: 400 };
        }
        return await FAQ_1.FAQ.findByIdAndDelete(id).lean();
    }
    async getStatistics() {
        const [total, published, unpublished, categoriesStats, recentFAQs] = await Promise.all([
            FAQ_1.FAQ.countDocuments(),
            FAQ_1.FAQ.countDocuments({ isPublished: true }),
            FAQ_1.FAQ.countDocuments({ isPublished: false }),
            FAQ_1.FAQ.aggregate([
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
            FAQ_1.FAQ.find()
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
        return await FAQ_1.FAQ.distinct("category");
    }
}
exports.FAQRepository = FAQRepository;
