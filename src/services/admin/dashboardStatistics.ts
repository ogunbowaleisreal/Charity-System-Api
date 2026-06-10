import { WalletTransaction } from "../../models/transaction";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import Campaign from "../../models/Campaign";
import { Account } from "../../models/Accounts";
import { KYC } from "../../models/KYC";

export class DashboardService {
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
    // 💰 FINANCIAL TOTALS
    // Per category: successful amount+count, failed amount+count, combined total
    // ================================================================
    private async getFinancialTotals() {
        const result = await WalletTransaction.aggregate([
            {
                $match: {
                    category: { $in: ["wallet_credit", "donation", "withdrawal"] },
                    status: { $in: ["successful", "failed"] },
                },
            },
            {
                // Group by category + status to get amount and count per bucket
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
                // Roll up into one document per category
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
                // Shape each category into a clean object
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

        // Index results by category for easy lookup
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
    // 📊 TRANSACTION COUNTS
    // Counts by category + failed transactions across all categories
    // ================================================================
    private async getTransactionCounts() {
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

            // All failed transactions regardless of category
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
    // 🎯 CAMPAIGN STATS
    // Total count + breakdown by status
    // ================================================================
    private async getCampaignStats() {
        const result = await Campaign.aggregate([
            {
                $match: { isDeleted: false },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    byStatus: { $arrayToObject: "$statuses" },
                },
            },
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
    // 🏦 WITHDRAWAL REQUEST STATS
    // Total count + breakdown by status
    // ================================================================
    private async getWithdrawalRequestStats() {
        const result = await WithdrawalRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    byStatus: { $arrayToObject: "$statuses" },
                },
            },
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
    // 👥 USER METRICS
    // Counts from Account + KYC models
    // ================================================================
    private async getUserMetrics() {
        const [accountStats, pendingKYC] = await Promise.all([
            Account.aggregate([
                {
                    $match: { isDeleted: false },
                },
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
}
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
//     // Sums amount for successful transactions by category
//     // ================================================================
//     private async getFinancialTotals() {
//         const result = await WalletTransaction.aggregate([
//             {
//                 $match: {
//                     status: "successful",
//                     category: { $in: ["wallet_credit", "donation", "withdrawal"] },
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$category",
//                     totalAmount: { $sum: "$amount" },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     categories: {
//                         $push: {
//                             k: "$_id",
//                             v: "$totalAmount",
//                         },
//                     },
//                 },
//             },
//             {
//                 $replaceRoot: {
//                     newRoot: {
//                         $arrayToObject: "$categories",
//                     },
//                 },
//             },
//         ]);

//         const data = result[0] ?? {};

//         return {
//             totalWalletCredits: data.wallet_credit ?? 0,
//             totalDonations: data.donation ?? 0,
//             totalWithdrawals: data.withdrawal ?? 0,
//         };
//     }

//     // ================================================================
//     // 📊 TRANSACTION COUNTS
//     // Counts by category + failed transactions across all categories
//     // ================================================================
//     private async getTransactionCounts() {
//         const [categoryCountsRaw, failedCount] = await Promise.all([
//             // Count per category (wallet_credit, donation, withdrawal)
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

//         // Map array to object
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
//                         // Total users (role: user)
//                         totalUsers: [
//                             { $match: { role: "user" } },
//                             { $count: "count" },
//                         ],

//                         // Active users (role: user + status: active)
//                         activeUsers: [
//                             { $match: { role: "user", status: "active" } },
//                             { $count: "count" },
//                         ],

//                         // Total organizations
//                         totalOrganizations: [
//                             { $match: { role: "organization" } },
//                             { $count: "count" },
//                         ],

//                         // KYC verified users
//                         verifiedUsers: [
//                             { $match: { role: "user", kycStatus: "verified" } },
//                             { $count: "count" },
//                         ],
//                     },
//                 },
//             ]),

//             // Pending KYC verifications from KYC collection
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