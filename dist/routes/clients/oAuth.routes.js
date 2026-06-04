"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oAuth_controller_1 = require("../../controllers/client/oAuth.controller");
const oauthCtrl = new oAuth_controller_1.oauthController();
const router = (0, express_1.Router)();
router.get('/google', oauthCtrl.getGoogleAuthUrl);
router.get('/google/callback', oauthCtrl.googleOAuthCallback);
exports.default = router;
