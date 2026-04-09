import cron from "node-cron";
import Requests from "../models/Requests";
import logger from "../logger";

export const handleBiddingLifecycle = () => {
    // -------------------------
    // 1️⃣ Start bidding: run every hour
    // -------------------------
    cron.schedule("0 * * * *", async () => { // at minute 0 of every hour
        try {
            const now = new Date();

            const started = await Requests.updateMany(
                {
                    biddingStartDate: { $lte: now },
                    status: "pending",
                },
                {
                    $set: { status: "ongoing" },
                }
            );

            logger.info("Hourly bidding start check executed", {
                started: started.modifiedCount,
            });
        } catch (error) {
            logger.error("Hourly bidding start cron failed", error);
        }
    });

    // -------------------------
    // 2️⃣ End bidding: keep it daily at midnight
    // -------------------------
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();

            const ended = await Requests.updateMany(
                {
                    biddingEndDate: { $lte: now },
                    status: { $in: ["pending", "ongoing"] },
                },
                {
                    $set: { status: "ended" },
                }
            );

            logger.info("Daily bidding end check executed", {
                ended: ended.modifiedCount,
            });
        } catch (error) {
            logger.error("Daily bidding end cron failed", error);
        }
    });
};

// import cron from "node-cron";
// import Requests from "../models/Requests";
// import logger from "../logger";

// export const handleBiddingLifecycle = () => {
//     // Runs every day at 00:00 (midnight)
//     cron.schedule("0 0 * * *", async () => {
//         try {
//             const now = new Date();

//             // 1. Start bidding
//             const started = await Requests.updateMany(
//                 {
//                     biddingStartDate: { $lte: now },
//                     status: "pending",
//                 },
//                 {
//                     $set: { status: "ongoing" },
//                 }
//             );

//             // 2. End bidding
//             const ended = await Requests.updateMany(
//                 {
//                     biddingEndDate: { $lte: now },
//                     status: { $in: ["pending", "ongoing"] },
//                 },
//                 {
//                     $set: { status: "ended" },
//                 }
//             );

//             logger.info("Bidding lifecycle cron executed", {
//                 started: started.modifiedCount,
//                 ended: ended.modifiedCount,
//             });
//         } catch (error) {
//             logger.error("Bidding lifecycle cron failed", error);
//         }
//     });
// };

// // import cron from "node-cron";
// // import Requests from "../models/Requests";
// // import logger from "../logger";

// // export const closeExpiredBiddingRequests = () => {
// //     // Runs every day at 00:00 (midnight)
// //     cron.schedule("0 0 * * *", async () => {
// //         try {
// //             const now = new Date();

// //             const result = await Requests.updateMany(
// //                 {
// //                     biddingEndDate: { $lte: now },
// //                     status: { $in: ["pending", "ongoing"] },
// //                 },
// //                 {
// //                     $set: { status: "ended" }, // or keep "pending" if you prefer
// //                 }
// //             );

// //             logger.info("Bidding window cron executed", {
// //                 modifiedCount: result.modifiedCount,
// //             });
// //         } catch (error) {
// //             logger.error("Bidding window cron failed", error);
// //         }
// //     });
// // };
