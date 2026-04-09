import { Router } from "express";
import { AdminEnquiryController } from "../../controllers/admin/adminEnquiresManagement";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const enquiryCtrl = new AdminEnquiryController();

router.use(verifyAdminToken);
router.use(rateLimiter.general);

router.get(
    "/list",
    enquiryCtrl.getAllEnquiries.bind(enquiryCtrl)
);

router.get(
    "/:enquiryId",
    enquiryCtrl.getEnquiryById.bind(enquiryCtrl)
);

router.delete(
    "/:enquiryId",
    enquiryCtrl.deleteEnquiry.bind(enquiryCtrl)
);

export default router;
