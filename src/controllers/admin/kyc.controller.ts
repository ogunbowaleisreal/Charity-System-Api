import { Response, NextFunction, Request } from "express";
import { KYCService } from "../../services/kyc.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
// NOTE: adjust this import to match your actual admin auth middleware/type
import { AdminAuthenticatedRequest } from "../../types/admin.management";
const kycService = new KYCService();

export class KYCAdminController {

    /** Review queue — everyone sitting in pending_verification, oldest first */
    async getPendingKYCs(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await kycService.getPendingKYCs();
            sendSuccessResponse(res, result, "Pending KYC list fetched");
        } catch (error: any) {
            next(error);
        }
    }

    /** Single user's KYC — NIN/face/address images + statuses side by side */
    async getKYCByUserId(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const result = await kycService.getKYCByUserId(userId);
            sendSuccessResponse(res, result, "KYC fetched");
        } catch (error: any) {
            next(error);
        }
    }

    async reviewNIN(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { decision, rejectionReason } = req.body; // decision: "verified" | "failed"

            const result = await kycService.reviewNIN(userId, decision, adminId, rejectionReason);
            sendSuccessResponse(res, result, `NIN review recorded: ${decision}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async reviewFace(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { decision, rejectionReason } = req.body;

            const result = await kycService.reviewFace(userId, decision, adminId, rejectionReason);
            sendSuccessResponse(res, result, `Face review recorded: ${decision}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async reviewAddress(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { decision, rejectionReason } = req.body;

            const result = await kycService.reviewAddress(userId, decision, adminId, rejectionReason);
            sendSuccessResponse(res, result, `Address review recorded: ${decision}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    /** Optional single-button approve, in case the admin UI doesn't split into 3 */
    async approveAllFields(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;

            const result = await kycService.approveAllFields(userId, adminId);
            sendSuccessResponse(res, result, "KYC fully approved");
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    /** Optional single-button reject, e.g. fraud/duplicate-account cases */
    async rejectAllFields(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { rejectionReason } = req.body;

            const result = await kycService.rejectAllFields(userId, adminId, rejectionReason);
            sendSuccessResponse(res, result, "KYC rejected");
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    // =========================================================
    // ORGANIZATION: CAC / utility bill review
    // =========================================================

    async reviewCAC(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { decision, rejectionReason } = req.body;

            const result = await kycService.reviewCAC(userId, decision, adminId, rejectionReason);
            sendSuccessResponse(res, result, `CAC review recorded: ${decision}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async reviewUtility(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId as string;
            const { userId } = req.params;
            const { decision, rejectionReason } = req.body;

            const result = await kycService.reviewUtility(userId, decision, adminId, rejectionReason);
            sendSuccessResponse(res, result, `Utility bill review recorded: ${decision}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }
}
// import { Response, NextFunction } from "express";
// import logger from "../../logger";
// import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
// import { AdminAuthenticatedRequest } from "../../types/admin.management";
// import { AdminKYCService } from "../../services/admin/kyc.services";

// const kycAdminService = new AdminKYCService();

// export class KYCAdminController {

//     // =========================
//     // 📥 GET PENDING KYC DOCUMENTS
//     // =========================
//     async getPendingKYC(
//         req: AdminAuthenticatedRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const response = await kycAdminService.getPendingKYC(req.query);

//             return sendSuccessResponse(
//                 res,
//                 response,
//                 "Pending KYC retrieved successfully"
//             );
//         } catch (error: any) {
//             logger.error("Get pending KYC failed", { error });
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =========================
//     // ✅ APPROVE DOCUMENT
//     // =========================
//     async approveDocument(
//         req: AdminAuthenticatedRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { userId } = req.params;
//             const { type } = req.body; // "cac" | "utility"

//             const adminId = req.admin??.adminId;

//             const response = await kycAdminService.approveDocument(
//                 userId,
//                 adminId as string,
//                 type
//             );

//             return sendSuccessResponse(
//                 res,
//                 response,
//                 "Document approved successfully"
//             );
//         } catch (error: any) {
//             logger.error("Approve document failed", { error });
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =========================
//     // ❌ REJECT DOCUMENT
//     // =========================
//     async rejectDocument(
//         req: AdminAuthenticatedRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { userId } = req.params;
//             const { type, reason } = req.body;

//             const adminId = req.admin??.adminId;

//             const response = await kycAdminService.rejectDocument(
//                 userId,
//                 adminId as string,
//                 type,
//                 reason,
//             );

//             return sendSuccessResponse(
//                 res,
//                 response,
//                 "Document rejected successfully"
//             );
//         } catch (error: any) {
//             logger.error("Reject document failed", { error });
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =========================
//     // 🔍 GET SINGLE KYC DETAILS (VERY USEFUL)
//     // =========================
//     async getKYCDetails(
//         req: AdminAuthenticatedRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { kycId } = req.params;

//             const response = await kycAdminService.getKYCDetails(kycId);

//             return sendSuccessResponse(
//                 res,
//                 response,
//                 "KYC details retrieved successfully"
//             );
//         } catch (error: any) {
//             logger.error("Get KYC details failed", { error });
//             return sendErrorResponse(res, error);
//         }
//     }
// }