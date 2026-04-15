import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWallet extends Document {
    userId: Types.ObjectId;
    campaignId?: Types.ObjectId;
    currency: string;
    availableBalance: number;
    pendingBalance: number;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
        campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
        currency: { type: String, default: "NGN" },
        availableBalance: { type: Number, default: 0 },
        pendingBalance: { type: Number, default: 0 },
        isLocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);