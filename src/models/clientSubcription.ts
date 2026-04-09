import mongoose, { Schema, model, Document } from "mongoose";

export interface IClientSubscription extends Document {
    clientId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;

    paystackCustomerCode?: string;
    paystackSubscriptionCode?: string | null;
    paystackAuthorizationToken?: string;

    status: "active" | "expired" | "pending" | "past_due" | "cancelled" | "non_renewing";

    currentPeriod: {
        start: Date;
        end: Date | null;
    };
    intentId?: string;
    emailToken?: string;
    type: string;

    autoRenew: boolean;

    transactionReference?: string;
    nextPaymentDate?: Date;

    lastInvoiceCode?: string;
    lastInvoiceAmount?: number;
    lastPaidAt?: Date;

    cancelledAt?: Date;
    cancelReason?: string;

    trialStart?: Date;
    trialEnd?: Date;

    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const clientSubscriptionSchema = new Schema<IClientSubscription>(
    {
        clientId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
            index: true,
        },

        planId: {
            type: Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },

        paystackCustomerCode: String,
        paystackSubscriptionCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        paystackAuthorizationToken: String,

        status: {
            type: String,
            enum: ["active", "non_renewing", "expired", "pending"],
            default: "pending",
            index: true,
        },
        intentId: String,

        currentPeriod: {
            start: { type: Date },
            end: { type: Date },
        },

        autoRenew: { type: Boolean, default: false },

        // Only this should be unique
        transactionReference: {
            type: String,
            unique: true,
            sparse: true,
        },

        type: {
            type: String,
            default: null,
        },

        nextPaymentDate: Date,

        lastInvoiceCode: String,
        lastInvoiceAmount: Number,
        lastPaidAt: Date,

        cancelledAt: Date,
        cancelReason: String,

        trialStart: Date,
        trialEnd: Date,
        emailToken: String,

        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        collection: "client_subscriptions",
    }
);

// Correct index
clientSubscriptionSchema.index({ clientId: 1, status: 1 });
clientSubscriptionSchema.index({ status: 1, nextPaymentDate: 1 });

export const ClientSubscription = model<IClientSubscription>(
    "ClientSubscription",
    clientSubscriptionSchema
);
