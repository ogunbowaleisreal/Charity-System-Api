"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentManagementServices = void 0;
const consultantClientAssignemnt_1 = __importDefault(require("../../models/consultantClientAssignemnt"));
const Accounts_1 = require("../../models/Accounts");
const Requests_1 = __importDefault(require("../../models/Requests"));
const mongoose_1 = __importDefault(require("mongoose"));
const Bids_1 = __importDefault(require("../../models/Bids"));
class assignmentManagementServices {
    async assignConsultant(clientId, consultantId, requestId, adminId) {
        const assignment = await consultantClientAssignemnt_1.default.findOne({ client: clientId, consultant: consultantId });
        if (assignment)
            throw new Error("Client already assigned to this consultant");
        return await consultantClientAssignemnt_1.default.create({ client: clientId, consultant: consultantId, request: requestId, assignedBy: adminId });
    }
    async removeAssignment(assignmentId) {
        const assignment = await consultantClientAssignemnt_1.default.findById(assignmentId);
        if (!assignment)
            throw new Error("Assignment not found");
        assignment.status = "removed";
        await assignment.save();
        return assignment;
    }
    async getClientAssignment(clientId, page = 1, limit = 10) {
        const client = await Accounts_1.Account.findById(clientId);
        const skip = (page - 1) * limit;
        if (!client)
            throw new Error("Client not found");
        if (client.role == "client") { //throw new Error("Client not found")
            const assignments = await consultantClientAssignemnt_1.default.find({ client: clientId, status: "active" }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('consultant').lean();
            const total = await consultantClientAssignemnt_1.default.countDocuments({ client: clientId, status: "active" });
            return { data: assignments, pagination: { page, limit, total, totalPages: 1, hasNext: false, hasPrevious: false } };
        }
        const assignments = await consultantClientAssignemnt_1.default.find({ consultant: clientId, status: "active" }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('client').lean();
        const total = await consultantClientAssignemnt_1.default.countDocuments({ consultant: clientId, status: "active" });
        return { data: assignments, pagination: { page, limit, total, totalPages: 1, hasNext: false, hasPrevious: false } };
    }
    async unassignConsultantClient(bidId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const bid = await Bids_1.default.findById(bidId).session(session);
            if (!bid)
                throw new Error("Bid not found");
            const request = await Requests_1.default.findById(bid.requestId).session(session);
            if (!request)
                throw new Error("Request not found");
            const clientId = request.client;
            const consultantId = bid.consultantId;
            console.log(clientId, consultantId, request);
            const assignment = await consultantClientAssignemnt_1.default.findOneAndUpdate({ client: clientId.toString(), consultant: consultantId.toString(), status: "active" }, { status: "removed" }, { new: true, session });
            if (!assignment)
                throw new Error("Assignment not found");
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
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
}
exports.assignmentManagementServices = assignmentManagementServices;
