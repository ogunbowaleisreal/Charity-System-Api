import { Account } from "../../models/Accounts";
import transaction from "../../models/transaction";
import ConsultantProfile from "../../models/ConsultantProfile";
import clientProfile from "../../models/clientProfile";
import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
import EmailService from "../Email.services";
import Bids from "../../models/Bids";
import Requests from "../../models/Requests";
import mongoose from "mongoose";
import logger from "../../logger";
import { PipelineStage } from "mongoose";
import { UpdateClientProfile } from "../../models/clientProfile";
import { updateConsultantProfile } from "../../models/ConsultantProfile";
import { updateClientProfile } from "../../types/clientprofile";
import { cert } from "firebase-admin/app";
export type AccountFilter = {
    role?: string,
    status?: string,
    // assignedConsultant?: string
    search?: string
    experienceLevel?: string
    page?: number
    limit?: number

}
const emailService = new EmailService()
export class AccountManagementServices {


    async getAllAccounts(filter: AccountFilter = {}) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        const skip = (page - 1) * limit;

        const { page: _p, limit: _l, search, ...queryObj } = filter;
        const matchStage: any = { ...queryObj };

        if (search) {
            const term = search.trim();
            matchStage.$or = [
                { firstName: { $regex: term, $options: "i" } },
                { lastName: { $regex: term, $options: "i" } },
                { email: { $regex: term, $options: "i" } },
                { companyName: { $regex: term, $options: "i" } },
                { contactPerson: { $regex: term, $options: "i" } },
                { phone: { $regex: term, $options: "i" } }
            ];
        }

        const pipeline: PipelineStage[] = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "consultantprofiles",
                    localField: "_id",
                    foreignField: "account",
                    as: "consultantProfile"
                }
            },
            {
                $lookup: {
                    from: "clientprofiles",
                    localField: "_id",
                    foreignField: "account",
                    as: "clientProfile"
                }
            },

            // Consultant assignments
            {
                $lookup: {
                    from: "consultantclientassignments",
                    let: { consultantId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$consultant", "$$consultantId"] },
                                        { $eq: ["$status", "active"] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "activeAssignments"
                }
            },

            // Client assignments
            {
                $lookup: {
                    from: "consultantclientassignments",
                    let: { clientId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$client", "$$clientId"] },
                                        { $eq: ["$status", "active"] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "activeConsultantAssignments"
                }
            },

            {
                $addFields: {
                    experienceLevel: {
                        $cond: [
                            { $eq: ["$role", "consultant"] },
                            { $arrayElemAt: ["$consultantProfile.experience", 0] },
                            null
                        ]
                    },

                    noOfClients: {
                        $ifNull: [
                            { $arrayElemAt: ["$activeAssignments.count", 0] },
                            0
                        ]
                    },

                    noOfConsultants: {
                        $ifNull: [
                            { $arrayElemAt: ["$activeConsultantAssignments.count", 0] },
                            0
                        ]
                    },

                    profile: {
                        $cond: [
                            { $eq: ["$role", "consultant"] },
                            { $arrayElemAt: ["$consultantProfile", 0] },
                            { $arrayElemAt: ["$clientProfile", 0] }
                        ]
                    }
                }
            },

            {
                $addFields: {
                    profileCompletionRate: {
                        $cond: [
                            { $ifNull: ["$profile", false] },
                            {
                                $let: {
                                    vars: {
                                        totalFields: {
                                            $size: { $objectToArray: "$profile" }
                                        },
                                        filledFields: {
                                            $size: {
                                                $filter: {
                                                    input: { $objectToArray: "$profile" },
                                                    as: "field",
                                                    cond: {
                                                        $and: [
                                                            { $ne: ["$$field.v", null] },
                                                            { $ne: ["$$field.v", ""] }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    in: {
                                        $round: [
                                            {
                                                $multiply: [
                                                    {
                                                        $divide: [
                                                            "$$filledFields",
                                                            {
                                                                $cond: [
                                                                    { $eq: ["$$totalFields", 0] },
                                                                    1,
                                                                    "$$totalFields"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            },

            // ✅ FINAL CLEAN PROJECTION
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    role: 1,
                    status: 1,
                    phone: 1,
                    gender: 1,
                    companyName: 1,
                    contactPerson: 1,
                    businessCategory: 1,
                    kycStatus: 1,
                    provider: 1,
                    verified: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    subscriptionStatus: 1,
                    subscriptionPlan: 1,
                    subscriptionStartDate: 1,
                    subscriptionEndDate: 1,
                    experienceLevel: 1,
                    profile: 1,
                    profileCompletionRate: 1,

                    noOfClients: {
                        $cond: [
                            { $eq: ["$role", "consultant"] },
                            "$noOfClients",
                            "$$REMOVE"
                        ]
                    },

                    noOfConsultants: {
                        $cond: [
                            { $eq: ["$role", "client"] },
                            "$noOfConsultants",
                            "$$REMOVE"
                        ]
                    }
                }
            }
            ,

            { $sort: { createdAt: -1 as 1 | -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const [accounts, total] = await Promise.all([
            Account.aggregate(pipeline),
            Account.countDocuments(matchStage)
        ]);

        return {
            data: accounts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    }



    // async getAccountById(accountId: string) {
    //     const account = await Account.findById(accountId);
    //     if (!account) throw new Error("account not found")
    //     if (account?.role == "client") {
    //         return await clientProfile.findOne({ account: accountId }).populate("account");
    //     }
    //     return await ConsultantProfile.findOne({ account: accountId }).populate("account");
    // }


    async getAccountById(accountId: string) {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw new Error("Invalid account id");
        }

        const pipeline: PipelineStage[] = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(accountId)
                }
            },

            {
                $lookup: {
                    from: "consultantprofiles",
                    localField: "_id",
                    foreignField: "account",
                    as: "consultantProfile"
                }
            },
            {
                $lookup: {
                    from: "clientprofiles",
                    localField: "_id",
                    foreignField: "account",
                    as: "clientProfile"
                }
            },

            // Consultant assignments count
            {
                $lookup: {
                    from: "consultantclientassignments",
                    let: { consultantId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$consultant", "$$consultantId"] },
                                        { $eq: ["$status", "active"] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "activeAssignments"
                }
            },

            // Client assignments count
            {
                $lookup: {
                    from: "consultantclientassignments",
                    let: { clientId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$client", "$$clientId"] },
                                        { $eq: ["$status", "active"] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "activeConsultantAssignments"
                }
            },

            {
                $addFields: {
                    profile: {
                        $cond: [
                            { $eq: ["$role", "consultant"] },
                            { $arrayElemAt: ["$consultantProfile", 0] },
                            { $arrayElemAt: ["$clientProfile", 0] }
                        ]
                    },

                    noOfClients: {
                        $ifNull: [
                            { $arrayElemAt: ["$activeAssignments.count", 0] },
                            0
                        ]
                    },

                    noOfConsultants: {
                        $ifNull: [
                            { $arrayElemAt: ["$activeConsultantAssignments.count", 0] },
                            0
                        ]
                    }
                }
            },

            // ✅ Profile Completion Rate
            {
                $addFields: {
                    profileCompletionRate: {
                        $cond: [
                            { $ifNull: ["$profile", false] },
                            {
                                $let: {
                                    vars: {
                                        totalFields: {
                                            $size: { $objectToArray: "$profile" }
                                        },
                                        filledFields: {
                                            $size: {
                                                $filter: {
                                                    input: { $objectToArray: "$profile" },
                                                    as: "field",
                                                    cond: {
                                                        $and: [
                                                            { $ne: ["$$field.v", null] },
                                                            { $ne: ["$$field.v", ""] }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    in: {
                                        $round: [
                                            {
                                                $multiply: [
                                                    {
                                                        $divide: [
                                                            "$$filledFields",
                                                            {
                                                                $cond: [
                                                                    { $eq: ["$$totalFields", 0] },
                                                                    1,
                                                                    "$$totalFields"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            },

            {
                $project: {
                    consultantProfile: 0,
                    clientProfile: 0,
                    activeAssignments: 0,
                    activeConsultantAssignments: 0,
                    password: 0
                }
            }
        ];

        const result = await Account.aggregate(pipeline);

        if (!result.length) {
            throw new Error("account not found");
        }

        return result[0];
    }

    async deleteAccount(accountId: string) {
        return await Account.findByIdAndDelete(accountId);
    }

    async updateAccount(accountId: string, data: any) {
        return await Account.findByIdAndUpdate(accountId, data, { new: true });
    }

    async getClientPaymentHistory(accountId: string) {
        return await transaction.find({ user: accountId });
    }

    async approveOrDeclineConsultant(consultant_id: string, data: any) {
        const consultant = await Account.findById(consultant_id)
        const consultantProfile = await ConsultantProfile.findOne({ account: consultant_id })
        if (!consultantProfile) throw new Error("consultant profile not found ")
        if (consultant?.role !== "consultant") throw new Error("this is not a consultant account")
        if (data.response == "approve") {
            consultant.status = 'active'
            await consultant.save()
            consultantProfile.experience = data.experienceLevel
            consultantProfile.remark = data.remark
            consultantProfile.status = "active"
            await consultantProfile.save()

            //console.log(consultantProfile)
            await emailService.sendConsultantApprovedEmail(consultantProfile)
            return clientProfile;
        }
        if (data.response == "decline") {
            consultant.status = 'pending'
            consultantProfile.experience = null
            await consultant.save()
            return await Account.findByIdAndUpdate(consultant_id, { status: "declined" }, { new: true });
        }
    }

    async updateProfile(accountId: string, fields: any, role: string) {
        if (role == "client") {
            const allowedFields: (keyof UpdateClientProfile)[] = [
                "businessAddress",
                "operatingCity",
                "operatingCountry",
                "operatingState",
                "positionInCompany",
                "companyName",
                "workEmail",
                "workPhone",
                "workType",
                "phoneCountryCode",
                "workPhoneCountryCode",
                "about",
                "coreNeeds",
                "employeeCapacity",
                "businessCategory",
                "instagram",
                "linkedin",
                "website",
                "youtube",
                "registrationNumber",
                "facebook",
                "x",
                "other",
                "firstName",
                "lastName",
                "profilePicture",
                "email",
                "phoneNumber",
            ];

            let updateAccount = {} as any;

            if (fields.firstName !== undefined) updateAccount.firstName = fields.firstName;
            if (fields.lastName !== undefined) updateAccount.lastName = fields.lastName;
            if (fields.email !== undefined) updateAccount.email = fields.email;
            if (fields.phoneNumber !== undefined) updateAccount.phone = fields.phoneNumber;
            if (fields.workPhoneCountryCode !== undefined)
                updateAccount.workPhoneCountryCode = fields.workPhoneCountryCode;
            if (fields.workPhone !== undefined) updateAccount.workPhone = fields.workPhone;
            if (fields.profilePicture !== undefined)
                updateAccount.picture = fields.profilePicture;

            const updateData: Record<string, any> = {};

            for (const field of allowedFields) {
                if (fields[field] !== undefined) {
                    updateData[field] = fields[field];
                }
            }

            const updatedData = await clientProfile.findOneAndUpdate(
                { account: accountId },
                { $set: updateData },
                { new: true }
            );

            console.log(updatedData);

            const updatedAccount = await Account.findOneAndUpdate(
                { _id: accountId },
                { $set: updateAccount },
                { new: true }
            );

            /* =======================
               KYC COMPLETION CHECK
               ======================= */

            if (updatedData) {
                const REQUIRED_KYC_FIELDS: (keyof typeof updatedData)[] = [
                    "firstName",
                    "lastName",
                    "email",
                    "phoneNumber",
                    "businessAddress",
                    "operatingCity",
                    "operatingCountry",
                    "operatingState",
                    "positionInCompany",
                    "workEmail",
                    "workPhone",
                    "businessCategory",
                    "employeeCapacity",
                    "registrationNumber",
                ];

                const isKycComplete = REQUIRED_KYC_FIELDS.every((field) => {
                    const value = updatedData[field];
                    return value !== undefined && value !== null && value !== "";
                });

                if (isKycComplete && updatedData.kycStatus !== "completed") {
                    await clientProfile.updateOne(
                        { _id: updatedData._id },
                        { $set: { kycStatus: "completed" } }
                    );
                    await Account.updateOne(
                        { _id: accountId },
                        { $set: { kycStatus: "completed" } }
                    )
                }

                return updatedData;
            }
        }
        const allowedFields: (keyof updateConsultantProfile)[] = [
            "professionalImage",
            "about",
            "firstName",
            "lastName",
            "phoneNumber",
            "gender",
            "identification",
            "homeAddress",
            "cityOfResidence",
            "stateOfResidence",
            "countryOfResidence",
            "stateOfOrigin",
            "countryOfOrigin",
            "phoneCountryCode",
            "workPhoneCountryCode",
            "certificates",
            "Bio",
            "company",
            "position",
            "startDate",
            "endDate",
            "responsibilities",
            "school",
            "courseStudied",
            "certification",
            "workType",
            "monthYear",
            "skills",
            "languages",
            "workType",
            "education",
            "facebook",
            "cvUrl",
            "linkedin",
            "x",
            "instagram",
            "youtube",
            "other",
        ];

        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updateData[field] = fields[field];
            }
        }

        const updatedData = await ConsultantProfile.findOneAndUpdate(
            { account: accountId },
            { $set: updateData },
            { new: true }
        );

        console.log(updatedData);

        /* =======================
           KYC COMPLETION CHECK
           ======================= */

        if (updatedData) {
            const REQUIRED_KYC_FIELDS: (keyof typeof updatedData)[] = [
                "firstName",
                "lastName",
                "phoneNumber",
                "gender",
                "homeAddress",
                "cityOfResidence",
                "stateOfResidence",
                "countryOfResidence",
                "countryOfOrigin",
                "professionalImage",
                "skills",
                "languages",
                "workType",
            ];

            const isKycComplete = REQUIRED_KYC_FIELDS.every((field) => {
                const value = updatedData[field];
                return value !== undefined && value !== null && value !== "";
            });

            if (isKycComplete && updatedData.kycStatus !== "completed") {
                await ConsultantProfile.updateOne(
                    { _id: updatedData._id },
                    { $set: { kycStatus: "completed" } }
                );
                await Account.updateOne(
                    { _id: accountId },
                    { $set: { kycStatus: "completed" } }
                );
            }

            return updatedData;
        }

        throw new Error("update failed");
    }



    async assignConsultant(clientId: string, consultantId: string, requestId: string, type: "direct" | "bidRelated") {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const doubleAssignment = await consultantClientAssignemnt.findOne({ client: clientId, consultant: consultantId, status: "active" }).session(session)
            if (doubleAssignment) throw new Error("This consultant is already assigned to the client, no further action required")
            const consultant = await Account.findById(consultantId).session(session);
            const client = await Account.findById(clientId).session(session);
            if (!consultant || !client) throw new Error("Invalid account");

            const ClientProfile = await clientProfile.findOne({ account: clientId }).session(session);
            const consultantProfile = await ConsultantProfile.findOne({ account: consultantId }).session(session);
            if (!ClientProfile) throw new Error("client profile not found")
            if (!consultantProfile) throw new Error("consultant profile not found")

            // const relatedRequest = await Requests.findById(requestId).session(session);
            // if (!relatedRequest) throw new Error("Request not found");

            // if (relatedRequest.assignedHRCount == relatedRequest.requiredHrCount) throw new Error("HR threshold reached")
            // relatedRequest.assignedHRCount += 1
            // await relatedRequest.save()

            // const updatedRequest = await Requests.findOneAndUpdate(
            //     {
            //         _id: relatedRequest._id,
            //         $expr: { $lt: ["$assignedHRCount", "$requiredHrCount"] }
            //     },
            //     {
            //         $inc: { assignedHRCount: 1 },
            //         status: "partially completed"
            //     },
            //     { new: true, session }
            // );
            // const updatedRequest = await Requests.findOneAndUpdate(
            //     {
            //         _id: relatedRequest._id,
            //         $expr: { $lt: ["$assignedHRCount", "$requiredHrCount"] }
            //     },
            //     [
            //         {
            //             $set: {
            //                 assignedHRCount: { $add: ["$assignedHRCount", 1] },
            //                 status: {
            //                     $switch: {
            //                         branches: [
            //                             {
            //                                 case: {
            //                                     $eq: [
            //                                         { $add: ["$assignedHRCount", 1] },
            //                                         "$requiredHrCount"
            //                                     ]
            //                                 },
            //                                 then: "completed"
            //                             },
            //                             {
            //                                 case: {
            //                                     $gt: [
            //                                         { $add: ["$assignedHRCount", 1] },
            //                                         0
            //                                     ]
            //                                 },
            //                                 then: "partially completed"
            //                             }
            //                         ],
            //                         default: "pending"
            //                     }
            //                 }
            //             }
            //         }
            //     ],
            //     { new: true, session }
            // );

            // //     },
            // //     { new: true }
            // // );

            // if (!updatedRequest) {
            //     throw new Error("HR threshold reached");
            // }


            // const request = await Requests.findOneAndUpdate(
            //     {
            //         _id: requestId,
            //         assignedHrCount: { $lt: baseRequest.requiredHrCount }
            //     },
            //     { $inc: { assignedHrCount: 1 } },
            //     { new: true, session }
            // );
            // if (!request) throw new Error("HR threshold reached");
            // const startDate = new Date();

            // const endDate = new Date(startDate);
            // switch (relatedRequest.jobDuration.unit) {
            //     case "days":
            //         endDate.setDate(endDate.getDate() + relatedRequest.jobDuration.value);
            //         break;
            //     case "weeks":
            //         endDate.setDate(endDate.getDate() + relatedRequest.jobDuration.value * 7);
            //         break;
            //     case "months":
            //         endDate.setMonth(endDate.getMonth() + relatedRequest.jobDuration.value);
            //         break;
            // }


            // const assignment = await consultantClientAssignemnt.create(
            //     [{
            //         client: clientId,
            //         consultant: consultantId,
            //         request: requestId,
            //         clientProfile: ClientProfile._id,
            //         consultantProfile: consultantProfile._id,
            //         type,
            //         startDate,
            //         endDate
            //     }],
            //     { session }
            // );

            // if (type !== "direct") {
            //     const bid = await Bids.findOneAndUpdate(
            //         { requestId, consultantId, status: "accepted" },
            //         { status: "assigned" },
            //         { new: true, session }
            //     );
            //     if (!bid) throw new Error("Bid not found/not approved yet");
            //     const assignment = await consultantClientAssignemnt.create(
            //         [{
            //             client: clientId,
            //             consultant: consultantId,
            //             //request: requestId,
            //             clientProfile: ClientProfile._id,
            //             consultantProfile: consultantProfile._id,
            //            // type,
            //             bidId: bid._id,
            //             startDate,
            //             endDate
            //         }],
            //         { session }
            //     );
            //     await session.commitTransaction();
            //     session.endSession();

            //     await emailService.sendAssignmentEmail(client, consultant);
            //     return { assignment, /*updatedRequest*/ bid };
            // }
            const assignment = await consultantClientAssignemnt.create(
                [{
                    client: clientId,
                    consultant: consultantId,
                    //request: requestId,
                    clientProfile: ClientProfile._id,
                    consultantProfile: consultantProfile._id,
                    //type,
                    // startDate,
                    // endDate
                }],
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            await emailService.sendAssignmentEmail(client, consultant);
            return { assignment, /*updatedRequest*/ };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }


    // async assignConsultant(clientId: string, consultantId: string, requestId: string, type: string) {
    //     //console.log("got here")
    //     const doubleAssignment = await consultantClientAssignemnt.findOne({ client: clientId, consultant: consultantId })
    //     if (doubleAssignment) throw new Error("client already assigned to this consultant")
    //     const consultant = await Account.findOne({ _id: consultantId,/* status: "active" */ })
    //     const client = await Account.findOne({ _id: clientId, /*subscriptionStatus: "active"*/ })
    //     if (!consultant) throw new Error("consultant not found or account not active yet")
    //     if (!client) throw new Error("client not found or subscribtion not active")
    //     const ClientProfile = await clientProfile.findOne({ account: clientId })
    //     const consultantProfile = await ConsultantProfile.findOne({ account: consultantId })
    //     if (!ClientProfile) throw new Error("client profile not found")
    //     if (!consultantProfile) throw new Error("consultant profile not found")
    //     const relatedRequest = await Requests.findById(requestId)
    //     if (!relatedRequest) throw new Error("Request not found")
    //     if (relatedRequest.approvedHrCount == relatedRequest.requiredHrCount) throw new Error("HR threshold reached")
    //     relatedRequest.approvedHrCount += 1
    //     await relatedRequest.save()

    //     //console.log(client)
    //     //return await Account.findByIdAndUpdate(accountId, { assignedConsultant: consultantId }, { new: true });
    //     const newAssignment = await (await consultantClientAssignemnt.create({ client: clientId, consultant: consultantId, clientProfile: ClientProfile._id, consultantProfile: consultantProfile._id, request: requestId })).populate("client")
    //     if (!newAssignment) throw new Error("Assignment not created")

    //     if (type == "direct") {
    //         await emailService.sendAssignmentEmail(client, consultant)
    //         return { newAssignment, relatedRequest }
    //     }

    //     const relatedBid = await Bids.findOne({ requestId: relatedRequest._id, consultantId: consultantId })
    //     if (!relatedBid) throw new Error("Bid not found, client did not bid for this request")
    //     relatedBid.status = "assigned"
    //     await relatedBid.save()
    //     await emailService.sendAssignmentEmail(client, consultant)
    //     return { newAssignment, relatedRequest, relatedBid }
    // }

    // async unassignConsultant(accountId: string) {
    //     return await Account.findByIdAndUpdate(accountId, { assignedConsultant: null }, { new: true });
    // }

    async suspendAccount(accountId: string) {
        return await Account.findByIdAndUpdate(accountId, { status: "restricted" }, { new: true });
    }

    async unSuspendAccount(accountId: string) {
        const account = await Account.findByIdAndUpdate(accountId, { status: "active" }, { new: true });
        if (!account) throw new Error("account not found")

        await emailService.sendAccountUnsuspendedEmail(account)

        return
    }


}