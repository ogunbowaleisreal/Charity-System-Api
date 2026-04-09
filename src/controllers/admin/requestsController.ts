import { Request, Response, NextFunction } from "express";
import { RequestService } from "../../services/admin/requestServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
////import { AuthenticatedRequest } from "../../middleware/verifyClients";
//import { AuthenticatedClientRequest } from "../../middleware/auth";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { BidServices } from "../../services/admin/bidServices";


const requestService = new RequestService()
const bidService = new BidServices()

export class RequestsController {
    // async listRequests(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const accountId = req.admin?.adminId as string
    //         const requests = await requestService.getClientsRequests(accountId);
    //         sendSuccessResponse(res, requests, "requests retrieved successfully", 200)
    //     } catch (error: any) {
    //         logger.error("request retrieval failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }

    async getAllRequests(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId as string
            const requests = await requestService.getAllRequests(req.query);
            sendSuccessResponse(res, requests, "requests retrieved successfully", 200)
        } catch (error: any) {
            logger.error("request retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async createRequest(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.admin?.adminId as string
            // const client = req.params.client_id
            const request = await requestService.createRequest(accountId,/* client*/ req.body);
            sendSuccessResponse(res, request, "request created successfully", 200)
        } catch (error: any) {
            logger.error("request creation failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async getRequestById(req: Request, res: Response, next: NextFunction) {
        try {
            const request = await requestService.getRequest(req.params.id);
            sendSuccessResponse(res, request, "request retrieved successfully", 200)
        } catch (error: any) {
            logger.error("request retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async deleteRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const request = await requestService.deleteRequest(req.params.id);
            sendSuccessResponse(res, null, "request deleted successfully", 200)
        } catch (error: any) {
            logger.error("request deletion failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    // async getAllRequests(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const requests = await requestService.getAllRequests();
    //         sendSuccessResponse(res, requests, "requests retrieved successfully", 200)
    //     } catch (error: any) {
    //         logger.error("request retrieval failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }

    async updateRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const request = await requestService.updateRequest(req.params.id, req.body);
            sendSuccessResponse(res, request, "request updated successfully", 200)
        } catch (error: any) {
            logger.error("request update failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    // async assignConsultant(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
    //     try {
    //         const adminId = req.admin?.adminId
    //         const request = await bidService.approveBid(req.params.id, adminId as string);
    //         sendSuccessResponse(res, request, "request assigned successfully", 200)
    //     } catch (error: any) {
    //         logger.error("request assignment failed", error.message)
    //         //sendErrorResponse(res, error.message, 400)
    //         next(error)
    //     }
    // }
}