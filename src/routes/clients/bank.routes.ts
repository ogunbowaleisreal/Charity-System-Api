import { Router } from "express";
import { BankController } from "../../controllers/client/bank.controller";
//import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const bankCtrl = new BankController();

router.use(rateLimiter.general);
//router.use(verifyClientToken);    
router.get("/", bankCtrl.getBanks);

export default router;