import { Request, Response, NextFunction } from "express";
import { BidServices } from "../../services/client/bidServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedRequest } from "../../middleware/verifyClients";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { error } from "console";


const bidService = new BidServices()

export class BidController {
    async createBid(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const consultantId = req.user.userId
            const bid = await bidService.createBid(consultantId, req.params.request_id, req.body);
            sendSuccessResponse(res, bid, "bid created successfully", 200)
        } catch (error: any) {
            logger.error("bid creation failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getRequestBids(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            //const clientId = req.user.userId
            const requestId = req.params.request_id
            const bids = await bidService.getRequestBids(requestId);
            sendSuccessResponse(res, bids, "bids retrieved successfully", 200)
        } catch (error: any) {
            logger.error("bid retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getBidById(req: Request, res: Response, next: NextFunction) {
        try {
            const bid = await bidService.getBid(req.params.bid_id);
            sendSuccessResponse(res, bid, "bid retrieved successfully", 200)
        } catch (error: any) {
            logger.error("bid retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getAllBids(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId
            const bids = await bidService.getAllBids(userId, req.query);
            sendSuccessResponse(res, bids, "bids retrieved successfully", 200)
        } catch (err: any) {
            logger.error("bid retrieval failed", err.message)
            //sendErrorResponse(res, err.message, 400)
            next(err)
        }
    }


}