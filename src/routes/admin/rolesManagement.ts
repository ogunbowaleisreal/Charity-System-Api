import { Router } from "express";
import { RoleController } from "../../controllers/admin/roleManagement";
// import { validateRequest } from "@/middleware/validation";
import { rateLimiter } from "../..//middleware/ratelimiter";
// import {
//   createRoleSchema,
//   updateRoleSchema,
//   assignRoleSchema,
//   updateRolePermissionsSchema,
// } from "@/validations/admin/roleValidation";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize, verifyAdminToken } from "../../middleware/adminAuth";

const router = Router();
const roleController = new RoleController();

router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

router.get(
    "/",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    roleController.getAllRoles as any
);

router.get(
    "/:id",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    roleController.getRoleById as any
);

router.post(
    "/",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.CREATE_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    //   validateRequest(createRoleSchema),
    roleController.createRole as any
);

// Update existing role
router.patch(
    "/:id",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.UPDATE_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    //   validateRequest(updateRoleSchema.body),
    roleController.updateRole as any
);

router.delete(
    "/:id",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.DELETE_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    roleController.deleteRole as any
);

// Get available permissions
router.get(
    "/permissions/available",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.CREATE_ROLES,
        ADMIN_PERMISSIONS.ADMIN.UPDATE_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    roleController.getAvailablePermissions as any
);

// Update role permissions //not in postman yet
router.patch(
    "/:id/permissions",
    authorize([ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]) as any,
    //   validateRequest(updateRolePermissionsSchema.body),
    roleController.updateRolePermissions as any
);

// Assign role to admin user
router.post(
    "/assign",
    authorize([ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]) as any,
    //   validateRequest(assignRoleSchema.body),
    roleController.assignRole as any
);

// Remove role from admin user
router.post(
    "/revoke",
    authorize([ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES]) as any,
    //   validateRequest(assignRoleSchema.body),
    roleController.revokeRole as any
);

// Get users with specific role
router.get(
    "/:id/users",
    authorize([
        ADMIN_PERMISSIONS.ADMIN.VIEW_ROLES,
        ADMIN_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ]) as any,
    roleController.getUsersByRole as any
);

export default router;
