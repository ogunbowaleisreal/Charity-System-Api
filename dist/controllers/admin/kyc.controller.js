"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCAdminController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const kyc_services_1 = require("../../services/admin/kyc.services");
const kycAdminService = new kyc_services_1.AdminKYCService();
class KYCAdminController {
    // =========================
    // 📥 GET PENDING KYC DOCUMENTS
    // =========================
    async getPendingKYC(req, res, next) {
        try {
            const response = await kycAdminService.getPendingKYC(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, response, "Pending KYC retrieved successfully");
        }
        catch (error) {
            logger_1.default.error("Get pending KYC failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =========================
    // ✅ APPROVE DOCUMENT
    // =========================
    async approveDocument(req, res, next) {
        try {
            const { userId } = req.params;
            const { type } = req.body; // "cac" | "utility"
            const adminId = req.admin?.adminId;
            const response = await kycAdminService.approveDocument(userId, adminId, type);
            return (0, helpers_1.sendSuccessResponse)(res, response, "Document approved successfully");
        }
        catch (error) {
            logger_1.default.error("Approve document failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =========================
    // ❌ REJECT DOCUMENT
    // =========================
    async rejectDocument(req, res, next) {
        try {
            const { userId } = req.params;
            const { type, reason } = req.body;
            const adminId = req.admin?.adminId;
            const response = await kycAdminService.rejectDocument(userId, adminId, type, reason);
            return (0, helpers_1.sendSuccessResponse)(res, response, "Document rejected successfully");
        }
        catch (error) {
            logger_1.default.error("Reject document failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =========================
    // 🔍 GET SINGLE KYC DETAILS (VERY USEFUL)
    // =========================
    async getKYCDetails(req, res, next) {
        try {
            const { kycId } = req.params;
            const response = await kycAdminService.getKYCDetails(kycId);
            return (0, helpers_1.sendSuccessResponse)(res, response, "KYC details retrieved successfully");
        }
        catch (error) {
            logger_1.default.error("Get KYC details failed", { error });
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.KYCAdminController = KYCAdminController;
