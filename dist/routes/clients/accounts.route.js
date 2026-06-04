"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountController_1 = require("../../controllers/client/accountController");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const accountCtrl = new accountController_1.AccountController();
//router.use(verifyJwt as any)
router.use(auth_1.verifyClientToken);
//router.get('/all', accountCtrl.getAllAccounts)
router.get('/user', 
//verifyJwt,
accountCtrl.getUserAccount);
// router.get('/:id',
//     //verifyJwt,
//     accountCtrl.getAccountById)
exports.default = router;
