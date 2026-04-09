import { Router } from "express"
import { AccountController } from "../../controllers/client/accountController";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const accountCtrl = new AccountController()
//router.use(verifyJwt as any)
router.use(verifyClientToken)
//router.get('/all', accountCtrl.getAllAccounts)
router.get('/user',
    //verifyJwt,
    accountCtrl.getUserAccount)

// router.get('/:id',
//     //verifyJwt,
//     accountCtrl.getAccountById)


export default router