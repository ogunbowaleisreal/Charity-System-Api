import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWallet extends Document {
    userId: Types.ObjectId;
    campaignId?: Types.ObjectId;
    currency: string;
    availableBalance: number;
    lockedBalance: number;
    walletPin: string
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
        campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
        currency: { type: String, default: "NGN" },
        walletPin: { type: String, select: false },
        availableBalance: { type: Number, default: 0 },
        lockedBalance: { type: Number, default: 0 },
        isLocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);