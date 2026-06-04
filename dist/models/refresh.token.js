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
exports.RefreshToken = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const refreshTokenSchema = new mongoose_1.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['user', 'organization', 'admin']
    },
    token: {
        type: String,
        required: true,
        select: false // Don't include in queries by default
    },
    deviceInfo: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    lastUsed: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'refresh_tokens'
});
// Compound indexes for better query performance
refreshTokenSchema.index({ userId: 1, isActive: 1 });
refreshTokenSchema.index({ userId: 1, userType: 1, isActive: 1 });
refreshTokenSchema.index({ tokenId: 1, isActive: 1 });
//refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Method to deactivate token
refreshTokenSchema.methods.deactivate = async function () {
    this.isActive = false;
    await this.save();
};
// Method to update last used
refreshTokenSchema.methods.updateLastUsed = async function () {
    this.lastUsed = new Date();
    await this.save();
};
// Static method to find active token
refreshTokenSchema.statics.findActiveToken = function (tokenId) {
    return this.findOne({ tokenId, isActive: true, expiresAt: { $gt: new Date() } });
};
// Static method to deactivate all user tokens
refreshTokenSchema.statics.deactivateAllUserTokens = async function (userId, userType) {
    return this.updateMany({ userId, userType, isActive: true }, { $set: { isActive: false } });
};
// Static method to clean expired tokens
refreshTokenSchema.statics.cleanExpiredTokens = async function () {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { isActive: false, updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days old inactive tokens
        ]
    });
};
// Static method to get user active sessions
refreshTokenSchema.statics.getUserActiveSessions = function (userId, userType) {
    return this.find({
        userId,
        userType,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).select('tokenId deviceInfo ipAddress lastUsed createdAt');
};
// Transform JSON output
refreshTokenSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.token;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});
// Pre-save middleware to set expiry if not set
refreshTokenSchema.pre('save', function (next) {
    if (this.isNew && !this.expiresAt) {
        const expiryDays = parseInt(process.env.JWT_REFRESH_EXPIRES_IN?.replace('d', '') || '30');
        this.expiresAt = new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000));
    }
    next();
});
exports.RefreshToken = mongoose_1.default.model('RefreshToken', refreshTokenSchema);
exports.default = exports.RefreshToken;
// import mongoose, { Schema, model, Document } from "mongoose";
// interface IRefreshToken extends Document {
//     userId?: mongoose.Types.ObjectId;
//     adminId?: mongoose.Types.ObjectId;
//     hashedToken: string;
//     revoked: boolean;
//     createdAt: Date;
//     expiresAt: Date;
// }
// const RefreshTokenSchema = new Schema<IRefreshToken>({
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
//     hashedToken: { type: String, required: true, unique: true },
//     revoked: { type: Boolean, default: false },
//     expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
// }
//     , { timestamps: true });
// export const refreshToken = model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
