"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionServices = void 0;
const mongoose_1 = require("mongoose");
const transaction_1 = require("../../models/transaction");
const logger_1 = __importDefault(require("../../logger"));
// import {
//     WalletTransactionFilters,
//     PaginatedResponse
// } from "../../interfaces/walletTransaction.filters";
const paginationUtills_1 = require("../../utils/admin/paginationUtills");
const dashboardStatistics_1 = require("./dashboardStatistics");
const dashboard = new dashboardStatistics_1.DashboardService();
class WalletTransactionServices {
    // =========================
    // 🔍 GET SINGLE TRANSACTION
    // =========================
    async getWalletTransaction(transactionId) {
        try {
            const transaction = await transaction_1.WalletTransaction.findById(transactionId);
            if (!transaction) {
                throw new Error("Transaction not found");
            }
            return transaction;
        }
        catch (error) {
            logger_1.default.error("Get transaction failed", { error });
            throw new Error(`Failed to get transaction: ${error.message}`);
        }
    }
    // =========================
    // 📊 GET USER TRANSACTIONS (WITH FILTERS)
    // =========================
    async getWalletTransactionHistory(
    //userId: string | null,
    filters) {
        try {
            const { userId, category, status, provider, method, minAmount, maxAmount, startDate, endDate, page = 1, limit = 10 } = filters;
            const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
            // const query: FilterQuery<IWalletTransaction> = {
            //     userId: new Types.ObjectId(userId)
            // };
            const query = {};
            // =========================
            // FILTERS
            // =========================
            if (category)
                query.category = category;
            if (status)
                query.status = status;
            if (provider)
                query.provider = provider;
            if (method)
                query.method = method;
            // 💰 amount range
            if (minAmount || maxAmount) {
                query.amount = {};
                if (minAmount)
                    query.amount.$gte = minAmount;
                if (maxAmount)
                    query.amount.$lte = maxAmount;
            }
            // 📅 date range
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate)
                    query.createdAt.$gte = startDate;
                if (endDate)
                    query.createdAt.$lte = endDate;
            }
            if (userId) {
                query.userId = new mongoose_1.Types.ObjectId(userId);
                const transactionstats = await dashboard.getUserFinancialTotals(new mongoose_1.Types.ObjectId(userId));
                const [transactions, total] = await Promise.all([
                    transaction_1.WalletTransaction.find(query)
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit),
                    transaction_1.WalletTransaction.countDocuments(query)
                ]);
                return (0, paginationUtills_1.formatPagination)({ transactions, transactionstats }, total, page, limit);
            }
            const [financialTotal, transactionstats] = await Promise.all([dashboard.getFinancialTotals(), dashboard.getTransactionCounts()]);
            const [transactions, total] = await Promise.all([
                transaction_1.WalletTransaction.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                transaction_1.WalletTransaction.countDocuments(query)
            ]);
            return (0, paginationUtills_1.formatPagination)({ transactions, transactionstats, financialTotal }, total, page, limit);
        }
        catch (error) {
            logger_1.default.error("Get transaction history failed", { error });
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
}
exports.WalletTransactionServices = WalletTransactionServices;
