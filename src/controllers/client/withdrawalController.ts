import { Request, Response } from "express";
import { WithdrawalService } from "../../services/client/withdrawal.services";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const withdrawalService = new WithdrawalService();

export class WithdrawalController {
    async applyForWithdrawalToBank(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.id;
        const walletId = req.params.walletId;
        try {
            const withdrawal = await withdrawalService.applyForWithdrawalToBank(
                userId,
                walletId,
                req.body.amount,
                req.body.accountName,
                req.body.bankCode,
                req.body.bank_name,
                req.body.accountNumber,
                req.body.narration
            );
            return sendSuccessResponse(res, withdrawal);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async withdrawFundsToWwallet(req: AuthenticatedClientRequest, res: Response) {
        const campaignId = req.params.comapignId;
        const userId = req.user.userId;
        try {
            const withdrawal = await withdrawalService.withdrawFundsToWallet(
                userId,
                campaignId,
                req.body.amount,
                req.body.narration
            );
            return sendSuccessResponse(res, withdrawal);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

}