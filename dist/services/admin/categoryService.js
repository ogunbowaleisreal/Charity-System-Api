"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const categoryRepository_1 = require("../../repository/admin/categoryRepository");
const constants_1 = require("../../utils/constants");
class CategoryService {
    constructor() {
        this.categoryRepository = new categoryRepository_1.CategoryRepository();
        // async getCategoriesWithSubcategoriesCount(query: any = {}) {
        //     return await this.categoryRepository.getCategoriesWithSubcategoriesCount(
        //         query
        //     );
        // }
    }
    async getAllCategories(query) {
        return await this.categoryRepository.getAllCategories(query);
    }
    async getCategoryById(categoryId) {
        const category = await this.categoryRepository.getCategoryById(categoryId);
        if (!category) {
            throw {
                message: "Category not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        return category;
    }
    async createCategory(categoryData) {
        const existingCategory = await this.categoryRepository.getCategoryByName(categoryData.categoryName);
        if (existingCategory) {
            throw {
                message: "Category with this name already exists",
                statusCode: constants_1.HTTP_STATUS.CONFLICT,
            };
        }
        return await this.categoryRepository.createCategory(categoryData);
    }
    async updateCategory(categoryId, updateData) {
        const existingCategory = await this.categoryRepository.getCategoryById(categoryId);
        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        // Checking if category name is being updated and if it conflicts with existing category
        if (updateData.categoryName && updateData.categoryName !== existingCategory.categoryName) {
            const categoryWithSameName = await this.categoryRepository.getCategoryByName(updateData.categoryName);
            console.log(categoryWithSameName);
            if (categoryWithSameName && categoryWithSameName._id.toString() !== categoryId.toString()) {
                throw {
                    message: "Category with this name already exists",
                    statusCode: constants_1.HTTP_STATUS.CONFLICT,
                };
            }
        }
        const updatedCategory = await this.categoryRepository.updateCategory(categoryId, updateData);
        if (!updatedCategory) {
            throw {
                message: "Failed to update category",
                statusCode: constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            };
        }
        return updatedCategory;
    }
    async deleteCategory(categoryId) {
        const existingCategory = await this.categoryRepository.getCategoryById(categoryId);
        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        // Checking if category has subcategories
        // const subcategoriesCount =
        //     await this.categoryRepository.getSubcategoriesCountByCategory(categoryId);
        // if (subcategoriesCount > 0) {
        //     throw {
        //         message:
        //             "Cannot delete category with existing subcategories. Delete subcategories first.",
        //         statusCode: HTTP_STATUS.CONFLICT,
        //     };
        // }
        await this.categoryRepository.deleteCategory(categoryId);
    }
    async updateCategoryStatus(categoryId, status) {
        const existingCategory = await this.categoryRepository.getCategoryById(categoryId);
        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND,
            };
        }
        const updatedCategory = await this.categoryRepository.updateCategory(categoryId, { status });
        if (!updatedCategory) {
            throw {
                message: "Failed to update category status",
                statusCode: constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            };
        }
        return updatedCategory;
    }
}
exports.CategoryService = CategoryService;
