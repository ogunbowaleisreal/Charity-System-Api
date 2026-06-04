"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidController = void 0;
const bidServices_1 = require("../../services/admin/bidServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const bidService = new bidServices_1.BidServices();
class BidController {
    // async createBid(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const clientId = req.user.userId
    //         const bid = await bidService.createBid(clientId, req.params.requestId, req.body);
    //         sendSuccessResponse(res, bid, "bid created successfully", 200)
    //     } catch (error: any) {
    //         logger.error("bid creation failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }
    async getRequestBids(req, res, next) {
        try {
            //const clientId = req.user.userId
            const requestId = req.params.request_id;
            console.log(requestId);
            const bids = await bidService.getRequestBids(requestId, req.query);
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
            const bid = await bidService.getBid(req.params.id);
            (0, helpers_1.sendSuccessResponse)(res, bid, "bid retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("bid retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    // async getAllBids(req: Request, res: Response, next: NextFunction) {
    //     try {
    //     } catch (err: any) {
    //         logger.error("bid fetch failed")
    //         next(err)
    //     }
    // }
    async approveOrDeclineConsultantBid(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const response = req.body.response;
            const request = await bidService.approveOrdeclineBid(req.params.bid_id, adminId, response);
            (0, helpers_1.sendSuccessResponse)(res, request, "request bid approved successfully, email sent", 200);
        }
        catch (error) {
            logger_1.default.error("request assignment failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async rejectConsultantBid(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const request = await bidService.rejectBid(req.params.bid_id);
            (0, helpers_1.sendSuccessResponse)(res, request, "request bid rejected successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request assignment failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getAllBids(req, res, next) {
        try {
            console.log(req.query);
            const bids = await bidService.getAllBids(req.query);
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
