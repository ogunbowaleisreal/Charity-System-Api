import { Router } from "express";
import { AdminGratuityController } from "../../controllers/admin/gratuity.controller";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const gratuityCtrl = new AdminGratuityController();

// =========================
// 🔒 GLOBAL MIDDLEWARES
// =========================
router.use(verifyAdminToken);
router.use(rateLimiter.general);

// =========================
// 🧩 ROUTES
// =========================

// Get current config (admin view)
router.get(
    "/config",
    authorize([ADMIN_PERMISSIONS.GRATUITY?.VIEW]),
    gratuityCtrl.getConfig.bind(gratuityCtrl)
);
router.post(
    "/create",
    authorize([ADMIN_PERMISSIONS.GRATUITY?.CREATE]),
    gratuityCtrl.createGratuityConfig.bind(gratuityCtrl)
)

// Update config
router.put(
    "/config/:gratuityId",
    authorize([ADMIN_PERMISSIONS.GRATUITY?.UPDATE]),
    gratuityCtrl.updateConfig.bind(gratuityCtrl)
);

// Toggle gratuity system
router.patch(
    "/config/toggle/:gratuityId",
    authorize([ADMIN_PERMISSIONS.GRATUITY?.UPDATE]),
    gratuityCtrl.toggleGratuity.bind(gratuityCtrl)
);

export default router;