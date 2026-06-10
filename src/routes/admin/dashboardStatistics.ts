import { Router } from "express";
import { DashboardController } from "../../controllers/admin/dashboardController";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const dashboardCtrl = new DashboardController();

// =========================
// GLOBAL MIDDLEWARE
// =========================
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

// =========================
// 📊 GET DASHBOARD STATS
// =========================
router.get(
    "/stats",
    authorize([ADMIN_PERMISSIONS.DASHBOARD.OVERVIEW]) as any,
    dashboardCtrl.getDashboardStats
);

export default router;