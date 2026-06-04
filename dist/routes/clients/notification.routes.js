"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pushNotificationController_1 = require("../../controllers/client/pushNotificationController");
const notificationController_1 = require("../../controllers/client/notificationController");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const notificationCtrl = new notificationController_1.NotificationController();
// Apply middlewares globally
router.use(auth_1.verifyClientToken);
router.use(ratelimiter_1.rateLimiter.general);
// Routes
router.get("/list", notificationCtrl.getMyNotifications);
router.patch("/:notificationId/read", notificationCtrl.markAsRead);
router.patch("/read-all", notificationCtrl.markAllAsRead);
router.delete("/:notificationId", notificationCtrl.deleteNotification);
router.post("/register-token", pushNotificationController_1.Notification.registerToken);
exports.default = router;
