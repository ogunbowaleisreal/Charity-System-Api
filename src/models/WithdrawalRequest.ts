import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWithdrawalRequest extends Document {
    // =========================
    // 👤 USER INFO
    // =========================
    userId: Types.ObjectId;
    campaignId?: Types.ObjectId;

    // =========================
    // 💰 FINANCIAL
    // =========================
    amount: number;
    currency: string;

    // snapshot (VERY IMPORTANT for audit)
    availableBalanceAtRequest: number;

    // =========================
    // 🏦 BANK DETAILS (FLUTTERWAVE READY)
    // =========================
    bankDetails: {
        bankCode: string;        // Flutterwave account_bank
        accountNumber: string;
        accountName: string;     // beneficiary_name
    };

    narration: string;           // transfer narration

    // =========================
    // 🔄 STATUS FLOW
    // =========================
    status:
    | "pending"
    | "approved"
    | "processing"
    | "completed"
    | "rejected"
    | "failed";

    // =========================
    // 👮 ADMIN ACTIONS
    // =========================
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;

    rejectionReason?: string;

    // =========================
    // 🔗 PAYMENT / PROVIDER TRACKING
    // =========================
    reference: string; // internal reference
    providerReference?: string;
    providerTransactionId?: string;

    // =========================
    // 🔁 SAFETY / IDEMPOTENCY
    // =========================
    idempotencyKey: string;

    // =========================
    // 📅 TIMESTAMPS
    // =========================
    processedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
            index: true,
        },

        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            index: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "NGN",
        },

        availableBalanceAtRequest: {
            type: Number,
            required: true,
        },

        bankDetails: {
            bankCode: { type: String, required: true },
            accountNumber: { type: String, required: true },
            accountName: { type: String, required: true },
        },

        narration: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "processing",
                "completed",
                "rejected",
                "failed",
            ],
            default: "pending",
            index: true,
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
        },

        reviewedAt: Date,
        rejectionReason: String,

        reference: {
            type: String,
            //   required: true,
            unique: true,
            index: true,
        },

        providerReference: String,
        providerTransactionId: String,

        // idempotencyKey: {
        //     type: String,
        //     // required: true,
        //     unique: true,
        // },

        processedAt: Date,
    },
    { timestamps: true }
);

// 🔥 indexes
WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
    "WithdrawalRequest",
    WithdrawalRequestSchema
);