import { Router } from "express";
import { ClientEnquiryController } from "../../controllers/client/enquiryController";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const enquiryCtrl = new ClientEnquiryController();

router.use(rateLimiter.general);

router.post(
    "/create",
    enquiryCtrl.createEnquiry.bind(enquiryCtrl)
);

export default router;
