import Requests from "../../models/Requests";
import { Account } from "../../models/Accounts";
import Bids from "../../models/Bids";
import mongoose from "mongoose";
import ConsultantProfile from "../../models/ConsultantProfile";

export interface RequestData {
    // client: string;
    amount: number;
    name: string;
    //email: string;
    message: string;
    experienceLevel: "Intern" | "Junior" | "Intermediate" | "Senior" | "Executive";
    companyIndustry: string;
    biddingStartDate: Date;
    biddingEndDate: Date;
}

export type requestFilter = {
    page?: number;
    limit?: number;
    workType?: "Physical" | "Remote" | "Hybrid";
    status?: "Pending" | "Accepted" | "Partially Completed" | "Completed" | "Declined";
    //role: string;
    experienceLevel?: "Intern" | "Junior" | "Intermediate" | "Senior" | "Executive";
}
export class RequestService {
    // async createRequest(accountId: string, data: RequestData) {
    //     // const account = await Account.findOne({ client: accountId, subscriptionStatus: "active" });
    //     const request = await Requests.create({ admin: accountId, ...data });
    //     return request;
    // }
    // async getClientsRequests(accountId: string) {
    //     const requests = await Requests.find({ client: accountId });
    //     return requests;
    // }

    async getAllRequests(filter: requestFilter, consultantId: string) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        const skip = (page - 1) * limit;

        const { page: _p, limit: _l, ...queryObj } = filter;

        // -----------------------
        // Fetch consultant profile to get allowed workTypes
        // -----------------------
        const consultantProfile = await ConsultantProfile.findOne({ account: consultantId });
        const allowedWorkTypes = consultantProfile?.workType || []; // empty array if none

        // Build the match stage for aggregation
        const matchStage: any = {
            biddingEndDate: { $gte: new Date() },
            status: { $in: ["pending", "ongoing"] },
            ...queryObj,
            // -----------------------
            // Filter requests whose workType is in consultant's allowed workTypes
            // -----------------------
            //workType: { $in: allowedWorkTypes }
        };

        const consultantObjectId = new mongoose.Types.ObjectId(consultantId);

        const pipeline = [
            { $match: matchStage },

            // -----------------------
            // Lookup business category
            // -----------------------
            {
                $lookup: {
                    from: "businesscategories",
                    localField: "businessCategory",
                    foreignField: "_id",
                    as: "businessCategory"
                }
            },
            {
                $unwind: {
                    path: "$businessCategory",
                    preserveNullAndEmptyArrays: true
                }
            },

            // -----------------------
            // Lookup consultant's bids for each request
            // -----------------------
            {
                $lookup: {
                    from: "bids",
                    let: { requestId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$requestId", "$$requestId"] },
                                        { $eq: ["$consultantId", consultantObjectId] },
                                        { $ne: ["$status", "withdrawn"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: "consultantBid"
                }
            },

            {
                $addFields: {
                    hasBidded: { $gt: [{ $size: "$consultantBid" }, 0] }
                }
            },

            {
                $project: {
                    consultantBid: 0,
                    client: 0
                }
            },

            { $sort: { createdAt: -1, _id: -1 } as const },

            { $skip: skip },
            { $limit: limit }
        ];

        const [requests, total] = await Promise.all([
            Requests.aggregate(pipeline),
            Requests.countDocuments(matchStage)
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: requests,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }


    // async getAllRequests(filter: requestFilter, consultantId: string) {
    //     const page = Number(filter.page) || 1;
    //     const limit = Number(filter.limit) || 10;
    //     const skip = (page - 1) * limit;

    //     const { page: _p, limit: _l, ...queryObj } = filter;

    //     const matchStage = {
    //         biddingEndDate: { $gte: new Date() },
    //         ...queryObj
    //     };

    //     const consultantObjectId = new mongoose.Types.ObjectId(consultantId);

    //     const pipeline = [
    //         { $match: matchStage },
    //         // {
    //         //     $lookup: {
    //         //         from: "accounts",
    //         //         localField: "client",
    //         //         foreignField: "_id",
    //         //         as: "client"
    //         //     }
    //         // },
    //         // {
    //         //     $unwind: {
    //         //         path: "$client",
    //         //         preserveNullAndEmptyArrays: true
    //         //     }
    //         // },

    //         {
    //             $lookup: {
    //                 from: "businesscategories",
    //                 localField: "businessCategory",
    //                 foreignField: "_id",
    //                 as: "businessCategory"
    //             }
    //         },
    //         {
    //             $unwind: {
    //                 path: "$businessCategory",
    //                 preserveNullAndEmptyArrays: true
    //             }
    //         },

    //         {
    //             $lookup: {
    //                 from: "bids",
    //                 let: { requestId: "$_id" },
    //                 pipeline: [
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $eq: ["$requestId", "$$requestId"] },
    //                                     { $eq: ["$consultantId", consultantObjectId] },
    //                                     { $ne: ["$status", "withdrawn"] }
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     { $limit: 1 }
    //                 ],
    //                 as: "consultantBid"
    //             }
    //         },

    //         {
    //             $addFields: {
    //                 hasBidded: { $gt: [{ $size: "$consultantBid" }, 0] }
    //             }
    //         },

    //         {
    //             $project: {
    //                 consultantBid: 0,
    //                 client: 0
    //             }
    //         },
    //         { $sort: { createdAt: -1, _id: -1 } as const },

    //         { $skip: skip },
    //         { $limit: limit }
    //     ];

    //     const [requests, total] = await Promise.all([
    //         Requests.aggregate(pipeline),
    //         Requests.countDocuments(matchStage)
    //     ]);

    //     const totalPages = Math.ceil(total / limit);

    //     return {
    //         data: requests,
    //         pagination: {
    //             page,
    //             limit,
    //             total,
    //             totalPages,
    //             hasNext: page < totalPages,
    //             hasPrev: page > 1
    //         }
    //     };
    // }


    // async getAllRequests(filter: requestFilter) {
    //     const page = Number(filter.page) || 1;
    //     const limit = Number(filter.limit) || 10;

    //     // Remove pagination from the main query object
    //     const { page: _p, limit: _l, ...queryObj } = filter;

    //     const skip = (page - 1) * limit;

    //     // Build the base query
    //     let query = Requests.find({ biddingEndDate: { $gte: new Date() }, ...queryObj })
    //         .skip(skip)
    //         .limit(limit)
    //         .populate("businessCategory client");

    //     // Run query + count in parallel
    //     const [requests, total] = await Promise.all([
    //         query.exec(),
    //         Requests.countDocuments(queryObj)
    //     ]);

    //     const totalPages = Math.ceil(total / limit);

    //     return {
    //         data: requests,
    //         pagination: {
    //             page,
    //             limit,
    //             total,
    //             totalPages,
    //             hasNext: page < totalPages,
    //             hasPrev: page > 1
    //         }
    //     };
    // }

    async getRequest(requestId: string) {
        const request = await Requests.findById(requestId);
        return request;
    }

    // async deleteRequest(requestId: string) {
    //     const request = await Requests.findByIdAndDelete(requestId);
    //     return request;
    // }

    // async updateRequest(requestId: string, data: any) {
    //     const request = await Requests.findByIdAndUpdate(requestId, data, { new: true });
    //     return request;
    // }
    // async approveAssignment() {

    // }

}