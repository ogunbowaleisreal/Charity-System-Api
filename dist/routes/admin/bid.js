"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bidController_1 = require("../../controllers/admin/bidController");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const admin_management_1 = require("../../types/admin.management");
//import { auth } from "googleapis/build/src/apis/abusiveexperiencereport";
const router = (0, express_1.Router)();
const bidCtrl = new bidController_1.BidController();
//router.use(verifyJwt as any)
router.use(ratelimiter_1.rateLimiter.general);
router.use(adminAuth_1.verifyAdminToken);
//router.post('/create/:id', bidCtrl.createBid)
router.get('/history', (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.BIDS.VIEW]), bidCtrl.getAllBids);
router.get('/list/:request_id', bidCtrl.getRequestBids);
router.get('/:id', (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.BIDS.VIEW]), bidCtrl.getBidById);
router.patch('/approve/:bid_id', (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.BIDS.APPROVE]), bidCtrl.approveOrDeclineConsultantBid);
// router.patch('/reject/:bid_id',
//     authorize([ADMIN_PERMISSIONS.BIDS.REJECT]) as any,
//     bidCtrl.rejectConsultantBid)
exports.default = router;
