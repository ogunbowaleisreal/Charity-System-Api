import { Document, Schema, model, Types } from "mongoose";

export interface IComment extends Document {
    campaign: Types.ObjectId;
    user: Types.ObjectId;

    message: string;
    firstName: string;
    lastName: string;

    // ===== OPTIONAL =====
    parentComment?: Types.ObjectId; // for replies (future)

    // ===== METADATA =====
    isEdited: boolean;
    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },

        message: {
            type: String,
            required: true,
            maxlength: 500,
        },

        parentComment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        isEdited: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default model<IComment>("Comment", CommentSchema);