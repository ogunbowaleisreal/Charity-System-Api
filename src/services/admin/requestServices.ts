import Requests from "../../models/Requests";
import { Account } from "../../models/Accounts";
import EmailService from "../Email.services";
import { HTTP_STATUS } from "../../utils/constants";
import Bids from "../../models/Bids";
import { Schema } from "mongoose";
//import { logger } from "../../logger";
import { BusinessCategory } from "../../models/BusinessCategory";
import { HydratedDocument, Types } from "mongoose";
import { IRequest } from "../../models/Requests";
import ConsultantProfile from "../../models/ConsultantProfile";
import Notification from "../../models/Notification";
import { NotificationService } from "./notificationService";

// export interface RequestData {
//     // client: string;
//     amount: number;
//     name: string;
//     email: string;
//     message: string;
// }
const emailService = new EmailService()

export type requestFilter = {
    page?: number;
    limit?: number;
    status?: string;
    client?: string;
    //role: string;
    experienceLevel?: string;
}

type WorkType = "Physical" | "Remote" | "Hybrid";

const workTypes: WorkType[] = ["Physical", "Hybrid"];

export interface RequestData {
    // client: string;
    amount: number;
    name: string;
    //email: string;
    message: string;
    experienceLevel: "Intern" | "Junior" | "Intermediate" | "Senior" | "Executive";
    status: "pending" | "ongoing" | "ended";
    //businessCategory: string;
    companyIndustry: string;
    businessCategory: Schema.Types.ObjectId;
    //requiredHrCount: number;
    workType: WorkType | WorkType[];
    biddingStartDate: Date;
    biddingEndDate: Date;
    filterByExperience: Boolean;
    filterByWorkType: Boolean;
}


export class RequestService {

    // private getNewRequestNotificationTemplate(request: HydratedDocument<IRequest>) {
    //     return `<p>There is a new request for ${request.workType} work.</p>`
    // }

    private getNewRequestNotificationTemplate(
        job: any
    ): string {
        // const fullName = `${consultant.firstName} ${consultant.lastName}`;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Job Alert</title>
</head>
<body style="font-family: Arial, sans-serif; margin:0; padding:0; background-color:#f4f6f8;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <h1 style="color:#0056b3;">Floatthr</h1>
            </td>
        </tr>
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="color:#0056b3;">New Job Opportunity</h2>
                            
                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                A new job has just been posted on Floatthr that might match your expertise.
                            </p>

                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                <strong>Job Title:</strong> ${job.name || "N/A"}<br/>
                                <strong>Posted At:</strong> ${new Date().toLocaleString()}
                            </p>

                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                Don’t miss out—review the details and submit your bid while it’s still open.
                            </p>

                            <!-- CTA Button -->
                            <p style="text-align:center; margin:30px 0;">
                                <a href="https://app.floatthr.com/jobs"
                                   style="background-color:#0056b3; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; font-weight:bold;">
                                   View Job & Apply
                                </a>
                            </p>

                            <p style="color:#666666; font-size:14px; line-height:1.4;">
                                Stay active to increase your chances of getting selected.
                            </p>

                            <p style="color:#666666; font-size:14px; line-height:1.4;">
                                Regards,<br>
                                <strong>Floatthr Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999999;">
                            <p>Consultant Notification • Floatthr</p>
                            <p>© 2026 Floatthr. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
    }
    async createRequest(accountId: string, data: RequestData) {

        function ensureArray<T>(input: T | T[]): T[] {
            if (Array.isArray(input)) return input; // already an array, leave it
            return [input]; // wrap single item in array
        }
        const businessCategory = await BusinessCategory.findById(data.businessCategory);
        if (!businessCategory) throw new Error("Business Category not found");

        // -----------------------
        // Automatically set status based on biddingStartDate
        // -----------------------
        const now = new Date();
        let statusToUse = data.status; // use provided status by default

        if (new Date(data.biddingStartDate) <= now) {
            statusToUse = "ongoing"; // start date is in past or today
        }

        console.log(statusToUse)

        const request = await Requests.create({
            admin: accountId,
            ...data,
            status: statusToUse // override status if condition met
        });

        const populatedRequest = await Requests.findById(request._id)
            .select("-__v -admin -updatedAt") // hide fields you don't want
            .populate("businessCategory");

        const users = await Account.find().select("_id");


        await Notification.create({
            title: "New Job Posted",
            message: `A new job "${request.name}" has been posted.`,
            type: "JOB_CREATED",
            recipients: users.map((u) => u._id),
        });
        let consultantArray: {
            email: string;
            firstName: string;
            lastName: string;
        }[] = []

        if (data.filterByExperience == true && data.filterByWorkType == true) {
            console.log(data.filterByExperience, data.filterByWorkType)
            const filterExperience = ensureArray(data.experienceLevel);
            const filterTypes = ensureArray(data.workType);
            consultantArray = await ConsultantProfile.find({ status: "active", experienceLevel: { $in: filterExperience }, workType: { $in: filterTypes } }).select("email firstName lastName");

            await emailService.sendBulkEmail(consultantArray.map((admin) => admin.email), "New request", this.getNewRequestNotificationTemplate(request));

            return populatedRequest;
        }

        //const adminsEmailArray = await Account.find({ role: "admin", status: "active" }).select("email");
        if (data.filterByWorkType == true) {
            const filterTypes = ensureArray(data.workType);
            console.log(filterTypes)
            consultantArray = await ConsultantProfile.find({ status: "active", workType: { $in: filterTypes } }).select("email firstName lastName");
            await emailService.sendBulkEmail(consultantArray.map((admin) => admin.email), "New request", this.getNewRequestNotificationTemplate(request));

            return populatedRequest;
        }

        if (data.filterByExperience == true) {
            console.log(`${data.experienceLevel}`)
            const filterExperience = ensureArray(data.experienceLevel);
            consultantArray = await ConsultantProfile.find({ status: "active", experienceLevel: { $in: filterExperience } }).select("email firstName lastName");
            await emailService.sendBulkEmail(consultantArray.map((admin) => admin.email), "New request", this.getNewRequestNotificationTemplate(request));

            return populatedRequest;
        }

        await NotificationService.sendToTopic("Requests", "New request", `A new request "${request.name}" has been posted. Click here to view details.`);

        // console.log("got here ")
        // await Promise.all(
        //     consultantArray.map((consultant) => {
        //         const template = this.getNewRequestNotificationTemplate(
        //             consultant.firstName,
        //             consultant.lastName,
        //             request
        //         );

        //         return emailService.sendEmail(
        //             consultant.email,
        //             "New request",
        //             template
        //         );
        //     })
        // );
        consultantArray = await ConsultantProfile.find({ status: "active" }).select("email firstName lastName");
        await emailService.sendBulkEmail(consultantArray.map((admin) => admin.email), "New request", this.getNewRequestNotificationTemplate(request));

        return populatedRequest;
    }


    async getClientsRequests(accountId: string) {
        const requests = await Requests.find({ client: accountId }).populate("businessCategory client");
        return requests;
    }

    async getAllRequests(filter: requestFilter = {}) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;

        const { page: _p, limit: _l, ...queryObj } = filter;

        const skip = (page - 1) * limit;

        let query = Requests.find(queryObj)
            .select("-client")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate("businessCategory");

        const [requests, total]: [HydratedDocument<IRequest>[], number] = await Promise.all([
            query.exec(),
            Requests.countDocuments(queryObj)
        ]);

        // 🔹 STEP 1: Extract request IDs
        const requestIds = requests.map(r => r._id);

        // 🔹 STEP 2: Aggregate pending bids
        const pendingBidsCounts = await Bids.aggregate([
            {
                $match: {
                    requestId: { $in: requestIds },
                    status: "pending"
                }
            },
            {
                $group: {
                    _id: "$requestId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 🔹 STEP 3: Convert to lookup map
        const pendingMap = pendingBidsCounts.reduce((acc, item) => {
            acc[item._id.toString()] = item.count;
            return acc;
        }, {} as Record<string, number>);

        // 🔹 STEP 4: Attach count to each request
        const requestsWithPendingCount = requests.map(req => {
            const obj = req.toObject();
            return {
                ...obj,
                pendingBidsCount: pendingMap[req._id.toString()] || 0
            };
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: requestsWithPendingCount,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }


    // async getAllRequests(filter: requestFilter = {}) {
    //     const page = Number(filter.page) || 1;
    //     const limit = Number(filter.limit) || 10;

    //     // Remove pagination from the main query object
    //     const { page: _p, limit: _l, ...queryObj } = filter;

    //     const skip = (page - 1) * limit;

    //     // Build the base query
    //     let query = Requests.find(queryObj)
    //         .select("-client")
    //         .sort({ createdAt: -1, _id: -1 })
    //         .skip(skip)
    //         .limit(limit)
    //         .populate("businessCategory");

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
    //             hasPrevious: page > 1,
    //         },
    //     };
    // }

    async getRequest(requestId: string) {
        const request = await Requests.findById(requestId);
        if (!request) throw new Error("Request not found");
        return request;
    }

    async deleteRequest(requestId: string) {
        const request = await Requests.findByIdAndDelete(requestId);
        if (!request) throw new Error("Request not found");
        return request;
    }

    async updateRequest(requestId: string, data: RequestData) {
        const request = await Requests.findById(requestId);
        if (!request) throw new Error("Request not found");

        const now = new Date();
        let updatedStatus = request.status;

        if (data.biddingStartDate || data.biddingEndDate) {
            const newStartDate = data.biddingStartDate
                ? new Date(data.biddingStartDate)
                : request.biddingStartDate;

            const newEndDate = data.biddingEndDate
                ? new Date(data.biddingEndDate)
                : request.biddingEndDate;

            if (newStartDate <= now && newEndDate >= now) {
                updatedStatus = "ongoing";
            } else if (newStartDate > now) {
                updatedStatus = "pending";
            }
        }

        const updatedRequest = await Requests.findByIdAndUpdate(
            requestId,
            { ...data, status: updatedStatus },
            { new: true }
        );

        return updatedRequest;
    }

    // async updateRequest(requestId: string, data: RequestData) {
    //     // 1️⃣ Fetch the current request first
    //     const request = await Requests.findById(requestId);
    //     if (!request) throw new Error("Request not found");

    //     // 2️⃣ Check if biddingStartDate or biddingEndDate was updated
    //     const now = new Date();
    //     let updatedStatus = /*data.status ?? */request.status; // default to existing or provided status

    //     // If biddingStartDate or biddingEndDate is updated
    //     if (data.biddingStartDate || data.biddingEndDate) {
    //         const newStartDate = data.biddingStartDate //?? request.biddingStartDate;
    //         const newEndDate = data.biddingEndDate //?? request.biddingEndDate;

    //         // If the new start/end is in the past or ongoing period, set status to "ongoing"
    //         if (newStartDate <= now && newEndDate >= now) {
    //             updatedStatus = "ongoing";
    //         }
    //         // Optionally, if start date is in the future, you might want "pending"
    //         else if (newStartDate > now) {
    //             updatedStatus = "pending";
    //         }
    //     }

    //     // 3️⃣ Apply updates, overriding status if needed
    //     const updatedRequest = await Requests.findByIdAndUpdate(
    //         requestId,
    //         { ...data, status: updatedStatus },
    //         { new: true }
    //     );

    //     return updatedRequest;
    // }


    // async updateRequest(requestId: string, data: RequestData) {
    //     const request = await Requests.findByIdAndUpdate(requestId, data, { new: true });
    //     if (!request) throw new Error("Request not found");
    //     return request;
    // }

    // async assignConsultant(adminId: string, consultantId: string, bidId: string) {
    //     const consultant = await Account.findById(consultantId);
    //     const bid = await Bids.findById(bidId);
    //     if (!consultant || consultant.role !== "consultant") throw new Error("consultant Account not found");
    //     if (!bid) throw new Error("Bid not found");

    //     if (consultant.status !== "active") throw new Error("consultant Account is not active");
    //     const request = await Requests.findById(bid.requestId)
    //     if (!request) throw new Error("Request not found");//{ consultant: consultantId, status: "accepted" }, { new: true });
    //     if (request?.assignedHR) {
    //         throw {
    //             message: "consultant already assigned to this request",
    //             statusCode: HTTP_STATUS.CONFLICT
    //         }
    //     }
    //     if (request?.biddingEndDate < new Date()) throw new Error("Request bidding has ended");
    //     request.assignedHR = consultantId as any;
    //     request.status = "accepted";
    //     await request.save();

    //     bid.status = "accepted"
    //     bid.approvedBy = adminId as Schema.Types.ObjectId


    //     await emailService.sendAssignmentEmail(consultant.email, "Request assigned", "You have been assigned a request. Please login to your dashboard to accept or decline the request.");
    //     return request;
    // }

}