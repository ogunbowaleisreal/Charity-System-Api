import { Router } from "express";
import { subscriptionController } from "../../controllers/client/subscriptionController";
import { verifyJwt } from "../../middleware/verifyClients";
import bodyParser from "body-parser"
import { verifyClientToken } from "../../middleware/auth";

const router = Router()
const subController = new subscriptionController()
//router.use(verifyJwt as any)
router.use(verifyClientToken)

router.post('/create',
    //  verifyJwt,
    subController.startSubscription)
router.post('/cancel',
    // verifyJwt,
    subController.cancelSubscription)
router.get('/change-card',
    subController.changeCard
)

router.post('/upgrade-subscription',
    subController.updateSubscription
)
router.get('/',
    //verifyJwt,
    subController.getUserSubscription)
// router.post("/webhook",
//     bodyParser.raw({ type: "*/*" }),
//     subController.handle)

export default router