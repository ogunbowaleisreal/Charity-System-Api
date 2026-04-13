// import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
// import { Account } from "../../models/Accounts";
// import clientProfile from "../../models/clientProfile";
// import ConsultantProfile from "../../models/ConsultantProfile";
// import { MonthlyReport } from "../../models/Reports";
// import { PipelineStage, Types } from "mongoose";


// export class clientAssignmentServices {
//     // async getAssignments(clientId: string, role: string) {
//     //     if (role == "client") return await consultantClientAssignemnt.find({ client: clientId }).populate('client')
//     //     return await consultantClientAssignemnt.find({ client: clientId }).populate('consultant')
//     // }

//     // async getAssignments(
//     //     clientId: string,
//     //     role: "client" | "consultant",
//     //     page = 1,
//     //     limit = 10
//     // ) {
//     //     const skip = (page - 1) * limit;

//     //     // Build base filter
//     //     // if (role == "client") {
//     //     //     const filter = { client: clientId };
//     //     // }else{
//     //     // const filter = { consultant: clientId };
//     //     // }

//     //     const filter = role == "client" ? { client: clientId } : { consultant: clientId };
//     //     // Decide which field to populate
//     //     const populateField = role === "client" ? "consultant" : "client";
//     //     const profileField = role === "client" ? "consultantProfile" : "clientProfile";
//     //     let latestReports: any = []

//     //     if (role == "client") {
//     //         latestReports = await MonthlyReport.find({ client: clientId })
//     //             .select("year month documentUrl")
//     //             .sort({ createdAt: -1 }) // newest → oldest
//     //             .limit(5);
//     //     }
//     //     if (role == "consultant") {
//     //         latestReports = await MonthlyReport.find({ consultant: clientId })
//     //             .select("year month documentUrl")
//     //             .sort({ createdAt: -1 }) // newest → oldest
//     //             .limit(5);
//     //     }

//     //     // Count total
//     //     const total = await consultantClientAssignemnt.countDocuments(filter);

//     //     // Query paginated data
//     //     const data = await consultantClientAssignemnt
//     //         .find(filter)
//     //         .populate(populateField)
//     //         .populate(profileField)
//     //         .skip(skip)
//     //         .limit(limit)
//     //         .sort({ createdAt: -1 }); // optional, but recommended

//     //     return {
//     //         total,
//     //         page,
//     //         limit,
//     //         totalPages: Math.ceil(total / limit),
//     //         data,
//     //         latestReports
//     //     };
//     // }
//     async getAssignments(
//         userId: string,
//         role: "client" | "consultant",
//         page = 1,
//         limit = 10,
//         status: "active" | "removed" = "active"
//     ) {
//         const skip = (page - 1) * limit;

//         const matchStage =
//             role === "client"
//                 ? { client: new Types.ObjectId(userId), status }
//                 : { consultant: new Types.ObjectId(userId), status };

//         const pipeline: PipelineStage[] = [
//             { $match: matchStage },

//             { $sort: { createdAt: -1 } },

//             { $skip: skip },
//             { $limit: limit },

//             // populate consultant / client
//             {
//                 $lookup: {
//                     from: "accounts",
//                     localField: role === "client" ? "consultant" : "client",
//                     foreignField: "_id",
//                     as: "counterparty"
//                 }
//             },
//             { $unwind: "$counterparty" },
//             {
//                 $lookup: {
//                     from: "businesscategories",
//                     localField: "counterparty.businessCategory",
//                     foreignField: "_id",
//                     as: "counterparty.businessCategory"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$counterparty.businessCategory",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },

//             // populate profile
//             {
//                 $lookup: {
//                     from: role === "client" ? "consultantprofiles" : "clientprofiles",
//                     localField: role === "client" ? "consultantProfile" : "clientProfile",
//                     foreignField: "_id",
//                     as: "profile"
//                 }
//             },
//             { $unwind: "$profile" },

//             // =====================================================
//             // 🔴 CHANGED: lookup TOP 5 reports (no requestId, reports only)
//             // =====================================================
//             {
//                 $lookup: {
//                     from: "reports",
//                     let: {
//                         consultantId: "$consultant",
//                         clientId: "$client"
//                     },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [
//                                         { $eq: ["$consultant", "$$consultantId"] },
//                                         { $eq: ["$client", "$$clientId"] },
//                                         { $eq: ["$type", "report"] } // 🔴 CHANGED
//                                     ]
//                                 }
//                             }
//                         },
//                         { $sort: { uploadedAt: -1 } },
//                         { $limit: 5 },
//                         {
//                             $project: {
//                                 year: 1,
//                                 month: 1,
//                                 documentUrl: 1,
//                                 fileName: 1,
//                                 uploadedAt: 1
//                             }
//                         }
//                     ],
//                     as: "reports"
//                 }
//             },

//             // =====================================================
//             // 🔴 CHANGED: lookup TOTAL report count (accurate)
//             // =====================================================
//             {
//                 $lookup: {
//                     from: "reports",
//                     let: {
//                         consultantId: "$consultant",
//                         clientId: "$client"
//                     },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [
//                                         { $eq: ["$consultant", "$$consultantId"] },
//                                         { $eq: ["$client", "$$clientId"] },
//                                         { $eq: ["$type", "report"] } // 🔴 CHANGED
//                                     ]
//                                 }
//                             }
//                         },
//                         { $count: "count" }
//                     ],
//                     as: "reportsMeta"
//                 }
//             },

//             // =====================================================
//             // 🔴 CHANGED: extract real count safely
//             // =====================================================
//             {
//                 $addFields: {
//                     reportsCount: {
//                         $ifNull: [{ $arrayElemAt: ["$reportsMeta.count", 0] }, 0]
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     reportsMeta: 0 // 🔴 CHANGED
//                 }
//             }
//         ];

//         const [data, totalCount] = await Promise.all([
//             consultantClientAssignemnt.aggregate(pipeline),
//             consultantClientAssignemnt.countDocuments(matchStage)
//         ]);

//         const totalPages = Math.ceil(totalCount / limit);

//         return {
//             data,
//             pagination: {
//                 page,
//                 limit,
//                 total: totalCount,
//                 totalPages,
//                 hasNext: page < totalPages,
//                 hasPrev: page > 1
//             }
//         };
//     }


//     //     async getAssignments(
//     //         userId: string,
//     //         role: "client" | "consultant",
//     //         page = 1,
//     //         limit = 10,
//     //         status: "active" | "removed" = "active"
//     //     ) {
//     //         const skip = (page - 1) * limit;

//     //         const matchStage =
//     //             role === "client"
//     //                 ? { client: new Types.ObjectId(userId), status }
//     //                 : { consultant: new Types.ObjectId(userId), status };

//     //         const pipeline: PipelineStage[] = [
//     //             { $match: matchStage },

//     //             { $sort: { createdAt: -1 } },

//     //             { $skip: skip },
//     //             { $limit: limit },

//     //             // populate consultant / client
//     //             {
//     //                 $lookup: {
//     //                     from: "accounts",
//     //                     localField: role === "client" ? "consultant" : "client",
//     //                     foreignField: "_id",
//     //                     as: "counterparty"
//     //                 }
//     //             },
//     //             { $unwind: "$counterparty" },
//     //             {
//     //                 $lookup: {
//     //                     from: "businesscategories",
//     //                     localField: "counterparty.businessCategory",
//     //                     foreignField: "_id",
//     //                     as: "counterparty.businessCategory"
//     //                 }
//     //             },
//     //             {
//     //                 $unwind: {
//     //                     path: "$counterparty.businessCategory",
//     //                     preserveNullAndEmptyArrays: true
//     //                 }
//     //             },


//     //             // populate profile
//     //             {
//     //                 $lookup: {
//     //                     from: role === "client" ? "consultantprofiles" : "clientprofiles",
//     //                     localField: role === "client" ? "consultantProfile" : "clientProfile",
//     //                     foreignField: "_id",
//     //                     as: "profile"
//     //                 }
//     //             },
//     //             { $unwind: "$profile" },

//     //             // 🔥 lookup reports PER assignment
//     //             {
//     //                 $lookup: {
//     //                     from: "reports",
//     //                     let: {
//     //                         consultantId: "$consultant",
//     //                         clientId: "$client",
//     //                         requestId: "$request"
//     //                     },
//     //                     pipeline: [
//     //                         {
//     //                             $match: {
//     //                                 $expr: {
//     //                                     $and: [
//     //                                         { $eq: ["$consultant", "$$consultantId"] },
//     //                                         { $eq: ["$client", "$$clientId"] },
//     //                                         { $eq: ["$request", "$$requestId"] }
//     //                                     ]
//     //                                 }
//     //                             }
//     //                         },
//     //                         { $sort: { uploadedAt: -1 } },
//     //                         { $limit: 5 },
//     //                         {
//     //                             $project: {
//     //                                 year: 1,
//     //                                 month: 1,
//     //                                 documentUrl: 1,
//     //                                 _id: 1,
//     //                                 fileName: 1
//     //                             }
//     //                         }
//     //                     ],
//     //                     as: "reports"
//     //                 }
//     //             },
//     //             {
//     //                 $addFields: {
//     //                     reportsCount: { $size: "$reports" }
//     //                 }
//     //             }
//     //         ];

//     //         const [data, totalCount] = await Promise.all([
//     //             consultantClientAssignemnt.aggregate(pipeline),
//     //             consultantClientAssignemnt.countDocuments(matchStage)
//     //         ]);
//     //         const totalPages = Math.ceil(totalCount / limit);

//     //         return {
//     //             data,
//     //             pagination: {
//     //                 page,
//     //                 limit,
//     //                 total: totalCount,
//     //                 totalPages,
//     //                 hasNext: page < totalPages,
//     //                 hasPrev: page > 1
//     //             }
//     //         };
//     //     }


// }