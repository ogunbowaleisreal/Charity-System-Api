import consultantClientAssignemnt from "../../models/consultantClientAssignemnt";
import { Account } from "../../models/Accounts";
import Bid from "../../models/Bids";
import Requests from "../../models/Requests";
import mongoose from "mongoose";
import logger from "../../logger";
import Bids from "../../models/Bids";

export type assignmentFilter = {
    client: string;
    consultant: string;
    status: string;
    assignedAt: string;
    removedAt: string;
}

export class assignmentManagementServices {
    async assignConsultant(clientId: string, consultantId: string, requestId: string, adminId: string) {
        const assignment = await consultantClientAssignemnt.findOne({ client: clientId, consultant: consultantId })
        if (assignment) throw new Error("Client already assigned to this consultant")
        return await consultantClientAssignemnt.create({ client: clientId, consultant: consultantId, request: requestId, assignedBy: adminId })
    }

    async removeAssignment(assignmentId: string) {

        const assignment = await consultantClientAssignemnt.findById(assignmentId)
        if (!assignment) throw new Error("Assignment not found")
        assignment.status = "removed"
        await assignment.save()
        return assignment
    }

    async getClientAssignment(clientId: string, page: number = 1, limit: number = 10) {
        const client = await Account.findById(clientId)
        const skip = (page - 1) * limit
        if (!client) throw new Error("Client not found")
        if (client.role == "client") { //throw new Error("Client not found")
            const assignments = await consultantClientAssignemnt.find({ client: clientId, status: "active" }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('consultant').lean()
            const total = await consultantClientAssignemnt.countDocuments({ client: clientId, status: "active" })
            return { data: assignments, pagination: { page, limit, total, totalPages: 1, hasNext: false, hasPrevious: false } }
        }
        const assignments = await consultantClientAssignemnt.find({ consultant: clientId, status: "active" }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('client').lean()
        const total = await consultantClientAssignemnt.countDocuments({ consultant: clientId, status: "active" })
        return { data: assignments, pagination: { page, limit, total, totalPages: 1, hasNext: false, hasPrevious: false } }

    }

    async unassignConsultantClient(bidId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const bid = await Bids.findById(bidId).session(session);
            if (!bid) throw new Error("Bid not found");

            const request = await Requests.findById(bid.requestId).session(session);
            if (!request) throw new Error("Request not found");

            const clientId = request.client;
            const consultantId = bid.consultantId;
            console.log(clientId, consultantId, request)

            const assignment = await consultantClientAssignemnt.findOneAndUpdate(
                { client: clientId.toString(), consultant: consultantId.toString(), status: "active" },
                { status: "removed" },
                { new: true, session }
            );

            if (!assignment) throw new Error("Assignment not found");

            // const updatedRequest = await Requests.findOneAndUpdate(
            //     { _id: request._id, assignedHRCount: { $gt: 0 } }, // only if > 0
            //     { $inc: { assignedHRCount: -1 } },
            //     { new: true, session }
            // );

            // if (!updatedRequest) throw new Error("Assigned HR count already 0");


            // Reset bid status
            bid.status = "accepted"; // or "pending", depends on your business rules
            await bid.save({ session });

            await session.commitTransaction();
            session.endSession();

            // Notify after commit
            //  await emailService.sendUnassignmentEmail(clientId, consultantId);

            return assignment;

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }

    // async unassignConsultantClient(bidId: string) {
    //     const bid = await Bid.findById(bidId)
    //     if (!bid) throw new Error("Bid not found")
    //     const consultantId = bid.consultantId
    //     const requestId = bid.requestId
    //     const relatedRequest = await Requests.findById(requestId)
    //     if (!relatedRequest) throw new Error("Request not found")
    //     const clientId = relatedRequest.client
    //     const unassignment = await consultantClientAssignemnt.findOneAndDelete({ client: clientId, consultant: consultantId }).lean()
    //     return unassignment
    // }

}