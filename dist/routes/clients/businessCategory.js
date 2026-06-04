"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessCategory_1 = require("../../controllers/client/businessCategory");
const router = (0, express_1.Router)();
const businessCategoryCtrl = new businessCategory_1.BusinessCategoryController();
//router.use(verifyJwt as any)
//router.use(verifyClientToken)
router.get('/list', 
//verifyJwt,
businessCategoryCtrl.businessCategory);
exports.default = router;
