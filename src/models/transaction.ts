import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
    user?: Types.ObjectId;
    subscription?: Types.ObjectId;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: Date;
    plan?: string;
    transactionReference?: string;
    transactionId?: string;
    subscriptionTempId: string
    customer: string;
    intent: string;
    type: string;
    channel?: string;
    intentId?: string;
    startDate?: Date;
    expiryDate?: Date;
    createdAt: Date;
    metadata?: Record<string, any>;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        user: { type: Schema.Types.ObjectId, ref: "Account", index: true },

        subscription: { type: Schema.Types.ObjectId, ref: "ClientSubscription" },

        subscriptionTempId: { type: String },

        plan: { type: Schema.Types.ObjectId, ref: "Plan" },

        intentId: { type: String },

        reference: { type: String, required: true, unique: true },

        amount: { type: Number, required: true },

        type: { type: String, required: true },

        currency: { type: String, default: "NGN" },
        customer: {},

        status: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
            required: true,
        },

        channel: { type: String },

        metadata: { type: Schema.Types.Mixed },

        startDate: Date,
        expiryDate: Date,
    },
    { timestamps: true }
);


// const TransactionSchema = new Schema<ITransaction>({
//     user: { type: Schema.Types.ObjectId, ref: "Account" },
//     //plan: { type: Schema.Types.ObjectId, ref: "Plan" },
//     subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
//     reference: { type: String, required: true, unique: true },
//     amount: { type: Number, required: true },
//     plan: { type: Schema.Types.ObjectId, ref: "Plan" },
//     transactionReference: { type: String },
//     currency: { type: String, default: "NGN" },
//     status: {
//         type: String,
//         enum: ["Ongoing", "Completed", "Failed"],
//         required: true
//     },
//     startDate: Date,
//     expiryDate: Date,
//     //paidAt: Date,
// }, { timestamps: true });

export default model<ITransaction>("Transaction", TransactionSchema);