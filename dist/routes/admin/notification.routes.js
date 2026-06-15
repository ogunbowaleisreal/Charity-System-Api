"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
//const notificationCtrl = new NotificationController();
// Apply middlewares globally
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// router.post("/create",
//     authorize([ADMIN_PERMISSIONS.NOTIFICATION.CREATE]),
//     NotificationController.createNotification.bind(NotificationController));
// router.get("/list",
//     authorize([ADMIN_PERMISSIONS.NOTIFICATION.VIEW]),
//     NotificationController.getAllNotifications.bind(NotificationController));
// router.delete("/:notificationId",
//     authorize([ADMIN_PERMISSIONS.NOTIFICATION.DELETE]),
//     NotificationController.deleteNotification.bind(NotificationController));
exports.default = router;
