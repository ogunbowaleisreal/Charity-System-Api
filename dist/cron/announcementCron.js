"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAnnouncementCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Announcement_1 = require("../models/Announcement");
const announcements_services_1 = require("../services/announcements.services");
const announcementService = new announcements_services_1.AnnouncementService();
const startAnnouncementCron = () => {
    console.log("📢 Announcement cron started");
    // Runs every minute
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const pendingAnnouncements = await Announcement_1.Announcement.find({
                status: "pending",
                announcementStartAt: {
                    $lte: new Date(),
                },
            });
            if (!pendingAnnouncements.length) {
                return;
            }
            console.log(`Found ${pendingAnnouncements.length} pending announcement(s)`);
            for (const announcement of pendingAnnouncements) {
                try {
                    await announcementService.sendAnnouncement(announcement._id.toString());
                    console.log(`Announcement ${announcement._id} sent successfully`);
                }
                catch (error) {
                    console.error(`Failed to send announcement ${announcement._id}`, error);
                }
            }
        }
        catch (error) {
            console.error("Announcement cron error:", error);
        }
    });
};
exports.startAnnouncementCron = startAnnouncementCron;
