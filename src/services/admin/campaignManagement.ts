import { FilterQuery, Types } from "mongoose";
import Campaign, { ICampaign } from "../../models/Campaign";
import Comment from "../../models/Comment";
import { Donation } from "../../models/Donations";
import { DashboardService } from "./dashboardStatistics";
import {
    buildPagination,
    formatPagination,
    PaginationQuery
} from "../../utils/admin/paginationUtills";
import { CampaignPipelineBuilder } from "../campaignPipelineBuilder";

// import {
//     CampaignFilters,
//     CampaignDonationFilters,
//     CampaignCommentFilters
// } from "../interfaces/campaign.admin.filters";

// import { Types } from "mongoose";
// import { PaginationQuery } from "../utils/pagination";

// =========================
// BASE
// =========================
export interface BaseFilter extends PaginationQuery {
    page?: number;
    limit?: number;

    startDate?: Date;
    endDate?: Date;
}

// =========================
// CAMPAIGN FILTERS
// =========================
export interface CampaignFilters extends BaseFilter {
    search?: string;
    status?: "upcoming" | "ongoing" | "completed";
    isActive?: boolean;
    isDeleted?: boolean;
    riskLevel?: "low" | "medium" | "high";
    isFlagged?: boolean;

    ownerId?: string;
    ownerType?: "user" | "organization";

    minTargetAmount?: number;
    maxTargetAmount?: number;

    minRaised?: number;
    maxRaised?: number;
}

// =========================
// DONATION FILTERS
// =========================
export interface CampaignDonationFilters extends BaseFilter {
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
// COMMENT FILTERS
// =========================
export interface CampaignCommentFilters extends BaseFilter {
    isDeleted?: boolean;
}
const dashboard = new DashboardService();

export class CampaignAdminService {
    // =========================
    // 📊 GET ALL CAMPAIGNS
    // =========================
    // async getAllCampaigns(filters: CampaignFilters) {
    //     const {
    //         status,
    //         isActive,
    //         isDeleted,
    //         riskLevel,
    //         isFlagged,
    //         ownerId,
    //         ownerType,
    //         minTargetAmount,
    //         maxTargetAmount,
    //         minRaised,
    //         maxRaised,
    //         startDate,
    //         endDate,
    //         page = 1,
    //         limit = 10
    //     } = filters;

    //     const { skip } = buildPagination(page, limit);

    //     const query: FilterQuery<ICampaign> = {};

    //     // 🎯 basic filters
    //     if (status) query.status = status;
    //     if (typeof isActive === "boolean") query.isActive = isActive;
    //     if (typeof isDeleted === "boolean") query.isDeleted = isDeleted;
    //     if (riskLevel) query.riskLevel = riskLevel;
    //     if (typeof isFlagged === "boolean") query.isFlagged = isFlagged;

    //     // 👤 ownership

    //     if (ownerType) query.ownerType = ownerType;

    //     // 💰 financial filters
    //     if (minTargetAmount || maxTargetAmount) {
    //         query.targetAmount = {};
    //         if (minTargetAmount) query.targetAmount.$gte = minTargetAmount;
    //         if (maxTargetAmount) query.targetAmount.$lte = maxTargetAmount;
    //     }

    //     if (minRaised || maxRaised) {
    //         query.totalRaised = {};
    //         if (minRaised) query.totalRaised.$gte = minRaised;
    //         if (maxRaised) query.totalRaised.$lte = maxRaised;
    //     }

    //     // 📅 date range
    //     if (startDate || endDate) {
    //         query.createdAt = {};
    //         if (startDate) query.createdAt.$gte = startDate;
    //         if (endDate) query.createdAt.$lte = endDate;
    //     }
    //     if (ownerId) {
    //         query.owner = new Types.ObjectId(ownerId);
    //         const campaignStats = await dashboard.getUserCampaignStats(new Types.ObjectId(ownerId));
    //         const [campaigns, total] = await Promise.all([
    //             Campaign.find(query)
    //                 .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
    //                 .populate("authors", "email fullName")
    //                 .populate("category", "categoryName description image status")
    //                 .populate("tags", "name")
    //                 .sort({ createdAt: -1 })
    //                 .skip(skip)
    //                 .limit(limit),

    //             Campaign.countDocuments(query)
    //         ]);

    //         return formatPagination({ campaigns, campaignStats }, total, page, limit);
    //     }
    //     const campaignStats = await dashboard.getCampaignTableStats();

    //     const [campaigns, total] = await Promise.all([
    //         Campaign.find(query)
    //             .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
    //             .populate("authors", "email fullName")
    //             .populate("category", "categoryName description image status")
    //             .populate("tags", "name")
    //             .sort({ createdAt: -1 })
    //             .skip(skip)
    //             .limit(limit),

    //         Campaign.countDocuments(query)
    //     ]);

    //     return formatPagination({ campaigns, campaignStats }, total, page, limit);
    // }

    async getAllCampaigns(filters: CampaignFilters) {
        const {
            search,           // 👈 add this
            status,
            isActive,
            isDeleted,
            riskLevel,
            isFlagged,
            ownerId,
            ownerType,
            minTargetAmount,
            maxTargetAmount,
            minRaised,
            maxRaised,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        const { skip } = buildPagination(page, limit);

        const query: FilterQuery<ICampaign> = {};

        // 🎯 basic filters
        if (status) query.status = status;
        if (typeof isActive === "boolean") query.isActive = isActive;
        if (typeof isDeleted === "boolean") query.isDeleted = isDeleted;
        if (riskLevel) query.riskLevel = riskLevel;
        if (typeof isFlagged === "boolean") query.isFlagged = isFlagged;
        if (ownerType) query.ownerType = ownerType;

        // 🔍 search
        if (search) {
            const regex = { $regex: search, $options: "i" };
            query.$or = [
                { title: regex },
                { description: regex },
                { firstName: regex },
                { lastName: regex },
                { userName: regex },
                { companyName: regex },
            ];
        }

        // 💰 financial filters
        if (minTargetAmount || maxTargetAmount) {
            query.targetAmount = {};
            if (minTargetAmount) query.targetAmount.$gte = minTargetAmount;
            if (maxTargetAmount) query.targetAmount.$lte = maxTargetAmount;
        }

        if (minRaised || maxRaised) {
            query.totalRaised = {};
            if (minRaised) query.totalRaised.$gte = minRaised;
            if (maxRaised) query.totalRaised.$lte = maxRaised;
        }

        // 📅 date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }

        if (ownerId) {
            query.owner = new Types.ObjectId(ownerId);
            const campaignStats = await dashboard.getUserCampaignStats(new Types.ObjectId(ownerId));
            const [campaigns, total] = await Promise.all([
                Campaign.find(query)
                    .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
                    .populate("authors", "email fullName")
                    .populate("category", "categoryName description image status")
                    .populate("tags", "name")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Campaign.countDocuments(query)
            ]);

            return formatPagination({ campaigns, campaignStats }, total, page, limit);
        }

        const campaignStats = await dashboard.getCampaignTableStats();

        const [campaigns, total] = await Promise.all([
            Campaign.find(query)
                .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
                .populate("authors", "email fullName")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Campaign.countDocuments(query)
        ]);

        return formatPagination({ campaigns, campaignStats }, total, page, limit);
    }

    // async getAllCampaigns(filters: CampaignFilters) {
    //     const { page = 1, limit = 10, ownerId } = filters;

    //     const builder = new CampaignPipelineBuilder(filters);

    //     const [campaignStats, campaignsRaw, countRaw] = await Promise.all([
    //         ownerId
    //             ? dashboard.getUserCampaignStats(new Types.ObjectId(ownerId))
    //             : dashboard.getCampaignTableStats(),
    //         Campaign.aggregate(builder.build()),
    //         Campaign.aggregate(builder.buildCount()),
    //     ]);

    //     const total = countRaw[0]?.total ?? 0;

    //     return formatPagination(
    //         { campaigns: campaignsRaw, campaignStats },
    //         total,
    //         page,
    //         limit
    //     );
    // }

    // =========================
    // 🎯 GET CAMPAIGN BY ID
    // =========================
    async getCampaignById(campaignId: string) {
        return Campaign.findById(campaignId)
            .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
            .populate("authors", "email fullName")
            .populate("category", "categoryName description image status")
            .populate("tags", "name");
    }

    // =========================
    // 💰 GET CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(
        campaignId: string,
        filters: CampaignDonationFilters
    ) {
        const {
            paymentStatus,
            paymentStatusExtended,
            paymentMethod,
            isAnonymous,
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
        if (typeof isAnonymous === "boolean")
            query.isAnonymous = isAnonymous;

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
                .limit(limit)
                .populate("donor", "email fullName"),

            Donation.countDocuments(query)
        ]);

        return formatPagination(donations, total, page, limit);
    }

    async getCampaignStats(campaignId: string) {
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new Error("Campaign not found");

        return {
            target: campaign.targetAmount,
            totalRaised: campaign.totalRaised,
            donationCount: campaign.donationCount,
            progress:
                (campaign.totalRaised / campaign.targetAmount) * 100 || 0,
        };
    }

    async suspendCampaign(campaignId: string) {
        return await Campaign.findByIdAndUpdate(
            campaignId,
            { isActive: false, },
            { new: true }
        );
    }

    async unsuspendCampaign(campaignId: string) {
        return await Campaign.findByIdAndUpdate(
            campaignId,
            { isActive: true },
            { new: true }
        );
    }

    // =========================
    // 💬 GET CAMPAIGN COMMENTS
    // =========================
    async getCampaignComments(
        campaignId: string,
        filters: CampaignCommentFilters
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
                .limit(limit)
                .populate("user", "email fullName"),

            Comment.countDocuments(query)
        ]);

        return formatPagination(comments, total, page, limit);
    }

    async getUserComments(userId: string) {
        return Comment.find({ user: userId }).populate("user", "email firstName lastName profilePicture logo");
    }
}