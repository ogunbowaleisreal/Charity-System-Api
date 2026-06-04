"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const Requests_1 = __importDefault(require("../../models/Requests"));
const Email_services_1 = __importDefault(require("../Email.services"));
//import { logger } from "../../logger";
const BusinessCategory_1 = require("../../models/BusinessCategory");
// export interface RequestData {
//     // client: string;
//     amount: number;
//     name: string;
//     email: string;
//     message: string;
// }
const emailService = new Email_services_1.default();
class RequestService {
    async createRequest(accountId, data) {
        const businessCategory = await BusinessCategory_1.BusinessCategory.findById(data.businessCategory);
        if (!businessCategory)
            throw new Error("Business Category not found");
        // -----------------------
        // Automatically set status based on biddingStartDate
        // -----------------------
        const now = new Date();
        let statusToUse = data.status; // use provided status by default
        if (data.biddingStartDate <= now) {
            statusToUse = "ongoing"; // start date is in past or today
        }
        const request = await Requests_1.default.create({
            admin: accountId,
            ...data,
            status: statusToUse // override status if condition met
        });
        const populatedRequest = await Requests_1.default.findById(request._id)
            .select("-__v -admin -updatedAt") // hide fields you don't want
            .populate("businessCategory");
        return populatedRequest;
    }
    async getClientsRequests(accountId) {
        const requests = await Requests_1.default.find({ client: accountId }).populate("businessCategory client");
        return requests;
    }
    async getAllRequests(filter = {}) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        // Remove pagination from the main query object
        const { page: _p, limit: _l, ...queryObj } = filter;
        const skip = (page - 1) * limit;
        // Build the base query
        let query = Requests_1.default.find(queryObj)
            .select("-client")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate("businessCategory");
        // Run query + count in parallel
        const [requests, total] = await Promise.all([
            query.exec(),
            Requests_1.default.countDocuments(queryObj)
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
                hasPrevious: page > 1,
            },
        };
    }
    async getRequest(requestId) {
        const request = await Requests_1.default.findById(requestId);
        if (!request)
            throw new Error("Request not found");
        return request;
    }
    async deleteRequest(requestId) {
        const request = await Requests_1.default.findByIdAndDelete(requestId);
        if (!request)
            throw new Error("Request not found");
        return request;
    }
    async updateRequest(requestId, data) {
        // 1️⃣ Fetch the current request first
        const request = await Requests_1.default.findById(requestId);
        if (!request)
            throw new Error("Request not found");
        // 2️⃣ Check if biddingStartDate or biddingEndDate was updated
        const now = new Date();
        let updatedStatus = data.status ?? request.status; // default to existing or provided status
        // If biddingStartDate or biddingEndDate is updated
        if (data.biddingStartDate || data.biddingEndDate) {
            const newStartDate = data.biddingStartDate ?? request.biddingStartDate;
            const newEndDate = data.biddingEndDate ?? request.biddingEndDate;
            // If the new start/end is in the past or ongoing period, set status to "ongoing"
            if (newStartDate <= now && newEndDate >= now) {
                updatedStatus = "ongoing";
            }
            // Optionally, if start date is in the future, you might want "pending"
            else if (newStartDate > now) {
                updatedStatus = "pending";
            }
        }
        // 3️⃣ Apply updates, overriding status if needed
        const updatedRequest = await Requests_1.default.findByIdAndUpdate(requestId, { ...data, status: updatedStatus }, { new: true });
        return updatedRequest;
    }
}
exports.RequestService = RequestService;
