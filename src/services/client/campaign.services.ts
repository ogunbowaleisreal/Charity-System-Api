import { Types } from "mongoose";
import Campaign from "../../models/Campaign";
import { Donation } from "../../models/Donations";
import Comment from "../../models/Comment";
import { Account } from "../../models/Accounts";

// type createCampaign = {
//     title: string;
//     description: string;
//     category: string;
//     targetAmount: number;
//     deadline: Date;
//     image: string;
// };

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
    image: string;
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

export type UpdateCampaign = {
    title: string;
    description: string;
    category: string;
    targetAmount: number;
    tags: Types.ObjectId[];
    //deadline: Date;
    closing: Date;
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
}


export class CampaignService {
    // =============================
    // 🔹 CREATE / UPDATE / DELETE
    // =============================

    async createCampaign(payload: CreateCampaignDTO, userId: string) {
        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");
        payload.owner = user._id as string;
        payload.ownerType = user.role;
        if (payload.startImmediately) payload.startDate = new Date();

        return await Campaign.create({
            ...payload,
            owner: userId,
        });
    }

    async updateCampaign(campaignId: string, userId: string, payload: UpdateCampaign) {
        const campaign = await Campaign.findOne({
            _id: campaignId,
            owner: userId,
            isDeleted: false,
        });

        if (!campaign) throw new Error("Campaign not found or unauthorized");

        Object.assign(campaign, payload);
        return await campaign.save();
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

    // =============================
    // 🔹 FETCH CAMPAIGNS
    // =============================

    async getAllCampaigns(query: campaignFilter) {
        const { page = 1, limit = 10, category, status } = query;

        const filter: any = { isDeleted: false, isActive: true };

        if (category) filter.category = category;
        if (status) filter.status = status;

        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("owner", "firstName lastName companyName logo ")
            .populate("category", "name")
            .populate("tags", "name");

        const total = await Campaign.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        return {
            campaigns,
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

    async getCampaignById(campaignId: string) {
        const campaign = await Campaign.findById(campaignId)
            .populate("owner", "firstName lastName companyName logo")
            .populate("category", "name")
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

        const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("category", "name").populate("tags", "name");

        const total = await Campaign.countDocuments({
            owner: userId,
            isDeleted: false,
        });
        const totalPages = Math.ceil(total / limit);

        return {
            campaigns,
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

    // =============================
    // 🔹 STATS
    // =============================

    async getCampaignStats(campaignId: string) {
        console.log(campaignId)
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

    // =============================
    // 🔹 DONATIONS
    // =============================

    async getCampaignDonations(campaignId: string, filter: donationFilter) {
        let sort: any = { createdAt: -1 };

        if (filter.sort === "top") {
            return await Donation.aggregate([
                {
                    $match: {
                        campaign: new Types.ObjectId(campaignId),
                        paymentStatus: "success",
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
            .populate("donor", "firstName lastName");

        const total = await Donation.countDocuments({
            campaign: campaignId,
            paymentStatus: "success",
        });

        const totalPages = Math.ceil(total / filter.limit);


        // donations.forEach((d) => {
        //     d.createdAt = moment(d.createdAt).fromNow();
        // })

        return {
            donations,
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
                .populate("user", "firstName lastName profilePicture");
        }
        const comments = await Comment.find({
            campaign: campaignId,
            isDeleted: false,
        }).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("user", "firstName lastName profilePicture");

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