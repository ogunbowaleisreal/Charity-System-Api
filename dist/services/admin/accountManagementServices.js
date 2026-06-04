"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountAdminService = void 0;
const mongoose_1 = require("mongoose");
const Accounts_1 = require("../../models/Accounts");
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const Comment_1 = __importDefault(require("../../models/Comment"));
const Donations_1 = require("../../models/Donations");
const transaction_1 = require("../../models/transaction");
const ResesndServices_1 = require("../ResesndServices");
const paginationUtills_1 = require("../../utils/admin/paginationUtills");
class AccountAdminService {
    constructor() {
        this.emailService = new ResesndServices_1.ResendEmailService();
    }
    // =========================
    // 🔍 GET ALL ACCOUNTS
    // =========================
    async getAllAccounts(filters) {
        const { search, role, status, isVerified, kycStatus, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {};
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
        if (role)
            query.role = role;
        if (status)
            query.status = status;
        if (typeof isVerified === "boolean")
            query.isVerified = isVerified;
        if (kycStatus)
            query.kycStatus = kycStatus;
        // 📅 date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        const [accounts, total] = await Promise.all([
            Accounts_1.Account.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Accounts_1.Account.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(accounts, total, page, limit);
    }
    // =========================
    // 👤 GET ACCOUNT BY ID
    // =========================
    async getAccountById(accountId) {
        return Accounts_1.Account.findById(accountId);
    }
    // =========================
    // 🚫 SUSPEND ACCOUNT
    // =========================
    async suspendAccount(accountId, reason) {
        const account = await Accounts_1.Account.findById(accountId);
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
        this.emailService.sendAccountSuspendedNotification(account.email, reason);
        return account;
    }
    // =========================
    // ✅ UNSUSPEND ACCOUNT
    // =========================
    async unsuspendAccount(accountId) {
        const account = await Accounts_1.Account.findById(accountId);
        if (!account) {
            throw new Error("Account not found");
        }
        if (account.status !== "suspended") {
            throw new Error("Account is not suspended");
        }
        account.status = "active";
        await account.save();
        await this.emailService.sendAccountUnsuspendedNotification(account.email);
        return account;
    }
    // =========================
    // 🎯 USER CAMPAIGNS
    // =========================
    async getUserCampaigns(userId, filters) {
        const { status, isActive, isDeleted, riskLevel, isFlagged, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {
            owner: new mongoose_1.Types.ObjectId(userId)
        };
        if (status)
            query.status = status;
        if (typeof isActive === "boolean")
            query.isActive = isActive;
        if (typeof isDeleted === "boolean")
            query.isDeleted = isDeleted;
        if (riskLevel)
            query.riskLevel = riskLevel;
        if (typeof isFlagged === "boolean")
            query.isFlagged = isFlagged;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        const [campaigns, total] = await Promise.all([
            Campaign_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Campaign_1.default.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(campaigns, total, page, limit);
    }
    // =========================
    // 💰 CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(campaignId, filters) {
        const { paymentStatus, paymentStatusExtended, paymentMethod, minAmount, maxAmount, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {
            campaign: new mongoose_1.Types.ObjectId(campaignId)
        };
        if (paymentStatus)
            query.paymentStatus = paymentStatus;
        if (paymentStatusExtended)
            query.paymentStatusExtended = paymentStatusExtended;
        if (paymentMethod)
            query.paymentMethod = paymentMethod;
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount)
                query.amount.$gte = minAmount;
            if (maxAmount)
                query.amount.$lte = maxAmount;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        const [donations, total] = await Promise.all([
            Donations_1.Donation.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Donations_1.Donation.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(donations, total, page, limit);
    }
    // =========================
    // 💬 CAMPAIGN COMMENTS
    // =========================
    async getCampaignComments(campaignId, filters) {
        const { isDeleted, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {
            campaign: new mongoose_1.Types.ObjectId(campaignId)
        };
        if (typeof isDeleted === "boolean") {
            query.isDeleted = isDeleted;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        const [comments, total] = await Promise.all([
            Comment_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Comment_1.default.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(comments, total, page, limit);
    }
    // =========================
    // 💳 USER DONATIONS
    // =========================
    async getUserDonations(userId, filters) {
        const { skip } = (0, paginationUtills_1.buildPagination)(filters.page, filters.limit);
        const query = {
            donor: new mongoose_1.Types.ObjectId(userId)
        };
        const [donations, total] = await Promise.all([
            Donations_1.Donation.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(filters.limit),
            Donations_1.Donation.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(donations, total, filters.page || 1, filters.limit || 10);
    }
    // =========================
    // 🧾 USER TRANSACTIONS
    // =========================
    async getUserTransactions(userId, filters) {
        const { status, category, provider, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {
            userId: new mongoose_1.Types.ObjectId(userId)
        };
        if (status)
            query.status = status;
        if (category)
            query.category = category;
        if (provider)
            query.provider = provider;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        const [transactions, total] = await Promise.all([
            transaction_1.WalletTransaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            transaction_1.WalletTransaction.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(transactions, total, page, limit);
    }
}
exports.AccountAdminService = AccountAdminService;
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
