"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bidController_1 = require("../../controllers/client/bidController");
//import { verifyJwt } from "../../middleware/verifyClients";
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const bidCtrl = new bidController_1.BidController();
//router.use(verifyJwt as any)
router.use(ratelimiter_1.rateLimiter.general);
router.use(auth_1.verifyClientToken);
router.post('/create/:request_id', bidCtrl.createBid);
router.get('/list/:request_id', bidCtrl.getRequestBids);
router.get('/history', bidCtrl.getAllBids);
router.get('/:id', bidCtrl.getBidById);
//router.get('/all', bidCtrl.getAllBidsWithPagination)
exports.default = router;
