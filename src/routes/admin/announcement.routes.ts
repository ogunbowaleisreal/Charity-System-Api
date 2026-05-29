import { Router } from "express";
import { AnnounceController } from "../../controllers/admin/Announcement.controller";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize } from "../../middleware/adminAuth";
const router = Router();
const announceCtrl = new AnnounceController();

// Apply middlewares globally
router.use(verifyAdminToken);

router.post("/",
    authorize([ADMIN_PERMISSIONS.ANNOUNCEMENT.CREATE]) as any,
    announceCtrl.createAnnouncement);
router.get("/list",
    authorize([ADMIN_PERMISSIONS.ANNOUNCEMENT.VIEW]) as any,
    announceCtrl.getAllAnnouncements);
router.post("/resend/:announcementId",
    authorize([ADMIN_PERMISSIONS.ANNOUNCEMENT.CREATE]) as any,
    announceCtrl.resendAnnouncement);
router.delete("/:announcementId",
    authorize([ADMIN_PERMISSIONS.ANNOUNCEMENT.DELETE]) as any,
    announceCtrl.deleteAnnouncement);


export default router;
