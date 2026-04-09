import { Router } from "express";
import { BidController } from "../../controllers/client/bidController";
//import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router()
const bidCtrl = new BidController()
//router.use(verifyJwt as any)
router.use(rateLimiter.general)
router.use(verifyClientToken)

router.post('/create/:request_id', bidCtrl.createBid)
router.get('/list/:request_id', bidCtrl.getRequestBids)
router.get('/history', bidCtrl.getAllBids)
router.get('/:id', bidCtrl.getBidById)

//router.get('/all', bidCtrl.getAllBidsWithPagination)

export default router