import { Response, NextFunction } from "express";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { AdminPlanManagementService } from "../../services/admin/adminPlanManagement";
import { sendSuccessResponse } from "../../utils/helpers";
import logger from "../../logger";

const planService = new AdminPlanManagementService();

export class AdminPlanController {

    async createPlan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const plan = await planService.createPlan(req.body);
            return sendSuccessResponse(res, plan, "Plan created successfully", 201);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async updatePlan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const plan = await planService.updatePlan(req.params.planId, req.body);
            return sendSuccessResponse(res, plan, "Plan updated successfully", 200);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getPlan(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const plan = await planService.getPlan(req.params.planId);
            return sendSuccessResponse(res, plan, "Plan retrieved successfully", 200);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getAllPlans(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const { page: _p, limit: _l, ...queryObj } = req.query

            const plans = await planService.getAllPlans(page, limit, queryObj);
            return sendSuccessResponse(res, plans, "Plans retrieved successfully", 200);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}
