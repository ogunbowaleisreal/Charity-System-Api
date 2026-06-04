"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Announcement_controller_1 = require("../../controllers/admin/Announcement.controller");
const adminAuth_1 = require("../../middleware/adminAuth");
const admin_management_1 = require("../../types/admin.management");
const adminAuth_2 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
const announceCtrl = new Announcement_controller_1.AnnounceController();
// Apply middlewares globally
router.use(adminAuth_1.verifyAdminToken);
router.post("/", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.ANNOUNCEMENT.CREATE]), announceCtrl.createAnnouncement);
router.get("/list", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.ANNOUNCEMENT.VIEW]), announceCtrl.getAllAnnouncements);
router.post("/resend/:announcementId", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.ANNOUNCEMENT.CREATE]), announceCtrl.resendAnnouncement);
router.delete("/:announcementId", (0, adminAuth_2.authorize)([admin_management_1.ADMIN_PERMISSIONS.ANNOUNCEMENT.DELETE]), announceCtrl.deleteAnnouncement);
exports.default = router;
