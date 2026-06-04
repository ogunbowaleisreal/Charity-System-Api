"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidController = void 0;
const bidServices_1 = require("../../services/client/bidServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const bidService = new bidServices_1.BidServices();
class BidController {
    async createBid(req, res, next) {
        try {
            const consultantId = req.user.userId;
            const bid = await bidService.createBid(consultantId, req.params.request_id, req.body);
            (0, helpers_1.sendSuccessResponse)(res, bid, "bid created successfully", 200);
        }
        catch (error) {
            logger_1.default.error("bid creation failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getRequestBids(req, res, next) {
        try {
            //const clientId = req.user.userId
            const requestId = req.params.request_id;
            const bids = await bidService.getRequestBids(requestId);
            (0, helpers_1.sendSuccessResponse)(res, bids, "bids retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("bid retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getBidById(req, res, next) {
        try {
            const bid = await bidService.getBid(req.params.bid_id);
            (0, helpers_1.sendSuccessResponse)(res, bid, "bid retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("bid retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getAllBids(req, res, next) {
        try {
            const userId = req.user.userId;
            const bids = await bidService.getAllBids(userId, req.query);
            (0, helpers_1.sendSuccessResponse)(res, bids, "bids retrieved successfully", 200);
        }
        catch (err) {
            logger_1.default.error("bid retrieval failed", err.message);
            //sendErrorResponse(res, err.message, 400)
            next(err);
        }
    }
}
exports.BidController = BidController;
