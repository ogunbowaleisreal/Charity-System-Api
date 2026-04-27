import mongoose, { Schema, Types, model } from "mongoose";

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    message: string;
    type: "DONATION" | "WITHDRAWAL" | "GENERAL" | "SYSTEM";
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
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
    },
    { timestamps: true }
);

export default model("Notification", NotificationSchema);
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