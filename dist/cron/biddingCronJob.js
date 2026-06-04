"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBiddingLifecycle = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Requests_1 = __importDefault(require("../models/Requests"));
const logger_1 = __importDefault(require("../logger"));
const handleBiddingLifecycle = () => {
    // -------------------------
    // 1️⃣ Start bidding: run every hour
    // -------------------------
    node_cron_1.default.schedule("0 * * * *", async () => {
        try {
            const now = new Date();
            const started = await Requests_1.default.updateMany({
                biddingStartDate: { $lte: now },
                status: "pending",
            }, {
                $set: { status: "ongoing" },
            });
            logger_1.default.info("Hourly bidding start check executed", {
                started: started.modifiedCount,
            });
        }
        catch (error) {
            logger_1.default.error("Hourly bidding start cron failed", error);
        }
    });
    // -------------------------
    // 2️⃣ End bidding: keep it daily at midnight
    // -------------------------
    node_cron_1.default.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();
            const ended = await Requests_1.default.updateMany({
                biddingEndDate: { $lte: now },
                status: { $in: ["pending", "ongoing"] },
            }, {
                $set: { status: "ended" },
            });
            logger_1.default.info("Daily bidding end check executed", {
                ended: ended.modifiedCount,
            });
        }
        catch (error) {
            logger_1.default.error("Daily bidding end cron failed", error);
        }
    });
};
exports.handleBiddingLifecycle = handleBiddingLifecycle;
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
