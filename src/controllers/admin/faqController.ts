import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { FAQService } from "../../services/admin/faqService";

export class FAQController {
    private faqService = new FAQService();

    getAllFAQs = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.faqService.getAllFAQs(req.query as any);
            sendSuccessResponse(res, result, "FAQs retrieved successfully");
        } catch (error: any) {
            logger.error("Failed to get FAQs", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getFAQById = async (req: Request, res: Response): Promise<void> => {
        try {
            const faq = await this.faqService.getFAQById(req.params.id as string);
            sendSuccessResponse(res, faq, "FAQ retrieved successfully");
        } catch (error: any) {
            logger.error("Failed to get FAQ by ID", {
                error: error.message,
                faqId: req.params.id,
            });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    createFAQ = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const faq = await this.faqService.createFAQ(req.body);

            logger.info("FAQ created", {
                faqId: faq._id.toString() as string,
                createdBy: adminId,
                category: faq.category,
            });

            sendSuccessResponse(
                res,
                faq,
                "FAQ created successfully",
                HTTP_STATUS.CREATED
            );
        } catch (error: any) {
            logger.error("Failed to create FAQ", {
                error: error.message,
                createdBy: req.admin?.id,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    updateFAQ = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            const faq = await this.faqService.updateFAQ(req.params.id, req.body);

            logger.info("FAQ updated", {
                faqId: req.params.id,
                updatedBy: adminId,
            });

            sendSuccessResponse(res, faq, "FAQ updated successfully");
        } catch (error: any) {
            logger.error("Failed to update FAQ", {
                error: error.message,
                faqId: req.params.id,
                updatedBy: req.admin?.id,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
    deleteFAQ = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                sendErrorResponse(res, "Unauthorized", HTTP_STATUS.UNAUTHORIZED);
                return;
            }

            await this.faqService.deleteFAQ(req.params.id);

            logger.info("FAQ deleted", {
                faqId: req.params.id,
                deletedBy: adminId,
            });

            sendSuccessResponse(res, null, "FAQ deleted successfully");
        } catch (error: any) {
            logger.error("Failed to delete FAQ", {
                error: error.message,
                faqId: req.params.id,
                deletedBy: req.admin?.id,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };


    getFAQStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const statistics = await this.faqService.getFAQStatistics();
            sendSuccessResponse(
                res,
                statistics,
                "FAQ statistics retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Failed to get FAQ statistics", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

    getFAQCategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await this.faqService.getFAQCategories();
            sendSuccessResponse(
                res,
                categories,
                "FAQ categories retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Failed to get FAQ categories", { error: error.message });
            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };

}
