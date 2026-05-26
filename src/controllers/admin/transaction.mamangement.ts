import { Request, Response, NextFunction } from "express";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { WalletTransactionServices } from "../../services/admin/transaction.services";

const transactionService = new WalletTransactionServices();

export class AdminTransactionController {
    async getWalletTransactionHistory(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // const { userId, filters } = req.body;
            const response = await transactionService.getWalletTransactionHistory(req.query);
            sendSuccessResponse(res, response, "transaction retrieved successfully");
        } catch (error: any) {
            logger.error("Get transaction failed", error);
            return sendErrorResponse(res, error);
        }
    }

    async getWalletTransaction(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const transactionId = req.params.transactionId;
            console.log(transactionId)
            const response = await transactionService.getWalletTransaction(transactionId);
            sendSuccessResponse(res, response, "Transaction retrieved ");
        } catch (error: any) {
            logger.error("Get transaction failed", error);
            return sendErrorResponse(res, error);
        }
    }

}