import { Response, NextFunction } from "express";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { AdminReportServices } from "../../services/admin/reportServices";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";

const reportService = new AdminReportServices();

export class AdminReportController {
    async getReports(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const reports = await reportService.getReports(req.query);

            return sendSuccessResponse(
                res,
                reports,
                "reports retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getComplains(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const reports = await reportService.getComplains(req.query);

            return sendSuccessResponse(
                res,
                reports,
                "complains retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}


