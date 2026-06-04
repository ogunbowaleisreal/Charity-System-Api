"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeExpiredAssignment = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const consultantClientAssignemnt_1 = __importDefault(require("../models/consultantClientAssignemnt"));
const logger_1 = __importDefault(require("../logger"));
const closeExpiredAssignment = () => {
    // Runs every day at 00:00 (midnight)
    node_cron_1.default.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();
            const result = await consultantClientAssignemnt_1.default.updateMany({
                endDate: { $lte: now },
                //          status: { $in: ["pending", "accepted", "partially completed", "completed"] },
            }, {
                $set: { status: "removed" }, // or keep "pending" if you prefer
            });
            logger_1.default.info("assignment window cron executed", {
                modifiedCount: result.modifiedCount,
            });
        }
        catch (error) {
            logger_1.default.error("assignment window cron failed", error);
        }
    });
};
exports.closeExpiredAssignment = closeExpiredAssignment;
