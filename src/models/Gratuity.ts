import { Schema, model, Document, Types } from "mongoose";

export interface IGratuity extends Document {
    amount: number;
    percentage: number;

    userId?: Types.ObjectId;
    fullName: string

    // Link to original payment
    transactionReference: string;

    // Optional: link to campaign for analytics
    campaign?: Types.ObjectId;

    // Snapshot of what admin set at the time
    // purposeTitle: string;

    source: "donation";

    currency: string;

    createdAt: Date;
}

const GratuitySchema = new Schema<IGratuity>(
    {
        amount: {
            type: Number,
            required: true,
        },

        percentage: {
            type: Number,
            required: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
        },

        transactionReference: {
            type: String,
            required: true,
            index: true,
        },
        fullName: {
            type: String
        },

        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
        },

        // purposeTitle: {
        //     type: String,
        //     required: true,
        // },

        source: {
            type: String,
            enum: ["donation"],
            default: "donation",
        },

        currency: {
            type: String,
            default: "NGN",
        },
    },
    { timestamps: true }
);

export const Gratuity = model<IGratuity>("Gratuity", GratuitySchema);