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
            transactionCounts,
            campaignStats,
            withdrawalRequestStats,
            userMetrics,
        ] = await Promise.all([
            this.getFinancialTotals(),
            this.getTransactionCounts(),
            this.getCampaignStats(),
            this.getWithdrawalRequestStats(),
            this.getUserMetrics(),
        ]);

        return {
            financialStats,
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
            recentDonations,
            recentWithdrawals,
        ] = await Promise.all([
            this.getUserFinancialTotals(userObjectId),
            this.getUserCampaignStats(userObjectId),
            this.getUserWithdrawalRequestStats(userObjectId),
            this.getUserRecentDonations(userObjectId),
            this.getUserRecentWithdrawals(userObjectId),
        ]);

        return {
            financialStats,
            campaignStats,
            withdrawalRequestStats,
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
    // 💰 FINANCIAL TOTALS — USER-SCOPED
    // Credits: donation, bonus, wallet_credit, campaign_credit, refund
    // Debits:  withdrawal, wallet_debit
    // Excluded: adjustment
    // Each split into successful / failed / total
    // ================================================================
    async getUserFinancialTotals(userId: Types.ObjectId) {
        const CREDIT_CATEGORIES = [
            "donation",
            "bonus",
            "wallet_credit",
            "campaign_credit",
            "refund",
        ];
        const DEBIT_CATEGORIES = ["withdrawal", "wallet_debit"];

        const result = await WalletTransaction.aggregate([
            {
                $match: {
                    userId,
                    category: { $in: [...CREDIT_CATEGORIES, ...DEBIT_CATEGORIES] },
                    status: { $in: ["successful", "failed"] },
                },
            },
            {
                // Derive credit/debit from category, keep status for bucketing
                $group: {
                    _id: {
                        direction: {
                            $cond: [
                                { $in: ["$category", CREDIT_CATEGORIES] },
                                "credit",
                                "debit",
                            ],
                        },
                        status: "$status",
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            {
                // Roll up into one document per direction (credit/debit)
                $group: {
                    _id: "$_id.direction",
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
                // Extract successful + failed buckets cleanly
                $project: {
                    _id: 0,
                    direction: "$_id",
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

        const byDirection: Record<string, any> = {};
        for (const row of result) {
            byDirection[row.direction] = row;
        }

        const empty = {
            successful: { amount: 0, count: 0 },
            failed: { amount: 0, count: 0 },
            totalAmount: 0,
            totalCount: 0,
        };

        const build = (direction: string) => {
            const row = byDirection[direction];
            if (!row) return empty;
            return {
                successful: row.successful,
                failed: row.failed,
                totalAmount: row.totalAmount,
                totalCount: row.totalCount,
            };
        };

        return {
            credits: build("credit"),
            debits: build("debit"),
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

    // ================================================================
    // 🎯 CAMPAIGN STATS — USER-SCOPED
    // ================================================================
    async getUserCampaignStats(userId: Types.ObjectId) {
        const result = await Campaign.aggregate([
            { $match: { owner: userId, isDeleted: false } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRaised: { $sum: "$totalRaised" },
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
                    availableBalance: { $sum: "$availableBalance" },
                    totalWithdrawn: { $sum: "$totalWithdrawn" },
                    pendingWithdrawals: { $sum: "$pendingWithdrawals" },
                    statuses: { $push: { k: "$_id", v: "$count" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalRaised: 1,
                    availableBalance: 1,
                    totalWithdrawn: 1,
                    pendingWithdrawals: 1,
                    byStatus: { $arrayToObject: "$statuses" },
                },
            },
        ]);

        const data = result[0] ?? {
            total: 0,
            totalRaised: 0,
            availableBalance: 0,
            totalWithdrawn: 0,
            pendingWithdrawals: 0,
            byStatus: {},
        };

        return {
            totalCampaigns: data.total,
            upcoming: data.byStatus?.upcoming ?? 0,
            ongoing: data.byStatus?.ongoing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            totalRaised: data.totalRaised,
            availableBalance: data.availableBalance,
            totalWithdrawn: data.totalWithdrawn,
            pendingWithdrawals: data.pendingWithdrawals,
        };
    }

    // ================================================================
    // 🏦 WITHDRAWAL REQUEST STATS — PLATFORM-WIDE
    // ================================================================
    async getWithdrawalRequestStats() {
        const result = await WithdrawalRequest.aggregate([
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
            totalWithdrawalRequests: data.total,
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
            totalWithdrawalRequests: data.total,
            pending: data.byStatus?.pending ?? 0,
            approved: data.byStatus?.approved ?? 0,
            processing: data.byStatus?.processing ?? 0,
            completed: data.byStatus?.completed ?? 0,
            rejected: data.byStatus?.rejected ?? 0,
            failed: data.byStatus?.failed ?? 0,
        };
    }

    // ================================================================
    // 👥 USER METRICS — PLATFORM-WIDE
    // ================================================================
    private async getUserMetrics() {
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
                            { $match: { role: "user", status: "active" } },
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

// export class DashboardService {
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
//     // 💰 FINANCIAL TOTALS
//     // Per category: successful amount+count, failed amount+count, combined total
//     // ================================================================
//     private async getFinancialTotals() {
//         const result = await WalletTransaction.aggregate([
//             {
//                 $match: {
//                     category: { $in: ["wallet_credit", "donation", "withdrawal"] },
//                     status: { $in: ["successful", "failed"] },
//                 },
//             },
//             {
//                 // Group by category + status to get amount and count per bucket
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
//                 // Roll up into one document per category
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
//                 // Shape each category into a clean object
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

//         // Index results by category for easy lookup
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
//     // 📊 TRANSACTION COUNTS
//     // Counts by category + failed transactions across all categories
//     // ================================================================
//     private async getTransactionCounts() {
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

//             // All failed transactions regardless of category
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
//     // 🎯 CAMPAIGN STATS
//     // Total count + breakdown by status
//     // ================================================================
//     private async getCampaignStats() {
//         const result = await Campaign.aggregate([
//             {
//                 $match: { isDeleted: false },
//             },
//             {
//                 $group: {
//                     _id: "$status",
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     statuses: {
//                         $push: {
//                             k: "$_id",
//                             v: "$count",
//                         },
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     total: 1,
//                     byStatus: { $arrayToObject: "$statuses" },
//                 },
//             },
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
//     // 🏦 WITHDRAWAL REQUEST STATS
//     // Total count + breakdown by status
//     // ================================================================
//     private async getWithdrawalRequestStats() {
//         const result = await WithdrawalRequest.aggregate([
//             {
//                 $group: {
//                     _id: "$status",
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$count" },
//                     statuses: {
//                         $push: {
//                             k: "$_id",
//                             v: "$count",
//                         },
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     total: 1,
//                     byStatus: { $arrayToObject: "$statuses" },
//                 },
//             },
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
//     // 👥 USER METRICS
//     // Counts from Account + KYC models
//     // ================================================================
//     private async getUserMetrics() {
//         const [accountStats, pendingKYC] = await Promise.all([
//             Account.aggregate([
//                 {
//                     $match: { isDeleted: false },
//                 },
//                 {
//                     $facet: {
//                         totalUsers: [
//                             { $match: { role: "user" } },
//                             { $count: "count" },
//                         ],
//                         activeUsers: [
//                             { $match: { status: "active" } },
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
// }
