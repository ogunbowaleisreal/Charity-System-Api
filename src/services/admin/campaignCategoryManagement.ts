import { CampaignCategory } from "../../models/campaignCategory";
import { HTTP_STATUS } from "../../utils/constants";
import { CampaignCategoryDocument, CategoryStatus } from "../../models/campaignCategory";
import { Document } from "mongoose";

type Lean<T> = Omit<T, keyof Document>;
export type categoryFilter = {
    name?: any,
    status?: CategoryStatus,
    search?: string,
    isDeleted?: boolean
}

export class CampaignCategoryService {
    // -------------------------
    // GET ALL (with optional filters)
    // -------------------------
    // async getAllCategories(query: any) {
    //     const filter: any = { isDeleted: false };

    //     if (query.status) filter.status = query.status;

    //     return await BusinessCategory.find(filter)
    //         .sort({ createdAt: -1 })
    //         .lean();
    // }
    async getAllCategories(query: any) {
        const filter: categoryFilter = { status: "active" };

        if (query.status) filter.status = query.status;

        /* ====== SEARCH ADDITION ====== */
        if (query.search) {
            filter.name = {
                $regex: query.search,
                $options: "i", // case-insensitive
            };
        }
        /* ============================= */

        return await CampaignCategory.find(filter)
            .sort({ createdAt: -1 })
            .lean();
    }


    // -------------------------
    // GET SINGLE
    // -------------------------
    async getCategoryById(id: string): Promise<Lean<CampaignCategoryDocument>> {
        const category = await CampaignCategory.findOne({
            _id: id,
            isDeleted: false,
        }).lean();

        if (!category) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        return category;
    }

    // -------------------------
    // CREATE
    // -------------------------
    async createCategory(data: Partial<CampaignCategoryDocument>) {
        // Check name conflict
        const exists = await CampaignCategory.findOne({
            name: data.categoryName,
            isDeleted: false,
        });

        if (exists) {
            throw {
                message: "Category with this name already exists",
                statusCode: HTTP_STATUS.CONFLICT,
            };
        }

        const category = new CampaignCategory(data);
        await category.save(); // slug auto-generated

        return category.toObject();
    }

    // -------------------------
    // UPDATE
    // -------------------------
    async updateCategory(
        id: string,
        updateData: Partial<CampaignCategoryDocument>
    ): Promise<Lean<CampaignCategoryDocument>> {
        const existing = await CampaignCategory.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!existing) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        // Check for conflicting category name
        if (updateData.categoryName) {
            const conflict = await CampaignCategory.findOne({
                name: updateData.categoryName,
                _id: { $ne: id },
                isDeleted: false,
            });

            if (conflict) {
                throw {
                    message: "Another category with this name already exists",
                    statusCode: HTTP_STATUS.CONFLICT,
                };
            }
        }

        // Apply updates manually so slug regenerates if name changes
        existing.set(updateData);
        await existing.save();

        return existing.toObject();
    }

    // -------------------------
    // SOFT DELETE
    // -------------------------
    async deleteCategory(id: string): Promise<void> {
        const category = await CampaignCategory.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!category) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        category.isDeleted = true;
        await category.save();
    }

    // -------------------------
    // UPDATE STATUS
    // -------------------------
    async updateCategoryStatus(
        id: string,
        status: CategoryStatus
    ): Promise<Lean<CampaignCategoryDocument>> {
        const category = await CampaignCategory.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!category) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        category.status = status;
        await category.save();

        return category.toObject();
    }
}

// import { BusinessCategory, BusinessCategoryDocument } from "../../models/BusinessCategory";
// import { HTTP_STATUS } from "../../utils/constants";
// import { Document } from "mongoose";

// type Lean<T> = Omit<T, keyof Document>;

// export class CategoryService {

//     // -------------------------------------------
//     // GET ALL CATEGORIES (with filters)
//     // -------------------------------------------
//     async getAllCategories(query: any = {}) {
//         const { status, search } = query;

//         const filter: any = { isDeleted: false };

//         if (status) filter.status = status;

//         if (search) {
//             filter.name = { $regex: search, $options: "i" };
//         }

//         return await BusinessCategory.find(filter).sort({ createdAt: -1 }).lean();
//     }

//     // -------------------------------------------
//     // GET SINGLE CATEGORY
//     // -------------------------------------------
//     async getCategoryById(id: string): Promise<Lean<BusinessCategoryDocument>> {
//         const category = await BusinessCategory.findOne({
//             _id: id,
//             isDeleted: false,
//         }).lean();

//         if (!category) {
//             throw {
//                 message: "Category not found",
//                 statusCode: HTTP_STATUS.NOT_FOUND,
//             };
//         }

//         return category;
//     }

//     // -------------------------------------------
//     // CREATE CATEGORY
//     // -------------------------------------------
//     async createCategory(data: Partial<BusinessCategoryDocument>) {
//         const { name, image } = data;

//         // Check duplicate
//         const existing = await BusinessCategory.findOne({
//             name: name!.trim(),
//             isDeleted: false,
//         });

//         if (existing) {
//             throw {
//                 message: "Category with this name already exists",
//                 statusCode: HTTP_STATUS.CONFLICT,
//             };
//         }

//         // Create
//         const newCategory = await BusinessCategory.create({
//             name: name!.trim(),
//             image: image || null,
//             status: "active",
//         });

//         return newCategory.toObject();
//     }

//     // -------------------------------------------
//     // UPDATE CATEGORY
//     // -------------------------------------------
//     async updateCategory(id: string, data: Partial<BusinessCategoryDocument>) {
//         const category = await BusinessCategory.findOne({ _id: id, isDeleted: false });

//         if (!category) {
//             throw {
//                 message: "Category not found",
//                 statusCode: HTTP_STATUS.NOT_FOUND,
//             };
//         }

//         // If name changed, check duplicate
//         if (data.name && data.name !== category.name) {
//             const duplicate = await BusinessCategory.findOne({
//                 name: data.name,
//                 _id: { $ne: id },
//                 isDeleted: false,
//             });

//             if (duplicate) {
//                 throw {
//                     message: "Another category with this name already exists",
//                     statusCode: HTTP_STATUS.CONFLICT,
//                 };
//             }
//         }

//         // Update fields
//         if (data.name) category.name = data.name.trim();
//         if (data.image !== undefined) category.image = data.image;
//         if (data.status) category.status = data.status;

//         await category.save();

//         return category.toObject();
//     }

//     // -------------------------------------------
//     // DELETE CATEGORY (Soft Delete)
//     // -------------------------------------------
//     async deleteCategory(id: string) {
//         const category = await BusinessCategory.findOne({ _id: id, isDeleted: false });

//         if (!category) {
//             throw {
//                 message: "Category not found",
//                 statusCode: HTTP_STATUS.NOT_FOUND,
//             };
//         }

//         category.isDeleted = true;
//         await category.save();

//         return;
//     }

//     // -------------------------------------------
//     // UPDATE STATUS
//     // -------------------------------------------
//     async updateCategoryStatus(
//         id: string,
//         status: "active" | "inactive" | "restricted"
//     ) {
//         const category = await BusinessCategory.findOne({ _id: id, isDeleted: false });

//         if (!category) {
//             throw {
//                 message: "Category not found",
//                 statusCode: HTTP_STATUS.NOT_FOUND,
//             };
//         }

//         category.status = status;
//         await category.save();

//         return category.toObject();
//     }

//     // -------------------------------------------
//     // INCREMENT LISTING COUNT (when a user picks this category)
//     // -------------------------------------------
//     async incrementListingCount(categoryId: string) {
//         await BusinessCategory.updateOne(
//             { _id: categoryId, isDeleted: false },
//             { $inc: { listingCount: 1 } }
//         );
//     }

//     // -------------------------------------------
//     // DECREMENT LISTING COUNT (optional)
//     // -------------------------------------------
//     async decrementListingCount(categoryId: string) {
//         await BusinessCategory.updateOne(
//             { _id: categoryId, isDeleted: false, listingCount: { $gt: 0 } },
//             { $inc: { listingCount: -1 } }
//         );
//     }
// }
