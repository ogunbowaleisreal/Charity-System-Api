import { Router } from "express";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { KYCAdminController } from "../../controllers/admin/kyc.controller";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const kycCtrl = new KYCAdminController();

// Apply middlewares globally
router.use(verifyAdminToken);
router.use(rateLimiter.general);

// =========================================================
// LISTING / QUEUE
// =========================================================

router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.KYC?.VIEW]),
    kycCtrl.getPendingKYCs
);

router.get(
    "/:userId",
    authorize([ADMIN_PERMISSIONS.KYC?.VIEW]),
    kycCtrl.getKYCByUserId
);

// =========================================================
// INDIVIDUAL — per-field review (NIN / face / address)
// decision ("verified" | "failed") comes in the body, so a route
// needs either APPROVE or REJECT to hit it either way.
// =========================================================

router.post(
    "/:userId/review-nin",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE, ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.reviewNIN
);

router.post(
    "/:userId/review-face",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE, ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.reviewFace
);

router.post(
    "/:userId/review-address",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE, ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.reviewAddress
);

// Optional single-button shortcuts
router.post(
    "/:userId/approve-all",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE]),
    kycCtrl.approveAllFields
);

router.post(
    "/:userId/reject-all",
    authorize([ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.rejectAllFields
);

// =========================================================
// ORGANIZATION — CAC / utility bill review
// =========================================================

router.post(
    "/:userId/review-cac",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE, ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.reviewCAC
);

router.post(
    "/:userId/review-utility",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE, ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.reviewUtility
);

export default router;
