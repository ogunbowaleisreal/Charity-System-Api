import { Router } from "express";
import { Notification } from "../../controllers/client/pushNotificationController";
import { NotificationController } from "../../controllers/client/notificationController";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const notificationCtrl = new NotificationController();

// Apply middlewares globally
router.use(verifyClientToken);
router.use(rateLimiter.general);

// Routes
router.get(
    "/list",
    notificationCtrl.getMyNotifications
);

router.patch(
    "/:notificationId/read",
    notificationCtrl.markAsRead
);

router.patch(
    "/read-all",
    notificationCtrl.markAllAsRead
);
router.delete(
    "/:notificationId",
    notificationCtrl.deleteNotification
);

router.post("/register-token", Notification.registerToken);

export default router;