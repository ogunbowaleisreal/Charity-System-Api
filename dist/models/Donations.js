"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Donation = void 0;
const mongoose_1 = require("mongoose");
const DonationSchema = new mongoose_1.Schema({
    campaign: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Campaign",
        required: true,
        index: true,
    },
    donor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        default: null,
    },
    donorName: {
        type: String,
        default: null,
    },
    amount: {
        type: Number,
        required: true,
    },
    serviceFee: {
        type: Number,
        default: 0,
    },
    netAmount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "NGN",
    },
    type: {
        type: String,
        enum: ["user", "guest"],
        required: true,
    },
    // ===== PAYMENT =====
    paymentProvider: {
        type: String,
        enum: ["safe haven", "flutterwave", "google pay", "manual"],
        required: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
        index: true,
    },
    // ===== OPTIONS =====
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    message: {
        type: String,
        maxlength: 300,
    },
    // ===== SYSTEM =====
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // =========================
    // 🔴 NEW: PROVIDER TRACKING
    // =========================
    providerTransactionId: String,
    providerReference: String,
    // =========================
    // 🔴 NEW: IDEMPOTENCY
    // =========================
    // idempotencyKey: {
    //     type: String,
    //     required: true,
    // },
    // =========================
    // 🔴 NEW: PAYMENT FLOW STATE
    // =========================
    paymentStatusExtended: {
        type: String,
        enum: [
            "initialized",
            "pending",
            "processing",
            "success",
            "failed",
            "reversed",
        ],
        default: "initialized",
    },
    settlementStatus: {
        type: String,
        enum: ["unsettled", "settled", "failed"],
        default: "unsettled",
    },
    allocationStatus: {
        type: String,
        enum: ["unallocated", "allocated_to_campaign", "reversed"],
        default: "unallocated",
    },
    // =========================
    // 🔴 NEW: TIMESTAMPS
    // =========================
    paidAt: Date,
    settledAt: Date,
    allocatedAt: Date,
    // =========================
    // 🔴 NEW: PAYMENT METHOD
    // =========================
    paymentMethod: {
        type: String,
        enum: ["card", "bank_transfer", "virtual_account", "google_pay"],
    },
    sourceBank: String,
    sourceAccountLast4: String,
    // =========================
    // 🔴 NEW: DONOR SNAPSHOT
    // =========================
    donorEmailSnapshot: String,
    donorPhoneSnapshot: String,
    // =========================
    // 🔴 NEW: FRAUD DATA
    // =========================
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    // =========================
    // 🔴 NEW: GEO DATA
    // =========================
    geoLocation: {
        country: String,
        region: String,
    },
}, { timestamps: true });
exports.Donation = (0, mongoose_1.model)("Donation", DonationSchema);
// import { Schema, Document, Types, model } from "mongoose";
// export interface IDonation extends Document {
//     campaign: Types.ObjectId;
//     donor?: Types.ObjectId; // optional (anonymous users)
//     donorName?: string;     // snapshot (important!)
//     amount: number;
//     currency: string;
//     // ===== PAYMENT =====
//     paymentProvider: "safe haven" | "google pay" | "manual";
//     transactionRef: string; // unique (VERY IMPORTANT)
//     paymentStatus: "pending" | "success" | "failed";
//     // ===== OPTIONS =====
//     isAnonymous: boolean;
//     // ===== METADATA =====
//     message?: string; // optional donor message
//     // ===== SYSTEM =====
//     isDeleted: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }
// const DonationSchema = new Schema<IDonation>(
//     {
//         campaign: {
//             type: Schema.Types.ObjectId,
//             ref: "Campaign",
//             required: true,
//             index: true,
//         },
//         donor: {
//             type: Schema.Types.ObjectId,
//             ref: "Account",
//             default: null,
//         },
//         donorName: {
//             type: String,
//             default: null,
//         },
//         amount: {
//             type: Number,
//             required: true,
//         },
//         currency: {
//             type: String,
//             default: "NGN",
//         },
//         // ===== PAYMENT =====
//         paymentProvider: {
//             type: String,
//             enum: ["safe haven", "google pay", "manual"],
//             required: true,
//         },
//         transactionRef: {
//             type: String,
//             required: true,
//             unique: true, // 🔥 prevents duplicate webhook issues
//         },
//         paymentStatus: {
//             type: String,
//             enum: ["pending", "success", "failed"],
//             default: "pending",
//             index: true,
//         },
//         // ===== OPTIONS =====
//         isAnonymous: {
//             type: Boolean,
//             default: false,
//         },
//         message: {
//             type: String,
//             maxlength: 300,
//         },
//         // ===== SYSTEM =====
//         isDeleted: {
//             type: Boolean,
//             default: false,
//         },
//     },
//     { timestamps: true }
// );
// export const Donation = model<IDonation>("Donation", DonationSchema);
