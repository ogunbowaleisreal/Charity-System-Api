import Bids from "../../models/Bids";
import { HTTP_STATUS } from "../../utils/constants";
import { Account } from "../../models/Accounts";
import EmailService from "../Email.services";
import Requests from "../../models/Requests";
import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
import { Interface } from "readline/promises";
const emailService = new EmailService();

export type bidFilter = {
    page?: string,
    limit?: string,
    experienceLevel?: "Intern" | "Junior" | "Intermediate" | "Senior" | "Executive",
    workType?: "Physical" | "Remote" | "Hybrid"
    requestId?: string
}
export class BidServices {
    async getRequestBids(requestId: string, filter: bidFilter) {

        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;

        // Remove pagination from the main query object
        const { page: _p, limit: _l, ...queryObj } = filter;

        const skip = (page - 1) * limit;

        // Build the base query
        let query = Bids.find({ requestId, ...queryObj })
            .skip(skip)
            .limit(limit)
            .populate("consultantId");

        // Run query + count in parallel
        const [bids, total] = await Promise.all([
            query.exec(),
            Bids.countDocuments({ requestId, ...queryObj })
        ]);
        const totalPages = Math.ceil(total / limit);
        // const bids = await Bids.find({ requestId, ...filter });
        // return bids;
        return {
            data: bids,
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

    async getBid(bidId: string) {
        const bid = await Bids.findById(bidId).populate("consultantId");
        return bid;
    }

    // async approveOrdeclineBid(bidId: string, adminId: string, status: "approved" | "declined") {
    //     const bid = await Bids.findById(bidId);

    //     if (!bid) throw new Error("Bid not found");

    //     const consultant = await Account.findById(bid.consultantId);
    //     if (!consultant || consultant.role !== "consultant") throw new Error("consultant Account not found/ account not a consultant");
    //     if (consultant.status !== "active") throw new Error("consultant Account is not active");
    //     const request = await Requests.findById(bid.requestId);
    //     if (!request) throw new Error("Request not found");
    //     // if (request.biddingEndDate < new Date()) throw new Error("Request bidding has ended");
    //     //request.status = "accepted";
    //     if (status === "approved") {
    //         if (request.approvedHrCount >= request.requiredHrCount) throw new Error("Requested Hr threshold reached")
    //         request.approvedHrCount = request.approvedHrCount + 1
    //         request.status = "partially completed"
    //         if (request.approvedHrCount === request.requiredHrCount) {
    //             request.status = "completed"
    //         }
    //         await request.save();
    //         bid.approvedBy = adminId
    //         bid.status = "accepted"
    //         await bid.save();
    //         // const newAssignment = await consultantClientAssignemnt.create({ client: request.client, consultant: consultant._id, assignedBy: adminId })
    //         // if (!newAssignment) throw new Error("Assignment not created")
    //         //await bid.updateOne({ status: "accepted", });
    //         //bid.
    //         await emailService.sendBidApprovalOrDenialEmail(consultant, bid, consultant.email, "approved")// "Request assigned", "You have been assigned a request. Please login to your dashboard to accept or decline the request.");
    //         return bid;
    //     }
    //     else {
    //         //await bid.updateOne({ status: "declined", });
    //         if (bid.status === "accepted") {
    //             if (request.approvedHrCount > 0) {
    //                 request.approvedHrCount -= 1;

    //                 if (request.approvedHrCount === 0) {
    //                     request.status = "pending";
    //                 } else {
    //                     request.status = "partially completed";
    //                 }

    //                 await request.save();
    //             }
    //         }

    //         bid.declinedBy = adminId
    //         bid.status = "declined";
    //         await bid.save();
    //         await emailService.sendBidApprovalOrDenialEmail(consultant, bid, consultant.email, "declined")// "Request assigned", "You have been assigned a request. Please login to your dashboard to accept or decline the request.");
    //         return bid;
    //     }


    // }

    async approveOrdeclineBid(
        bidId: string,
        adminId: string,
        status: "approved" | "declined"
    ) {
        const bid = await Bids.findById(bidId);
        if (!bid) throw new Error("Bid not found");

        // Prevent double actions
        if (bid.status === "accepted" && status === "approved") {
            throw new Error("Bid already approved");
        }

        if (bid.status === "declined" && status === "declined") {
            throw new Error("Bid already declined");
        }

        const consultant = await Account.findById(bid.consultantId);
        if (!consultant || consultant.role !== "consultant") {
            throw new Error("Consultant account not found / not a consultant");
        }

        if (consultant.status !== "active") {
            throw new Error("Consultant account is not active");
        }

        const request = await Requests.findById(bid.requestId);

        if (!request) throw new Error("Request not found");
        if (request.status === "ended") {
            throw new Error("Bidding for this request has ended");
        }

        // Helper to keep request status consistent
        // const updateRequestStatus = () => {
        //     if (request.approvedHrCount === 0) {
        //         request.status = "pending";
        //     } else if (request.approvedHrCount < request.requiredHrCount) {
        //         request.status = "partially completed";
        //     } else {
        //         request.status = "completed";
        //     }
        // };

        if (status === "approved") {
            // if (request.approvedHrCount >= request.requiredHrCount) {
            //     throw new Error("Requested Hr threshold reached");
            // }

            // request.approvedHrCount += 1;
            // updateRequestStatus();
            // await request.save();

            bid.status = "accepted";
            bid.approvedBy = adminId;
            await bid.save();

            await emailService.sendBidApprovalOrDenialEmail(
                consultant,
                bid,
                consultant.email,
                "approved"
            );

            return bid;
        }

        // ===== DECLINE FLOW =====

        // Only rollback hours if this bid was previously accepted
        if (bid.status === "accepted" /*&& request.approvedHrCount > 0*/) {
            // request.approvedHrCount -= 1;
            // //updateRequestStatus();
            // await request.save();

            bid.status = "declined";
            bid.declinedBy = adminId;
            await bid.save();
        }



        await emailService.sendBidApprovalOrDenialEmail(
            consultant,
            bid,
            consultant.email,
            "declined"
        );

        return bid;
    }


    // async declineBid(bidId: string) {
    //     const bid = await Bids.findById(bidId);
    //     if (!bid) throw new Error("Bid not found");
    //     const request = await Requests.findById(bid.requestId)
    //     if (!request) throw new Error("Request not found");
    //     if (request.biddingEndDate < new Date()) throw new Error("Request bidding has ended");
    //     //request.status = "declined";
    //     //await request.save();
    //     bid.status = "declined";
    //     await bid.save();
    //     return bid;
    // }

    async rejectBid(bidId: string) {
        const bid = await Bids.findById(bidId);
        if (!bid) throw new Error("Bid not found");
        const request = await Requests.findById(bid.requestId)
        if (!request) throw new Error("Request not found");
        //if (request.biddingEndDate < new Date()) throw new Error("Request bidding has ended");
        //request.status = "rejected";
        //await request.save(); 
        bid.status = "declined";
        await bid.save();
        return bid;
    }

    async getAllBids(filter: bidFilter = {}) {
        // const page = Number(filter.page) || 1;
        // const limit = Number(filter.limit) || 10;
        const { page, limit, ...queryObj } = filter
        const intPage = Number(page) || 1
        const intLimit = Number(limit)
        const skip = (intPage - 1) * intLimit;
        console.log(filter)
        const bids = await Bids.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(intLimit)
            .populate("consultantId").populate({ path: "requestId" /*, populate: { path: "client" } */ });
        const total = await Bids.countDocuments({});
        const totalPages = Math.ceil(total / intLimit);
        return { data: bids, pagination: { page, limit, total, totalPages, hasNext: false, hasPrevious: false } };//bids;
    }


}