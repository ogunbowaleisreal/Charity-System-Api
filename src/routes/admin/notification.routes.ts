import { Router } from "express";
//import { Notification } from "../../controllers/admin/pushNotificationController";
import { NotificationController } from "../../controllers/admin/notification.controller";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { authorize } from "../../middleware/adminAuth";

const router = Router();
//const notificationCtrl = new NotificationController();

// Apply middlewares globally
router.use(verifyAdminToken);
router.use(rateLimiter.general);


router.post("/create",
    authorize([ADMIN_PERMISSIONS.NOTIFICATION.CREATE]),
    NotificationController.createNotification.bind(NotificationController));
router.get("/list",
    authorize([ADMIN_PERMISSIONS.NOTIFICATION.VIEW]),
    NotificationController.getAllNotifications.bind(NotificationController));
router.delete("/:notificationId",
    authorize([ADMIN_PERMISSIONS.NOTIFICATION.DELETE]),
    NotificationController.deleteNotification.bind(NotificationController));

export default router;