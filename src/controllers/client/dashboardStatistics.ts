import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
//import { FAQService } from "../../services/client/faqServices";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { ClientDashboardService } from "../../services/client/dashboard.service";
import { Types } from "mongoose";

const dashoardService = new ClientDashboardService();
export class DashboardController {

    async getDashboard(req: AuthenticatedClientRequest, res: Response) {
        try {
            const userId = req.user.userId;
            const stats = await dashoardService.getDashboardStats(userId);

            logger.info("Dashboard statistics fetched successfully");
            sendSuccessResponse(res, stats, "Dashboard statistics fetched successfully", HTTP_STATUS.OK);
        } catch (error: any) {
            logger.error("Dashboard statistics fetch failed", error.message);
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }

        //res.json({ role, stats });
    }
}