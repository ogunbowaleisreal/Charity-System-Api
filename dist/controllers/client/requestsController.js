"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsController = void 0;
const requestServices_1 = require("../../services/client/requestServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const requestService = new requestServices_1.RequestService();
class RequestsController {
    async listRequests(req, res, next) {
        try {
            const accountId = req.user.userId;
            const requests = await requestService.getClientsRequests(accountId);
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
            const accountId = req.user.userId;
            const request = await requestService.createRequest(accountId, req.body);
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
            (0, helpers_1.sendSuccessResponse)(res, request, "request deleted successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request deletion failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.RequestsController = RequestsController;
