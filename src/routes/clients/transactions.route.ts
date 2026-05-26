import { Router } from "express";
import { TransactionController } from "../../controllers/client/transactionController";
import { verifyJwt } from "../../middleware/verifyClients";

const router = Router()
const transactionCtrl = new TransactionController()
router.use(verifyJwt as any)


router.get('/history', transactionCtrl.getTransactionsHistory)
router.get('/:transactionId', transactionCtrl.getTransactionById)

export default router