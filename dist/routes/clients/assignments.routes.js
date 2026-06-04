"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignmentController_1 = require("../../controllers/client/assignmentController");
//import { verifyJwt } from "../../middleware/verifyClients";
const auth_1 = require("../../middleware/auth");
const subscriptionMiddleware_1 = require("../../middleware/subscriptionMiddleware");
const router = (0, express_1.Router)();
const assignmentCtrl = new assignmentController_1.ClientAssignmentsController();
//router.use(verifyJwt as any)
router.use(auth_1.verifyClientToken);
router.get('/list', subscriptionMiddleware_1.subscriptionRequired, assignmentCtrl.getAssignments);
//router.post('/create/:id', assignmentCtrl.createAssignment)
//router.get('/:id', assignmentCtrl.getAssignmentById)
//router.delete('/:id', assignmentCtrl.deleteAssignment)
exports.default = router;
