import { Router } from "express";
import { AccountManagementController } from "../../controllers/admin/accountManagementController";
import { verifyAdminToken, requireRole, authorize } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { AdminAssignmentController } from "../../controllers/admin/assignmentController";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const accountCtrl = new AccountManagementController();
const assignmentCtrl = new AdminAssignmentController()
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

router.get("/all-accounts",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.getAllAccounts);
// router.get("/user", accountCtrl.getUserAccount);
// router.get("/:id",
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
//     accountCtrl.getAccountById);

router.get("/transactions/:id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.getClientPaymentHistory
);

router.patch("/update-profile/:accountId",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.updateProfile
)

router.patch("/restrict/:account_id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND, ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.suspendAccount
)

router.patch("/unrestrict/:account_id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND, ADMIN_PERMISSIONS.ACCOUNTS.UPDATE, ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.unsuspendAccount
)

router.get("/details/:account_id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]) as any,
    accountCtrl.getAccountDetails
)

router.get('/assignment/:account_id',
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.VIEW]),
    assignmentCtrl.getAssignments)

router.patch('/approve-decline/:consultant_id',
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.APPROVE, ADMIN_PERMISSIONS.ACCOUNTS.DECLINE]) as any,
    accountCtrl.approveOrDeclineAccount
)
// router.post('/assign/:consultant_id', 
//     authorize([ADMIN_PERMISSIONS.ACCOUNTS.])
//     assignmentCtrl.assignConsultant)
router.post("/assign-consultant/:client_id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.ASSIGN]),
    accountCtrl.assignConsultant
)

router.delete('/unassign/:assignment_id',
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE]) as any,
    assignmentCtrl.removeAssignment)

router.delete('/remove-assignment/:bid_id',
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.UPDATE]) as any,
    assignmentCtrl.unassignConsultantClient
)

// router.post("/create", accountCtrl.createAccount);
// router.post("/update/:id", accountCtrl.updateAccount);
router.post("/delete/:id",
    authorize([ADMIN_PERMISSIONS.ACCOUNTS.SUSPEND]) as any,
    accountCtrl.deleteAccount
);

export default router;