import { Router } from "express";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { AdminDashboardController } from "../../controllers/admin/adminDashboardController";

const router = Router();
const controller = new AdminDashboardController();

router.use(rateLimiter.general);
router.use(verifyAdminToken as any);

router.get(
    "/stats",
    authorize([ADMIN_PERMISSIONS.DASHBOARD.OVERVIEW]),
    controller.getDashboardStats
);

export default router;
