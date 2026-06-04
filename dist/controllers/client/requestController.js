"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRequestController = void 0;
const requestServices_1 = require("../../services/client/requestServices");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
const requestService = new requestServices_1.RequestService();
class clientRequestController {
    async getRequestById(req, res, next) {
        try {
            const role = req.user.role;
            if (role !== "consultant") {
                throw new Error("unauthorized, you are not a consultant");
            }
            const request = await requestService.getRequest(req.params.id);
            (0, helpers_1.sendSuccessResponse)(res, request, "request retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
    async listRequests(req, res, next) {
        try {
            const role = req.user.role;
            const accountId = req.user.userId;
            if (role !== "consultant") {
                throw new Error("unauthorized, you are not a consultant");
            }
            const requests = await requestService.getAllRequests(req.query, accountId);
            (0, helpers_1.sendSuccessResponse)(res, requests, "requests retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error("request retrieval failed", error.message);
            //sendErrorResponse(res, error.message, 400)
            next(error);
        }
    }
}
exports.clientRequestController = clientRequestController;
