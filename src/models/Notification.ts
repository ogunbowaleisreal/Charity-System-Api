import mongoose, { Schema, Document, Types, model } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    type: "JOB_CREATED" | "GENERAL";
    createdAt: Date;

    // Who should see this
    recipients: Types.ObjectId[]; // user IDs OR empty for "broadcast"

    // Who has read it
    readBy: Types.ObjectId[];
}

const NotificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },

        type: {
            type: String,
            enum: ["JOB_CREATED", "GENERAL"],
            default: "GENERAL",
        },

        recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],

        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);
export default model("Notification", NotificationSchema);


// export const Notification = mongoose.model<INotification>(
//     "Notification",
//     NotificationSchema
// );