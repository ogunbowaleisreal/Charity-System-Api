"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CampaignSchema = new mongoose_1.Schema({
    // ===== BASIC =====
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Category",
    },
    authors: [{
            type: mongoose_1.Schema.Types.ObjectId,
            trim: true,
            ref: "Account",
            required: true,
        }],
    tags: [{
            type: mongoose_1.Schema.Types.ObjectId,
            trim: true,
            ref: "Tag",
            required: true,
        }],
    // ===== OWNER =====
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    ownerType: {
        type: String,
        enum: ["user", "organization"],
        required: true,
    },
    // ===== FUNDING =====
    targetAmount: {
        type: Number,
        required: true,
    },
    totalRaised: {
        type: Number,
        default: 0,
    },
    donationCount: {
        type: Number,
        default: 0,
    },
    // ===== TIME =====
    startDate: {
        type: Date,
        required: true,
    },
    // startImmediately: {
    //     type: Boolean,
    //     default: false,
    // },
    endDate: {
        type: Date,
        required: true,
    },
    // ===== STATUS =====
    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // ===== SETTINGS =====
    allowComments: {
        type: Boolean,
        default: true,
    },
    showDonations: {
        type: Boolean,
        default: true,
    },
    // ===== META =====
    views: {
        type: Number,
        default: 0,
    },
    shares: {
        type: Number,
        default: 0,
    },
    // ===== SOFT DELETE =====
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // =========================
    // 🔴 NEW: FINANCIAL / LEDGER FIELDS
    // =========================
    totalWithdrawn: {
        type: Number,
        default: 0,
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
    pendingWithdrawals: {
        type: Number,
        default: 0,
    },
    frozenBalance: {
        type: Number,
        default: 0,
    },
    // =========================
    // 🔴 NEW: PAYOUT DETAILS
    // =========================
    payoutAccount: {
        bankCode: String,
        accountNumber: String,
        accountName: String,
    },
    // =========================
    // 🔴 NEW: RISK / COMPLIANCE
    // =========================
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
    },
    isFlagged: {
        type: Boolean,
        default: false,
    },
    flagReason: {
        type: String,
    },
}, { timestamps: true });
CampaignSchema.pre("save", function (next) {
    const now = new Date();
    if (now < this.startDate) {
        this.status = "upcoming";
    }
    else if (now >= this.startDate && now <= this.endDate) {
        this.status = "ongoing";
    }
    else {
        this.status = "completed";
    }
    next();
});
exports.default = (0, mongoose_1.model)("Campaign", CampaignSchema);
// import mongoose, { Schema, model, Document, Types } from "mongoose";
// export interface ICampaign extends Document {
//     // ===== BASIC =====
//     title: string;
//     description: string;
//     image: string;
//     category: string;
//     tags: string[];
//     // ===== OWNER =====
//     owner: Types.ObjectId; // Account
//     ownerType: "user" | "organization";
//     // ===== FUNDING =====
//     targetAmount: number;
//     totalRaised: number;
//     donationCount: number;
//     // ===== TIME =====
//     startDate: Date;
//     endDate: Date;
//     // ===== STATUS =====
//     status: "upcoming" | "ongoing" | "completed";
//     isActive: boolean; // can be toggled manually
//     // ===== SETTINGS =====
//     allowComments: boolean;
//     showDonations: boolean;
//     // ===== META =====
//     views: number;
//     shares: number;
//     // ===== SOFT DELETE =====
//     isDeleted: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }
// const CampaignSchema = new Schema<ICampaign>(
//     {
//         // ===== BASIC =====
//         title: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         description: {
//             type: String,
//             required: true,
//         },
//         image: {
//             type: String,
//             required: true,
//         },
//         category: {
//             type: String,
//             required: true,
//         },
//         tags: [String],
//         // ===== OWNER =====
//         owner: {
//             type: Schema.Types.ObjectId,
//             ref: "Account",
//             required: true,
//         },
//         ownerType: {
//             type: String,
//             enum: ["user", "organization"],
//             required: true,
//         },
//         // ===== FUNDING =====
//         targetAmount: {
//             type: Number,
//             required: true,
//         },
//         totalRaised: {
//             type: Number,
//             default: 0,
//         },
//         donationCount: {
//             type: Number,
//             default: 0,
//         },
//         // ===== TIME =====
//         startDate: {
//             type: Date,
//             required: true,
//         },
//         endDate: {
//             type: Date,
//             required: true,
//         },
//         // ===== STATUS =====
//         status: {
//             type: String,
//             enum: ["upcoming", "ongoing", "completed"],
//             default: "upcoming",
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//         },
//         // ===== SETTINGS =====
//         allowComments: {
//             type: Boolean,
//             default: true,
//         },
//         showDonations: {
//             type: Boolean,
//             default: true,
//         },
//         // ===== META =====
//         views: {
//             type: Number,
//             default: 0,
//         },
//         shares: {
//             type: Number,
//             default: 0,
//         },
//         // ===== SOFT DELETE =====
//         isDeleted: {
//             type: Boolean,
//             default: false,
//         },
//     },
//     { timestamps: true }
// );
// CampaignSchema.pre("save", function (next) {
//     const now = new Date();
//     if (now < this.startDate) {
//         this.status = "upcoming";
//     } else if (now >= this.startDate && now <= this.endDate) {
//         this.status = "ongoing";
//     } else {
//         this.status = "completed";
//     }
//     next();
// });
// export default model<ICampaign>("Campaign", CampaignSchema);
