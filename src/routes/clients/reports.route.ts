import { Router } from "express";
import { ClientReportController } from "../../controllers/client/reportController";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const reportCtrl = new ClientReportController();

router.use(verifyClientToken);
router.use(rateLimiter.general);

router.post(
    "/upload/:accountId",
    reportCtrl.uploadReport.bind(reportCtrl)
);

router.get(
    "/history",
    reportCtrl.getMyReports.bind(reportCtrl)
);

export default router;
