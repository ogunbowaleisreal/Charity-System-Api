import { Router } from "express";
import { WithdrawalRequestsManagementController } from "../../controllers/admin/withdrawalRequests.management";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const withdrawalCtrl = new WithdrawalRequestsManagementController();

router.use(rateLimiter.general);
router.use(verifyAdminToken);

router.post("/approve/:requestId",
    authorize([ADMIN_PERMISSIONS.WITHDRAWAL.APPROVE, ADMIN_PERMISSIONS.WITHDRAWAL.REJECT, ADMIN_PERMISSIONS.WITHDRAWAL.VIEW]),
    withdrawalCtrl.acceptWithdrawalRequest);
router.post("/reject/:requestId",
    authorize([ADMIN_PERMISSIONS.WITHDRAWAL.REJECT, ADMIN_PERMISSIONS.WITHDRAWAL.APPROVE, ADMIN_PERMISSIONS.WITHDRAWAL.VIEW]),
    withdrawalCtrl.rejectWithdrawalRequest);
router.get("/list",
    authorize([ADMIN_PERMISSIONS.WITHDRAWAL.VIEW, ADMIN_PERMISSIONS.WITHDRAWAL.APPROVE, ADMIN_PERMISSIONS.WITHDRAWAL.REJECT]),
    withdrawalCtrl.getWithdrawalRequests);

export default router;