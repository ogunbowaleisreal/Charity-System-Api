import { Router } from "express";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize, verifyAdminToken } from "../../middleware/adminAuth";
import { AdminTransactionController } from "../../controllers/admin/transaction.mamangement";
import { de } from "zod/locales";

const router = Router();
const transactionCtrl = new AdminTransactionController();

router.use(rateLimiter.general);
router.use(verifyAdminToken);

router.get("/list",
    authorize([ADMIN_PERMISSIONS.TRANSACTIONS.VIEW]),
    transactionCtrl.getWalletTransactionHistory);

router.get("/list/:transactionId",
    authorize([ADMIN_PERMISSIONS.TRANSACTIONS.VIEW]),
    transactionCtrl.getWalletTransaction);



export default router;
