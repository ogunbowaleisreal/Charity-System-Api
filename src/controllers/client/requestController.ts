import { Request, Response, NextFunction } from "express";
import { RequestService } from "../../services/client/requestServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const requestService = new RequestService()

export class clientRequestController {
    async getRequestById(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const role = req.user.role
            if (role !== "consultant") {
                throw new Error("unauthorized, you are not a consultant")
            }
            const request = await requestService.getRequest(req.params.id);
            sendSuccessResponse(res, request, "request retrieved successfully", 200)
        } catch (error: any) {
            logger.error("request retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }

    async listRequests(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const role = req.user.role
            const accountId = req.user.userId
            if (role !== "consultant") {
                throw new Error("unauthorized, you are not a consultant")
            }
            const requests = await requestService.getAllRequests(req.query, accountId);
            sendSuccessResponse(res, requests, "requests retrieved successfully", 200)
        } catch (error: any) {
            logger.error("request retrieval failed", error.message)
            //sendErrorResponse(res, error.message, 400)
            next(error)
        }
    }
}