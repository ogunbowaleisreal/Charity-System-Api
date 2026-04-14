import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWallet extends Document {
    userId: Types.ObjectId;
    currency: string;
    availableBalance: number;
    pendingBalance: number;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
        currency: { type: String, default: "NGN" },
        availableBalance: { type: Number, default: 0 },
        pendingBalance: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);