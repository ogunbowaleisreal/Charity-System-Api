import { Request, Response, NextFunction } from "express";
import { SubscriptionManagementServices } from "../../services/admin/subscriptionManagement";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
//import { SubscriptionService } from "../../services/admin/subscriptionServices";

const subscriptionService = new SubscriptionManagementServices()
export class SubscriptionController {

    async getClientSubscription(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.params.clientId
            const subscription = await subscriptionService.getClientSubscription(clientId);
            return sendSuccessResponse(
                res,
                subscription,
                "subscription retrieved successfully",
                200
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getAllActiveSubscriptions(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const { page: _p, limit: _l, ...queryObj } = req.query
            const subscriptions = await subscriptionService.getAllActiveSubscriptions(page, limit, queryObj);
            return sendSuccessResponse(
                res,
                subscriptions,
                "subscriptions retrieved successfully",
                200
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getClientTransacionHiatory(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.params.clientId
            const transactions = await subscriptionService.getClientTransactionHistory(clientId, req.query);
            return sendSuccessResponse(
                res,
                transactions,
                "transactions retrieved successfully",
                200
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}