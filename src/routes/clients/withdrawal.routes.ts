import { Router } from "express";
import { WithdrawalController } from "../../controllers/client/withdrawalController";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const withdrawalCtrl = new WithdrawalController();

router.use(rateLimiter.general);
router.use(verifyClientToken);

router.get("/wallet/campaignId", withdrawalCtrl.withdrawFundsToWwallet);
router.post("/bank/walletId", withdrawalCtrl.applyForWithdrawalToBank);

export default router;