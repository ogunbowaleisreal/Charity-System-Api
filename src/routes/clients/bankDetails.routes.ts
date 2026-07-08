import { Router } from "express";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { BankDetailsController } from "../../controllers/client/bankDetails.controller";

const router = Router();

const bankCtrl = new BankDetailsController();

router.use(rateLimiter.general);
router.use(verifyClientToken);

router.post(
    "/create",
    bankCtrl.createBankDetails
);

router.get(
    "/user",
    bankCtrl.getUserBankDetails
);

router.patch(
    "/update",
    bankCtrl.updateBankDetails
);

router.patch(
    "/update/confirm",
    bankCtrl.confirmUpdateBankDetails
);

router.delete(
    "/delete",
    bankCtrl.deleteBankDetails
);

router.delete(
    "/delete/confirm",
    bankCtrl.confirmDeleteBankDetails
);

export default router;