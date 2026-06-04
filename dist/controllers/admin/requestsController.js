"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsController = void 0;
const requestServices_1 = require("../../services/admin/requestServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const bidServices_1 = require("../../services/admin/bidServices");
const requestService = new requestServices_1.RequestService();
const bidService = new bidServices_1.BidServices();
class RequestsController {
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
    async getAllRequests(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            const requests = await requestService.getAllRequests(req.query);
            (0, helpers_1.sendSuccessResponse)(res, requests, "requests retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async createRequest(req, res, next) {
        try {
            const accountId = req.admin?.adminId;
            // const client = req.params.client_id
            const request = await requestService.createRequest(accountId, /* client*/ req.body);
            (0, helpers_1.sendSuccessResponse)(res, request, "request created successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request creation failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async getRequestById(req, res, next) {
        try {
            const request = await requestService.getRequest(req.params.id);
            (0, helpers_1.sendSuccessResponse)(res, request, "request retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async deleteRequest(req, res, next) {
        try {
            const request = await requestService.deleteRequest(req.params.id);
            (0, helpers_1.sendSuccessResponse)(res, null, "request deleted successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request deletion failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
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
    async updateRequest(req, res, next) {
        try {
            const request = await requestService.updateRequest(req.params.id, req.body);
            (0, helpers_1.sendSuccessResponse)(res, request, "request updated successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request update failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.RequestsController = RequestsController;
