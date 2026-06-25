import { Router } from "express";
//import { oauthController } from "../../controllers/client/googleAuth.controller";
import { profileController } from "../../controllers/client/profile.controller";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { updateProfileSchema, changePasswordSchema } from "../../validators/user.validation";
import { validate } from "../../middleware/validator";

const router = Router()
const profileCtrl = new profileController()
router.use(verifyJwt as any)
router.use(rateLimiter.general)
router.use(verifyClientToken)

router.patch('/update',
    validate(updateProfileSchema),
    profileCtrl.updateClientProfile)

router.post("/change-password",
    validate(changePasswordSchema),
    profileCtrl.changePassword
)

// router.post("/verify-password-reset-otp",
//     //verifyJwt,
//     profileCtrl.verifyPasswordResetOtp
// )

// router.post("/set-password",
//     //verifyJwt,
//     profileCtrl.verifyAndResetPassword
// )
router.post("/delete-account",
    //verifyJwt,
    profileCtrl.deleteAccount
)

router.delete("/delete-account-verification",
    profileCtrl.verifyAccountDeletionOtp
)
router.get("/",
    //verifyJwt,
    profileCtrl.getClientProfile
)

router.post(
    "/toggle-2fa",
    profileCtrl.toggle2FA
)

export default router