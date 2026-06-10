"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalController = void 0;
const withdrawal_services_1 = require("../../services/client/withdrawal.services");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const flutterwave_services_1 = require("../../services/flutterwave.services");
const withdrawalService = new withdrawal_services_1.WithdrawalService();
const flutterwave = new flutterwave_services_1.FlutterwaveService();
class WithdrawalController {
    async applyForWithdrawalToBank(req, res) {
        const userId = req.user.userId;
        const walletId = req.params.walletId;
        try {
            const withdrawal = await withdrawalService.applyForWithdrawalToBank(userId, req.body.amount, walletId, req.body.accountName, req.body.bankCode, req.body.bank_name, req.body.accountNumber, req.body.narration);
            return (0, helpers_1.sendSuccessResponse)(res, withdrawal);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    async verifyWithdrawalRequestOtp(req, res) {
        const userId = req.user.userId;
        const walletId = req.params.walletId;
        try {
            const withdrawal = await withdrawalService.verifyWithdrawalRequest2FA(userId, req.body.amount, req.body.otp, walletId, req.body.accountName, req.body.bankCode, req.body.bank_name, req.body.accountNumber, req.body.narration);
            return (0, helpers_1.sendSuccessResponse)(res, withdrawal);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    async toggleWithdrawal2Fa(req, res) {
        const userId = req.user.userId;
        const toggle = req.body.toggle;
        try {
            const response = await withdrawalService.toggle2faWithdrawal(userId, toggle);
            (0, helpers_1.sendSuccessResponse)(res, response, "2fa for withdrawal has been updated");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message);
        }
    }
    async resetWalletPin(req, res) {
        const userId = req.user.userId;
        try {
            await withdrawalService.resetWalletPin(userId);
            return (0, helpers_1.sendSuccessResponse)(res, "wallet pin reset otp sent successfully");
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode, err);
        }
    }
    async firstTimeWalletPinSet(req, res) {
        const userId = req.user.userId;
        console.log("goit here ");
        try {
            await withdrawalService.firstTimeWalletPinSet(userId, req.body.walletPin);
            return (0, helpers_1.sendSuccessResponse)(res, "wallet pin set successfully");
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode, err);
        }
    }
    async verifyWalletPinResetOTP(req, res) {
        const userId = req.user.userId;
        try {
            await withdrawalService.verifyWalletPinResetOTP(userId, req.body.otp);
            logger_1.default.info("wallet pin reset OTP verified successfully");
            return (0, helpers_1.sendSuccessResponse)(res, "wallet pin reset OTP verified successfully");
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message);
        }
    }
    async getUserWallet(req, res) {
        const userId = req.user.userId;
        try {
            const wallet = await withdrawalService.getUserWallet(userId);
            return (0, helpers_1.sendSuccessResponse)(res, wallet, "wallet fetched successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message);
        }
    }
    async verifyBankAccount(req, res) {
        const userId = req.user.userId;
        try {
            const wallet = await flutterwave.nameEnquiry(req.body.accountNumber, req.body.bankCode);
            return (0, helpers_1.sendSuccessResponse)(res, wallet, "bank account verified successfully", 200);
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message);
        }
    }
    async setWalletPin(req, res) {
        const userId = req.user.userId;
        try {
            const wallet = await withdrawalService.setWalletPin(userId, req.body.newPin);
            logger_1.default.info("wallet pin set successfully");
            return (0, helpers_1.sendSuccessResponse)(res, wallet, "wallet pin set successfully");
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    async verifyWalletPin(req, res) {
        const userId = req.user.userId;
        try {
            const isVerified = await withdrawalService.verifyWalletPin(userId, req.body.walletPin);
            logger_1.default.info("wallet pin verified successfully");
            return (0, helpers_1.sendSuccessResponse)(res, "wallet pin verified successfully");
        }
        catch (err) {
            logger_1.default.error(err);
            return (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    async withdrawFundsToWwallet(req, res) {
        const campaignId = req.params.campaignId;
        const userId = req.user.userId;
        console.log(campaignId);
        try {
            const withdrawal = await withdrawalService.withdrawFundsToWallet(userId, campaignId, req.body.walletPin, req.body.amount, req.body.narration);
            return (0, helpers_1.sendSuccessResponse)(res, withdrawal, "withdrawal successful");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    async verifyWitdrawal2fa(req, res) {
        const userId = req.user.userId;
        const campaignId = req.params.campaignId;
        const code = req.body.otp;
        const amount = req.body.amount;
        const narration = req.body.narration;
        try {
            const withdrawal = await withdrawalService.verifyWithdrawal2fa(userId, campaignId, code, amount, narration);
            return (0, helpers_1.sendSuccessResponse)(res, withdrawal);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getAllBanks(req, res) {
        try {
            const banks = await withdrawalService.getAllBanks();
            return (0, helpers_1.sendSuccessResponse)(res, banks);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message);
        }
    }
}
exports.WithdrawalController = WithdrawalController;
