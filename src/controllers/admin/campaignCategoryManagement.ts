import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
//import { AdminAuthenticatedRequest } from "../../middleware/verify.admin";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

import { CampaignCategoryService } from "../../services/admin/campaignCategoryManagement";

export class CampaignCategoryController {
    private categoryService = new CampaignCategoryService();

    // -------------------------------------------
    // CREATE CATEGORY
    // -------------------------------------------
    createCampaignCategory = async (req: AdminAuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const adminId = req.admin?.adminId;

            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const category = await this.categoryService.createCategory(req.body);
            if (!category || !category._id) throw new Error("there was an error creating the category")

            logger.info("Category created", {
                categoryId: category._id.toString(),
                createdBy: adminId,
            });

            sendSuccessResponse(
                res,
                category,
                "Category created successfully",
                HTTP_STATUS.CREATED
            );
        } catch (error: any) {
            logger.error("Failed to create category", {
                error: error.message,
                adminId: req.admin?.adminId,
                payload: req.body,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // -------------------------------------------
    // GET ALL CATEGORIES
    // -------------------------------------------
    getAllCampaignCategories = async (req: AdminAuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const categories = await this.categoryService.getAllCategories(req.query);

            sendSuccessResponse(
                res,
                categories,
                "Categories retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Failed to get categories", {
                error: error.message,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // -------------------------------------------
    // GET CATEGORY BY ID
    // -------------------------------------------
    getCampaignCategoryById = async (req: Request, res: Response): Promise<void> => {
        try {
            const categoryId = req.params.categoryId as string;

            const category = await this.categoryService.getCategoryById(categoryId);

            sendSuccessResponse(
                res,
                { category },
                "Category retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Failed to get category", {
                categoryId: req.params.categoryId,
                error: error.message,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // -------------------------------------------
    // UPDATE CATEGORY
    // -------------------------------------------
    updateCampaignCategory = async (req: AdminAuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const adminId = req.admin?.adminId;

            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const { categoryId } = req.params;

            const updatedCategory = await this.categoryService.updateCategory(
                categoryId,
                req.body
            );

            logger.info("Category updated", {
                categoryId,
                updatedBy: adminId,
                updates: Object.keys(req.body),
            });

            sendSuccessResponse(
                res,
                { category: updatedCategory },
                "Category updated successfully"
            );
        } catch (error: any) {
            logger.error("Failed to update category", {
                categoryId: req.params.categoryId,
                error: error.message,
                updatedBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // -------------------------------------------
    // DELETE CATEGORY
    // -------------------------------------------
    deleteCampaignCategory = async (req: AdminAuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const adminId = req.admin?.adminId;

            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const { categoryId } = req.params;

            await this.categoryService.deleteCategory(categoryId);

            logger.info("Category deleted", {
                categoryId,
                deletedBy: adminId,
            });

            sendSuccessResponse(res, null, "Category deleted successfully");
        } catch (error: any) {
            logger.error("Failed to delete category", {
                categoryId: req.params.categoryId,
                error: error.message,
                deletedBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    // -------------------------------------------
    // UPDATE STATUS (active / inactive / restricted)
    // -------------------------------------------
    updateCampaignCategoryStatus = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.admin?.adminId;

            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const { categoryId } = req.params;
            const { status } = req.body;

            const updated = await this.categoryService.updateCategoryStatus(
                categoryId,
                status
            );

            logger.info("Category status updated", {
                categoryId,
                newStatus: status,
                updatedBy: adminId,
            });

            sendSuccessResponse(
                res,
                { category: updated },
                "Category status updated successfully"
            );
        } catch (error: any) {
            logger.error("Failed to update category status", {
                categoryId: req.params.categoryId,
                error: error.message,
                updatedBy: req.admin?.adminId,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
}
