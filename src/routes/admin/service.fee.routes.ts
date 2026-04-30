import { Router } from "express";
import { ServiceFeeController } from "../../controllers/admin/serviceFee.management";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const serviceFeeCtrl = new ServiceFeeController();

router.use(rateLimiter.general);
router.use(verifyAdminToken);

router.get("/",
    authorize([ADMIN_PERMISSIONS.SERVICE_FEE.VIEW, ADMIN_PERMISSIONS.SERVICE_FEE.UPDATE]),
    serviceFeeCtrl.getServiceFee);


router.patch("/update",
    authorize([ADMIN_PERMISSIONS.SERVICE_FEE.UPDATE, ADMIN_PERMISSIONS.SERVICE_FEE.VIEW]),
    serviceFeeCtrl.updateServiceFee);


export default router;