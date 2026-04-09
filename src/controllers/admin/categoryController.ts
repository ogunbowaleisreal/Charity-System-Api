import { Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { CategoryService } from "../../services/admin/categoryService";

export class CategoryController {
    private categoryService = new CategoryService();

    getAllCategories = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const result = await this.categoryService.getAllCategories(req.query);

            sendSuccessResponse(res, result, "Categories retrieved successfully");
            logger.info("Admin retrieved categories", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                totalCount: result.pagination.totalPages,
                page: req.query.page || 1,
            });
        } catch (error: any) {
            logger.error("Failed to retrieve categories", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                query: req.query,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getCategoryById = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const category = await this.categoryService.getCategoryById(
                req.params.id
            );

            sendSuccessResponse(res, category, "Category retrieved successfully");
            logger.info("Admin retrieved category by ID", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
            });
        } catch (error: any) {
            logger.error("Failed to retrieve category by ID", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    createCategory = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const category = await this.categoryService.createCategory(req.body);

            sendSuccessResponse(
                res,
                category,
                "Category created successfully",
                HTTP_STATUS.CREATED
            );
            logger.info("Admin created category", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: category.id,
                categoryName: category.categoryName,
            });
        } catch (error: any) {
            logger.error("Failed to create category", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryData: req.body,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateCategory = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const category = await this.categoryService.updateCategory(
                req.params.id,
                req.body
            );

            sendSuccessResponse(res, category, "Category updated successfully");
            logger.info("Admin updated category", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
                updateData: req.body,
            });
        } catch (error: any) {
            logger.error("Failed to update category", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
                updateData: req.body,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    deleteCategory = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            await this.categoryService.deleteCategory(req.params.id);

            sendSuccessResponse(res, null, "Category deleted successfully");
            logger.info("Admin deleted category", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
            });
        } catch (error: any) {
            logger.error("Failed to delete category", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateCategoryStatus = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const category = await this.categoryService.updateCategoryStatus(
                req.params.id,
                req.body.status
            );

            sendSuccessResponse(
                res,
                category,
                "Category status updated successfully"
            );
            logger.info("Admin updated category status", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
                newStatus: req.body.status,
            });
        } catch (error: any) {
            logger.error("Failed to update category status", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
                categoryId: req.params.id,
                status: req.body.status,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // getCategoriesWithSubcategoriesCount = async (
    //     req: AdminAuthenticatedRequest,
    //     res: Response
    // ): Promise<void> => {
    //     try {
    //         const result =
    //             await this.categoryService.getCategoriesWithSubcategoriesCount(
    //                 req.query
    //             );

    //         sendSuccessResponse(
    //             res,
    //             result,
    //             "Categories with subcategories count retrieved successfully"
    //         );
    //         logger.info("Admin retrieved categories with subcategories count", {
    //             adminId: req.admin?.id,
    //             adminEmail: req.admin?.email,
    //             totalCount: result.total,
    //         });
    //     } catch (error: any) {
    //         logger.error("Failed to retrieve categories with subcategories count", {
    //             error: error.message,
    //             adminId: req.admin?.id,
    //             adminEmail: req.admin?.email,
    //             query: req.query,
    //         });

    //         sendErrorResponse(
    //             res,
    //             error.message,
    //             error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    //         );
    //     }
    // };
}
