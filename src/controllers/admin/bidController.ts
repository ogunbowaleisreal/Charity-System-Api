import { Request, Response, NextFunction } from "express";
import { BidServices } from "../../services/admin/bidServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AuthenticatedRequest } from "../../middleware/verifyClients";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { request } from "http";


const bidService = new BidServices()

export class BidController {
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

    async getRequestBids(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            //const clientId = req.user.userId
            const requestId = req.params.request_id
            console.log(requestId)
            const bids = await bidService.getRequestBids(requestId, req.query);
            sendSuccessResponse(res, bids, "bids retrieved successfully", 200)
        } catch (error: any) {
            logger.error("bid retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getBidById(req: Request, res: Response, next: NextFunction) {
        try {
            const bid = await bidService.getBid(req.params.id);
            sendSuccessResponse(res, bid, "bid retrieved successfully", 200)
        } catch (error: any) {
            logger.error("bid retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    // async getAllBids(req: Request, res: Response, next: NextFunction) {
    //     try {

    //     } catch (err: any) {
    //         logger.error("bid fetch failed")
    //         next(err)
    //     }
    // }

    async approveOrDeclineConsultantBid(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const response = req.body.response
            const request = await bidService.approveOrdeclineBid(req.params.bid_id, adminId as string, response);
            sendSuccessResponse(res, request, "request bid approved successfully, email sent", 200)
        } catch (error: any) {
            logger.error("request assignment failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async rejectConsultantBid(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId
            const request = await bidService.rejectBid(req.params.bid_id);
            sendSuccessResponse(res, request, "request bid rejected successfully", 200)
        } catch (error: any) {
            logger.error("request assignment failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getAllBids(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            console.log(req.query)
            const bids = await bidService.getAllBids(req.query);
            sendSuccessResponse(res, bids, "bids retrieved successfully", 200)
        } catch (err: any) {
            logger.error("bid retrieval failed", err.message)
            //sendErrorResponse(res, err.message, 400)
            next(err)
        }
    }


}