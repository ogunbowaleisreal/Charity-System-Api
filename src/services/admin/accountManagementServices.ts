import { FilterQuery, Types } from "mongoose";
import { Account, IAccount } from "../../models/Accounts";
import Campaign from "../../models/Campaign";
import Comment from "../../models/Comment";
import { Donation } from "../../models/Donations";
import { WalletTransaction } from "../../models/transaction";
import { ResendEmailService } from "../ResesndServices";
import { DashboardService } from "./dashboardStatistics";

import {
    PaginationQuery,
    buildPagination,
    formatPagination
} from "../../utils/admin/paginationUtills";

// =========================
// 🔍 BASE FILTERS
// =========================
export interface BaseFilter extends PaginationQuery {
    page?: number;
    limit?: number;

    startDate?: Date;
    endDate?: Date;
}

// =========================
// 👤 ACCOUNT FILTERS
// =========================
export interface AccountFilters extends BaseFilter {
    search?: string;
    role?: "user" | "organization";
    status?: "active" | "suspended" | "deleted";
    isVerified?: boolean;
    kycStatus?: "pending" | "verified";
}

// =========================
// 🎯 CAMPAIGN FILTERS
// =========================
export interface CampaignFilters extends BaseFilter {
    status?: "upcoming" | "ongoing" | "completed";
    isActive?: boolean;
    isDeleted?: boolean;
    riskLevel?: "low" | "medium" | "high";
    isFlagged?: boolean;
}

// =========================
// 💰 DONATION FILTERS
// =========================
export interface DonationFilters extends BaseFilter {
    paymentStatus?: "pending" | "success" | "failed";
    paymentStatusExtended?:
    | "initialized"
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | "reversed";

    paymentMethod?: "card" | "bank_transfer" | "virtual_account";
    isAnonymous?: boolean;
    minAmount?: number;
    maxAmount?: number;
}

// =========================
// 💬 COMMENT FILTERS
// =========================
export interface CommentFilters extends BaseFilter {
    isDeleted?: boolean;
}

// =========================
// 🧾 TRANSACTION FILTERS
// =========================
export interface TransactionFilters extends BaseFilter {
    status?: "pending" | "processing" | "successful" | "failed" | "expired";
    category?:
    | "donation"
    | "withdrawal"
    | "refund"
    | "adjustment"
    | "bonus"
    | "wallet_credit"
    | "wallet_debit"
    | "campaign_credit";

    provider?: "flutterwave" | "googlepay" | "safehaven";
}
export class AccountAdminService {
    emailService = new ResendEmailService()
    dashboard = new DashboardService()
    // =========================
    // 🔍 GET ALL ACCOUNTS
    // =========================
    async getAllAccounts(filters: AccountFilters) {
        const {
            search,
            role,
            status,
            isVerified,
            kycStatus,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: FilterQuery<IAccount> = {};

        // 🔍 search
        if (search) {
            const regex = new RegExp(search, "i");
            query.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { companyName: regex }
            ];
        }

        // 🎯 structured filters
        if (role) query.role = role;
        if (status) query.status = status;
        if (typeof isVerified === "boolean") query.isVerified = isVerified;
        if (kycStatus) query.kycStatus = kycStatus;

        // 📅 date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }
        const userMetrics = await this.dashboard.getUserMetrics();
        const [accounts, total] = await Promise.all([
            Account.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Account.countDocuments(query)
        ]);

        return formatPagination({ accounts, userMetrics }, total, page, limit);
    }

    // =========================
    // 👤 GET ACCOUNT BY ID
    // =========================
    async getAccountById(accountId: string) {
        return Account.findById(accountId);
    }

    // =========================
    // 🚫 SUSPEND ACCOUNT
    // =========================
    async suspendAccount(accountId: string, reason?: string) {
        const account = await Account.findById(accountId);

        if (!account) {
            throw new Error("Account not found");
        }

        if (account.status === "suspended") {
            throw new Error("Account already suspended");
        }

        account.status = "suspended";

        // Optional: attach metadata later (audit logs)
        // account.suspensionReason = reason;

        await account.save();

        this.emailService.sendAccountSuspendedNotification(account.email, reason)
        return account;
    }

    // =========================
    // ✅ UNSUSPEND ACCOUNT
    // =========================
    async unsuspendAccount(accountId: string) {
        const account = await Account.findById(accountId);

        if (!account) {
            throw new Error("Account not found");
        }

        if (account.status !== "suspended") {
            throw new Error("Account is not suspended");
        }

        account.status = "active";
        await account.save();

        await this.emailService.sendAccountUnsuspendedNotification(account.email)

        return account;
    }

    // =========================
    // 🎯 USER CAMPAIGNS
    // =========================
    async getUserCampaigns(
        userId: string,
        filters: CampaignFilters
    ) {
        const {
            status,
            isActive,
            isDeleted,
            riskLevel,
            isFlagged,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: any = {
            owner: new Types.ObjectId(userId)
        };

        if (status) query.status = status;
        if (typeof isActive === "boolean") query.isActive = isActive;
        if (typeof isDeleted === "boolean") query.isDeleted = isDeleted;
        if (riskLevel) query.riskLevel = riskLevel;
        if (typeof isFlagged === "boolean") query.isFlagged = isFlagged;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }

        const [campaigns, total] = await Promise.all([
            Campaign.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Campaign.countDocuments(query)
        ]);

        return formatPagination(campaigns, total, page, limit);
    }

    // =========================
    // 💰 CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(
        campaignId: string,
        filters: DonationFilters
    ) {
        const {
            paymentStatus,
            paymentStatusExtended,
            paymentMethod,
            minAmount,
            maxAmount,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: any = {
            campaign: new Types.ObjectId(campaignId)
        };

        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (paymentStatusExtended)
            query.paymentStatusExtended = paymentStatusExtended;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = minAmount;
            if (maxAmount) query.amount.$lte = maxAmount;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }

        const [donations, total] = await Promise.all([
            Donation.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Donation.countDocuments(query)
        ]);

        return formatPagination(donations, total, page, limit);
    }

    // =========================
    // 💬 CAMPAIGN COMMENTS
    // =========================
    async getCampaignComments(
        campaignId: string,
        filters: CommentFilters
    ) {
        const {
            isDeleted,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: any = {
            campaign: new Types.ObjectId(campaignId)
        };

        if (typeof isDeleted === "boolean") {
            query.isDeleted = isDeleted;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }

        const [comments, total] = await Promise.all([
            Comment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Comment.countDocuments(query)
        ]);

        return formatPagination(comments, total, page, limit);
    }

    // =========================
    // 💳 USER DONATIONS
    // =========================
    async getUserDonations(
        userId: string,
        filters: DonationFilters
    ) {
        const { skip } = buildPagination(filters.page, filters.limit);

        const query: any = {
            donor: new Types.ObjectId(userId)
        };

        const [donations, total] = await Promise.all([
            Donation.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(filters.limit as number),

            Donation.countDocuments(query)
        ]);

        return formatPagination(
            donations,
            total,
            filters.page || 1,
            filters.limit || 10
        );
    }

    // =========================
    // 🧾 USER TRANSACTIONS
    // =========================
    async getUserTransactions(
        userId: string,
        filters: TransactionFilters
    ) {
        const {
            status,
            category,
            provider,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: any = {
            userId: new Types.ObjectId(userId)
        };

        if (status) query.status = status;
        if (category) query.category = category;
        if (provider) query.provider = provider;

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
    }
}




// export class AccountAdminService {
//     // =========================
//     // 🔍 GET ALL ACCOUNTS (SEARCH + PAGINATION)
//     // =========================
//     async getAllAccounts(
//         query: {
//             search?: string;
//         } & PaginationQuery
//     ) {
//         const { search, page = 1, limit = 10 } = query;

//         const { skip } = buildPagination(page, limit);

//         const filter: FilterQuery<IAccount> = {};

//         if (search) {
//             const regex = new RegExp(search, "i");

//             filter.$or = [
//                 { firstName: regex },
//                 { lastName: regex },
//                 { email: regex },
//                 { companyName: regex }
//             ];
//         }

//         const [accounts, total] = await Promise.all([
//             Account.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             Account.countDocuments(filter)
//         ]);

//         return formatPagination(accounts, total, page, limit);
//     }

//     // =========================
//     // 👤 GET SINGLE ACCOUNT (ADMIN VIEW)
//     // =========================
//     async getAccountById(accountId: string) {
//         return Account.findById(accountId);
//     }

//     // =========================
//     // 🧾 GET USER CAMPAIGNS (ALL STATES)
//     // =========================
//     async getUserCampaigns(
//         userId: string,
//         query: PaginationQuery
//     ) {
//         const { page = 1, limit = 10 } = query;
//         const { skip } = buildPagination(page, limit);

//         const filter = {
//             owner: new Types.ObjectId(userId)
//             // 🔥 no isDeleted filter (admin sees everything)
//         };

//         const [campaigns, total] = await Promise.all([
//             Campaign.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             Campaign.countDocuments(filter)
//         ]);

//         return formatPagination(campaigns, total, page, limit);
//     }

//     // =========================
//     // 💰 GET CAMPAIGN DONATIONS
//     // =========================
//     async getCampaignDonations(
//         campaignId: string,
//         query: PaginationQuery
//     ) {
//         const { page = 1, limit = 10 } = query;
//         const { skip } = buildPagination(page, limit);

//         const filter = {
//             campaign: new Types.ObjectId(campaignId)
//         };

//         const [donations, total] = await Promise.all([
//             Donation.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             Donation.countDocuments(filter)
//         ]);

//         return formatPagination(donations, total, page, limit);
//     }

//     // =========================
//     // 💬 GET CAMPAIGN COMMENTS
//     // =========================
//     async getCampaignComments(
//         campaignId: string,
//         query: PaginationQuery
//     ) {
//         const { page = 1, limit = 10 } = query;
//         const { skip } = buildPagination(page, limit);

//         const filter = {
//             campaign: new Types.ObjectId(campaignId)
//         };

//         const [comments, total] = await Promise.all([
//             Comment.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             Comment.countDocuments(filter)
//         ]);

//         return formatPagination(comments, total, page, limit);
//     }

//     // =========================
//     // 💳 GET USER DONATIONS
//     // =========================
//     async getUserDonations(
//         userId: string,
//         query: PaginationQuery
//     ) {
//         const { page = 1, limit = 10 } = query;
//         const { skip } = buildPagination(page, limit);

//         const filter = {
//             donor: new Types.ObjectId(userId)
//         };

//         const [donations, total] = await Promise.all([
//             Donation.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             Donation.countDocuments(filter)
//         ]);

//         return formatPagination(donations, total, page, limit);
//     }

//     // =========================
//     // 🧾 GET USER TRANSACTIONS
//     // =========================
//     async getUserTransactions(
//         userId: string,
//         query: PaginationQuery
//     ) {
//         const { page = 1, limit = 10 } = query;
//         const { skip } = buildPagination(page, limit);

//         const filter = {
//             userId: new Types.ObjectId(userId)
//         };

//         const [transactions, total] = await Promise.all([
//             WalletTransaction.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),

//             WalletTransaction.countDocuments(filter)
//         ]);

//         return formatPagination(transactions, total, page, limit);
//     }
// }
