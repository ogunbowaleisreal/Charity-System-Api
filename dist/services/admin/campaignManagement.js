"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignAdminService = void 0;
const mongoose_1 = require("mongoose");
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const Comment_1 = __importDefault(require("../../models/Comment"));
const Donations_1 = require("../../models/Donations");
const dashboardStatistics_1 = require("./dashboardStatistics");
const paginationUtills_1 = require("../../utils/admin/paginationUtills");
const dashboard = new dashboardStatistics_1.DashboardService();
class CampaignAdminService {
    // =========================
    // 📊 GET ALL CAMPAIGNS
    // =========================
    async getAllCampaigns(filters) {
        const { status, isActive, isDeleted, riskLevel, isFlagged, ownerId, ownerType, minTargetAmount, maxTargetAmount, minRaised, maxRaised, startDate, endDate, page = 1, limit = 10 } = filters;
        const { skip } = (0, paginationUtills_1.buildPagination)(page, limit);
        const query = {};
        // 🎯 basic filters
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
        // 👤 ownership
        if (ownerType)
            query.ownerType = ownerType;
        // 💰 financial filters
        if (minTargetAmount || maxTargetAmount) {
            query.targetAmount = {};
            if (minTargetAmount)
                query.targetAmount.$gte = minTargetAmount;
            if (maxTargetAmount)
                query.targetAmount.$lte = maxTargetAmount;
        }
        if (minRaised || maxRaised) {
            query.totalRaised = {};
            if (minRaised)
                query.totalRaised.$gte = minRaised;
            if (maxRaised)
                query.totalRaised.$lte = maxRaised;
        }
        // 📅 date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        if (ownerId) {
            query.owner = new mongoose_1.Types.ObjectId(ownerId);
            const campaignStats = await dashboard.getUserCampaignStats(new mongoose_1.Types.ObjectId(ownerId));
            const [campaigns, total] = await Promise.all([
                Campaign_1.default.find(query)
                    .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
                    .populate("authors", "email fullName")
                    .populate("category", "categoryName description image status")
                    .populate("tags", "name")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Campaign_1.default.countDocuments(query)
            ]);
            return (0, paginationUtills_1.formatPagination)({ campaigns, campaignStats }, total, page, limit);
        }
        const campaignStats = await dashboard.getCampaignStats();
        const [campaigns, total] = await Promise.all([
            Campaign_1.default.find(query)
                .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
                .populate("authors", "email fullName")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Campaign_1.default.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)({ campaigns, campaignStats }, total, page, limit);
    }
    // =========================
    // 🎯 GET CAMPAIGN BY ID
    // =========================
    async getCampaignById(campaignId) {
        return Campaign_1.default.findById(campaignId)
            .populate("owner", "email fullName firstName lastName phoneNumber profilePicture")
            .populate("authors", "email fullName")
            .populate("category", "categoryName description image status")
            .populate("tags", "name");
    }
    // =========================
    // 💰 GET CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(campaignId, filters) {
        const { paymentStatus, paymentStatusExtended, paymentMethod, isAnonymous, minAmount, maxAmount, startDate, endDate, page = 1, limit = 10 } = filters;
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
        if (typeof isAnonymous === "boolean")
            query.isAnonymous = isAnonymous;
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
                .limit(limit)
                .populate("donor", "email fullName"),
            Donations_1.Donation.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(donations, total, page, limit);
    }
    async getCampaignStats(campaignId) {
        const campaign = await Campaign_1.default.findById(campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        return {
            target: campaign.targetAmount,
            totalRaised: campaign.totalRaised,
            donationCount: campaign.donationCount,
            progress: (campaign.totalRaised / campaign.targetAmount) * 100 || 0,
        };
    }
    async suspendCampaign(campaignId) {
        return await Campaign_1.default.findByIdAndUpdate(campaignId, { isActive: false, }, { new: true });
    }
    async unsuspendCampaign(campaignId) {
        return await Campaign_1.default.findByIdAndUpdate(campaignId, { isActive: true }, { new: true });
    }
    // =========================
    // 💬 GET CAMPAIGN COMMENTS
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
                .limit(limit)
                .populate("user", "email fullName"),
            Comment_1.default.countDocuments(query)
        ]);
        return (0, paginationUtills_1.formatPagination)(comments, total, page, limit);
    }
    async getUserComments(userId) {
        return Comment_1.default.find({ user: userId }).populate("user", "email firstName lastName profilePicture logo");
    }
}
exports.CampaignAdminService = CampaignAdminService;
