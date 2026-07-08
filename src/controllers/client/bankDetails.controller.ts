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

    // =============================
    // 🔹 UPDATE (request otp -> confirm)
    // =============================

    async updateBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            await bankDetailsService.requestUpdateOTP(
                req.user.userId,
                req.body
            );

            return sendSuccessResponse(
                res,
                null,
                "OTP sent to your registered email, please confirm to complete the update"
            );
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async confirmUpdateBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { otp } = req.body;

            const bankDetails = await bankDetailsService.confirmUpdate(
                req.user.userId,
                otp
            );

            return sendSuccessResponse(
                res,
                bankDetails,
                "Bank details updated successfully"
            );
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    // =============================
    // 🔹 DELETE (request otp -> confirm)
    // =============================

    async deleteBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            await bankDetailsService.requestDeleteOTP(req.user.userId);

            return sendSuccessResponse(
                res,
                null,
                "OTP sent to your registered email, please confirm to complete the deletion"
            );
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async confirmDeleteBankDetails(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { otp } = req.body;

            await bankDetailsService.confirmDelete(req.user.userId, otp);

            logger.info("Bank details deleted successfully");

            return sendSuccessResponse(
                res,
                null,
                "Bank details deleted successfully"
            );
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }
}