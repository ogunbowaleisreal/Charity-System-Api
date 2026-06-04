"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidServices = void 0;
const Bids_1 = __importDefault(require("../../models/Bids"));
const Accounts_1 = require("../../models/Accounts");
const Requests_1 = __importDefault(require("../../models/Requests"));
const ConsultantProfile_1 = __importDefault(require("../../models/ConsultantProfile"));
const Email_services_1 = __importDefault(require("../Email.services"));
const AdminModel_1 = __importDefault(require("../../models/AdminModel"));
const emailService = new Email_services_1.default();
class BidServices {
    getNewBidNotificationTemplate(consultant, job, bid) {
        const fullName = `${consultant.firstName} ${consultant.lastName}`;
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Bid Notification</title>
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
                            <h2 style="color:#0056b3;">New Bid Submitted</h2>

                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                <strong>${fullName}</strong> has just placed a bid on a job.
                            </p>

                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                <strong>Job Title:</strong> ${job.name || "N/A"}<br/>
                                <strong>Submitted At:</strong> ${new Date().toLocaleString()}
                            </p>

                            <p style="color:#333333; font-size:16px; line-height:1.5;">
                                Please review this bid and take the appropriate action.
                            </p>

                            <!-- CTA Button -->
                            <p style="text-align:center; margin:30px 0;">
                                <a href="https://admin.floatthr.com"
                                   style="background-color:#0056b3; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; font-weight:bold;">
                                   View Bid
                                </a>
                            </p>

                            <p style="color:#666666; font-size:14px; line-height:1.4;">
                                This is an automated notification from Floatthr.
                            </p>

                            <p style="color:#666666; font-size:14px; line-height:1.4;">
                                Regards,<br>
                                <strong>Floatthr System</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999999;">
                            <p>Admin Notification • Floatthr</p>
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
    async createBid(consultantId, requestId, bid) {
        if (bid.availabilityConfimation === false || bid.termsConfirmation === false)
            throw new Error("Availability confirmation and terms confirmation is required");
        const account = await Accounts_1.Account.findOne({ _id: consultantId, role: "consultant" });
        if (!account || account.role !== "consultant")
            throw new Error("Account not found");
        const doubleBid = await Bids_1.default.findOne({ requestId: requestId, consultantId: consultantId });
        if (doubleBid)
            throw new Error("you already bidded for this request");
        const request = await Requests_1.default.findById(requestId);
        if (!request)
            throw new Error("Request not found");
        if (request.biddingEndDate < new Date())
            throw new Error("Request bidding has ended");
        if (request.biddingStartDate > new Date())
            throw new Error("Request bidding has not started yet");
        if (request.status === "ended")
            throw new Error("Request has been completed");
        const consultantProfile = await ConsultantProfile_1.default.findOne({ account: consultantId });
        if (!consultantProfile)
            throw new Error("consultant profile not found");
        const experience = consultantProfile.experience;
        console.log(experience);
        if (experience === null)
            throw new Error("you are not approved yet");
        const newBid = (await Bids_1.default.create({ consultantId: account._id, requestId: requestId, workType: request.workType, experienceLevel: experience, ...bid })).populate("consultantId");
        const adminsEmailArray = await AdminModel_1.default.find({ status: "active" }).select("email");
        await emailService.sendBulkEmail(adminsEmailArray.map((admin) => admin.email), "New bid for request", this.getNewBidNotificationTemplate(account, request, newBid));
        return newBid;
    }
    async getRequestBids(requestId) {
        const bids = await Bids_1.default.find({ requestId }).populate("consultantId");
        return bids;
    }
    async getBid(bidId) {
        const bid = await Bids_1.default.findById(bidId);
        return bid;
    }
    async getAllBids(consultantId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        const bids = await Bids_1.default.find({ consultantId: consultantId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate({ path: "requestId", populate: [{ path: "businessCategory" }] });
        const total = await Bids_1.default.countDocuments({ consultantId: consultantId });
        const totalPages = Math.ceil(total / limit);
        return { bids, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
}
exports.BidServices = BidServices;
