import { Schema, model, Document, Types } from "mongoose";

export interface IServiceCharge extends Document {
    amount: number;

    // Snapshot of the fee config that produced this amount
    feeType: string;   // "percentage" | "flat" | "none"
    feeValue: number;

    userId?: Types.ObjectId;
    fullName: string;

    // Link to original payment
    transactionReference: string;

    // Optional: link to campaign for analytics
    campaign?: Types.ObjectId;

    source: "donation";

    currency: string;

    createdAt: Date;
}

const ServiceChargeSchema = new Schema<IServiceCharge>(
    {
        amount: {
            type: Number,
            required: true,
        },

        feeType: {
            type: String,
        },

        feeValue: {
            type: Number,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
        },

        fullName: {
            type: String,
        },

        transactionReference: {
            type: String,
            required: true,
            index: true,
        },

        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
        },

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

export const ServiceCharge = model<IServiceCharge>("ServiceCharge", ServiceChargeSchema);