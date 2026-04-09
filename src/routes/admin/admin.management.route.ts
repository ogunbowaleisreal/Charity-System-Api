import { Router } from "express";
import { AdminManagementController } from "../../controllers/admin/adminManagement";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
//import { validateRequest } from "@/middleware/validation";
// import {
//   createAdminSchema,
//   getAdminsQuerySchema,
//   updateAdminSchema,
// } from "@/validations/admin/authValidation";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";

const router = Router();
const adminManagementController = new AdminManagementController();

router.use(verifyAdminToken as any);

router.post(
    "/",
    authorize([ADMIN_PERMISSIONS.ADMIN.CREATE]) as any,
    //validateRequest(createAdminSchema),
    adminManagementController.createAdmin as any
);

router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.ADMIN.VIEW]) as any,
    //validateRequest(getAdminsQuerySchema),
    adminManagementController.getAllAdmins
);

// router.get(
//     "/statistics",
//     authorize([ADMIN_PERMISSIONS.ADMIN.ADMIN_STATS]) as any,
//     adminManagementController.getAdminStatistics
// );

router.get(
    "/:adminId",
    authorize([ADMIN_PERMISSIONS.ADMIN.VIEW]) as any,
    adminManagementController.getAdminById
);

router.put(
    "/:adminId",
    authorize([ADMIN_PERMISSIONS.ADMIN.UPDATE]) as any,
    //validateRequest(updateAdminSchema),
    adminManagementController.updateAdmin as any
);

router.patch(
    "/:adminId/suspend",
    // requireRole(["super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.ADMIN.SUSPEND]) as any,
    adminManagementController.suspendAdmin as any
)

router.delete(
    "/:adminId/deactivate",
    requireRole(["super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.ADMIN.DELETE]) as any,
    adminManagementController.deactivateAdmin as any
);

router.patch(
    "/:adminId/reset-password",
    requireRole(["super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.ADMIN.UPDATE]) as any,
    adminManagementController.resetAdminPassword as any
);

export default router;

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