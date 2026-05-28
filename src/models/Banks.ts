// models/bank.model.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IBank extends Document {
    name: string;
    code: string;
    slug?: string;
    country: string;
    currency: string;
    type?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const bankSchema = new Schema<IBank>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        slug: {
            type: String,
            trim: true,
        },

        country: {
            type: String,
            default: "NG",
        },

        currency: {
            type: String,
            default: "NGN",
        },

        type: {
            type: String,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

bankSchema.index({ code: 1 });
bankSchema.index({ name: 1 });

export const Bank = mongoose.model<IBank>("Bank", bankSchema);