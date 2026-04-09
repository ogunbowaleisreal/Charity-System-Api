import { Router } from "express";
import { AdminReportController } from "../../controllers/admin/reportController";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const reportCtrl = new AdminReportController();

router.use(verifyAdminToken);
router.use(rateLimiter.general);

router.get(
    "/list",
    reportCtrl.getReports.bind(reportCtrl)
);

router.get(
    "/list-complains",
    reportCtrl.getComplains.bind(reportCtrl)
);


export default router;
