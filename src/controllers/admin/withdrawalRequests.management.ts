import { Request, Response, NextFunction } from "express";
import { WithdrawalAdminService } from "../../services/admin/withdrawal.request.management";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { request } from "http";

const withdrawalRequestsService = new WithdrawalAdminService();
export class WithdrawalRequestsManagementController {

    async acceptWithdrawalRequest(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { requestId } = req.params;
            const adminId = req.admin?.adminId
            const response = await withdrawalRequestsService.approveAndProcessWithdrawal(requestId, adminId as string);
            return sendSuccessResponse(res, response);
        } catch (error: any) {
            logger.error("Get transaction failed", { error });
            return sendErrorResponse(res, error.message, 400, error);
        }
    }

    async rejectWithdrawalRequest(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { requestId } = req.params;
            const response = await withdrawalRequestsService.rejectWithdrawal(requestId, req.admin?.adminId as string, req.body.reason);
            return sendSuccessResponse(res, response);
        } catch (error: any) {
            logger.error("Get transaction failed", { error });
            return sendErrorResponse(res, error.message, 400, error);
        }
    }

    async getWithdrawalRequests(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const response = await withdrawalRequestsService.getWithdrawalRequests(req.query);
            return sendSuccessResponse(res, response);
        } catch (error: any) {
            logger.error("Get transaction failed", { error });
            return sendErrorResponse(res, error);
        }
    }

}