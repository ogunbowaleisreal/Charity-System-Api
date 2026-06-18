import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
    image: string;
    category: string;
    isActive: boolean;
    order: number;
    link: string
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