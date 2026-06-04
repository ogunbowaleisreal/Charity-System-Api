"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleManagement_1 = require("../../controllers/admin/roleManagement");
// import { validateRequest } from "@/middleware/validation";
const ratelimiter_1 = require("../..//middleware/ratelimiter");
// import {
//   createRoleSchema,
//   updateRoleSchema,
//   assignRoleSchema,
//   updateRolePermissionsSchema,
// } from "@/validations/admin/roleValidation";
const admin_management_1 = require("../../types/admin.management");
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
const roleController = new roleManagement_1.RoleController();
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
router.get("/", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), roleController.getAllRoles);
router.get("/:id", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), roleController.getRoleById);
router.post("/", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.CREATE_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), 
//   validateRequest(createRoleSchema),
roleController.createRole);
// Update existing role
router.patch("/:id", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.UPDATE_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), 
//   validateRequest(updateRoleSchema.body),
roleController.updateRole);
router.delete("/:id", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.DELETE_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), roleController.deleteRole);
// Get available permissions
router.get("/permissions/available", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.CREATE_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.UPDATE_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), roleController.getAvailablePermissions);
// Update role permissions //not in postman yet
router.patch("/:id/permissions", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]), 
//   validateRequest(updateRolePermissionsSchema.body),
roleController.updateRolePermissions);
// Assign role to admin user
router.post("/assign", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]), 
//   validateRequest(assignRoleSchema.body),
roleController.assignRole);
// Remove role from admin user
router.post("/revoke", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]), 
//   validateRequest(assignRoleSchema.body),
roleController.revokeRole);
// Get users with specific role
router.get("/:id/users", (0, adminAuth_1.authorize)([
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
    admin_management_1.ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
]), roleController.getUsersByRole);
exports.default = router;
