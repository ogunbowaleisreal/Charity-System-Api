import { Router } from "express";
//import { oauthController } from "../../controllers/client/googleAuth.controller";
import { profileController } from "../../controllers/client/profile.controller";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const profileCtrl = new profileController()
//router.use(verifyJwt as any)
router.use(verifyClientToken)

router.patch('/update/client',
    //verifyJwt,
    profileCtrl.updateClientProfile)

router.post("/change-password",
    //verifyJwt,
    profileCtrl.changePassword)
router.get("/client/profile",
    //verifyJwt,
    profileCtrl.getClientProfile)

router.get("/consultant/profile",
    //verifyJwt,
    profileCtrl.getConsultantProfile)

router.patch("/update/consultant",
    //verifyJwt,
    profileCtrl.updateConsultantProfile)

router.delete("/delete/education/:educationId", profileCtrl.deleteEducation)

router.delete("/delete/certificate/:certificateId", profileCtrl.deleteCertificate)

export default router