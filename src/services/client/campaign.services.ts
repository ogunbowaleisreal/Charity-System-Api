import { ObjectId, Types } from "mongoose";
import Campaign, { ICampaign } from "../../models/Campaign";
import { Donation } from "../../models/Donations";
import Comment from "../../models/Comment";
import { Account } from "../../models/Accounts";
import { formatPagination } from "../../utils/admin/paginationUtills";
import { FilterQuery } from "mongoose";
import { PushNotificationService } from "../pushNotificationService";
import { NotificationService } from "../notification.Services";
import favouriteService from "./favourite.service";
import { sanitizeDonation } from "../../utils/helpers";

export type donationFilter = {
    sort: "top" | "latest";
    page: number;
    limit: number;
}
export type commentFilter = {
    sort: "top" | "latest";
    page: number;
    limit: number;
}

export type CreateCampaignDTO = {
    // =========================
    // DETAILS
    // =========================
    category: string;
    search?: string
    image: {
        imageUrl: string,
        thumbnailUrl: string
    }[];
    firstName?: string;
    lastName?: string;
    companyName?: string;
    userName?: string;
    thumbnailUrl: string;
    title: string;
    tags: Types.ObjectId[];
    authors: string[]; // usually Account IDs or names depending on your system
    targetAmount: number;
    opening: Date;
    startImmediately: boolean;
    startDate?: Date; // optional if startImmediately = false
    endDate: Date;
    description: string;
    allowComments: boolean;
    isActive: boolean;
    showDonationHistory: boolean;
    donationCards?: {
        name: string;
        amount: number;
        dateTime: Date;
    }[];
    owner: string; // Account ID
    ownerType: "user" | "organization";
};
interface RecentDonation {
    _id: Types.ObjectId;
    amount: number;
    currency: string;
    message?: string;
    isAnonymous: boolean;
    createdAt: Date;
    donorName: string | null;          // masked to null when anonymous
    donor: DonorSnapshot | null;       // masked to null when anonymous
    paymentMethod?: string;
    paymentStatus: string;
}

interface DonorSnapshot {
    _id: Types.ObjectId;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    role?: string;
    logo?: string;
}


export type UpdateCampaign = {
    title: string;
    description: string;
    category: string;
    targetAmount: number;
    tags: Types.ObjectId[];
    //deadline: Date;
    closing: Date;
    thumbnailUrl: string;
    isActive: boolean;
    showDonationHistory: boolean;
    allowComments: boolean;

    image: string;
}

export type campaignFilter = {
    page: number;
    limit: number;
    category: string;
    status: string;
    search?: string
}


export class CampaignService {
    // private pushNotification = new PushNotificationService()
    // notification = new NotificationService()
    // =============================
    // 🔹 CREATE / UPDATE / DELETE
    // =============================

    private async getRecentDonationsForCampaigns(
        campaignIds: Types.ObjectId[]
    ): Promise<Map<string, RecentDonation[]>> {

        if (!campaignIds.length) return new Map();

        // Single DB round-trip: fetch up to 3 successful donations per campaign.
        // We over-fetch slightly (3 × N) then slice in memory — still one query.
        const rawDonations = await Donation.find({
            campaign: { $in: campaignIds },
            paymentStatus: "success",
            isDeleted: false,
        })
            .sort({ createdAt: -1 })
            .limit(campaignIds.length * 3)           // 3 per campaign max
            .populate<{ donor: DonorSnapshot | null }>(
                "donor",
                "firstName lastName profilePicture role logo"
            )
            .select(
                "campaign amount currency message isAnonymous createdAt " +
                "donorName donor paymentMethod paymentStatus"
            )
            .lean();

        // Group in-memory — O(n) single pass
        const grouped = new Map<string, RecentDonation[]>();

        for (const donation of rawDonations) {
            const key = (donation.campaign as Types.ObjectId).toString();

            if (!grouped.has(key)) grouped.set(key, []);

            const bucket = grouped.get(key)!;
            if (bucket.length >= 3) continue;       // already have 3 for this campaign

            bucket.push(
                sanitizeDonation({
                    _id: donation._id as Types.ObjectId,
                    amount: donation.amount,
                    currency: donation.currency,
                    message: donation.message,
                    isAnonymous: donation.isAnonymous,
                    createdAt: donation.createdAt,
                    paymentMethod: donation.paymentMethod,
                    paymentStatus: donation.paymentStatus,
                    donorName: donation.donorName ?? null,
                    donor: donation.donor as DonorSnapshot | null,
                })
            );
        }

        return grouped;
    }

    // async createCampaign(payload: CreateCampaignDTO, userId: string) {
    //     const user = await Account.findById(userId);
    //     if (!user) throw new Error("User not found");
    //     payload.owner = user._id.toString() as string;
    //     payload.ownerType = user.role;
    //     payload.firstName = user.firstName;
    //     payload.lastName = user.lastName;
    //     payload.userName = user.userName;
    //     payload.companyName = user.companyName;
    //     if (payload.startImmediately) payload.startDate = new Date();
    //     console.log(payload)
    //     user.noOfCampaigns += 1
    //     await user.save()


    //     const campaign = await Campaign.create({
    //         ...payload,
    //         owner: userId,
    //     });

    //     await NotificationService.createForUser({
    //         userId: user._id as any,
    //         title: "Campaign Creation",
    //         message: `A new campaign '${campaign.title}' has been created`
    //     })
    //     await PushNotificationService.sendToUser(user._id as any, {
    //         title: "Campaign Creation",
    //         body: "`A new campaign '${campaign.title}' has been created`",
    //     })

    //     return campaign

    // }

    async createCampaign(payload: CreateCampaignDTO, userId: string) {
        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        payload.owner = user._id.toString() as string;
        payload.ownerType = user.role;
        payload.firstName = user.firstName;
        payload.lastName = user.lastName;
        payload.userName = user.userName;
        payload.companyName = user.companyName;

        if (payload.startImmediately) payload.startDate = new Date();

        user.noOfCampaigns += 1;
        await user.save();

        const campaign = await Campaign.create({
            ...payload,
            owner: userId,
        });

        // Notifications are a side effect — never let a failure here
        // take down a successfully created campaign.
        try {
            // 1. Confirm to the owner (in-app)
            await NotificationService.createForUser({
                userId: user._id as any,
                title: "Campaign Creation",
                message: `A new campaign '${campaign.title}' has been created`,
            });

            // 2. Confirm to the owner (push)
            await PushNotificationService.sendToUser(user._id as any, {
                title: "Campaign Creation",
                body: `A new campaign '${campaign.title}' has been created`,
            });

            // 3. Let verified users know a new campaign exists to donate to (in-app only, no push)
            await NotificationService.createBroadcast({
                title: "New Campaign",
                message: `${payload.companyName || payload.userName || "Someone"} just launched '${campaign.title}' — check it out`,
                type: "GENERAL",
                segment: "verifiedUsers",
            });
        } catch (err) {
            console.error("Failed to send campaign creation notifications:", err);
        }

        return campaign;
    }

    async getFeaturedCampaigns(query: any) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const filter = {
            isFeatured: true,
            isDeleted: false,
            isActive: true,
            status: "ongoing",
        };

        const [campaigns, total] = await Promise.all([
            Campaign.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("owner", "firstName lastName companyName logo profilePicture")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .lean(),

            Campaign.countDocuments(filter),
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

    async updateCampaign(campaignId: string, userId: string, payload: UpdateCampaign) {
        const campaign = await Campaign.findOne({
            _id: campaignId,
            owner: userId,
            isDeleted: false,
        });

        if (!campaign) throw new Error("Campaign not found or unauthorized");

        Object.assign(campaign, payload);

        if (campaign.endDate <= campaign.startDate) {
            throw new Error("End date must be after start date");
        }

        return await campaign.save(); // pre-save hook recalculates status here
    }

    async deleteCampaign(campaignId: string, userId: string) {
        const campaign = await Campaign.findOneAndUpdate(
            { _id: campaignId, owner: userId },
            { isDeleted: true },
            { new: true }
        );

        if (!campaign) throw new Error("Campaign not found or unauthorized");

        return campaign;
    }

    async getAllCampaigns(query: any, userId?: string) {
        const { page = 1, limit = 10, category, status, search } = query;

        const filter: any = {
            isDeleted: false,
            isActive: true,
            status: "ongoing",
        };

        if (category) filter.category = category;
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
            Campaign.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("owner", "firstName lastName companyName logo profilePicture")
                .populate("category", "categoryName description image status")
                .populate("tags", "name")
                .lean(),

            Campaign.countDocuments(filter),
        ]);

        const campaignIds = campaigns.map((c) => c._id as Types.ObjectId);

        // ── these two run concurrently, same pattern as before ──
        const [donationsMap, favoritesSet] = await Promise.all([
            this.getRecentDonationsForCampaigns(campaignIds),
            favouriteService.getUserFavoritesForCampaigns(userId, campaignIds),
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

    async getCampaignById(campaignId: string) {
        const campaign = await Campaign.findById(campaignId)
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

    async getUserCampaigns(userId: string, query: campaignFilter) {
        const { page = 1, limit = 10 } = query;
        const filter: any = { isDeleted: false, isActive: true, owner: userId };
        if (query.category) filter.category = query.category;
        if (query.status) filter.status = query.status;

        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("owner", "firstName lastName companyName logo")
            .populate("category", "categoryName description image status")
            .populate("tags", "name")
            .lean();

        const total = await Campaign.countDocuments({
            owner: userId,
            isDeleted: false,
        });

        const campaignIds = campaigns.map((c) => c._id as Types.ObjectId);

        // ── these two run concurrently, same pattern as before ──
        const [donationsMap, favoritesSet] = await Promise.all([
            this.getRecentDonationsForCampaigns(campaignIds),
            favouriteService.getUserFavoritesForCampaigns(userId, campaignIds),
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


    async getCampaignStats(campaignId: string) {
        // console.log(campaignId)
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new Error("Campaign not found");

        const commentCount = await Comment.countDocuments({
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

    async getUserCampaignStats(userId: string) {
        // =========================
        // 1. GET USER CAMPAIGNS
        // =========================
        const campaigns = await Campaign.find({ owner: userId });

        const campaignIds = campaigns.map((c) => c._id);

        // =========================
        // 2. TOTAL RAISED (FROM CAMPAIGNS - CACHE VALUE)
        // =========================
        const totalRaised = campaigns.reduce(
            (acc, c) => acc + (c.totalRaised || 0),
            0
        );

        // =========================
        // 3. TOTAL DONATIONS (FROM DONATION COLLECTION)
        // =========================
        const totalDonations = await Donation.countDocuments({
            campaign: { $in: campaignIds },
            paymentStatus: "success",
            isDeleted: false,
        });

        // =========================
        // 4. TOTAL COMMENTS (FROM COMMENT COLLECTION)
        // =========================
        const totalComments = await Comment.countDocuments({
            campaign: { $in: campaignIds },
            isDeleted: false,
        });

        // =========================
        // 5. CAMPAIGN STATUS BREAKDOWN
        // =========================
        const active = campaigns.filter(
            (c) => c.status === "ongoing"
        ).length;

        const upcoming = campaigns.filter(
            (c) => c.status === "upcoming"
        ).length;

        const completed = campaigns.filter(
            (c) => c.status === "completed"
        ).length;

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

    async getCampaignDonations(campaignId: string, filter: donationFilter) {
        let sort: any = { createdAt: -1 };

        if (filter.sort === "top") {
            return await Donation.aggregate([
                {
                    $match: {
                        campaign: new Types.ObjectId(campaignId),
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

        const donations = await Donation.find({
            campaign: campaignId,
            paymentStatus: "success",
        })
            .sort(sort)
            .skip((filter.page - 1) * filter.limit)
            .limit(filter.limit)
            .populate("donor", "firstName lastName profilePicture logo country state")
            .lean(); // 👈 needed so plain objects work cleanly with the sanitizer

        const sanitizedDonations = donations.map(sanitizeDonation);

        const total = await Donation.countDocuments({
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
        }
    }

    // =============================
    // 🔹 COMMENTS
    // =============================

    async addComment(campaignId: string, userId: string, message: string) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error("Campaign not found");
        if (campaign.isDeleted) throw new Error("Campaign has been deleted");
        if (campaign.allowComments === false) throw new Error("Comments are disabled for this campaign");
        const user = await Account.findById(userId)

        return await Comment.create({
            campaign: campaignId,
            user: userId,
            firstName: user?.firstName,
            lastName: user?.lastName,
            message,
        });
    }

    async getCampaignComments(campaignId: string, filter: commentFilter) {
        const { page = 1, limit = 10 } = filter

        if (filter.sort === "top") {
            return await Comment.find({
                campaign: campaignId,
                isDeleted: false,
            }).sort({ likes: -1 })
                .limit(20)
                .populate("user", "firstName lastName profilePicture logo");
        }
        const comments = await Comment.find({
            campaign: campaignId,
            isDeleted: false,
        }).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("user", "firstName lastName profilePicture logo");

        const total = await Comment.countDocuments({
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

    async deleteComment(commentId: string, userId: string) {
        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, user: userId },
            { isDeleted: true },
            { new: true }
        );

        if (!comment) throw new Error("Comment not found or unauthorized");

        return comment;
    }

    // =============================
    // 🔹 PREFERENCES
    // =============================

    async updatePreferences(campaignId: string, userId: string, payload: any) {
        const campaign = await Campaign.findOne({
            _id: campaignId,
            owner: userId,
        });

        if (!campaign) throw new Error("Unauthorized");

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

    async confirmDonation(transactionRef: string) {
        const donation = await Donation.findOneAndUpdate(
            { transactionRef },
            { paymentStatus: "success" },
            { new: true }
        );

        if (!donation) throw new Error("Donation not found");

        await Campaign.findByIdAndUpdate(donation.campaign, {
            $inc: {
                totalRaised: donation.amount,
                donationCount: 1,
            },
        });

        return donation;
    }
};