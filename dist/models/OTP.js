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
exports.OTP = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const otpSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 6,
        match: /^\d{6}$/,
    },
    type: {
        type: String,
        required: true,
        enum: ["registration", "password_reset", "email_change", "2fa"],
        index: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    maxAttempts: {
        type: Number,
        default: 3,
    },
    isUsed: {
        type: Boolean,
        default: false,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        //  index: { expireAfterSeconds: 0 },
    },
}, {
    timestamps: true,
    collection: "otps",
});
// Compound indexes for better query performance
otpSchema.index({ email: 1, type: 1, isUsed: 1 });
otpSchema.index({ email: 1, type: 1, expiresAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Method to verify OTP
otpSchema.methods.verify = async function (inputOtp) {
    // Check if OTP is expired
    if (this.expiresAt < new Date()) {
        return { success: false, error: "OTP has expired" };
    }
    // Check if OTP is already used
    if (this.isUsed) {
        return { success: false, error: "OTP has already been used" };
    }
    // Check if max attempts exceeded
    if (this.attempts >= this.maxAttempts) {
        return { success: false, error: "Maximum OTP attempts exceeded" };
    }
    // Increment attempts
    this.attempts += 1;
    await this.save();
    // Check if OTP matches
    if (this.otp !== inputOtp) {
        return { success: false, error: "Invalid OTP" };
    }
    // Mark as used
    this.isUsed = true;
    await this.save();
    return { success: true };
};
// Method to check if OTP is valid (without marking as used)
otpSchema.methods.isValid = function () {
    return (!this.isUsed &&
        this.expiresAt > new Date() &&
        this.attempts < this.maxAttempts);
};
// Static method to find valid OTP
otpSchema.statics.findValidOTP = function (email, type) {
    return this.findOne({
        email: email.toLowerCase(),
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: this.maxAttempts || 3 },
    });
};
// Static method to invalidate all OTPs for email and type
otpSchema.statics.invalidateOTPs = async function (email, type) {
    return this.updateMany({ email: email.toLowerCase(), type, isUsed: false }, { $set: { isUsed: true } });
};
// Static method to clean expired OTPs
otpSchema.statics.cleanExpiredOTPs = async function () {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            {
                isUsed: true,
                updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        ],
    });
};
// Static method to create new OTP (invalidates existing ones)
otpSchema.statics.createOTP = async function (email, type, expiryMinutes) {
    // Invalidate existing OTPs
    await this.invalidateOTPs(email, type);
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiry
    const defaultExpiry = type === "password_reset" ? 15 : 10; // 15 min for password reset, 10 min for others
    const expiryTime = expiryMinutes || defaultExpiry;
    const expiresAt = new Date(Date.now() + expiryTime * 60 * 1000);
    // Create and save new OTP
    const newOTP = new this({
        email: email.toLowerCase(),
        otp,
        type,
        expiresAt,
    });
    return await newOTP.save();
};
// Static method to get OTP statistics
otpSchema.statics.getOTPStats = async function (email, type, timeframe = 24) {
    const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    const stats = await this.aggregate([
        {
            $match: {
                email: email.toLowerCase(),
                type,
                createdAt: { $gte: since },
            },
        },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                successfulVerifications: {
                    $sum: { $cond: [{ $eq: ["$isUsed", true] }, 1, 0] },
                },
                totalAttempts: { $sum: "$attempts" },
                averageAttempts: { $avg: "$attempts" },
            },
        },
    ]);
    return (stats[0] || {
        totalRequests: 0,
        successfulVerifications: 0,
        totalAttempts: 0,
        averageAttempts: 0,
    });
};
// Pre-save middleware to set expiry if not set
otpSchema.pre("save", function (next) {
    if (this.isNew && !this.expiresAt) {
        const defaultExpiry = this.type === "password_reset" ? 15 : 10;
        this.expiresAt = new Date(Date.now() + defaultExpiry * 60 * 1000);
    }
    next();
});
// Transform JSON output
otpSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.otp;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.OTP = mongoose_1.default.model("OTP", otpSchema);
exports.default = exports.OTP;
