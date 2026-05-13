import mongoose, { Schema, Document, Types } from "mongoose";
import { number } from "zod";
import { required } from "zod/mini";

//import { Document, Types } from "mongoose";

export interface IWalletTransaction extends Document {
    walletId: Types.ObjectId;

    type: "credit" | "debit";

    category: "donation" | "withdrawal" | "refund" | "adjustment" | "bonus";

    status: "pending" | "processing" | "successful" | "failed" | "expired";

    amount: number;
    userId: Types.ObjectId

    currency: string;
    campaignId?: Types.ObjectId
    gratuityPercentage: number
    gratuityAmount: number

    grossAmount: number;

    fullName: string;

    serviceCharge: number;

    vat: number;

    provider: "flutterwave" | "googlepay" | "safehaven";
    netAmount: number;

    method: "card" | "bank_transfer" | "wallet";

    reference: string; // internal idempotency key

    providerReference?: string; // Safe Haven reference
    providerTransactionId: number;

    bankDetails?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };

    metadata?: {
        campaignId?: Types.ObjectId;
        donationId?: Types.ObjectId;
        withdrawalId?: Types.ObjectId;
        donationAmount: number //amountData.donationAmount,
        gratuityAmount: number //amountData.gratuityAmount,
        gratuityPercentage: number //amountData.gratuityPercentage,
        totalAmount: number
        purposeTitle: string
        feeType: string,
        feeValue: number
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
            required: false,
            index: true,
        },

        type: {
            type: String,
            enum: ["user", "guest"],
            required: true,
        },

        category: {
            type: String,
            enum: ["donation", "withdrawal", "refund", "adjustment", "bonus", "wallet_credit", "wallet_debit", "campaign_credit"],
            required: true,
            index: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            //required: true,
        },
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: false,
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "processing", "successful", "failed", "expired"],
            default: "pending",
            index: true,
        },
        fullName: {
            type: String,
            required: true,
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
        gratuityPercentage: {
            type: Number,
            default: 0,
        },
        gratuityAmount: {
            type: Number,
            default: 0,
        },

        method: {
            type: String,
            enum: ["card", "bank_transfer", "wallet"],
            required: true,
        },

        provider: {
            type: String,
            enum: ["flutterwave", "googlepay"],
            required: true
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

        providerTransactionId: {
            type: Number,
            index: true,
            default: null
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
            donationAmount: { type: Number },
            gratuityAmount: { type: Number },
            gratuityPercentage: { type: Number },
            totalAmount: { type: Number },
            feeType: { type: String },
            feeValue: { type: Number },
        },

        balanceBefore: {
            type: Number,
            //required: true,
        },

        balanceAfter: {
            type: Number,
            // required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance + safety
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ category: 1, status: 1 });
WalletTransactionSchema.index({
    status: 1,
    providerTransactionId: 1,
    createdAt: 1,
});

export const WalletTransaction = mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
);

