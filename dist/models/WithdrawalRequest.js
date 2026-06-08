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
exports.WithdrawalRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WithdrawalRequestSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
        index: true,
    },
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
// 🔥 indexes
WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
exports.WithdrawalRequest = mongoose_1.default.model("WithdrawalRequest", WithdrawalRequestSchema);
