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
    // async getWalletTransactionHistory(
    //     //userId: string | null,
    //     filters: WalletTransactionFilters
    // ) {
    //     try {
    //         const {
    //             userId,
    //             category,
    //             status,
    //             provider,
    //             method,
    //             minAmount,
    //             maxAmount,
    //             startDate,
    //             endDate,
    //             page = 1,
    //             limit = 10
    //         } = filters;
    //         const { skip } = buildPagination(page, limit);
    //         // const query: FilterQuery<IWalletTransaction> = {
    //         //     userId: new Types.ObjectId(userId)
    //         // };
    //         const query: FilterQuery<IWalletTransaction> = {};
    //         // =========================
    //         // FILTERS
    //         // =========================
    //         if (category) query.category = category;
    //         if (status) query.status = status;
    //         if (provider) query.provider = provider;
    //         if (method) query.method = method;
    //         // 💰 amount range
    //         if (minAmount || maxAmount) {
    //             query.amount = {};
    //             if (minAmount) query.amount.$gte = minAmount;
    //             if (maxAmount) query.amount.$lte = maxAmount;
    //         }
    //         // 📅 date range
    //         if (startDate || endDate) {
    //             query.createdAt = {};
    //             if (startDate) query.createdAt.$gte = startDate;
    //             if (endDate) query.createdAt.$lte = endDate;
    //         }
    //         if (userId) {
    //             query.userId = new Types.ObjectId(userId);
    //             const transactionStats = await dashboard.getUserFinancialTotals(new Types.ObjectId(userId))
    //             const [transactions, total] = await Promise.all([
    //                 WalletTransaction.find(query)
    //                     .sort({ createdAt: -1 })
    //                     .skip(skip)
    //                     .limit(limit),
    //                 WalletTransaction.countDocuments(query)
    //             ]);
    //             return formatPagination({ transactions, transactionStats }, total, page, limit);
    //         }
    //         const transactionStats = await dashboard.getPlatformFinancialTotals()
    //         const [transactions, total] = await Promise.all([
    //             WalletTransaction.find(query)
    //                 .sort({ createdAt: -1 })
    //                 .skip(skip)
    //                 .limit(limit),
    //             WalletTransaction.countDocuments(query)
    //         ]);
    //         return formatPagination({ transactions, transactionStats }, total, page, limit);
    //     } catch (error: any) {
    //         logger.error("Get transaction history failed", { error });
    //         throw new Error(`Failed to get transaction history: ${error.message}`);
    //     }
    // }
    async getWalletTransactionHistory(filters) {
        try {
            const { userId, category, status, provider, method, minAmount, maxAmount, startDate, endDate, search, page = 1, limit = 10, } = filters;
            const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
            const matchStage = {};
            // =========================
            // FILTERS
            // =========================
            if (userId) {
                matchStage.userId = new mongoose_1.Types.ObjectId(userId);
            }
            if (category)
                matchStage.category = category;
            if (status)
                matchStage.status = status;
            if (provider)
                matchStage.provider = provider;
            if (method)
                matchStage.method = method;
            // Amount range
            if (minAmount || maxAmount) {
                matchStage.amount = {};
                if (minAmount) {
                    matchStage.amount.$gte = Number(minAmount);
                }
                if (maxAmount) {
                    matchStage.amount.$lte = Number(maxAmount);
                }
            }
            // Date range
            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) {
                    matchStage.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    matchStage.createdAt.$lte = new Date(endDate);
                }
            }
            const pipeline = [
                {
                    $match: matchStage,
                },
                {
                    $lookup: {
                        from: "accounts", // collection name
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ];
            // =========================
            // SEARCH
            // =========================
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            {
                                "user.firstName": {
                                    $regex: search,
                                    $options: "i",
                                },
                            },
                            {
                                "user.lastName": {
                                    $regex: search,
                                    $options: "i",
                                },
                            },
                            {
                                fullName: {
                                    $regex: search,
                                    $options: "i",
                                },
                            },
                            {
                                reference: {
                                    $regex: search,
                                    $options: "i",
                                },
                            },
                            {
                                providerReference: {
                                    $regex: search,
                                    $options: "i",
                                },
                            },
                        ],
                    },
                });
            }
            const countPipeline = [...pipeline, { $count: "total" }];
            const dataPipeline = [
                ...pipeline,
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limit,
                },
            ];
            const [transactions, countResult] = await Promise.all([
                transaction_1.WalletTransaction.aggregate(dataPipeline),
                transaction_1.WalletTransaction.aggregate(countPipeline),
            ]);
            const total = countResult[0]?.total || 0;
            const transactionStats = userId
                ? await dashboard.getUserFinancialTotals(new mongoose_1.Types.ObjectId(userId))
                : await dashboard.getPlatformFinancialTotals();
            return (0, paginationUtills_1.formatPagination)({
                transactions,
                transactionStats,
            }, total, page, limit);
        }
        catch (error) {
            logger_1.default.error("Get transaction history failed", { error });
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
}
exports.WalletTransactionServices = WalletTransactionServices;
