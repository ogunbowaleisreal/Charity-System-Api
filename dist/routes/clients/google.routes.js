"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const googleAuth_controller_1 = require("../../controllers/client/googleAuth.controller");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.default)();
const googleCtrl = new googleAuth_controller_1.GoogleAuthController();
router.use(ratelimiter_1.rateLimiter.auth);
router.post("/google-login", googleCtrl.googleLogin);
exports.default = router;
