import { Response } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { DashboardService } from "../../services/admin/dashboardStatistics";

export class DashboardController {
    private dashboardService = new DashboardService();

    getDashboardStats = async (
        req: AdminAuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const result = await this.dashboardService.getDashboardStats();

            sendSuccessResponse(res, result, "Dashboard statistics retrieved successfully");
            logger.info("Admin retrieved dashboard statistics", {
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
            });
        } catch (error: any) {
            logger.error("Failed to retrieve dashboard statistics", {
                error: error.message,
                adminId: req.admin?.id,
                adminEmail: req.admin?.email,
            });

            sendErrorResponse(
                res,
                error.message,
                error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    };
}