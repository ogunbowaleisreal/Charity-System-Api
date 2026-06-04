"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gratuity_controller_1 = require("../../controllers/client/gratuity.controller");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const gratuityCtrl = new gratuity_controller_1.UserGratuityController();
// =========================
// 🔒 GLOBAL MIDDLEWARES
// =========================
//router.use(verifyClientToken);
router.use(ratelimiter_1.rateLimiter.general);
// =========================
// 🧩 ROUTES
// =========================
// Get current gratuity config (frontend usage)
router.get("/config", gratuityCtrl.getCurrentGratuity.bind(gratuityCtrl));
exports.default = router;
