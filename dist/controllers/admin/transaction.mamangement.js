"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTransactionController = void 0;
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const transaction_services_1 = require("../../services/admin/transaction.services");
const transactionService = new transaction_services_1.WalletTransactionServices();
class AdminTransactionController {
    async getWalletTransactionHistory(req, res, next) {
        try {
            const { userId, category, status, provider, method, minAmount, maxAmount, startDate, endDate, search, page = 1, limit = 10, } = req.query;
            const payload = {
                userId,
                category,
                status,
                provider,
                method,
                minAmount,
                maxAmount,
                startDate,
                endDate,
                search,
                page: Number(page),
                limit: Number(limit)
            };
            // console.log(payload)
            // const { userId, filters } = req.body;
            const response = await transactionService.getWalletTransactionHistory(payload);
            (0, helpers_1.sendSuccessResponse)(res, response, "transaction retrieved successfully");
        }
        catch (error) {
            logger_1.default.error("Get transaction failed", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getWalletTransaction(req, res, next) {
        try {
            const transactionId = req.params.transactionId;
            console.log(transactionId);
            const response = await transactionService.getWalletTransaction(transactionId);
            (0, helpers_1.sendSuccessResponse)(res, response, "Transaction retrieved ");
        }
        catch (error) {
            logger_1.default.error("Get transaction failed", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.AdminTransactionController = AdminTransactionController;
