import Favorite from "../../models/Favourite";
import Campaign from "../../models/Campaign";
import { Types } from "mongoose";

class FavoriteService {
    async toggleFavorite(userId: string, campaignId: string) {
        const existing = await Favorite.findOneAndDelete({
            user: userId,
            campaign: campaignId,
        });

        if (existing) {
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { favoritesCount: -1 },
            });
            return { favorited: false };
        }

        try {
            await Favorite.create({ user: userId, campaign: campaignId });
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { favoritesCount: 1 },
            });
            return { favorited: true };
        } catch (err: any) {
            if (err.code === 11000) {
                // race condition — a concurrent request already created it
                return { favorited: true };
            }
            throw err;
        }
    }

    // used by getAllCampaigns / getCampaignById to batch-check favorites
    async getUserFavoritesForCampaigns(
        userId: string | undefined,
        campaignIds: Types.ObjectId[]
    ): Promise<Set<string>> {
        if (!userId || campaignIds.length === 0) return new Set();

        const favorites = await Favorite.find({
            user: userId,
            campaign: { $in: campaignIds },
        })
            .select("campaign")
            .lean();

        return new Set(favorites.map((f) => f.campaign.toString()));
    }

    async getUserFavoriteCampaigns(userId: string, query: any) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [favorites, total] = await Promise.all([
            Favorite.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate({
                    path: "campaign",
                    match: { isDeleted: false },
                    populate: [
                        { path: "owner", select: "firstName lastName companyName logo profilePicture" },
                        { path: "category", select: "categoryName description image status" },
                        { path: "tags", select: "name" },
                    ],
                })
                .lean(),

            Favorite.countDocuments({ user: userId }),
        ]);

        // populate + match returns null for deleted campaigns — filter those out
        const campaigns = favorites
            .map((f) => f.campaign)
            .filter(Boolean)
            .map((c: any) => ({ ...c, isFavorited: true }));

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
}

export default new FavoriteService();