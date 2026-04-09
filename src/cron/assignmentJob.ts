import cron from "node-cron";
import Requests from "../models/Requests";
import consultantClientAssignemnt from "../models/consultantClientAssignemnt";
import logger from "../logger";

export const closeExpiredAssignment = () => {
    // Runs every day at 00:00 (midnight)
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();

            const result = await consultantClientAssignemnt.updateMany(
                {
                    endDate: { $lte: now },
                    //          status: { $in: ["pending", "accepted", "partially completed", "completed"] },
                },
                {
                    $set: { status: "removed" }, // or keep "pending" if you prefer
                }
            );

            logger.info("assignment window cron executed", {
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            logger.error("assignment window cron failed", error);
        }
    });
};
