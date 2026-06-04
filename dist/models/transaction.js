"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
//import mongoose, { Schema } from "mongoose";
const WalletTransactionSchema = new mongoose_1.Schema({
    walletId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        //required: true,
    },
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        // required: true,
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
        //required: true,
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
        campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Campaign" },
        donationId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Donation" },
        withdrawalId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Withdrawal" },
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
}, {
    timestamps: true,
});
// Indexes for performance + safety
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ category: 1, status: 1 });
WalletTransactionSchema.index({
    status: 1,
    providerTransactionId: 1,
    createdAt: 1,
});
exports.WalletTransaction = mongoose_1.default.model("WalletTransaction", WalletTransactionSchema);
