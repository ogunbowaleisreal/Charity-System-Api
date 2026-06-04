"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const Category_1 = require("../../models/Category");
const mongoose_1 = __importDefault(require("mongoose"));
class CategoryRepository {
    async getAllCategories(query = {}) {
        const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search, status, } = query;
        const filter = {};
        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (status) {
            filter.status = status;
        }
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
    async getCategoryById(categoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return null;
        }
        return await Category_1.Category.findById(categoryId).lean();
    }
    // async getCategoryByName(categoryName: string): Promise<Lean<ICategory> | null> {
    //     return await Category.findOne({
    //         categoryName: { $regex: `^${categoryName}$`, $options: "i" },
    //     }).lean();
    // }
    async getCategoryByName(categoryName) {
        return await Category_1.Category.findOne({
            categoryName: { $regex: `^${categoryName}$`, $options: "i" },
        });
    }
    async createCategory(categoryData) {
        const category = new Category_1.Category(categoryData);
        const savedCategory = await category.save();
        return savedCategory.toObject();
    }
    async updateCategory(categoryId, updateData) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return null;
        }
        return await Category_1.Category.findByIdAndUpdate(categoryId, updateData, {
            new: true,
            runValidators: true,
        }).lean();
    }
    async deleteCategory(categoryId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            throw new Error("Invalid category ID");
        }
        // Deleting all category subcategories
        // await Subcategory.deleteMany({ categoryId });
        await Category_1.Category.findByIdAndDelete(categoryId);
    }
}
exports.CategoryRepository = CategoryRepository;
