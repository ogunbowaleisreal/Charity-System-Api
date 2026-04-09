import mongoose, { Schema, Types } from "mongoose";

const notificationTokenSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    device: {
        type: String,
        default: "web",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const NotificationToken = mongoose.model(
    "NotificationToken",
    notificationTokenSchema
);