import { Router } from "express";
//import { oauthController } from "../../controllers/client/googleAuth.controller";
import { profileController } from "../../controllers/client/profile.controller";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router()
const profileCtrl = new profileController()
//router.use(verifyJwt as any)
router.use(rateLimiter.general)
router.use(verifyClientToken)

router.patch('/update/client',
    //verifyJwt,
    profileCtrl.updateClientProfile)

router.post("/change-password",
    //verifyJwt,
    profileCtrl.changePassword)
router.post("/delete-account",
    //verifyJwt,
    profileCtrl.deleteAccount
)
router.get("/client/profile",
    //verifyJwt,
    profileCtrl.getClientProfile)

export default router