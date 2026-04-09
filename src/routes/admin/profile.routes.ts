import { ProfileController } from "../../controllers/admin/profileController";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
//import { validateRequest } from "@/middleware/validation";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
// import { toggle2FASchema } from "@/validations/admin/accountValidation";
// import { updateAdminProfileSchema } from "@/validations/admin/profileValidation";
// import { changePasswordSchema } from "@/validations/client/userValidation";
import { Router } from "express";

const router = Router();
const profileController = new ProfileController();

router.use(verifyAdminToken as any);
router.use(rateLimiter.general)

router.patch(
    "/change-password",
    //  validateRequest(changePasswordSchema),
    (req, res, next) =>
        profileController.changePassword(
            req as AdminAuthenticatedRequest,
            res,
            next
        )
);

router.patch("/",
    //validateRequest(updateAdminProfileSchema),
    (req, res, next) =>
        profileController.updateProfile(req as AdminAuthenticatedRequest, res, next)
);

router.patch("/toggle-2fa",
    //validateRequest(toggle2FASchema),
    (req, res) =>
        profileController.toggle2FA(req as AdminAuthenticatedRequest, res)
);

router.get("/", (req, res, next) =>
    profileController.getProfile(req as AdminAuthenticatedRequest, res, next)
);

export default router;
