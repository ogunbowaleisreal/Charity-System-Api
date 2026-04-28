import { Router } from "express";
import { UserGratuityController } from "../../controllers/client/gratuity.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const gratuityCtrl = new UserGratuityController();

// =========================
// 🔒 GLOBAL MIDDLEWARES
// =========================
//router.use(verifyClientToken);
router.use(rateLimiter.general);

// =========================
// 🧩 ROUTES
// =========================

// Get current gratuity config (frontend usage)
router.get(
    "/config",
    gratuityCtrl.getCurrentGratuity.bind(gratuityCtrl)
);

export default router;