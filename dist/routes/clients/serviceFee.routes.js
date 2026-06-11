"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceChargeController_1 = require("../../controllers/serviceChargeController");
const serviceFee = new serviceChargeController_1.ServiceFeeController();
const router = (0, express_1.Router)();
router.get("/", serviceFee.getServiceFee);
exports.default = router;
