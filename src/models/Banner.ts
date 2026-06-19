import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBanner extends Document {
    image: string;
    category: string;
    isActive: boolean;
    order: number;
    link: string
    createdBy: Types.ObjectId
}

const bannerSchema = new Schema<IBanner>(
    {
        image: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            enum: [
                "home",
                "campaign",
                "donation",
                "event",
                "general",
            ],
            default: "general",
        },
        link: {
            type: String,
            default: null

        },

        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IBanner>(
    "Banner",
    bannerSchema
);