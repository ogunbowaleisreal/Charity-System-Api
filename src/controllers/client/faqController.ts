import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { FAQService } from "../../services/client/faqServices";
import { AuthenticatedClientRequest } from "../../middleware/auth";


export class FAQController {
    private faqService = new FAQService();

    getAllFAQs = async (req: AuthenticatedClientRequest, res: Response): Promise<void> => {
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

}