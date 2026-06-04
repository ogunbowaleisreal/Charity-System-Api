import { Router } from "express";
import { WithdrawalController } from "../../controllers/client/withdrawalController";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const withdrawalCtrl = new WithdrawalController();

router.use(rateLimiter.general);
router.use(verifyClientToken);


router.get("/banks", withdrawalCtrl.getAllBanks);
router.post("/verify-2fa", withdrawalCtrl.verifyWitdrawal2fa);
router.post("/bank/account-name", withdrawalCtrl.verifyBankAccount);
router.post("/wallet/set-wallet-pin", withdrawalCtrl.firstTimeWalletPinSet);
router.get("/wallet/reset-pin", withdrawalCtrl.resetWalletPin);
router.post("/wallet/verify-pin", withdrawalCtrl.verifyWalletPin);
router.post("/wallet/verify-reset-otp", withdrawalCtrl.verifyWalletPinResetOTP);
router.post("/wallet/set-pin", withdrawalCtrl.setWalletPin);
router.get("/wallet", withdrawalCtrl.getUserWallet);
router.post("/wallet/:campaignId", withdrawalCtrl.withdrawFundsToWwallet);
router.post("/bank/:walletId", withdrawalCtrl.applyForWithdrawalToBank);

export default router;