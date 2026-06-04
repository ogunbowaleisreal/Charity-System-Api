"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transactionServices_1 = require("../../services/client/transactionServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const transactionService = new transactionServices_1.WalletTransactionServices();
class TransactionController {
    async getTransactionById(req, res, next) {
        try {
            const transactionId = req.params.transactionId;
            const transactions = await transactionService.getWalletTransaction(transactionId);
            (0, helpers_1.sendSuccessResponse)(res, transactions, "transactions fetched successfully", 200);
        }
        catch (error) {
            logger_1.default.error("transaction fetch failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getTransactionsHistory(req, res, next) {
        try {
            // console.log(req.user)
            const clientId = req.user.userId;
            const transactions = await transactionService.getWalletTransactionHistory(clientId, req.query);
            (0, helpers_1.sendSuccessResponse)(res, transactions, "transactions fetched successfully", 200);
        }
        catch (error) {
            logger_1.default.error("transaction fetch failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
