import { Router } from "express";
import { ClientAssignmentsController } from "../../controllers/client/assignmentController";
//import { verifyJwt } from "../../middleware/verifyClients";
import { verifyClientToken } from "../../middleware/auth";
import { subscriptionRequired } from "../../middleware/subscriptionMiddleware";

const router = Router()
const assignmentCtrl = new ClientAssignmentsController()
//router.use(verifyJwt as any)
router.use(verifyClientToken)

router.get('/list',
    subscriptionRequired,
    assignmentCtrl.getAssignments
)
//router.post('/create/:id', assignmentCtrl.createAssignment)
//router.get('/:id', assignmentCtrl.getAssignmentById)
//router.delete('/:id', assignmentCtrl.deleteAssignment)

export default router