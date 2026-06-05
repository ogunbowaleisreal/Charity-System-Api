import cron from "node-cron";
import { Announcement, IAnnouncement } from "../models/Announcement";
import { AnnouncementService } from "../services/announcements.services";

const announcementService = new AnnouncementService();

export const startAnnouncementCron = () => {

    console.log("📢 Announcement cron started");

    // Runs every minute
    cron.schedule("* * * * *", async () => {

        try {

            const pendingAnnouncements =
                await Announcement.find({
                    status: "pending",
                    announcementStartAt: {
                        $lte: new Date(),
                    },
                }) as IAnnouncement[];

            if (!pendingAnnouncements.length) {
                return;
            }

            console.log(
                `Found ${pendingAnnouncements.length} pending announcement(s)`
            );

            for (const announcement of pendingAnnouncements) {

                try {

                    await announcementService.sendAnnouncement(
                        announcement._id.toString()
                    );

                    console.log(
                        `Announcement ${announcement._id} sent successfully`
                    );

                } catch (error) {

                    console.error(
                        `Failed to send announcement ${announcement._id}`,
                        error
                    );
                }
            }

        } catch (error) {

            console.error(
                "Announcement cron error:",
                error
            );
        }
    });
};