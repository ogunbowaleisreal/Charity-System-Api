import { Response, NextFunction } from "express";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { AdminKYCService } from "../../services/admin/kyc.services";

const kycAdminService = new AdminKYCService();

export class KYCAdminController {

    // =========================
    // 📥 GET PENDING KYC DOCUMENTS
    // =========================
    async getPendingKYC(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const response = await kycAdminService.getPendingKYC(req.query);

            return sendSuccessResponse(
                res,
                response,
                "Pending KYC retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Get pending KYC failed", { error });
            return sendErrorResponse(res, error);
        }
    }

    // =========================
    // ✅ APPROVE DOCUMENT
    // =========================
    async approveDocument(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = req.params;
            const { type } = req.body; // "cac" | "utility"

            const adminId = req.admin?.adminId;

            const response = await kycAdminService.approveDocument(
                userId,
                adminId as string,
                type
            );

            return sendSuccessResponse(
                res,
                response,
                "Document approved successfully"
            );
        } catch (error: any) {
            logger.error("Approve document failed", { error });
            return sendErrorResponse(res, error);
        }
    }

    // =========================
    // ❌ REJECT DOCUMENT
    // =========================
    async rejectDocument(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { userId } = req.params;
            const { type, reason } = req.body;

            const adminId = req.admin?.adminId;

            const response = await kycAdminService.rejectDocument(
                userId,
                adminId as string,
                type,
                reason,
            );

            return sendSuccessResponse(
                res,
                response,
                "Document rejected successfully"
            );
        } catch (error: any) {
            logger.error("Reject document failed", { error });
            return sendErrorResponse(res, error);
        }
    }

    // =========================
    // 🔍 GET SINGLE KYC DETAILS (VERY USEFUL)
    // =========================
    async getKYCDetails(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { kycId } = req.params;

            const response = await kycAdminService.getKYCDetails(kycId);

            return sendSuccessResponse(
                res,
                response,
                "KYC details retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Get KYC details failed", { error });
            return sendErrorResponse(res, error);
        }
    }
}