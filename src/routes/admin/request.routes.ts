import { Router } from "express";
import { RequestsController } from "../../controllers/admin/requestsController";
//import { verifyJwt } from "../../middleware/verifyClients";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
const router = Router()
const requestCtrl = new RequestsController()
router.use(verifyAdminToken as any)

router.get('/list',
    authorize([ADMIN_PERMISSIONS.REQUESTS.VIEW]) as any,
    requestCtrl.getAllRequests)
router.post('/create',
    authorize([ADMIN_PERMISSIONS.REQUESTS.CREATE]) as any,
    requestCtrl.createRequest)
router.get('/:id',
    authorize([ADMIN_PERMISSIONS.REQUESTS.VIEW]) as any,
    requestCtrl.getRequestById)
router.patch('/:id',
    authorize([ADMIN_PERMISSIONS.REQUESTS.UPDATE]) as any,
    requestCtrl.updateRequest)
router.delete('/:id',
    authorize([ADMIN_PERMISSIONS.REQUESTS.DELETE]) as any,
    requestCtrl.deleteRequest)

export default router