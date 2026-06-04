"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionServices = void 0;
const transaction_1 = require("../../models/transaction");
const paginationUtills_1 = require("../../utils/admin/paginationUtills");
class WalletTransactionServices {
    async createWalletTransaction(WalletTransactionData) {
        try {
            const WalletTransactionInfo = await transaction_1.WalletTransaction.create(WalletTransactionData);
            return WalletTransactionInfo;
        }
        catch (error) {
            throw new Error(`Failed to create WalletTransaction: ${error.message}`);
        }
    }
    async getWalletTransaction(WalletTransactionId) {
        try {
            const WalletTransactionInfo = await transaction_1.WalletTransaction.findById(WalletTransactionId);
            return WalletTransactionInfo;
        }
        catch (error) {
            throw new Error(`Failed to get WalletTransaction: ${error.message}`);
        }
    }
    async getWalletTransactionHistory(clientId, filters) {
        try {
            // const WalletTransactionInfo = await WalletTransaction.find({ user: clientId });
            // return WalletTransactionInfo;
            const { 
            //userId,
            category, status, provider, method, minAmount, maxAmount, startDate, endDate, page = 1, limit = 10 } = filters;
            const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
            // const query: FilterQuery<IWalletTransaction> = {
            //     userId: new Types.ObjectId(userId)
            // };
            const query = {};
            if (clientId) {
                query.userId = clientId;
            }
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
            //   console.log(query)
            const [transactions, total] = await Promise.all([
                transaction_1.WalletTransaction.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                transaction_1.WalletTransaction.countDocuments(query)
            ]);
            return (0, paginationUtills_1.formatPagination)(transactions, total, page, limit);
        }
        catch (error) {
            throw new Error(`Failed to get WalletTransaction history: ${error.message}`);
        }
    }
}
exports.WalletTransactionServices = WalletTransactionServices;
