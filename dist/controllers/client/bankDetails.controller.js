"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDetailsController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const bank_details_services_1 = require("../../services/client/bank.details.services");
const constants_1 = require("../../utils/constants");
const bankDetailsService = new bank_details_services_1.BankDetailsService();
class BankDetailsController {
    // =============================
    // 🔹 CREATE
    // =============================
    async createBankDetails(req, res, next) {
        try {
            const bankDetails = await bankDetailsService.createBankDetails(req.body, req.user.userId);
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    // =============================
    // 🔹 FETCH
    // =============================
    async getUserBankDetails(req, res, next) {
        try {
            const bankDetails = await bankDetailsService.getUserBankDetails(req.user.userId);
            if (!bankDetails) {
                return (0, helpers_1.sendErrorResponse)(res, "You have no bank details yet or it has been deleted , plss create a bank detail", constants_1.HTTP_STATUS.NOT_FOUND);
            }
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message);
        }
    }
    // =============================
    // 🔹 UPDATE (request otp -> confirm)
    // =============================
    async updateBankDetails(req, res, next) {
        try {
            await bankDetailsService.requestUpdateOTP(req.user.userId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, null, "OTP sent to your registered email, please confirm to complete the update");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    async confirmUpdateBankDetails(req, res, next) {
        try {
            const { otp } = req.body;
            const bankDetails = await bankDetailsService.confirmUpdate(req.user.userId, otp);
            return (0, helpers_1.sendSuccessResponse)(res, bankDetails, "Bank details updated successfully");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    // =============================
    // 🔹 DELETE (request otp -> confirm)
    // =============================
    async deleteBankDetails(req, res, next) {
        try {
            await bankDetailsService.requestDeleteOTP(req.user.userId);
            return (0, helpers_1.sendSuccessResponse)(res, null, "OTP sent to your registered email, please confirm to complete the deletion");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
    async confirmDeleteBankDetails(req, res, next) {
        try {
            const { otp } = req.body;
            await bankDetailsService.confirmDelete(req.user.userId, otp);
            logger_1.default.info("Bank details deleted successfully");
            return (0, helpers_1.sendSuccessResponse)(res, null, "Bank details deleted successfully");
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error.message, error.statusCode);
        }
    }
}
exports.BankDetailsController = BankDetailsController;
