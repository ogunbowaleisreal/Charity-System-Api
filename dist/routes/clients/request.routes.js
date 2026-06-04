"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_1 = require("../../controllers/client/requestController");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const requestCtrl = new requestController_1.clientRequestController();
//router.use(verifyJwt as any)
router.use(auth_1.verifyClientToken);
router.use(ratelimiter_1.rateLimiter.general);
router.get('/list', requestCtrl.listRequests);
//router.post('/create', requestCtrl.createRequest)
router.get('/:id', requestCtrl.getRequestById);
//router.delete('/:id', requestCtrl.deleteRequest)
exports.default = router;
