import { AuthenticatedRequest } from "../../middleware/verifyClients";
import { NextFunction, Request, Response } from "express";
import { transactionServices } from "../../services/client/transactionServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";


const transactionService = new transactionServices()

export class TransactionController {
    async getTransactionById(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const clientId = req.params.clientId
            const transactions = await transactionService.getTransaction(clientId)
            sendSuccessResponse(res, transactions, "transactions fetched successfully", 200)
        } catch (error: any) {
            logger.error("transaction fetch failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }


    async getTransactionsHistory(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            // console.log(req.user)
            const clientId = req.user.userId
            const transactions = await transactionService.getTransactionHistory(clientId)
            sendSuccessResponse(res, transactions, "transactions fetched successfully", 200)
        } catch (error: any) {
            logger.error("transaction fetch failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }
}