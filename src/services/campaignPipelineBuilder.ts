import { Types, PipelineStage } from "mongoose";

export interface CampaignFilters {
    search?: string;
    status?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    riskLevel?: string;
    isFlagged?: boolean;
    ownerId?: string;
    ownerType?: string;
    minTargetAmount?: number;
    maxTargetAmount?: number;
    minRaised?: number;
    maxRaised?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

export class CampaignPipelineBuilder {
    private filters: CampaignFilters;

    constructor(filters: CampaignFilters) {
        this.filters = filters;
    }

    build(): PipelineStage[] {
        const {
            search,
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
            limit = 10,
        } = this.filters;

        const skip = (page - 1) * limit;
        const pipeline: PipelineStage[] = [];

        // ================================================================
        // STAGE 1 — campaign-level pre-filters (no join yet, fast index hit)
        // ================================================================
        const campaignMatch: Record<string, any> = {};

        if (status) campaignMatch.status = status;
        if (typeof isActive === "boolean") campaignMatch.isActive = isActive;
        if (typeof isDeleted === "boolean") campaignMatch.isDeleted = isDeleted;
        if (riskLevel) campaignMatch.riskLevel = riskLevel;
        if (typeof isFlagged === "boolean") campaignMatch.isFlagged = isFlagged;
        if (ownerType) campaignMatch.ownerType = ownerType;
        if (ownerId) campaignMatch.owner = new Types.ObjectId(ownerId);

        if (minTargetAmount || maxTargetAmount) {
            campaignMatch.targetAmount = {};
            if (minTargetAmount) campaignMatch.targetAmount.$gte = minTargetAmount;
            if (maxTargetAmount) campaignMatch.targetAmount.$lte = maxTargetAmount;
        }

        if (minRaised || maxRaised) {
            campaignMatch.totalRaised = {};
            if (minRaised) campaignMatch.totalRaised.$gte = minRaised;
            if (maxRaised) campaignMatch.totalRaised.$lte = maxRaised;
        }

        if (startDate || endDate) {
            campaignMatch.createdAt = {};
            if (startDate) campaignMatch.createdAt.$gte = startDate;
            if (endDate) campaignMatch.createdAt.$lte = endDate;
        }

        // free-text search on campaign fields
        if (search) {
            const regex = { $regex: search, $options: "i" };
            campaignMatch.$or = [
                { title: regex },
                { description: regex },
            ];
        }

        if (Object.keys(campaignMatch).length > 0) {
            pipeline.push({ $match: campaignMatch });
        }

        // ================================================================
        // STAGE 2 — join owner (Account)
        // ================================================================
        pipeline.push({
            $lookup: {
                from: "accounts",
                localField: "owner",
                foreignField: "_id",
                as: "ownerData",
            },
        });

        pipeline.push({
            $unwind: {
                path: "$ownerData",
                preserveNullAndEmptyArrays: false,
            },
        });

        // ================================================================
        // STAGE 3 — owner field search (applied after join)
        // ================================================================
        if (search) {
            const regex = { $regex: search, $options: "i" };
            pipeline.push({
                $match: {
                    $or: [
                        { "ownerData.firstName": regex },
                        { "ownerData.lastName": regex },
                        { "ownerData.userName": regex },
                        { "ownerData.companyName": regex },
                        { "ownerData.fullName": regex },
                    ],
                },
            });
        }

        // ================================================================
        // STAGE 4 — join category, tags, authors
        // ================================================================
        pipeline.push({
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "categoryData",
            },
        });

        pipeline.push({
            $lookup: {
                from: "tags",
                localField: "tags",
                foreignField: "_id",
                as: "tagsData",
            },
        });

        pipeline.push({
            $lookup: {
                from: "accounts",
                localField: "authors",
                foreignField: "_id",
                as: "authorsData",
            },
        });

        // ================================================================
        // STAGE 5 — shape the output
        // ================================================================
        pipeline.push({
            $addFields: {
                owner: {
                    _id: "$ownerData._id",
                    email: "$ownerData.email",
                    fullName: "$ownerData.fullName",
                    firstName: "$ownerData.firstName",
                    lastName: "$ownerData.lastName",
                    phoneNumber: "$ownerData.phoneNumber",
                    profilePicture: "$ownerData.profilePicture",
                },
                category: {
                    _id: "$categoryData._id",
                    categoryName: { $arrayElemAt: ["$categoryData.categoryName", 0] },
                    description: { $arrayElemAt: ["$categoryData.description", 0] },
                    image: { $arrayElemAt: ["$categoryData.image", 0] },
                    status: { $arrayElemAt: ["$categoryData.status", 0] },
                },
                tags: {
                    $map: {
                        input: "$tagsData",
                        as: "t",
                        in: { _id: "$$t._id", name: "$$t.name" },
                    },
                },
                authors: {
                    $map: {
                        input: "$authorsData",
                        as: "a",
                        in: { _id: "$$a._id", email: "$$a.email", fullName: "$$a.fullName" },
                    },
                },
            },
        });

        pipeline.push({
            $unset: ["ownerData", "categoryData", "tagsData", "authorsData"],
        });

        // ================================================================
        // STAGE 6 — sort, paginate
        // ================================================================
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        return pipeline;
    }

    // Separate count pipeline — same filters, no sort/skip/limit/joins
    buildCount(): PipelineStage[] {
        const {
            search,
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
        } = this.filters;

        const pipeline: PipelineStage[] = [];

        const campaignMatch: Record<string, any> = {};

        if (status) campaignMatch.status = status;
        if (typeof isActive === "boolean") campaignMatch.isActive = isActive;
        if (typeof isDeleted === "boolean") campaignMatch.isDeleted = isDeleted;
        if (riskLevel) campaignMatch.riskLevel = riskLevel;
        if (typeof isFlagged === "boolean") campaignMatch.isFlagged = isFlagged;
        if (ownerType) campaignMatch.ownerType = ownerType;
        if (ownerId) campaignMatch.owner = new Types.ObjectId(ownerId);

        if (minTargetAmount || maxTargetAmount) {
            campaignMatch.targetAmount = {};
            if (minTargetAmount) campaignMatch.targetAmount.$gte = minTargetAmount;
            if (maxTargetAmount) campaignMatch.targetAmount.$lte = maxTargetAmount;
        }

        if (minRaised || maxRaised) {
            campaignMatch.totalRaised = {};
            if (minRaised) campaignMatch.totalRaised.$gte = minRaised;
            if (maxRaised) campaignMatch.totalRaised.$lte = maxRaised;
        }

        if (startDate || endDate) {
            campaignMatch.createdAt = {};
            if (startDate) campaignMatch.createdAt.$gte = startDate;
            if (endDate) campaignMatch.createdAt.$lte = endDate;
        }

        if (search) {
            const regex = { $regex: search, $options: "i" };
            campaignMatch.$or = [
                { title: regex },
                { description: regex },
            ];
        }

        if (Object.keys(campaignMatch).length > 0) {
            pipeline.push({ $match: campaignMatch });
        }

        // only join owner if we need to search owner fields
        if (search) {
            pipeline.push({
                $lookup: {
                    from: "accounts",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerData",
                },
            });

            pipeline.push({
                $unwind: {
                    path: "$ownerData",
                    preserveNullAndEmptyArrays: false,
                },
            });

            const regex = { $regex: search, $options: "i" };
            pipeline.push({
                $match: {
                    $or: [
                        { "ownerData.firstName": regex },
                        { "ownerData.lastName": regex },
                        { "ownerData.userName": regex },
                        { "ownerData.companyName": regex },
                        { "ownerData.fullName": regex },
                    ],
                },
            });
        }

        pipeline.push({ $count: "total" });

        return pipeline;
    }
}