import { Router } from "express";
import { WithdrawalRequestsManagementController } from "../../controllers/admin/withdrawalRequests.management";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const withdrawalCtrl = new WithdrawalRequestsManagementController();

router.use(rateLimiter.general);
router.use(verifyAdminToken);

router.get("/wallet/requestId", withdrawalCtrl.acceptWithdrawalRequest);
router.post("/bank/requestId", withdrawalCtrl.rejectWithdrawalRequest);

export default router;