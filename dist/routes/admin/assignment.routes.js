"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignmentController_1 = require("../../controllers/admin/assignmentController");
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
const assignmentCtrl = new assignmentController_1.AdminAssignmentController();
router.use(adminAuth_1.verifyAdminToken);
router.get('/list/:account_id', assignmentCtrl.getAssignments);
router.post('/assign/:consultant_id', assignmentCtrl.assignConsultant);
router.delete('/unassign/:assignment_id', assignmentCtrl.removeAssignment);
//router.get('/:id', assignmentCtrl.getAssignmentById)
exports.default = router;
