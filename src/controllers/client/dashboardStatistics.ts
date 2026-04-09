import { Request, Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
//import { FAQService } from "../../services/client/faqServices";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { DashboardService } from "../../services/client/dashboardStatistics";
import { Types } from "mongoose";


export class DashboardController {
    async getDashboard(req: AuthenticatedClientRequest, res: Response) {
        try {
            const userId = new Types.ObjectId(req.user._id);
            const role = req.user.role;

            let stats;

            if (role === "client") {
                stats = await DashboardService.clientDashboard(userId);
            } else if (role === "consultant") {
                stats = await DashboardService.consultantDashboard(userId);
            } else {
                return res.status(403).json({ message: "Invalid role" });
            }
            logger.info("Dashboard statistics fetched successfully");
            sendSuccessResponse(res, stats, "Dashboard statistics fetched successfully", HTTP_STATUS.OK);
        } catch (error: any) {
            logger.error("Dashboard statistics fetch failed", error.message);
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }

        //res.json({ role, stats });
    }
}