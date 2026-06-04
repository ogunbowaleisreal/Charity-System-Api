"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
//import { Notification } from "../../controllers/admin/pushNotificationController";
const notification_controller_1 = require("../../controllers/admin/notification.controller");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const admin_management_1 = require("../../types/admin.management");
const adminAuth_2 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
//const notificationCtrl = new NotificationController();
// Apply middlewares globally
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
router.post("/create", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.NOTIFICATION.CREATE]), notification_controller_1.NotificationController.createNotification.bind(notification_controller_1.NotificationController));
router.get("/list", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.NOTIFICATION.VIEW]), notification_controller_1.NotificationController.getAllNotifications.bind(notification_controller_1.NotificationController));
router.delete("/:notificationId", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.NOTIFICATION.DELETE]), notification_controller_1.NotificationController.deleteNotification.bind(notification_controller_1.NotificationController));
exports.default = router;
