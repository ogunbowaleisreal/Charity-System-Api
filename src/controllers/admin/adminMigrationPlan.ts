import { Request, Response, NextFunction } from "express";
import { AdminPlanMigrationService } from "../../services/admin/adminMigrationPlan";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

const migrationService = new AdminPlanMigrationService();

export class AdminPlanMigrationController {
    async migratePlan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { oldPlanId, newPlanId } = req.body;

            const result = await migrationService.migratePlan(oldPlanId, newPlanId);

            return sendSuccessResponse(res, result, "Plan migration completed successfully", 200);
        } catch (err: any) {
            logger.error(err.message);
            return sendErrorResponse(res, err.message || "Migration failed", 500);
        }
    }
}
