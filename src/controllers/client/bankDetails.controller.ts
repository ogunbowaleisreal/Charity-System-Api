import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import {
    sendSuccessResponse,
    sendErrorResponse,
} from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { BankDetailsService } from "../../services/client/bank.details.services";
import { HTTP_STATUS } from "../../utils/constants";

const bankDetailsService = new BankDetailsService();

export class BankDetailsController {
    // =============================
    // 🔹 CREATE
    // =============================

    async createBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const bankDetails =
                await bankDetailsService.createBankDetails(
                    req.body,
                    req.user.userId
                );

            return sendSuccessResponse(res, bankDetails);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    // =============================
    // 🔹 FETCH
    // =============================

    async getUserBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const bankDetails =
                await bankDetailsService.getUserBankDetails(
                    req.user.userId
                );
            if (!bankDetails) {
                return sendErrorResponse(res,
                    "You have no bank details yet or it has been deleted , plss create a bank detail",
                    HTTP_STATUS.NOT_FOUND);
            }

            return sendSuccessResponse(res, bankDetails);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message);
        }
    }

    // async getBankDetailsById(
    //     req: Request,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { bankDetailsId } = req.params;

    //         const bankDetails =
    //             await bankDetailsService.getBankDetailsById(
    //                 bankDetailsId
    //             );

    //         return sendSuccessResponse(res, bankDetails);
    //     } catch (error: any) {
    //         logger.error(error);
    //         return sendErrorResponse(res, error);
    //     }
    // }

    // =============================
    // 🔹 UPDATE
    // =============================

    async updateBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { bankDetailsId } = req.params;

            const bankDetails =
                await bankDetailsService.updateBankDetails(
                    bankDetailsId,
                    req.user.userId,
                    req.body
                );

            return sendSuccessResponse(res, bankDetails);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 DELETE
    // =============================

    async deleteBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { bankDetailsId } = req.params;

            const bankDetails =
                await bankDetailsService.deleteBankDetails(
                    bankDetailsId,
                    req.user.userId
                );
            logger.info("Bank details deleted successfully");

            return sendSuccessResponse(res, bankDetails, "bank details deleted successfully");
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }
}