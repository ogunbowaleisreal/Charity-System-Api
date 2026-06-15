import Comment from "../../models/Comment";
import { Types } from "mongoose";
import { IComment } from "../../models/Comment";
import { buildPagination, PaginatedResponse, formatPagination } from "../../utils/admin/paginationUtills";

export class CommentAdminService {
    async getCampaignComments(campaignId: string, filters: any) {
        const { page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            Comment.find({ campaign: new Types.ObjectId(campaignId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments({ campaign: new Types.ObjectId(campaignId) })
        ]);
        return formatPagination(comments, total, page, limit);
    }

    async getUserComments(userId: string, filters: any) {
        const { page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([Comment.find({ user: userId })
            .populate("user", "email firstName lastName profilePicture logo")
            .populate("campaign", "title image description ")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Comment.countDocuments({ user: userId })
        ]);
        return formatPagination(comments, total, page, limit);
    }
}