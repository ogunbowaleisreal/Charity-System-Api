"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
        index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ["DONATION", "WITHDRAWAL", "GENERAL"],
        default: "GENERAL",
    },
    isRead: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Notification", NotificationSchema);
// import mongoose, { Schema, Document, Types, model } from "mongoose";
// export interface INotification extends Document {
//     title: string;
//     message: string;
//     type: "JOB_CREATED" | "GENERAL";
//     createdAt: Date;
//     status: ""
//     // Who should see this
//     recipients: Types.ObjectId[]; // user IDs OR empty for "broadcast"
//     // Who has read it
//     readBy: Types.ObjectId[];
// }
// const NotificationSchema = new Schema<INotification>(
//     {
//         title: { type: String, required: true },
//         message: { type: String, required: true },
//         type: {
//             type: String,
//             enum: ["DONATION", "WITHDRAWAL", "GENERAL"],
//             default: "GENERAL",
//         },
//         recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
//         readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     },
//     { timestamps: true }
// );
// export default model("Notification", NotificationSchema);
// // export const Notification = mongoose.model<INotification>(
// //     "Notification",
// //     NotificationSchema
// // );
