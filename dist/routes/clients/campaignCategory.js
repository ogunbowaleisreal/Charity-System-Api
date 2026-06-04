"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CampaignCategory_1 = require("../../controllers/client/CampaignCategory");
const router = (0, express_1.Router)();
const CampaignCategoryCtrl = new CampaignCategory_1.CampaignCategoryController();
//router.use(verifyJwt as any)
//router.use(verifyClientToken)
router.get('/list', 
//verifyJwt,
CampaignCategoryCtrl.campaignCategory);
exports.default = router;
