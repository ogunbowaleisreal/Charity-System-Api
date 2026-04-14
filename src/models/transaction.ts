import mongoose, { Schema, Document, Types } from "mongoose";

//import { Document, Types } from "mongoose";

export interface IWalletTransaction extends Document {
    walletId: Types.ObjectId;

    type: "credit" | "debit";

    category: "donation" | "withdrawal" | "refund" | "adjustment" | "bonus";

    status: "pending" | "processing" | "successful" | "failed";

    amount: number;

    currency: string;

    grossAmount: number;

    serviceCharge: number;

    vat: number;

    netAmount: number;

    method: "card" | "bank_transfer" | "wallet";

    reference: string; // internal idempotency key

    providerReference?: string; // Safe Haven reference

    bankDetails?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };

    metadata?: {
        campaignId?: Types.ObjectId;
        donationId?: Types.ObjectId;
        withdrawalId?: Types.ObjectId;
    };

    balanceBefore: number;
    balanceAfter: number;

    createdAt: Date;
    updatedAt: Date;
}

//import mongoose, { Schema } from "mongoose";

const WalletTransactionSchema = new Schema<IWalletTransaction>(
    {
        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },

        category: {
            type: String,
            enum: ["donation", "withdrawal", "refund", "adjustment", "bonus"],
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "processing", "successful", "failed"],
            default: "pending",
            index: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            required: true,
            default: "NGN",
        },

        grossAmount: {
            type: Number,
            required: true,
        },

        serviceCharge: {
            type: Number,
            default: 0,
        },

        vat: {
            type: Number,
            default: 0,
        },

        netAmount: {
            type: Number,
            required: true,
        },

        method: {
            type: String,
            enum: ["card", "bank_transfer", "wallet"],
            required: true,
        },

        reference: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        providerReference: {
            type: String,
            index: true,
        },

        bankDetails: {
            bankName: { type: String },
            accountNumber: { type: String },
            accountName: { type: String },
        },

        metadata: {
            campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
            donationId: { type: Schema.Types.ObjectId, ref: "Donation" },
            withdrawalId: { type: Schema.Types.ObjectId, ref: "Withdrawal" },
        },

        balanceBefore: {
            type: Number,
            required: true,
        },

        balanceAfter: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance + safety
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ category: 1, status: 1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
);

