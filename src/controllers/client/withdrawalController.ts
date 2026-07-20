import { Request, Response, NextFunction } from "express";
import { WithdrawalService } from "../../services/client/withdrawal.services";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { Bank } from "../../models/Banks";
import { FlutterwaveService } from "../../services/flutterwave.services";

const withdrawalService = new WithdrawalService();
const flutterwave = new FlutterwaveService();

export class WithdrawalController {

    async applyForWithdrawalToBank(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId;
        const walletId = req.params.walletId as string;
        try {
            const withdrawal = await withdrawalService.applyForWithdrawalToBank(
                userId,
                req.body.amount,
                walletId,
                req.body.accountName,
                req.body.bankCode,
                req.body.bank_name,
                req.body.accountNumber,
                req.body.narration
            );
            return sendSuccessResponse(res, withdrawal);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async verifyWithdrawalRequestOtp(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        const walletId = req.params.walletId as string;
        try {
            const withdrawal = await withdrawalService.verifyWithdrawalRequest2FA(
                userId,
                req.body.amount,
                req.body.otp,
                walletId,
                req.body.accountName,
                req.body.bankCode,
                req.body.bank_name,
                req.body.accountNumber,
                req.body.narration
            );
            return sendSuccessResponse(res, withdrawal);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async resendWithdrawalOtp(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId; // adjust to however you attach the authenticated user

            const result = await withdrawalService.resendWithdrawal2FAOtp(userId);
            return res.status(result.status).json({ message: result.message });
        } catch (err) {
            logger.error("withdrawal otp resend failed");
            next(err);
        }
    }

    async toggleWithdrawal2Fa(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        const toggle = req.body.toggle as boolean
        try {
            const response = await withdrawalService.toggle2faWithdrawal(userId, toggle)
            sendSuccessResponse(res, response, "2fa for withdrawal has been updated")
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message);
        }

    }



    async resetWalletPin(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            await withdrawalService.resetWalletPin(userId)
            return sendSuccessResponse(res, "wallet pin reset otp sent successfully")
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message, err.statusCode, err);
        }
    }

    async firstTimeWalletPinSet(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        console.log("goit here ")
        try {
            const data = await withdrawalService.firstTimeWalletPinSet(userId, req.body.walletPin)
            return sendSuccessResponse(res, data, "wallet pin set successfully")
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message, err.statusCode, err);
        }
    }

    async verifyWalletPinResetOTP(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            await withdrawalService.verifyWalletPinResetOTP(userId, req.body.otp)
            logger.info("wallet pin reset OTP verified successfully")
            return sendSuccessResponse(res, "wallet pin reset OTP verified successfully")
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message);
        }
    }

    async getUserWallet(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            const wallet = await withdrawalService.getUserWallet(userId)
            return sendSuccessResponse(res, wallet, "wallet fetched successfully", 200)
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message);
        }
    }

    async verifyBankAccount(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            const wallet = await flutterwave.nameEnquiry(req.body.accountNumber, req.body.bankCode)
            return sendSuccessResponse(res, wallet, "bank account verified successfully", 200)
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message);
        }
    }


    async setWalletPin(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            const wallet = await withdrawalService.setWalletPin(userId, req.body.newPin)
            logger.info("wallet pin set successfully")
            return sendSuccessResponse(res, wallet, "wallet pin set successfully")

        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message, err.statusCode);
        }
    }

    async verifyWalletPin(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId
        try {
            const isVerified = await withdrawalService.verifyWalletPin(userId, req.body.walletPin)
            logger.info("wallet pin verified successfully")
            return sendSuccessResponse(res, { isVerified }, "wallet pin verified successfully")
        } catch (err: any) {
            logger.error(err);
            return sendErrorResponse(res, err.message, err.statusCode);
        }
    }

    async withdrawFundsToWwallet(req: AuthenticatedClientRequest, res: Response) {
        const campaignId = req.params.campaignId as string;
        const userId = req.user.userId;
        console.log(campaignId);
        try {
            const withdrawal = await withdrawalService.withdrawFundsToWallet(
                userId,
                campaignId,
                req.body.walletPin,
                req.body.amount,
                req.body.narration
            );
            return sendSuccessResponse(res, withdrawal, "withdrawal successful");
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, error.statusCode);
        }
    }

    async verifyWitdrawal2fa(req: AuthenticatedClientRequest, res: Response) {
        const userId = req.user.userId;
        const campaignId = req.params.campaignId as string;
        const code = req.body.otp;
        const amount = req.body.amount;
        const narration = req.body.narration;
        try {
            const withdrawal = await withdrawalService.verifyWithdrawal2fa(userId, campaignId, code, amount, narration);
            return sendSuccessResponse(res, withdrawal);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async getAllBanks(req: Request, res: Response) {
        try {
            const banks = await withdrawalService.getAllBanks();
            return sendSuccessResponse(res, banks);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message);
        }
    }

}