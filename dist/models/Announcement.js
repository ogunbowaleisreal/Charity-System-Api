"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Announcement = void 0;
const mongoose_1 = require("mongoose");
const AnnouncementSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    channel: {
        type: String,
        enum: ["push", "email"],
        required: true,
    },
    audience: {
        type: String,
        enum: [
            "all_users",
            "verified_users",
            "unverified_users",
            "organizations",
            "normal_users",
            "active_users",
            "suspended_users",
            "specific"
        ],
        required: true,
    },
    status: {
        type: String,
        enum: [
            "pending",
            "ongoing",
            "successful",
            "failed",
        ],
        default: "pending",
    },
    specificUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Account",
        },
    ],
    announcementStartAt: {
        type: Date,
    },
    sentCount: {
        type: Number,
        default: 0,
    },
    failedCount: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
    },
    lastSentAt: Date,
}, {
    timestamps: true,
});
exports.Announcement = (0, mongoose_1.model)("Announcement", AnnouncementSchema);
