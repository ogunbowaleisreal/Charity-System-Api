"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminManagement_1 = require("../../controllers/admin/adminManagement");
const admin_management_1 = require("../../types/admin.management");
//import { validateRequest } from "@/middleware/validation";
// import {
//   createAdminSchema,
//   getAdminsQuerySchema,
//   updateAdminSchema,
// } from "@/validations/admin/authValidation";
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
const adminManagementController = new adminManagement_1.AdminManagementController();
router.use(adminAuth_1.verifyAdminToken);
router.post("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.CREATE]), 
//validateRequest(createAdminSchema),
adminManagementController.createAdmin);
router.get("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.VIEW]), 
//validateRequest(getAdminsQuerySchema),
adminManagementController.getAllAdmins);
// router.get(
//     "/statistics",
//     authorize([ADMIN_PERMISSIONS.ADMIN.ADMIN_STATS]) as any,
//     adminManagementController.getAdminStatistics
// );
router.get("/:adminId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.VIEW]), adminManagementController.getAdminById);
router.put("/:adminId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.UPDATE]), 
//validateRequest(updateAdminSchema),
adminManagementController.updateAdmin);
router.patch("/:adminId/suspend", 
// requireRole(["super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.SUSPEND]), adminManagementController.suspendAdmin);
router.delete("/:adminId/deactivate", (0, adminAuth_1.requireRole)(["super_admin"]), (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.DELETE]), adminManagementController.deactivateAdmin);
router.patch("/:adminId/reset-password", (0, adminAuth_1.requireRole)(["super_admin"]), (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.UPDATE]), adminManagementController.resetAdminPassword);
exports.default = router;
// import { Router } from "express";
// import { AdminManagementController } from "../../controllers/admin/adminManagement";
// const adminMngtCtrl = new AdminManagementController()
// const router = Router()
// router.post('/create', adminMngtCtrl.createAdmin as any)
// router.patch('/update-admin', adminMngtCtrl.updateAdmin as any)
// router.get('/:id', adminMngtCtrl.getAdminById as any)
// router.get('/alladmin', adminMngtCtrl.getAllAdmins as any)
// router.patch('/deactivate-admin/:adminId', adminMngtCtrl.deactivateAdmin as any)
// export default router;
