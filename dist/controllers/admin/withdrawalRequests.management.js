"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalRequestsManagementController = void 0;
const withdrawal_request_management_1 = require("../../services/admin/withdrawal.request.management");
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const withdrawalRequestsService = new withdrawal_request_management_1.WithdrawalAdminService();
class WithdrawalRequestsManagementController {
    async acceptWithdrawalRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const adminId = req.admin?.adminId;
            const response = await withdrawalRequestsService.approveAndProcessWithdrawal(requestId, adminId);
            return (0, helpers_1.sendSuccessResponse)(res, response);
        }
        catch (error) {
            logger_1.default.error("Get transaction failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error.message, 400, error);
        }
    }
    async rejectWithdrawalRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const response = await withdrawalRequestsService.rejectWithdrawal(requestId, req.admin?.adminId, req.body.reason);
            return (0, helpers_1.sendSuccessResponse)(res, response);
        }
        catch (error) {
            logger_1.default.error("Get transaction failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error.message, 400, error);
        }
    }
    async getWithdrawalRequests(req, res, next) {
        try {
            const response = await withdrawalRequestsService.getWithdrawalRequests(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, response);
        }
        catch (error) {
            logger_1.default.error("Get transactions failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.WithdrawalRequestsManagementController = WithdrawalRequestsManagementController;
