import { Router } from "express";
import { AdminAssignmentController } from "../../controllers/admin/assignmentController";
import { verifyAdminToken } from "../../middleware/adminAuth";

const router = Router()
const assignmentCtrl = new AdminAssignmentController()
router.use(verifyAdminToken as any)

router.get('/list/:account_id', assignmentCtrl.getAssignments)
router.post('/assign/:consultant_id', assignmentCtrl.assignConsultant)
router.delete('/unassign/:assignment_id', assignmentCtrl.removeAssignment)
//router.get('/:id', assignmentCtrl.getAssignmentById)

export default router