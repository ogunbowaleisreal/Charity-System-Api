import { Router } from "express";
import { BidController } from "../../controllers/admin/bidController";
//import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
//import { auth } from "googleapis/build/src/apis/abusiveexperiencereport";

const router = Router()
const bidCtrl = new BidController()
//router.use(verifyJwt as any)
router.use(rateLimiter.general)
router.use(verifyAdminToken as any)

//router.post('/create/:id', bidCtrl.createBid)
router.get('/history',
    authorize([ADMIN_PERMISSIONS.BIDS.VIEW]) as any,
    bidCtrl.getAllBids)
router.get('/list/:request_id', bidCtrl.getRequestBids)
router.get('/:id',
    authorize([ADMIN_PERMISSIONS.BIDS.VIEW]) as any,
    bidCtrl.getBidById)
router.patch('/approve/:bid_id',
    authorize([ADMIN_PERMISSIONS.BIDS.APPROVE]) as any,
    bidCtrl.approveOrDeclineConsultantBid)
// router.patch('/reject/:bid_id',
//     authorize([ADMIN_PERMISSIONS.BIDS.REJECT]) as any,
//     bidCtrl.rejectConsultantBid)



export default router