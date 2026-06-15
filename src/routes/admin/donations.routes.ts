import { Router } from "express";
import { DonationController } from "../../controllers/admin/donation.controller";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize } from "../../middleware/adminAuth";

const router = Router();
const controller = new DonationController();

router.use(verifyAdminToken);

router.get("/:user_id",
    authorize([ADMIN_PERMISSIONS.DONATIONS.VIEW]),
    controller.getUserDonations);

export default router;