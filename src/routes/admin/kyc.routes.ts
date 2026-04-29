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

// Routes

// Submit BVN
router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.KYC?.VIEW]),
    kycCtrl.getPendingKYC
);

router.post(
    "/:userId",
    authorize([ADMIN_PERMISSIONS.KYC?.APPROVE]),
    kycCtrl.approveDocument
);

router.put(
    "/:userId",
    authorize([ADMIN_PERMISSIONS.KYC?.REJECT]),
    kycCtrl.rejectDocument
);

export default router;