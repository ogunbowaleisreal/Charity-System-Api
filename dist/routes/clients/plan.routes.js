"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const planController_1 = require("../../controllers/client/planController");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const planCtrl = new planController_1.PlanController();
router.use(auth_1.verifyClientToken);
//router.post('/create', planCtrl.createPlan)
router.get('/get', planCtrl.getPlanByCode);
router.get('/list', planCtrl.listPlans);
exports.default = router;
