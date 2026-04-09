import { Router } from "express";
import { clientRequestController } from "../../controllers/client/requestController";
import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { subscriptionRequired } from "../../middleware/subscriptionMiddleware";

const router = Router()
const requestCtrl = new clientRequestController()
//router.use(verifyJwt as any)
router.use(verifyClientToken)
router.use(rateLimiter.general)

router.get('/list',
    requestCtrl.listRequests)
//router.post('/create', requestCtrl.createRequest)
router.get('/:id', requestCtrl.getRequestById)
//router.delete('/:id', requestCtrl.deleteRequest)

export default router