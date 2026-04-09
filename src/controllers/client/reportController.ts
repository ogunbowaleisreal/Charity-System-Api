import { Response, NextFunction } from "express";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { ClientReportServices } from "../../services/client/reportsServices";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";

const reportService = new ClientReportServices();

export class ClientReportController {

    async uploadReport(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {

            const report = await reportService.uploadReport(
                req.user!.id,
                req.params.accountId,
                req.body
            );

            return sendSuccessResponse(
                res,
                report,
                "report uploaded successfully",
                HTTP_STATUS.CREATED
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getMyReports(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const filters = req.query as any
            const reports = await reportService.getMyReports(req.user!.id, filters);
            return sendSuccessResponse(
                res,
                reports,
                "report history retrieved",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}
