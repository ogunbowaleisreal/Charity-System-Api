import { Schema, model, Document, Types } from "mongoose";

export interface IAnnouncement extends Document {
    _id: Types.ObjectId;
    title: string;
    message: string;

    channel: "push" | "email";

    audience:
    | "all_users"
    | "verified_users"
    | "unverified_users"
    | "organizations"
    | "normal_users"
    | "active_users"
    | "suspended_users"
    | "specific";

    status:
    | "pending"
    | "ongoing"
    | "successful"
    | "failed";

    sentCount: number;
    failedCount: number;
    specificUsers: Types.ObjectId[];
    announcementStartAt: Date;
    createdBy: Types.ObjectId;

    lastSentAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
    {
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
                "specific",
                "subscribed_users"
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
                type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        lastSentAt: Date,
    },
    {
        timestamps: true,
    }
);

export const Announcement = model<IAnnouncement>(
    "Announcement",
    AnnouncementSchema
);