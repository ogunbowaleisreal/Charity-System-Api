"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const mongoose_1 = require("mongoose");
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const Donations_1 = require("../../models/Donations");
const Comment_1 = __importDefault(require("../../models/Comment"));
const Accounts_1 = require("../../models/Accounts");
const pushNotificationService_1 = require("../pushNotificationService");
const notification_Services_1 = require("../notification.Services");
const favourite_service_1 = __importDefault(require("./favourite.service"));
const helpers_1 = require("../../utils/helpers");
class CampaignService {
    // private pushNotification = new PushNotificationService()
    // notification = new NotificationService()
    // =============================
    // 🔹 CREATE / UPDATE / DELETE
    // =============================
    async getRecentDonationsForCampaigns(campaignIds) {
        if (!campaignIds.length)
            return new Map();
        // Single DB round-trip: fetch up to 3 successful donations per campaign.
        // We over-fetch slightly (3 × N) then slice in memory — still one query.
        const rawDonations = await Donations_1.Donation.find({
            campaign: { $in: campaignIds },
            paymentStatus: "success",
            isDeleted: false,
        })
            .sort({ createdAt: -1 })
            .limit(campaignIds.length * 3) // 3 per campaign max
            .populate("donor", "firstName lastName profilePicture role logo")
            .select("campaign amount currency message isAnonymous createdAt " +
            "donorName donor paymentMethod paymentStatus")
            .lean();
        // Group in-memory — O(n) single pass
        const grouped = new Map();
        for (const donation of rawDonations) {
            const key = donation.campaign.toString();
            if (!grouped.has(key))
                grouped.set(key, []);
            const bucket = grouped.get(key);
            if (bucket.length >= 3)
                continue; // already have 3 for this campaign
            // bucket.push({
            //     _id: donation._id as Types.ObjectId,
            //     amount: donation.amount,
            //     currency: donation.currency,
            //     message: donation.message,
            //     isAnonymous: donation.isAnonymous,
            //     createdAt: donation.createdAt,
            //     paymentMethod: donation.paymentMethod,
            //     paymentStatus: donation.paymentStatus,
            //     // ── Anonymity masking ──────────────────────────────────────────
            //     // Strip donor identity when isAnonymous is true.
            //     // We never expose the donor ObjectId either — that alone could be
            //     // used to correlate across requests.
            //     donorName: donation.isAnonymous
            //         ? null
            //         : (donation.donorName ?? null),
            //     donor: donation.isAnonymous
            //         ? null
            //         : (donation.donor as DonorSnapshot | null),
            // });
            bucket.push((0, helpers_1.sanitizeDonation)({
                _id: donation._id,
                amount: donation.amount,
                currency: donation.currency,
                message: donation.message,
                isAnonymous: donation.isAnonymous,
                createdAt: donation.createdAt,
                paymentMethod: donation.paymentMethod,
                paymentStatus: donation.paymentStatus,
                donorName: donation.donorName ?? null,
                donor: donation.donor,
            }));
        }
        return grouped;
    }
    async createCampaign(payload, userId) {
        const user = await Accounts_1.Account.findById(userId);
        if (!user)
            throw new Error("User not found");
        payload.owner = user._id;
        payload.ownerType = user.role;
        payload.firstName = user.firstName;
        payload.lastName = user.lastName;
        payload.userName = user.userName;
        payload.companyName = user.companyName;
        if (payload.startImmediately)
            payload.startDate = new Date();
        console.log(payload);
        user.noOfCampaigns += 1;
        await user.save();
        const campaign = await Campaign_1.default.create({
            ...payload,
            owner: userId,
        });
        await notification_Services_1.NotificationService.createForUser({
            userId: user._id,
            title: "Campaign Creation",
            message: `A new campaign '${campaign.title}' has been created`
        });
        await pushNotificationService_1.PushNotificationService.sendToUser(user._id, {
            title: "Campaign Creation",
            body: "`A new campaign '${campaign.title}' has been created`",
        });
        return campaign;
    }
    async getFeaturedCampaigns(query) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const filter = {
            isFeatured: true,
            isDeleted: false,
            isActive: true,
            status: "ongoing",
        };
        const [campaigns, total] = await Promise.all([
            Campaign_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("owner", "firstName lastName companyName logo profilePicture")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .lean(),
            Campaign_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            campaigns,
            pagination: {
                current_page: Number(page),
                total_pages: totalPages,
                per_page: Number(limit),
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }
    async updateCampaign(campaignId, userId, payload) {
        const campaign = await Campaign_1.default.findOne({
            _id: campaignId,
            owner: userId,
            isDeleted: false,
        });
        if (!campaign)
            throw new Error("Campaign not found or unauthorized");
        Object.assign(campaign, payload);
        return await campaign.save();
    }
    async deleteCampaign(campaignId, userId) {
        const campaign = await Campaign_1.default.findOneAndUpdate({ _id: campaignId, owner: userId }, { isDeleted: true }, { new: true });
        if (!campaign)
            throw new Error("Campaign not found or unauthorized");
        return campaign;
    }
    async getAllCampaigns(query, userId) {
        const { page = 1, limit = 10, category, status, search } = query;
        const filter = {
            isDeleted: false,
            isActive: true,
            status: "ongoing",
        };
        if (category)
            filter.category = category;
        // if (status) filter.status = status;
        if (search) {
            const regex = { $regex: search, $options: "i" };
            filter.$or = [
                { title: regex },
                { description: regex },
                { firstName: regex },
                { lastName: regex },
                { userName: regex },
                { companyName: regex },
            ];
        }
        const skip = (page - 1) * limit;
        const [campaigns, total] = await Promise.all([
            Campaign_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("owner", "firstName lastName companyName logo profilePicture")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .lean(),
            Campaign_1.default.countDocuments(filter),
        ]);
        const campaignIds = campaigns.map((c) => c._id);
        // ── these two run concurrently, same pattern as before ──
        const [donationsMap, favoritesSet] = await Promise.all([
            this.getRecentDonationsForCampaigns(campaignIds),
            favourite_service_1.default.getUserFavoritesForCampaigns(userId, campaignIds),
        ]);
        const campaignsWithExtras = campaigns.map((campaign) => ({
            ...campaign,
            recentDonations: donationsMap.get(campaign._id.toString()) ?? [],
            isFavorited: favoritesSet.has(campaign._id.toString()),
        }));
        const totalPages = Math.ceil(total / limit);
        return {
            campaigns: campaignsWithExtras,
            pagination: {
                current_page: Number(page),
                total_pages: totalPages,
                per_page: Number(limit),
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }
    async getCampaignById(campaignId) {
        const campaign = await Campaign_1.default.findById(campaignId)
            .populate("owner", "firstName lastName companyName logo")
            .populate("category", "categoryName description image status")
            .populate("tags", "name");
        if (!campaign || campaign.isDeleted) {
            throw new Error("Campaign not found");
        }
        // increment views
        campaign.views += 1;
        await campaign.save();
        return campaign;
    }
    async getUserCampaigns(userId, query) {
        const { page = 1, limit = 10 } = query;
        const filter = { isDeleted: false, isActive: true, owner: userId };
        if (query.category)
            filter.category = query.category;
        if (query.status)
            filter.status = query.status;
        const campaigns = await Campaign_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("owner", "firstName lastName companyName logo")
            .populate("category", "categoryName description image status")
            .populate("tags", "name")
            .lean();
        const total = await Campaign_1.default.countDocuments({
            owner: userId,
            isDeleted: false,
        });
        const campaignIds = campaigns.map((c) => c._id);
        // ── these two run concurrently, same pattern as before ──
        const [donationsMap, favoritesSet] = await Promise.all([
            this.getRecentDonationsForCampaigns(campaignIds),
            favourite_service_1.default.getUserFavoritesForCampaigns(userId, campaignIds),
        ]);
        const campaignsWithExtras = campaigns.map((campaign) => ({
            ...campaign,
            recentDonations: donationsMap.get(campaign._id.toString()) ?? [],
            isFavorited: favoritesSet.has(campaign._id.toString()),
        }));
        const totalPages = Math.ceil(total / limit);
        return {
            campaigns: campaignsWithExtras,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }
    async getCampaignStats(campaignId) {
        // console.log(campaignId)
        const campaign = await Campaign_1.default.findById(campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        const commentCount = await Comment_1.default.countDocuments({
            campaign: campaignId,
            isDeleted: false,
        });
        return {
            target: campaign.targetAmount,
            totalRaised: campaign.totalRaised,
            donationCount: campaign.donationCount,
            progress: (campaign.totalRaised / campaign.targetAmount) * 100 || 0,
            commentCount,
        };
    }
    async getUserCampaignStats(userId) {
        // =========================
        // 1. GET USER CAMPAIGNS
        // =========================
        const campaigns = await Campaign_1.default.find({ owner: userId });
        const campaignIds = campaigns.map((c) => c._id);
        // =========================
        // 2. TOTAL RAISED (FROM CAMPAIGNS - CACHE VALUE)
        // =========================
        const totalRaised = campaigns.reduce((acc, c) => acc + (c.totalRaised || 0), 0);
        // =========================
        // 3. TOTAL DONATIONS (FROM DONATION COLLECTION)
        // =========================
        const totalDonations = await Donations_1.Donation.countDocuments({
            campaign: { $in: campaignIds },
            paymentStatus: "success",
            isDeleted: false,
        });
        // =========================
        // 4. TOTAL COMMENTS (FROM COMMENT COLLECTION)
        // =========================
        const totalComments = await Comment_1.default.countDocuments({
            campaign: { $in: campaignIds },
            isDeleted: false,
        });
        // =========================
        // 5. CAMPAIGN STATUS BREAKDOWN
        // =========================
        const active = campaigns.filter((c) => c.status === "ongoing").length;
        const upcoming = campaigns.filter((c) => c.status === "upcoming").length;
        const completed = campaigns.filter((c) => c.status === "completed").length;
        // =========================
        // 6. RESPONSE
        // =========================
        return {
            totalRaised,
            totalDonations,
            totalComments,
            totalCampaigns: {
                total: campaigns.length,
                active,
                upcoming,
                completed,
            },
        };
    }
    // =============================
    // 🔹 DONATIONS
    // =============================
    // async getCampaignDonations(campaignId: string, filter: donationFilter) {
    //     let sort: any = { createdAt: -1 };
    //     if (filter.sort === "top") {
    //         return await Donation.aggregate([
    //             {
    //                 $match: {
    //                     campaign: new Types.ObjectId(campaignId),
    //                     paymentStatus: "success",
    //                 },
    //             },
    //             {
    //                 $group: {
    //                     _id: "$donor",
    //                     total: { $sum: "$amount" },
    //                 },
    //             },
    //             { $sort: { total: -1 } },
    //         ]);
    //     }
    //     const donations = await Donation.find({
    //         campaign: campaignId,
    //         paymentStatus: "success",
    //     })
    //         .sort(sort)
    //         .skip((filter.page - 1) * filter.limit)
    //         .limit(filter.limit)
    //         .populate("donor", "firstName lastName profilePicture logo country state");
    //     const total = await Donation.countDocuments({
    //         campaign: campaignId,
    //         paymentStatus: "success",
    //     });
    //     const totalPages = Math.ceil(total / filter.limit);
    //     // donations.forEach((d) => {
    //     //     d.createdAt = moment(d.createdAt).fromNow();
    //     // })
    //     return {
    //         donations,
    //         pagination: {
    //             current_page: filter.page,
    //             total_pages: totalPages,
    //             per_page: filter.limit,
    //             total_records: total,
    //             has_next_page: filter.page < totalPages,
    //             has_prev_page: filter.page > 1,
    //         }
    //     }
    // }
    async getCampaignDonations(campaignId, filter) {
        let sort = { createdAt: -1 };
        if (filter.sort === "top") {
            return await Donations_1.Donation.aggregate([
                {
                    $match: {
                        campaign: new mongoose_1.Types.ObjectId(campaignId),
                        paymentStatus: "success",
                        isAnonymous: { $ne: true }, // 👈 exclude anonymous donors from leaderboard
                    },
                },
                {
                    $group: {
                        _id: "$donor",
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { total: -1 } },
            ]);
        }
        const donations = await Donations_1.Donation.find({
            campaign: campaignId,
            paymentStatus: "success",
        })
            .sort(sort)
            .skip((filter.page - 1) * filter.limit)
            .limit(filter.limit)
            .populate("donor", "firstName lastName profilePicture logo country state")
            .lean(); // 👈 needed so plain objects work cleanly with the sanitizer
        const sanitizedDonations = donations.map(helpers_1.sanitizeDonation);
        const total = await Donations_1.Donation.countDocuments({
            campaign: campaignId,
            paymentStatus: "success",
        });
        const totalPages = Math.ceil(total / filter.limit);
        return {
            donations: sanitizedDonations,
            pagination: {
                current_page: filter.page,
                total_pages: totalPages,
                per_page: filter.limit,
                total_records: total,
                has_next_page: filter.page < totalPages,
                has_prev_page: filter.page > 1,
            }
        };
    }
    // =============================
    // 🔹 COMMENTS
    // =============================
    async addComment(campaignId, userId, message) {
        const campaign = await Campaign_1.default.findById(campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        if (campaign.isDeleted)
            throw new Error("Campaign has been deleted");
        if (campaign.allowComments === false)
            throw new Error("Comments are disabled for this campaign");
        const user = await Accounts_1.Account.findById(userId);
        return await Comment_1.default.create({
            campaign: campaignId,
            user: userId,
            firstName: user?.firstName,
            lastName: user?.lastName,
            message,
        });
    }
    async getCampaignComments(campaignId, filter) {
        const { page = 1, limit = 10 } = filter;
        if (filter.sort === "top") {
            return await Comment_1.default.find({
                campaign: campaignId,
                isDeleted: false,
            }).sort({ likes: -1 })
                .limit(20)
                .populate("user", "firstName lastName profilePicture logo");
        }
        const comments = await Comment_1.default.find({
            campaign: campaignId,
            isDeleted: false,
        }).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("user", "firstName lastName profilePicture logo");
        const total = await Comment_1.default.countDocuments({
            campaign: campaignId,
            isDeleted: false,
        });
        const totalPages = Math.ceil(total / limit);
        return {
            comments,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }
    async deleteComment(commentId, userId) {
        const comment = await Comment_1.default.findOneAndUpdate({ _id: commentId, user: userId }, { isDeleted: true }, { new: true });
        if (!comment)
            throw new Error("Comment not found or unauthorized");
        return comment;
    }
    // =============================
    // 🔹 PREFERENCES
    // =============================
    async updatePreferences(campaignId, userId, payload) {
        const campaign = await Campaign_1.default.findOne({
            _id: campaignId,
            owner: userId,
        });
        if (!campaign)
            throw new Error("Unauthorized");
        if (payload.allowComments !== undefined) {
            campaign.allowComments = payload.allowComments;
        }
        if (payload.isActive !== undefined) {
            campaign.isActive = payload.isActive;
        }
        if (payload.showDonations !== undefined) {
            campaign.showDonations = payload.showDonations;
        }
        return await campaign.save();
    }
    // =============================
    // 🔹 INTERNAL (DONATION UPDATE)
    // =============================
    async confirmDonation(transactionRef) {
        const donation = await Donations_1.Donation.findOneAndUpdate({ transactionRef }, { paymentStatus: "success" }, { new: true });
        if (!donation)
            throw new Error("Donation not found");
        await Campaign_1.default.findByIdAndUpdate(donation.campaign, {
            $inc: {
                totalRaised: donation.amount,
                donationCount: 1,
            },
        });
        return donation;
    }
}
exports.CampaignService = CampaignService;
;
