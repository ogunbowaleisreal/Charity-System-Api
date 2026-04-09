import { Category, ICategory } from "../../models/Category";
import mongoose from "mongoose";
import { Schema, Document } from 'mongoose'

type Lean<T> = Omit<T, keyof Document>; // Remove Document methods


interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
    status?: string;
}
export class CategoryRepository {
    async getAllCategories(query: QueryOptions = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            search,
            status,
        } = query;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { categoryName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (status) {
            filter.status = status;
        }

        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        const skip = (Number(page) - 1) * Number(limit);

        const [categories, totalCount] = await Promise.all([
            Category.find(filter)
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
            data: categories as ICategory[],
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

    async getCategoryById(categoryId: string): Promise<Lean<ICategory> | null> {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return null;
        }

        return await Category.findById(categoryId).lean();
    }

    // async getCategoryByName(categoryName: string): Promise<Lean<ICategory> | null> {
    //     return await Category.findOne({
    //         categoryName: { $regex: `^${categoryName}$`, $options: "i" },
    //     }).lean();
    // }
    async getCategoryByName(categoryName: string): Promise<ICategory | null> {
        return await Category.findOne({
            categoryName: { $regex: `^${categoryName}$`, $options: "i" },
        });
    }


    async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
        const category = new Category(categoryData);
        const savedCategory = await category.save();
        return savedCategory.toObject();
    }

    async updateCategory(
        categoryId: string,
        updateData: Partial<ICategory>
    ): Promise<Lean<ICategory> | null> {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return null;
        }

        return await Category.findByIdAndUpdate(categoryId, updateData, {
            new: true,
            runValidators: true,
        }).lean();
    }

    async deleteCategory(categoryId: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new Error("Invalid category ID");
        }

        // Deleting all category subcategories
        // await Subcategory.deleteMany({ categoryId });

        await Category.findByIdAndDelete(categoryId);
    }

    // async getSubcategoriesCountByCategory(categoryId: string): Promise<number> {
    //     if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    //         return 0;
    //     }

    //     return await Subcategory.countDocuments({ categoryId });
    // }

    // async getCategoriesWithSubcategoriesCount(query: QueryOptions = {}) {
    //     const {
    //         page = 1,
    //         limit = 10,
    //         sortBy = "createdAt",
    //         sortOrder = "desc",
    //         search,
    //         status,
    //     } = query;

    //     const matchStage: any = {};

    //     if (search) {
    //         matchStage.$or = [
    //             { categoryName: { $regex: search, $options: "i" } },
    //             { description: { $regex: search, $options: "i" } },
    //         ];
    //     }

    //     if (status) {
    //         matchStage.status = status;
    //     }

    //     const sortStage: any = {};
    //     sortStage[sortBy] = sortOrder === "asc" ? 1 : -1;

    //     const skip = (Number(page) - 1) * Number(limit);

    //     const pipeline = [
    //         { $match: matchStage },
    //         {
    //             $lookup: {
    //                 from: "subcategories",
    //                 localField: "_id",
    //                 foreignField: "categoryId",
    //                 as: "subcategories",
    //             },
    //         },
    //         {
    //             $addFields: {
    //                 subcategoriesCount: { $size: "$subcategories" },
    //             },
    //         },
    //         {
    //             $project: {
    //                 subcategories: 0,
    //             },
    //         },
    //         { $sort: sortStage },
    //     ];

    //     const [categories, totalCountResult] = await Promise.all([
    //         Category.aggregate([
    //             ...pipeline,
    //             { $skip: skip },
    //             { $limit: Number(limit) },
    //         ]),
    //         Category.aggregate([{ $match: matchStage }, { $count: "total" }]),
    //     ]);

    //     const totalCount = totalCountResult[0]?.total || 0;
    //     const totalPages = Math.ceil(totalCount / Number(limit));

    //     return {
    //         data: categories,
    //         total: totalCount,
    //         page: Number(page),
    //         limit: Number(limit),
    //         totalPages,
    //     };
    // }
}
