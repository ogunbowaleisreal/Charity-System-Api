"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountManagementController_1 = require("../../controllers/admin/accountManagementController");
const adminAuth_1 = require("../../middleware/adminAuth");
const admin_management_1 = require("../../types/admin.management");
//import { AdminAssignmentController } from "../../controllers/admin/assignmentController";
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const accountCtrl = new accountManagementController_1.AccountManagementController();
//const assignmentCtrl = new AdminAssignmentController()
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
router.get("/all-accounts", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getAllAccounts);
// router.get("/user", accountCtrl.getUserAccount);
// router.get("/:id",
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
//     accountCtrl.getAccountById);
router.get("/transactions/:id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getClientPaymentHistory);
// router.patch("/update-profile/:accountId",
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
//     accountCtrl.updat
// )
router.patch("/restrict/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND, admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.suspendAccount);
router.patch("/unrestrict/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND, admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.unsuspendAccount);
router.get("/details/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getAccountDetails);
router.get("/payment-history/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getClientPaymentHistory);
router.get("/campaign/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getUserCampaigns);
router.get("/campaign/donation/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getCampaignDonations);
router.get("/donation/:account_id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.ACCOUNTS.VIEW]), accountCtrl.getUserDonations);
router.get("/campaign");
// router.get('/assignment/:account_id',
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]),
//     assignmentCtrl.getAssignments)
// router.patch('/approve-decline/:consultant_id',
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.APPROVE, ADMIN_PERMISSIONS.ACCOUNTS.DECLINE]) as any,
//     accountCtrl.approveOrDeclineAccount
// )
// router.post('/assign/:consultant_id',
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.])
//     assignmentCtrl.assignConsultant)
// router.post("/assign-consultant/:client_id",
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.ASSIGN]),
//     accountCtrl.assignConsultant
// )
// router.delete('/unassign/:assignment_id',
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE]) as any,
//     assignmentCtrl.removeAssignment)
// router.delete('/remove-assignment/:bid_id',
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE]) as any,
//     assignmentCtrl.unassignConsultantClient
// )
// router.post("/create", accountCtrl.createAccount);
// router.post("/update/:id", accountCtrl.updateAccount);
// router.post("/delete/:id",
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND]) as any,
//     accountCtrl.deleteAccount
// );
exports.default = router;
