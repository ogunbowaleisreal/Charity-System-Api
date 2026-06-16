import { Account } from "../../models/Accounts";
import Campaign from "../../models/Campaign";
import { Donation } from "../../models/Donations";
import { WalletTransaction } from "../../models/transaction";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { Types } from "mongoose";

export class ClientDashboardService {
    async getDashboardStats(userId: string) {
        const userObjectId = new Types.ObjectId(userId);

        const [
            campaignStats,
            donationStats,
            walletStats,
            withdrawalRequestStats,
            accountStatus,
            recentDonations,
            recentWithdrawals,
        ] = await Promise.all([
            this.getCampaignStats(userObjectId),
            this.getDonationStats(userObjectId),
            this.getWalletStats(userObjectId),
            this.getWithdrawalRequestStats(userObjectId),
            this.getAccountStatus(userObjectId),
            this.getRecentDonations(userObjectId),
            this.getRecentWithdrawals(userObjectId),
        ]);

        return {
            campaignStats,
            donationStats,
            walletStats,
            withdrawalRequestStats,
            accountStatus,
            recentActivity: {
                donations: recentDonations,
                withdrawals: recentWithdrawals,
            },
        };
    }

    // ================================================================
    // 🎯 CAMPAIGN STATS (owned by this account)
    // Total count, breakdown by status, summed financial fields
    // ================================================================
    private async getCampaignStats(userId: Types.ObjectId) {
        const result = await Campaign.aggregate([
            {
                $match: { owner: userId, isDeleted: false },
            },
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
    // 💝 DONATION STATS (donations made by this account)
    // Total amount donated (successful), donation count, unique campaigns
    // ================================================================
    private async getDonationStats(userId: Types.ObjectId) {
        const result = await Donation.aggregate([
            {
                $match: {
                    donor: userId,
                    paymentStatus: "success",
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalCount: { $sum: 1 },
                    campaigns: { $addToSet: "$campaign" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalAmount: 1,
                    totalCount: 1,
                    campaignsSupported: { $size: "$campaigns" },
                },
            },
        ]);

        const data = result[0] ?? {
            totalAmount: 0,
            totalCount: 0,
            campaignsSupported: 0,
        };

        return {
            totalDonated: data.totalAmount,
            donationCount: data.totalCount,
            campaignsSupported: data.campaignsSupported,
        };
    }

    // ================================================================
    // 💳 WALLET STATS (this account's wallet activity)
    // Credit/debit derived from `category` (not `type`):
    //   credit -> donation, bonus, wallet_credit, campaign_credit, refund
    //   debit  -> withdrawal, wallet_debit
    //   adjustment -> excluded entirely
    // ================================================================
    private async getWalletStats(userId: Types.ObjectId) {
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
                    userId: userId,
                    status: "successful",
                    category: { $in: [...CREDIT_CATEGORIES, ...DEBIT_CATEGORIES] },
                },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $in: ["$category", CREDIT_CATEGORIES] },
                            "credit",
                            "debit",
                        ],
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    buckets: {
                        $push: {
                            k: "$_id",
                            v: {
                                amount: "$totalAmount",
                                count: "$count",
                            },
                        },
                    },
                },
            },
            {
                $replaceRoot: {
                    newRoot: { $arrayToObject: "$buckets" },
                },
            },
        ]);

        const data = result[0] ?? {};

        const credits = data.credit ?? { amount: 0, count: 0 };
        const debits = data.debit ?? { amount: 0, count: 0 };

        return {
            totalCredits: credits.amount,
            totalDebits: debits.amount,
            creditCount: credits.count,
            debitCount: debits.count,
            currentBalance: credits.amount - debits.amount,
        };
    }

    // ================================================================
    // 🏦 WITHDRAWAL REQUEST STATS (this account's requests)
    // Total count + breakdown by status
    // ================================================================
    private async getWithdrawalRequestStats(userId: Types.ObjectId) {
        const result = await WithdrawalRequest.aggregate([
            {
                $match: { userId: userId },
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
    // 👤 ACCOUNT STATUS
    // KYC status, wallet pin, 2FA — quick reference for the client
    // ================================================================
    private async getAccountStatus(userId: Types.ObjectId) {
        const account = await Account.findById(userId).select(
            "role kycStatus isWalletPinSet twoFactorEnabled twoFactorWithdrawalEnabled isVerified status"
        );

        if (!account) {
            return {
                role: null,
                kycStatus: null,
                isVerified: false,
                isWalletPinSet: false,
                twoFactorEnabled: false,
                twoFactorWithdrawalEnabled: false,
                accountStatus: null,
            };
        }

        return {
            role: account.role,
            kycStatus: account.kycStatus,
            isVerified: account.isVerified,
            isWalletPinSet: account.isWalletPinSet,
            twoFactorEnabled: account.twoFactorEnabled,
            twoFactorWithdrawalEnabled: account.twoFactorWithdrawalEnabled,
            accountStatus: account.status,
        };
    }

    // ================================================================
    // 🕒 RECENT DONATIONS (last 5 made by this account)
    // ================================================================
    private async getRecentDonations(userId: Types.ObjectId) {
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
    // 🕒 RECENT WITHDRAWALS (last 5 requested by this account)
    // ================================================================
    private async getRecentWithdrawals(userId: Types.ObjectId) {
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

// import { Account } from "../../models/Accounts";
// import Campaign from "../../models/Campaign";
// import { Donation } from "../../models/Donations";
// import { WalletTransaction } from "../../models/transaction";
// import { WithdrawalRequest } from "../../models/WithdrawalRequest";
// import { Types } from "mongoose";

// export class ClientDashboardService {
//     async getDashboardStats(userId: string) {
//         const userObjectId = new Types.ObjectId(userId);

//         const [
//             campaignStats,
//             donationStats,
//             walletStats,
//             withdrawalRequestStats,
//             accountStatus,
//             recentDonations,
//             recentWithdrawals,
//         ] = await Promise.all([
//             this.getCampaignStats(userObjectId),
//             this.getDonationStats(userObjectId),
//             this.getWalletStats(userObjectId),
//             this.getWithdrawalRequestStats(userObjectId),
//             this.getAccountStatus(userObjectId),
//             this.getRecentDonations(userObjectId),
//             this.getRecentWithdrawals(userObjectId),
//         ]);

//         return {
//             campaignStats,
//             donationStats,
//             walletStats,
//             withdrawalRequestStats,
//             accountStatus,
//             recentActivity: {
//                 donations: recentDonations,
//                 withdrawals: recentWithdrawals,
//             },
//         };
//     }

//     // ================================================================
//     // 🎯 CAMPAIGN STATS (owned by this account)
//     // Total count, breakdown by status, summed financial fields
//     // ================================================================
//     private async getCampaignStats(userId: Types.ObjectId) {
//         const result = await Campaign.aggregate([
//             {
//                 $match: { owner: userId, isDeleted: false },
//             },
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
//     // 💝 DONATION STATS (donations made by this account)
//     // Total amount donated (successful), donation count, unique campaigns
//     // ================================================================
//     private async getDonationStats(userId: Types.ObjectId) {
//         const result = await Donation.aggregate([
//             {
//                 $match: {
//                     donor: userId,
//                     paymentStatus: "success",
//                     isDeleted: false,
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: "$amount" },
//                     totalCount: { $sum: 1 },
//                     campaigns: { $addToSet: "$campaign" },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     totalAmount: 1,
//                     totalCount: 1,
//                     campaignsSupported: { $size: "$campaigns" },
//                 },
//             },
//         ]);

//         const data = result[0] ?? {
//             totalAmount: 0,
//             totalCount: 0,
//             campaignsSupported: 0,
//         };

//         return {
//             totalDonated: data.totalAmount,
//             donationCount: data.totalCount,
//             campaignsSupported: data.campaignsSupported,
//         };
//     }

//     // ================================================================
//     // 💳 WALLET STATS (this account's wallet activity)
//     // Successful credits, debits, and current balance
//     // ================================================================
//     private async getWalletStats(userId: Types.ObjectId) {
//         const result = await WalletTransaction.aggregate([
//             {
//                 $match: {
//                     userId: userId,
//                     status: "successful",
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$type",
//                     totalAmount: { $sum: "$amount" },
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     types: {
//                         $push: {
//                             k: "$_id",
//                             v: {
//                                 amount: "$totalAmount",
//                                 count: "$count",
//                             },
//                         },
//                     },
//                 },
//             },
//             {
//                 $replaceRoot: {
//                     newRoot: { $arrayToObject: "$types" },
//                 },
//             },
//         ]);

//         const data = result[0] ?? {};

//         const credits = data.credit ?? { amount: 0, count: 0 };
//         const debits = data.debit ?? { amount: 0, count: 0 };

//         return {
//             totalCredits: credits.amount,
//             totalDebits: debits.amount,
//             creditCount: credits.count,
//             debitCount: debits.count,
//             currentBalance: credits.amount - debits.amount,
//         };
//     }

//     // ================================================================
//     // 🏦 WITHDRAWAL REQUEST STATS (this account's requests)
//     // Total count + breakdown by status
//     // ================================================================
//     private async getWithdrawalRequestStats(userId: Types.ObjectId) {
//         const result = await WithdrawalRequest.aggregate([
//             {
//                 $match: { userId: userId },
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
//     // 👤 ACCOUNT STATUS
//     // KYC status, wallet pin, 2FA — quick reference for the client
//     // ================================================================
//     private async getAccountStatus(userId: Types.ObjectId) {
//         const account = await Account.findById(userId).select(
//             "role kycStatus isWalletPinSet twoFactorEnabled twoFactorWithdrawalEnabled isVerified status"
//         );

//         if (!account) {
//             return {
//                 role: null,
//                 kycStatus: null,
//                 isVerified: false,
//                 isWalletPinSet: false,
//                 twoFactorEnabled: false,
//                 twoFactorWithdrawalEnabled: false,
//                 accountStatus: null,
//             };
//         }

//         return {
//             role: account.role,
//             kycStatus: account.kycStatus,
//             isVerified: account.isVerified,
//             isWalletPinSet: account.isWalletPinSet,
//             twoFactorEnabled: account.twoFactorEnabled,
//             twoFactorWithdrawalEnabled: account.twoFactorWithdrawalEnabled,
//             accountStatus: account.status,
//         };
//     }

//     // ================================================================
//     // 🕒 RECENT DONATIONS (last 5 made by this account)
//     // ================================================================
//     private async getRecentDonations(userId: Types.ObjectId) {
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
//     // 🕒 RECENT WITHDRAWALS (last 5 requested by this account)
//     // ================================================================
//     private async getRecentWithdrawals(userId: Types.ObjectId) {
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