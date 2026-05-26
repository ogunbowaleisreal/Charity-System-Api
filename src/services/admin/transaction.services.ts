import { FilterQuery, Types } from "mongoose";
import { WalletTransaction, IWalletTransaction } from "../../models/transaction";
import logger from "../../logger";
// import {
//     WalletTransactionFilters,
//     PaginatedResponse
// } from "../../interfaces/walletTransaction.filters";
import { buildPagination, formatPagination } from "../../utils/admin/paginationUtills";


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
    async getWalletTransactionHistory(
        //userId: string | null,
        filters: WalletTransactionFilters
    ): Promise<PaginatedResponse<IWalletTransaction>> {
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
                page = 1,
                limit = 10
            } = filters;

            const { skip } = buildPagination(page, limit);

            // const query: FilterQuery<IWalletTransaction> = {
            //     userId: new Types.ObjectId(userId)
            // };
            const query: FilterQuery<IWalletTransaction> = {};

            if (userId) {
                query.userId = new Types.ObjectId(userId);
            }

            // =========================
            // FILTERS
            // =========================
            if (category) query.category = category;
            if (status) query.status = status;
            if (provider) query.provider = provider;
            if (method) query.method = method;

            // 💰 amount range
            if (minAmount || maxAmount) {
                query.amount = {};
                if (minAmount) query.amount.$gte = minAmount;
                if (maxAmount) query.amount.$lte = maxAmount;
            }

            // 📅 date range
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = startDate;
                if (endDate) query.createdAt.$lte = endDate;
            }

            const [transactions, total] = await Promise.all([
                WalletTransaction.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),

                WalletTransaction.countDocuments(query)
            ]);

            return formatPagination(transactions, total, page, limit);

        } catch (error: any) {
            logger.error("Get transaction history failed", { error });
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
}
