import { CategoryRepository } from "../../repository/admin/categoryRepository";
import { HTTP_STATUS } from "../../utils/constants";

import { ICategory } from "../../models/Category";
import { Schema, Document } from 'mongoose'
type Lean<T> = Omit<T, keyof Document>; // Remove Document methods

export class CategoryService {
    private categoryRepository = new CategoryRepository();

    async getAllCategories(query: any) {
        return await this.categoryRepository.getAllCategories(query);
    }

    async getCategoryById(categoryId: string): Promise<Lean<ICategory>> {
        const category = await this.categoryRepository.getCategoryById(categoryId);

        if (!category) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        return category;
    }

    async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
        const existingCategory = await this.categoryRepository.getCategoryByName(
            categoryData.categoryName!
        );

        if (existingCategory) {
            throw {
                message: "Category with this name already exists",
                statusCode: HTTP_STATUS.CONFLICT,
            };
        }

        return await this.categoryRepository.createCategory(categoryData);
    }

    async updateCategory(
        categoryId: string,
        updateData: Partial<ICategory>
    ): Promise<Lean<ICategory>> {
        const existingCategory = await this.categoryRepository.getCategoryById(
            categoryId
        );

        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        // Checking if category name is being updated and if it conflicts with existing category
        if (updateData.categoryName && updateData.categoryName !== existingCategory.categoryName) {
            const categoryWithSameName =
                await this.categoryRepository.getCategoryByName(
                    updateData.categoryName
                );

            console.log(categoryWithSameName)

            if (categoryWithSameName && categoryWithSameName._id as string !== categoryId.toString()) {
                throw {
                    message: "Category with this name already exists",
                    statusCode: HTTP_STATUS.CONFLICT,
                };
            }
        }

        const updatedCategory = await this.categoryRepository.updateCategory(
            categoryId,
            updateData
        );

        if (!updatedCategory) {
            throw {
                message: "Failed to update category",
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            };
        }

        return updatedCategory;
    }

    async deleteCategory(categoryId: string): Promise<void> {
        const existingCategory = await this.categoryRepository.getCategoryById(
            categoryId
        );

        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
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

    async updateCategoryStatus(
        categoryId: string,
        status: "active" | "inactive" | "restricted"
    ): Promise<Lean<ICategory>> {
        const existingCategory = await this.categoryRepository.getCategoryById(
            categoryId
        );

        if (!existingCategory) {
            throw {
                message: "Category not found",
                statusCode: HTTP_STATUS.NOT_FOUND,
            };
        }

        const updatedCategory = await this.categoryRepository.updateCategory(
            categoryId,
            { status }
        );

        if (!updatedCategory) {
            throw {
                message: "Failed to update category status",
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            };
        }

        return updatedCategory;
    }

    // async getCategoriesWithSubcategoriesCount(query: any = {}) {
    //     return await this.categoryRepository.getCategoriesWithSubcategoriesCount(
    //         query
    //     );
    // }
}
