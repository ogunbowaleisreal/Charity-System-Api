import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import {
    sendSuccessResponse,
    sendErrorResponse,
} from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { BankDetailsService } from "../../services/client/bank.details.services";

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
                    req.user._id
                );

            return sendSuccessResponse(res, bankDetails);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
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
                    req.user._id
                );

            return sendSuccessResponse(res, bankDetails);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
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
                    req.user._id,
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

    // async deleteBankDetails(
    //     req: AuthenticatedClientRequest,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { bankDetailsId } = req.params;

    //         const bankDetails =
    //             await bankDetailsService.deleteBankDetails(
    //                 bankDetailsId,
    //                 req.user._id
    //             );

    //         return sendSuccessResponse(res, bankDetails);
    //     } catch (error: any) {
    //         logger.error(error);
    //         return sendErrorResponse(res, error);
    //     }
    // }
}