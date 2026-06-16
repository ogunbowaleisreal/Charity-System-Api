import { FilterQuery, Types } from "mongoose";
import { WalletTransaction, IWalletTransaction } from "../../models/transaction";
import logger from "../../logger";
// import {
//     WalletTransactionFilters,
//     PaginatedResponse
// } from "../../interfaces/walletTransaction.filters";
import { buildPagination, formatPagination } from "../../utils/admin/paginationUtills";
import { DashboardService } from "./dashboardStatistics";


// =========================
// BASE FILTER
// =========================
export interface WalletTransactionBaseFilter {
    page?: number;
    limit?: number;

    startDate?: Date;
    endDate?: Date;
}

// =========================
// TRANSACTION FILTERS
// =========================
export interface WalletTransactionFilters extends WalletTransactionBaseFilter {

    category?:
    | "donation"
    | "withdrawal"
    | "refund"
    | "adjustment"
    | "bonus"
    | "wallet_credit"
    | "wallet_debit"
    | "campaign_credit";

    userId: string;

    status?: "pending" | "processing" | "successful" | "failed" | "expired";

    provider?: "flutterwave" | "googlepay"

    method?: "card" | "bank_transfer" | "wallet";

    minAmount?: number;
    maxAmount?: number;
    search?: string;

    type?: "user" | "guest"; // ⚠️ (see note below)
}

// =========================
// PAGINATED RESPONSE
// =========================
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
const dashboard = new DashboardService()

export class WalletTransactionServices {

    // =========================
    // 🔍 GET SINGLE TRANSACTION
    // =========================
    async getWalletTransaction(transactionId: string) {
        try {
            const transaction = await WalletTransaction.findById(transactionId);

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            return transaction;
        } catch (error: any) {
            logger.error("Get transaction failed", { error });
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

    async getWalletTransactionHistory(
        filters: WalletTransactionFilters
    ) {
        try {
            const {
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
                page = 1,
                limit = 10,
            } = filters;

            const { skip } = buildPagination(page, limit);

            const matchStage: any = {};

            // =========================
            // FILTERS
            // =========================

            if (userId) {
                matchStage.userId = new Types.ObjectId(userId);
            }

            if (category) matchStage.category = category;
            if (status) matchStage.status = status;
            if (provider) matchStage.provider = provider;
            if (method) matchStage.method = method;

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

            const pipeline: any[] = [
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
                WalletTransaction.aggregate(dataPipeline),
                WalletTransaction.aggregate(countPipeline),
            ]);

            const total = countResult[0]?.total || 0;

            const transactionStats = userId
                ? await dashboard.getUserFinancialTotals(
                    new Types.ObjectId(userId)
                )
                : await dashboard.getPlatformFinancialTotals();

            return formatPagination(
                {
                    transactions,
                    transactionStats,
                },
                total,
                page,
                limit
            );
        } catch (error: any) {
            logger.error("Get transaction history failed", { error });

            throw new Error(
                `Failed to get transaction history: ${error.message}`
            );
        }
    }
}
