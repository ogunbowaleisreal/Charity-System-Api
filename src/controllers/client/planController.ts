import { PlanServices } from "../../services/client/planServices";
import { Request, Response, NextFunction } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";

const planService = new PlanServices()
export class PlanController {
    async createPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const planData = req.body;
            const newPlan = await planService.createPlan(planData);
            sendSuccessResponse(res, newPlan, "plan created successfully", 200)
        } catch (error: any) {
            logger.error("plan creation failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getPlanByCode(req: Request, res: Response, next: NextFunction) {
        try {
            const planCode = req.body.planCode;
            const plan = await planService.getPlan(planCode);
            sendSuccessResponse(res, plan, "plan retrieved successfully", 200)
        } catch (error: any) {
            logger.error("plan retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async listPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const plans = await planService.listPlans();
            sendSuccessResponse(res, plans, "plans retrieved successfully", 200)
        } catch (error: any) {
            logger.error("plan retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }
}