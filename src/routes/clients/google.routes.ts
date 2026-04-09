import Router from "express";
import { GoogleAuthController } from "../../controllers/client/googleAuth.controller";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const googleCtrl = new GoogleAuthController();

router.use(rateLimiter.auth);
router.post("/google-login", googleCtrl.googleLogin);

export default router;
