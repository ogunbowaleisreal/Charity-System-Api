import { WalletTransaction } from "../../models/transaction";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import Campaign from "../../models/Campaign";
import { Account } from "../../models/Accounts";
import { KYC } from "../../models/KYC";
import { Donation } from "../../models/Donations";
import { Types } from "mongoose";

export class DashboardService {

    // ================================================================
    // 🌐 GENERAL DASHBOARD STATS (platform-wide, admin only)
    // ================================================================
    async getDashboardStats() {
        const [
            financialStats,
            // platformsFinancialStats,
            transactionCounts,
            campaignStats,
            withdrawalRequestStats,
            userMetrics,
        ] = await Promise.all([
            this.getFinancialTotals(),
            // this.getPlatformFinancialTotals(),
            this.getTransactionCounts(),
            this.getCampaignStats(),
            this.getWithdrawalRequestStats(),
            this.getUserMetrics(),
        ]);

        return {
            financialStats,
            //platformsFinancialStats,
            transactionCounts,
            campaignStats,
            withdrawalRequestStats,
            userMetrics,
        };
    }

    // ================================================================
    // 👤 USER-SCOPED DASHBOARD STATS (admin viewing one user)
    // ================================================================
    async getUserStatsByUserId(userId: string) {
        const userObjectId = new Types.ObjectId(userId);

        const [
            financialStats,
            campaignStats,
            withdrawalRequestStats,
            userMetrics,
            recentDonations,
            recentWithdrawals,
        ] = await Promise.all([
            this.getUserFinancialTotals(userObjectId),
            this.getUserCampaignStats(userObjectId),
            this.getUserWithdrawalRequestStats(userObjectId),
            this.getUserMetricsByUserId(userObjectId),
            this.getUserRecentDonations(userObjectId),
            this.getUserRecentWithdrawals(userObjectId),
        ]);

        return {
            financialStats,
            campaignStats,
            withdrawalRequestStats,
            userMetrics,
            recentActivity: {
                donations: recentDonations,
                withdrawals: recentWithdrawals,
            },
        };
    }

    // ================================================================
    // 💰 FINANCIAL TOTALS — PLATFORM-WIDE
    // Per category: successful amount+count, failed amount+count, combined total
    // ================================================================
    async getFinancialTotals() {
        const result = await WalletTransaction.aggregate([
            {
                $match: {
                    category: { $in: ["wallet_credit", "donation", "withdrawal"] },
                    status: { $in: ["successful", "failed"] },
                },
            },
            {
                $group: {
                    _id: {
                        category: "$category",
                        status: "$status",
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.category",
                    buckets: {
                        $push: {
                            status: "$_id.status",
                            totalAmount: "$totalAmount",
                            count: "$count",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    successful: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$buckets",
                                                as: "b",
                                                cond: { $eq: ["$$b.status", "successful"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: {
                                amount: { $ifNull: ["$$match.totalAmount", 0] },
                                count: { $ifNull: ["$$match.count", 0] },
                            },
                        },
                    },
                    failed: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$buckets",
                                                as: "b",
                                                cond: { $eq: ["$$b.status", "failed"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: {
                                amount: { $ifNull: ["$$match.totalAmount", 0] },
                                count: { $ifNull: ["$$match.count", 0] },
                            },
                        },
                    },
                    totalAmount: { $sum: "$buckets.totalAmount" },
                    totalCount: { $sum: "$buckets.count" },
                },
            },
        ]);

        const byCategory: Record<string, any> = {};
        for (const row of result) {
            byCategory[row.category] = row;
        }

        const empty = {
            successful: { amount: 0, count: 0 },
            failed: { amount: 0, count: 0 },
            totalAmount: 0,
            totalCount: 0,
        };

        const build = (category: string) => {
            const row = byCategory[category];
            if (!row) return empty;
            return {
                successful: row.successful,
                failed: row.failed,
                totalAmount: row.totalAmount,
                totalCount: row.totalCount,
            };
        };

        return {
            walletCredits: build("wallet_credit"),
            donations: build("donation"),
            withdrawals: build("withdrawal"),
        };
    }

    // ================================================================
    // 💰 FINANCIAL TOTALS — PLATFORM-WIDE (FLAT, ALL CATEGORIES)
    // Same shape as getUserFinancialTotals but across ALL transactions
    // on the platform (no userId filter, no category filter):
    //   - totalAmount / totalCount  (every status)
    //   - successfulAmount / successfulCount  (status === "successful")
    //   - byStatus: { pending, processing, successful, failed, expired } -> { amount, count }
    // ================================================================
    async getPlatformFinancialTotals() {
        const STATUSES = ["pending", "processing", "successful", "failed", "expired"];

        const result = await WalletTransaction.aggregate([
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const byStatus: Record<string, { amount: number; count: number }> = {};
        for (const status of STATUSES) {
            byStatus[status] = { amount: 0, count: 0 };
        }

        let totalAmount = 0;
        let totalCount = 0;

        for (const row of result) {
            const status = row._id as string;
            const amount = row.totalAmount ?? 0;
            const count = row.count ?? 0;

            byStatus[status] = { amount, count };

            totalAmount += amount;
            totalCount += count;
        }

        const successful = byStatus["successful"] ?? { amount: 0, count: 0 };

        return {
            totalAmount,
            totalCount,
            successfulAmount: successful.amount,
            successfulCount: successful.count,
            byStatus,
        };
    }

    // ================================================================
    // 💰 FINANCIAL TOTALS — USER-SCOPED
    // Status-based breakdown across ALL of the user's wallet transactions:
    //   - totalAmount / totalCount  (every status)
    //   - successfulAmount / successfulCount  (status === "successful")
    //   - byStatus: { pending, processing, successful, failed, expired } -> { amount, count }
    // ================================================================
    async getUserFinancialTotals(userId: Types.ObjectId) {
        const STATUSES = ["pending", "processing", "successful", "failed", "expired"];

        const result = await WalletTransaction.aggregate([
            {
                $match: {
                    userId,
                },
            },
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const byStatus: Record<string, { amount: number; count: number }> = {};
        for (const status of STATUSES) {
            byStatus[status] = { amount: 0, count: 0 };
        }

        let totalAmount = 0;
        let totalCount = 0;

        for (const row of result) {
            const status = row._id as string;
            const amount = row.totalAmount ?? 0;
            const count = row.count ?? 0;

            if (byStatus[status]) {
                byStatus[status] = { amount, count };
            } else {
                // Any unexpected/legacy status values still get counted in totals
                byStatus[status] = { amount, count };
            }

            totalAmount += amount;
            totalCount += count;
        }

        const successful = byStatus["successful"] ?? { amount: 0, count: 0 };

        return {
            totalAmount,
            totalCount,
            successfulAmount: successful.amount,
            successfulCount: successful.count,
            byStatus,
        };
    }

    // ================================================================
    // 📊 TRANSACTION COUNTS — PLATFORM-WIDE
    // ================================================================
    async getTransactionCounts() {
        const [categoryCountsRaw, failedCount] = await Promise.all([
            WalletTransaction.aggregate([
                {
                    $match: {
                        category: { $in: ["wallet_credit", "donation", "withdrawal"] },
                    },
                },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                    },
                },
            ]),
            WalletTransaction.countDocuments({ status: "failed" }),
        ]);

        const categoryCounts = categoryCountsRaw.reduce(
            (acc: Record<string, number>, item: { _id: string; count: number }) => {
                acc[item._id] = item.count;
                return acc;
            },
            {}
        );

        return {
            walletCreditTransactions: categoryCounts["wallet_credit"] ?? 0,
            donationTransactions: categoryCounts["donation"] ?? 0,
            withdrawalTransactions: categoryCounts["withdrawal"] ?? 0,
            failedTransactions: failedCount,
        };
    }

    // ================================================================
    // 🎁 DONATION STATS — PLATFORM-WIDE
    // Covers:
    //   - totalCount + totalAmount (all donations)
    //   - byPaymentStatus: { pending, success, failed } -> { count, amount }
    //   - byType: { user, guest } -> { count, amount }
    //   - anonymous: { count, amount } — donor is "Anonymous" (isAnonymous: true)
    //   - nonAnonymous: { count, amount } — named donors
    //   - registered: { count, amount } — donor field is not null
    //   - unregistered: { count, amount } — donor field is null (guest/unregistered)
    // ================================================================
    async getDonationStats() {
        const [statusBreakdown, typeBreakdown, anonymousBreakdown, registrationBreakdown] =
            await Promise.all([
                // 1. By paymentStatus
                Donation.aggregate([
                    {
                        $group: {
                            _id: "$paymentStatus",
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ]),

                // 2. By type (user | guest)
                Donation.aggregate([
                    {
                        $group: {
                            _id: "$type",
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ]),

                // 3. Anonymous vs non-anonymous (isAnonymous flag)
                Donation.aggregate([
                    {
                        $group: {
                            _id: "$isAnonymous",
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ]),

                // 4. Registered (donor != null) vs unregistered (donor == null)
                Donation.aggregate([
                    {
                        $group: {
                            _id: { $cond: [{ $ifNull: ["$donor", false] }, "registered", "unregistered"] },
                            totalAmount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);

        // --- helpers ---
        const emptyBucket = { count: 0, amount: 0 };

        const pickBucket = (rows: any[], id: any) => {
            const row = rows.find((r) => r._id === id);
            return row ? { count: row.count, amount: row.totalAmount } : { ...emptyBucket };
        };

        const pending = pickBucket(statusBreakdown, "pending");
        const success = pickBucket(statusBreakdown, "success");
        const failed = pickBucket(statusBreakdown, "failed");

        const userType = pickBucket(typeBreakdown, "user");
        const guestType = pickBucket(typeBreakdown, "guest");

        const anonymous = pickBucket(anonymousBreakdown, true);
        const nonAnonymous = pickBucket(anonymousBreakdown, false);

        const registered = pickBucket(registrationBreakdown, "registered");
        const unregistered = pickBucket(registrationBreakdown, "unregistered");

        const totalCount = pending.count + success.count + failed.count;
        const totalAmount = pending.amount + success.amount + failed.amount;

        return {
            totalCount,
            totalAmount,
            byPaymentStatus: { pending, success, failed },
            byType: { user: userType, guest: guestType },
            byAnonymity: { anonymous, nonAnonymous },
            byRegistration: { registered, unregistered },
        };
    }

    // ================================================================
    // 🎁 DONATION STATS — USER-SCOPED
    // For a registered user (donor = userId):
    //   - totalCount + totalAmount (all statuses)
    //   - successfulAmount + successfulCount (paymentStatus === "success")
    //   - byPaymentStatus: { pending, success, failed } -> { count, amount }
    //   - byAnonymity: { anonymous, nonAnonymous } -> { count, amount }
    //   - byRegistration: always registered for this user, but guest
    //     donations they made while unregistered won't appear here since
    //     those have donor: null — so we track by type instead
    //   - byType: { user, guest } -> { count, amount }
    // ================================================================
    async getUserDonationStats(userId: Types.ObjectId) {
        const [statusBreakdown, typeBreakdown, anonymousBreakdown] = await Promise.all([
            // 1. By paymentStatus
            Donation.aggregate([
                { $match: { donor: userId } },
                {
                    $group: {
                        _id: "$paymentStatus",
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // 2. By type (user | guest)
            Donation.aggregate([
                { $match: { donor: userId } },
                {
                    $group: {
                        _id: "$type",
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // 3. Anonymous vs non-anonymous
            Donation.aggregate([
                { $match: { donor: userId } },
                {
                    $group: {
                        _id: "$isAnonymous",
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const emptyBucket = { count: 0, amount: 0 };

        const pickBucket = (rows: any[], id: any) => {
            const row = rows.find((r) => r._id === id);
            return row ? { count: row.count, amount: row.totalAmount } : { ...emptyBucket };
        };

        const pending = pickBucket(statusBreakdown, "pending");
        const success = pickBucket(statusBreakdown, "success");
        const failed = pickBucket(statusBreakdown, "failed");

        const userType = pickBucket(typeBreakdown, "user");
        const guestType = pickBucket(typeBreakdown, "guest");

        const anonymous = pickBucket(anonymousBreakdown, true);
        const nonAnonymous = pickBucket(anonymousBreakdown, false);

        const totalCount = pending.count + success.count + failed.count;
        const totalAmount = pending.amount + success.amount + failed.amount;

        return {
            totalCount,
            totalAmount,
            successfulAmount: success.amount,
            successfulCount: success.count,
            byPaymentStatus: { pending, success, failed },
            byType: { user: userType, guest: guestType },
            byAnonymity: { anonymous, nonAnonymous },
        };
    }

    // ================================================================
    // 🎯 CAMPAIGN STATS — PLATFORM-WIDE
    // ================================================================
    async getCampaignStats() {
        const result = await Campaign.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    statuses: { $push: { k: "$_id", v: "$count" } },
                },
            },
            { $project: { _id: 0, total: 1, byStatus: { $arrayToObject: "$statuses" } } },
        ]);

        const data = result[0] ?? { total: 0, byStatus: {} };

        return {
            totalCampaigns: data.total,
            upcoming: data.byStatus?.upcoming ?? 0,
            ongoing: data.byStatus?.ongoing ?? 0,
            completed: data.byStatus?.completed ?? 0,
        };
    }


    async getCampaignTableStats() {
        const result = await Campaign.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRaised: { $sum: "$totalRaised" },
                    targetAmount: { $sum: "$targetAmount" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    totalRaised: { $sum: "$totalRaised" },
                    totalTarget: { $sum: "$targetAmount" },
                    statuses: { $push: { k: "$_id", v: "$count" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalRaised: 1,
                    totalTarget: 1,
                    byStatus: { $arrayToObject: "$statuses" },
                },
            },
        ]);

        const data = result[0] ?? { total: 0, totalRaised: 0, totalTarget: 0, byStatus: {} };

        return {
            totalCampaigns: data.total,
            upcoming: data.byStatus?.upcoming ?? 0,
            ongoing: data.byStatus?.ongoing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            totalRaised: data.totalRaised,
            totalTarget: data.totalTarget,
        };
    }

    // ================================================================
    // 🎯 CAMPAIGN STATS — USER-SCOPED
    // Adds: completedTotalRaised — sum of totalRaised across the user's
    // campaigns whose status is "completed"
    // ================================================================

    async getUserCampaignStats(userId: Types.ObjectId) {
        const result = await Campaign.aggregate([
            { $match: { owner: userId, isDeleted: false } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRaised: { $sum: "$totalRaised" },
                    targetAmount: { $sum: "$targetAmount" },
                    availableBalance: { $sum: "$availableBalance" },
                    totalWithdrawn: { $sum: "$totalWithdrawn" },
                    pendingWithdrawals: { $sum: "$pendingWithdrawals" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    totalRaised: { $sum: "$totalRaised" },
                    totalTarget: { $sum: "$targetAmount" },
                    availableBalance: { $sum: "$availableBalance" },
                    totalWithdrawn: { $sum: "$totalWithdrawn" },
                    pendingWithdrawals: { $sum: "$pendingWithdrawals" },
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count",
                            totalRaised: "$totalRaised",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalRaised: 1,
                    totalTarget: 1,
                    availableBalance: 1,
                    totalWithdrawn: 1,
                    pendingWithdrawals: 1,
                    byStatus: {
                        $arrayToObject: {
                            $map: {
                                input: "$statuses",
                                as: "s",
                                in: { k: "$$s.k", v: "$$s.v" },
                            },
                        }
                    },
                    completedTotalRaised: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$statuses",
                                                as: "s",
                                                cond: { $eq: ["$$s.k", "completed"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: { $ifNull: ["$$match.totalRaised", 0] },
                        },
                    },
                },
            },
        ]);

        const data = result[0] ?? {
            total: 0,
            totalRaised: 0,
            totalTarget: 0,
            availableBalance: 0,
            totalWithdrawn: 0,
            pendingWithdrawals: 0,
            byStatus: {},
            completedTotalRaised: 0,
        };

        return {
            totalCampaigns: data.total,
            upcoming: data.byStatus?.upcoming ?? 0,
            ongoing: data.byStatus?.ongoing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            totalRaised: data.totalRaised,
            totalTarget: data.totalTarget,
            availableBalance: data.availableBalance,
            totalWithdrawn: data.totalWithdrawn,
            pendingWithdrawals: data.pendingWithdrawals,
            completedTotalRaised: data.completedTotalRaised,
        };
    }

    // ================================================================
    // 🏦 WITHDRAWAL REQUEST STATS — PLATFORM-WIDE
    // ================================================================

    async getWithdrawalRequestStats() {
        const result = await WithdrawalRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    totalAmount: { $sum: "$totalAmount" },
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count",
                            totalAmount: "$totalAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalAmount: 1,
                    completedTotalAmount: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$statuses",
                                                as: "s",
                                                cond: { $eq: ["$$s.k", "completed"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: { $ifNull: ["$$match.totalAmount", 0] },
                        },
                    },
                    byStatus: {
                        $arrayToObject: {
                            $map: {
                                input: "$statuses",
                                as: "s",
                                in: { k: "$$s.k", v: "$$s.v" },
                            },
                        }
                    },
                },
            },
        ]);

        const data = result[0] ?? { total: 0, totalAmount: 0, completedTotalAmount: 0, byStatus: {} };

        return {
            totalWithdrawalRequests: data.total,
            totalAmount: data.totalAmount,
            completedTotalAmount: data.completedTotalAmount,
            pending: data.byStatus?.pending ?? 0,
            approved: data.byStatus?.approved ?? 0,
            processing: data.byStatus?.processing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            rejected: data.byStatus?.rejected ?? 0,
            failed: data.byStatus?.failed ?? 0,
        };
    }

    // ================================================================
    // 🏦 WITHDRAWAL REQUEST STATS — USER-SCOPED
    // ================================================================

    async getUserWithdrawalRequestStats(userId: Types.ObjectId) {
        const result = await WithdrawalRequest.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    totalAmount: { $sum: "$totalAmount" },
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count",
                            totalAmount: "$totalAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalAmount: 1,
                    completedTotalAmount: {
                        $let: {
                            vars: {
                                match: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$statuses",
                                                as: "s",
                                                cond: { $eq: ["$$s.k", "completed"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: { $ifNull: ["$$match.totalAmount", 0] },
                        },
                    },
                    byStatus: {
                        $arrayToObject: {
                            $map: {
                                input: "$statuses",
                                as: "s",
                                in: { k: "$$s.k", v: "$$s.v" },
                            },
                        }
                    },
                },
            },
        ]);

        const data = result[0] ?? { total: 0, totalAmount: 0, completedTotalAmount: 0, byStatus: {} };

        return {
            totalWithdrawalRequests: data.total,
            totalAmount: data.totalAmount,
            completedTotalAmount: data.completedTotalAmount,
            pending: data.byStatus?.pending ?? 0,
            approved: data.byStatus?.approved ?? 0,
            processing: data.byStatus?.processing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            rejected: data.byStatus?.rejected ?? 0,
            failed: data.byStatus?.failed ?? 0,
        };
    }
    // async getUserWithdrawalRequestStats(userId: Types.ObjectId) {
    //     const result = await WithdrawalRequest.aggregate([
    //         { $match: { userId } },
    //         { $group: { _id: "$status", count: { $sum: 1 } } },
    //         {
    //             $group: {
    //                 _id: null,
    //                 total: { $sum: "$count" },
    //                 statuses: { $push: { k: "$_id", v: "$count" } },
    //             },
    //         },
    //         { $project: { _id: 0, total: 1, byStatus: { $arrayToObject: "$statuses" } } },
    //     ]);

    //     const data = result[0] ?? { total: 0, byStatus: {} };

    //     return {
    //         totalWithdrawalRequests: data.total,
    //         pending: data.byStatus?.pending ?? 0,
    //         approved: data.byStatus?.approved ?? 0,
    //         processing: data.byStatus?.processing ?? 0,
    //         completed: data.byStatus?.completed ?? 0,
    //         rejected: data.byStatus?.rejected ?? 0,
    //         failed: data.byStatus?.failed ?? 0,
    //     };
    // }

    // ================================================================
    // 👥 USER METRICS — PLATFORM-WIDE
    // ================================================================
    async getUserMetrics() {
        const [accountStats, pendingKYC] = await Promise.all([
            Account.aggregate([
                { $match: { isDeleted: false } },
                {
                    $facet: {
                        totalUsers: [
                            { $match: { role: "user" } },
                            { $count: "count" },
                        ],
                        activeUsers: [
                            { $match: { status: "active" } },
                            { $count: "count" },
                        ],
                        totalOrganizations: [
                            { $match: { role: "organization" } },
                            { $count: "count" },
                        ],
                        verifiedUsers: [
                            { $match: { role: "user", kycStatus: "verified" } },
                            { $count: "count" },
                        ],
                    },
                },
            ]),
            KYC.countDocuments({ status: "pending_verification" }),
        ]);

        const stats = accountStats[0];

        return {
            totalUsers: stats.totalUsers[0]?.count ?? 0,
            activeUsers: stats.activeUsers[0]?.count ?? 0,
            totalOrganizations: stats.totalOrganizations[0]?.count ?? 0,
            verifiedUsers: stats.verifiedUsers[0]?.count ?? 0,
            pendingKYCVerifications: pendingKYC,
        };
    }

    // ================================================================
    // 👤 USER METRICS — SINGLE USER
    // Mirrors getUserMetrics but scoped to one account:
    //   - kycStatus (pending | verified)
    //   - isVerified (account email/identity verification)
    //   - status (active | suspended | deleted)
    //   - role (user | organization)
    //   - pendingKYCVerification (whether this user has a pending KYC doc)
    // totalUsers / activeUsers / totalOrganizations are not applicable per-user.
    // ================================================================
    // private async getUserMetricsByUserId(userId: Types.ObjectId) {
    //     const [account, pendingKYC] = await Promise.all([
    //         Account.findOne({ _id: userId, isDeleted: false })
    //             .select("kycStatus isVerified status role")
    //             .lean(),
    //         KYC.countDocuments({ userId, status: "pending_verification" }),
    //     ]);

    //     return {
    //         kycStatus: account?.kycStatus ?? null,
    //         isVerified: account?.isVerified ?? false,
    //         status: account?.status ?? null,
    //         role: account?.role ?? null,
    //         pendingKYCVerification: pendingKYC > 0,
    //     };
    // }

    async getUserMetricsByUserId(userId: Types.ObjectId) {
        const result = await Account.aggregate([
            {
                $match: { _id: userId, isDeleted: false },
            },
            {
                // Pull in campaign count for this user
                $lookup: {
                    from: "campaigns",
                    let: { ownerId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$owner", "$$ownerId"] } } },
                        { $count: "count" },
                    ],
                    as: "campaignData",
                },
            },
            {
                // Pull in wallet balance for this user
                $lookup: {
                    from: "wallets",
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                        { $project: { availableBalance: 1, _id: 0 } },
                    ],
                    as: "walletData",
                },
            },
            {
                // Pull in pending KYC count for this user
                $lookup: {
                    from: "kycs",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$userId", "$$userId"] },
                                status: "pending_verification",
                            },
                        },
                        { $count: "count" },
                    ],
                    as: "kycData",
                },
            },
            {
                $project: {
                    _id: 0,
                    kycStatus: 1,
                    isVerified: 1,
                    status: 1,
                    role: 1,
                    totalCampaignsOwned: {
                        $ifNull: [{ $arrayElemAt: ["$campaignData.count", 0] }, 0],
                    },
                    walletBalance: {
                        $ifNull: [{ $arrayElemAt: ["$walletData.availableBalance", 0] }, 0],
                    },
                    pendingKYCVerification: {
                        $gt: [
                            { $ifNull: [{ $arrayElemAt: ["$kycData.count", 0] }, 0] },
                            0,
                        ],
                    },
                },
            },
        ]);

        const data = result[0];

        return {
            kycStatus: data?.kycStatus ?? null,
            isVerified: data?.isVerified ?? false,
            status: data?.status ?? null,
            role: data?.role ?? null,
            pendingKYCVerification: data?.pendingKYCVerification ?? false,
            totalCampaignsOwned: data?.totalCampaignsOwned ?? 0,
            walletBalance: data?.walletBalance ?? 0,
        };
    }

    // ================================================================
    // 🕒 RECENT DONATIONS — USER-SCOPED (last 5)
    // ================================================================
    private async getUserRecentDonations(userId: Types.ObjectId) {
        const donations = await Donation.find({
            donor: userId,
            isDeleted: false,
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("amount paymentStatus campaign createdAt isAnonymous")
            .populate("campaign", "title")
            .lean();

        return donations.map((d: any) => ({
            id: d._id,
            amount: d.amount,
            status: d.paymentStatus,
            campaignId: d.campaign?._id ?? d.campaign,
            campaignTitle: d.campaign?.title ?? null,
            isAnonymous: d.isAnonymous,
            createdAt: d.createdAt,
        }));
    }

    // ================================================================
    // 🕒 RECENT WITHDRAWALS — USER-SCOPED (last 5)
    // ================================================================
    private async getUserRecentWithdrawals(userId: Types.ObjectId) {
        const withdrawals = await WithdrawalRequest.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("amount status campaignId createdAt")
            .lean();

        return withdrawals.map((w: any) => ({
            id: w._id,
            amount: w.amount,
            status: w.status,
            campaignId: w.campaignId ?? null,
            createdAt: w.createdAt,
        }));
    }
}
// import { WalletTransaction } from "../../models/transaction";
// import { WithdrawalRequest } from "../../models/WithdrawalRequest";
// import Campaign from "../../models/Campaign";
// import { Account } from "../../models/Accounts";
// import { KYC } from "../../models/KYC";
// import { Donation } from "../../models/Donations";
// import { Types } from "mongoose";

// export class DashboardService {

//     // ================================================================
//     // 🌐 GENERAL DASHBOARD STATS (platform-wide, admin only)
//     // ================================================================
//     async getDashboardStats() {
//         const [
//             financialStats,
//             transactionCounts,
//             campaignStats,
//             withdrawalRequestStats,
//             userMetrics,
//         ] = await Promise.all([
//             this.getFinancialTotals(),
//             this.getTransactionCounts(),
//             this.getCampaignStats(),
//             this.getWithdrawalRequestStats(),
//             this.getUserMetrics(),
//         ]);

//         return {
//             financialStats,
//             transactionCounts,
//             campaignStats,
//             withdrawalRequestStats,
//             userMetrics,
//         };
//     }

//     // ================================================================
//     // 👤 USER-SCOPED DASHBOARD STATS (admin viewing one user)
//     // ================================================================
//     async getUserStatsByUserId(userId: string) {
//         const userObjectId = new Types.ObjectId(userId);

//         const [
//             financialStats,
//             campaignStats,
//             withdrawalRequestStats,
//             recentDonations,
//             recentWithdrawals,
//         ] = await Promise.all([
//             this.getUserFinancialTotals(userObjectId),
//             this.getUserCampaignStats(userObjectId),
//             this.getUserWithdrawalRequestStats(userObjectId),
//             this.getUserRecentDonations(userObjectId),
//             this.getUserRecentWithdrawals(userObjectId),
//         ]);

//         return {
//             financialStats,
//             campaignStats,
//             withdrawalRequestStats,
//             recentActivity: {
//                 donations: recentDonations,
//                 withdrawals: recentWithdrawals,
//             },
//         };
//     }

//     // ================================================================
//     // 💰 FINANCIAL TOTALS — PLATFORM-WIDE
//     // Per category: successful amount+count, failed amount+count, combined total
//     // ================================================================
//     async getFinancialTotals() {
//         const result = await WalletTransaction.aggregate([
//             {
//                 $match: {
//                     category: { $in: ["wallet_credit", "donation", "withdrawal"] },
//                     status: { $in: ["successful", "failed"] },
//                 },
//             },
//             {
//                 $group: {
//                     _id: {
//                         category: "$category",
//                         status: "$status",
//                     },
//                     totalAmount: { $sum: "$amount" },
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id.category",
//                     buckets: {
//                         $push: {
//                             status: "$_id.status",
//                             totalAmount: "$totalAmount",
//                             count: "$count",
//                         },
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     category: "$_id",
//                     successful: {
//                         $let: {
//                             vars: {
//                                 match: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$buckets",
//                                                 as: "b",
//                                                 cond: { $eq: ["$$b.status", "successful"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },
//                             },
//                             in: {
//                                 amount: { $ifNull: ["$$match.totalAmount", 0] },
//                                 count: { $ifNull: ["$$match.count", 0] },
//                             },
//                         },
//                     },
//                     failed: {
//                         $let: {
//                             vars: {
//                                 match: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$buckets",
//                                                 as: "b",
//                                                 cond: { $eq: ["$$b.status", "failed"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },
//                             },
//                             in: {
//                                 amount: { $ifNull: ["$$match.totalAmount", 0] },
//                                 count: { $ifNull: ["$$match.count", 0] },
//                             },
//                         },
//                     },
//                     totalAmount: { $sum: "$buckets.totalAmount" },
//                     totalCount: { $sum: "$buckets.count" },
//                 },
//             },
//         ]);

//         const byCategory: Record<string, any> = {};
//         for (const row of result) {
//             byCategory[row.category] = row;
//         }

//         const empty = {
//             successful: { amount: 0, count: 0 },
//             failed: { amount: 0, count: 0 },
//             totalAmount: 0,
//             totalCount: 0,
//         };

//         const build = (category: string) => {
//             const row = byCategory[category];
//             if (!row) return empty;
//             return {
//                 successful: row.successful,
//                 failed: row.failed,
//                 totalAmount: row.totalAmount,
//                 totalCount: row.totalCount,
//             };
//         };

//         return {
//             walletCredits: build("wallet_credit"),
//             donations: build("donation"),
//             withdrawals: build("withdrawal"),
//         };
//     }

//     // ================================================================
//     // 💰 FINANCIAL TOTALS — USER-SCOPED
//     // Credits: donation, bonus, wallet_credit, campaign_credit, refund
//     // Debits:  withdrawal, wallet_debit
//     // Excluded: adjustment
//     // Each split into successful / failed / total
//     // ================================================================
//     async getUserFinancialTotals(userId: Types.ObjectId) {
//         const CREDIT_CATEGORIES = [
//             "donation",
//             "bonus",
//             "wallet_credit",
//             "campaign_credit",
//             "refund",
//         ];
//         const DEBIT_CATEGORIES = ["withdrawal", "wallet_debit"];

//         const result = await WalletTransaction.aggregate([
//             {
//                 $match: {
//                     userId,
//                     category: { $in: [...CREDIT_CATEGORIES, ...DEBIT_CATEGORIES] },
//                     status: { $in: ["successful", "failed"] },
//                 },
//             },
//             {
//                 // Derive credit/debit from category, keep status for bucketing
//                 $group: {
//                     _id: {
//                         direction: {
//                             $cond: [
//                                 { $in: ["$category", CREDIT_CATEGORIES] },
//                                 "credit",
//                                 "debit",
//                             ],
//                         },
//                         status: "$status",
//                     },
//                     totalAmount: { $sum: "$amount" },
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 // Roll up into one document per direction (credit/debit)
//                 $group: {
//                     _id: "$_id.direction",
//                     buckets: {
//                         $push: {
//                             status: "$_id.status",
//                             totalAmount: "$totalAmount",
//                             count: "$count",
//                         },
//                     },
//                 },
//             },
//             {
//                 // Extract successful + failed buckets cleanly
//                 $project: {
//                     _id: 0,
//                     direction: "$_id",
//                     successful: {
//                         $let: {
//                             vars: {
//                                 match: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$buckets",
//                                                 as: "b",
//                                                 cond: { $eq: ["$$b.status", "successful"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },
//                             },
//                             in: {
//                                 amount: { $ifNull: ["$$match.totalAmount", 0] },
//                                 count: { $ifNull: ["$$match.count", 0] },
//                             },
//                         },
//                     },
//                     failed: {
//                         $let: {
//                             vars: {
//                                 match: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$buckets",
//                                                 as: "b",
//                                                 cond: { $eq: ["$$b.status", "failed"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },
//                             },
//                             in: {
//                                 amount: { $ifNull: ["$$match.totalAmount", 0] },
//                                 count: { $ifNull: ["$$match.count", 0] },
//                             },
//                         },
//                     },
//                     totalAmount: { $sum: "$buckets.totalAmount" },
//                     totalCount: { $sum: "$buckets.count" },
//                 },
//             },
//         ]);

//         const byDirection: Record<string, any> = {};
//         for (const row of result) {
//             byDirection[row.direction] = row;
//         }

//         const empty = {
//             successful: { amount: 0, count: 0 },
//             failed: { amount: 0, count: 0 },
//             totalAmount: 0,
//             totalCount: 0,
//         };

//         const build = (direction: string) => {
//             const row = byDirection[direction];
//             if (!row) return empty;
//             return {
//                 successful: row.successful,
//                 failed: row.failed,
//                 totalAmount: row.totalAmount,
//                 totalCount: row.totalCount,
//             };
//         };

//         return {
//             credits: build("credit"),
//             debits: build("debit"),
//         };
//     }

//     // ================================================================
//     // 📊 TRANSACTION COUNTS — PLATFORM-WIDE
//     // ================================================================
//     async getTransactionCounts() {
//         const [categoryCountsRaw, failedCount] = await Promise.all([
//             WalletTransaction.aggregate([
//                 {
//                     $match: {
//                         category: { $in: ["wallet_credit", "donation", "withdrawal"] },
//                     },
//                 },
//                 {
//                     $group: {
//                         _id: "$category",
//                         count: { $sum: 1 },
//                     },
//                 },
//             ]),
//             WalletTransaction.countDocuments({ status: "failed" }),
//         ]);

//         const categoryCounts = categoryCountsRaw.reduce(
//             (acc: Record<string, number>, item: { _id: string; count: number }) => {
//                 acc[item._id] = item.count;
//                 return acc;
//             },
//             {}
//         );

//         return {
//             walletCreditTransactions: categoryCounts["wallet_credit"] ?? 0,
//             donationTransactions: categoryCounts["donation"] ?? 0,
//             withdrawalTransactions: categoryCounts["withdrawal"] ?? 0,
//             failedTransactions: failedCount,
//         };
//     }

//     // ================================================================
//     // 🎯 CAMPAIGN STATS — PLATFORM-WIDE
//     // ================================================================
//     async getCampaignStats() {
//         const result = await Campaign.aggregate([
//             { $match: { isDeleted: false } },
//             { $group: { _id: "$status", count: { $sum: 1 } } },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     statuses: { $push: { k: "$_id", v: "$count" } },
//                 },
//             },
//             { $project: { _id: 0, total: 1, byStatus: { $arrayToObject: "$statuses" } } },
//         ]);

//         const data = result[0] ?? { total: 0, byStatus: {} };

//         return {
//             totalCampaigns: data.total,
//             upcoming: data.byStatus?.upcoming ?? 0,
//             ongoing: data.byStatus?.ongoing ?? 0,
//             completed: data.byStatus?.completed ?? 0,
//         };
//     }

//     // ================================================================
//     // 🎯 CAMPAIGN STATS — USER-SCOPED
//     // ================================================================
//     async getUserCampaignStats(userId: Types.ObjectId) {
//         const result = await Campaign.aggregate([
//             { $match: { owner: userId, isDeleted: false } },
//             {
//                 $group: {
//                     _id: "$status",
//                     count: { $sum: 1 },
//                     totalRaised: { $sum: "$totalRaised" },
//                     availableBalance: { $sum: "$availableBalance" },
//                     totalWithdrawn: { $sum: "$totalWithdrawn" },
//                     pendingWithdrawals: { $sum: "$pendingWithdrawals" },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     totalRaised: { $sum: "$totalRaised" },
//                     availableBalance: { $sum: "$availableBalance" },
//                     totalWithdrawn: { $sum: "$totalWithdrawn" },
//                     pendingWithdrawals: { $sum: "$pendingWithdrawals" },
//                     statuses: { $push: { k: "$_id", v: "$count" } },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     total: 1,
//                     totalRaised: 1,
//                     availableBalance: 1,
//                     totalWithdrawn: 1,
//                     pendingWithdrawals: 1,
//                     byStatus: { $arrayToObject: "$statuses" },
//                 },
//             },
//         ]);

//         const data = result[0] ?? {
//             total: 0,
//             totalRaised: 0,
//             availableBalance: 0,
//             totalWithdrawn: 0,
//             pendingWithdrawals: 0,
//             byStatus: {},
//         };

//         return {
//             totalCampaigns: data.total,
//             upcoming: data.byStatus?.upcoming ?? 0,
//             ongoing: data.byStatus?.ongoing ?? 0,
//             completed: data.byStatus?.completed ?? 0,
//             totalRaised: data.totalRaised,
//             availableBalance: data.availableBalance,
//             totalWithdrawn: data.totalWithdrawn,
//             pendingWithdrawals: data.pendingWithdrawals,
//         };
//     }

//     // ================================================================
//     // 🏦 WITHDRAWAL REQUEST STATS — PLATFORM-WIDE
//     // ================================================================
//     async getWithdrawalRequestStats() {
//         const result = await WithdrawalRequest.aggregate([
//             { $group: { _id: "$status", count: { $sum: 1 } } },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     statuses: { $push: { k: "$_id", v: "$count" } },
//                 },
//             },
//             { $project: { _id: 0, total: 1, byStatus: { $arrayToObject: "$statuses" } } },
//         ]);

//         const data = result[0] ?? { total: 0, byStatus: {} };

//         return {
//             totalWithdrawalRequests: data.total,
//             pending: data.byStatus?.pending ?? 0,
//             approved: data.byStatus?.approved ?? 0,
//             processing: data.byStatus?.processing ?? 0,
//             completed: data.byStatus?.completed ?? 0,
//             rejected: data.byStatus?.rejected ?? 0,
//             failed: data.byStatus?.failed ?? 0,
//         };
//     }

//     // ================================================================
//     // 🏦 WITHDRAWAL REQUEST STATS — USER-SCOPED
//     // ================================================================
//     async getUserWithdrawalRequestStats(userId: Types.ObjectId) {
//         const result = await WithdrawalRequest.aggregate([
//             { $match: { userId } },
//             { $group: { _id: "$status", count: { $sum: 1 } } },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     statuses: { $push: { k: "$_id", v: "$count" } },
//                 },
//             },
//             { $project: { _id: 0, total: 1, byStatus: { $arrayToObject: "$statuses" } } },
//         ]);

//         const data = result[0] ?? { total: 0, byStatus: {} };

//         return {
//             totalWithdrawalRequests: data.total,
//             pending: data.byStatus?.pending ?? 0,
//             approved: data.byStatus?.approved ?? 0,
//             processing: data.byStatus?.processing ?? 0,
//             completed: data.byStatus?.completed ?? 0,
//             rejected: data.byStatus?.rejected ?? 0,
//             failed: data.byStatus?.failed ?? 0,
//         };
//     }

//     // ================================================================
//     // 👥 USER METRICS — PLATFORM-WIDE
//     // ================================================================
//     private async getUserMetrics() {
//         const [accountStats, pendingKYC] = await Promise.all([
//             Account.aggregate([
//                 { $match: { isDeleted: false } },
//                 {
//                     $facet: {
//                         totalUsers: [
//                             { $match: { role: "user" } },
//                             { $count: "count" },
//                         ],
//                         activeUsers: [
//                             { $match: { role: "user", status: "active" } },
//                             { $count: "count" },
//                         ],
//                         totalOrganizations: [
//                             { $match: { role: "organization" } },
//                             { $count: "count" },
//                         ],
//                         verifiedUsers: [
//                             { $match: { role: "user", kycStatus: "verified" } },
//                             { $count: "count" },
//                         ],
//                     },
//                 },
//             ]),
//             KYC.countDocuments({ status: "pending_verification" }),
//         ]);

//         const stats = accountStats[0];

//         return {
//             totalUsers: stats.totalUsers[0]?.count ?? 0,
//             activeUsers: stats.activeUsers[0]?.count ?? 0,
//             totalOrganizations: stats.totalOrganizations[0]?.count ?? 0,
//             verifiedUsers: stats.verifiedUsers[0]?.count ?? 0,
//             pendingKYCVerifications: pendingKYC,
//         };
//     }

//     // ================================================================
//     // 🕒 RECENT DONATIONS — USER-SCOPED (last 5)
//     // ================================================================
//     private async getUserRecentDonations(userId: Types.ObjectId) {
//         const donations = await Donation.find({
//             donor: userId,
//             isDeleted: false,
//         })
//             .sort({ createdAt: -1 })
//             .limit(5)
//             .select("amount paymentStatus campaign createdAt isAnonymous")
//             .populate("campaign", "title")
//             .lean();

//         return donations.map((d: any) => ({
//             id: d._id,
//             amount: d.amount,
//             status: d.paymentStatus,
//             campaignId: d.campaign?._id ?? d.campaign,
//             campaignTitle: d.campaign?.title ?? null,
//             isAnonymous: d.isAnonymous,
//             createdAt: d.createdAt,
//         }));
//     }

//     // ================================================================
//     // 🕒 RECENT WITHDRAWALS — USER-SCOPED (last 5)
//     // ================================================================
//     private async getUserRecentWithdrawals(userId: Types.ObjectId) {
//         const withdrawals = await WithdrawalRequest.find({ userId })
//             .sort({ createdAt: -1 })
//             .limit(5)
//             .select("amount status campaignId createdAt")
//             .lean();

//         return withdrawals.map((w: any) => ({
//             id: w._id,
//             amount: w.amount,
//             status: w.status,
//             campaignId: w.campaignId ?? null,
//             createdAt: w.createdAt,
//         }));
//     }
// }
