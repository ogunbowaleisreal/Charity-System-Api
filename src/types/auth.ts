import { Request } from "express";
import mongoose from "mongoose";

export interface JWTPayload {
    id: string;
    userId: string;
    email: string;
    subscriptionPlan?: "free" | "standard";
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    //subscriptionStatus:string
    status?:
    | "active"
    | "pending_verification"
    | "suspended"
    | "deactivated"
    | "incomplete_profile"
    | "deleted";
    role: string;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    deviceInfo?: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
    subscription?: {
        plan: "free" | "standard";

        currentPeriod: {
            start: Date;
            end: Date | null;
        };
        isExpired: boolean;
        daysUntilExpiry: number;
    };
    isDraftOperation?: boolean;
}

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "client";
    companyName?: string;
    phone?: string;
}

export interface InitiateListingCreationRequest {
    businessName: string;
    businessPhone: string;
    businessCategory: string;
    address: string;
    state: string;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface GoogleAuthProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    verified: boolean;
}

export interface AuthResponse {
    message?: string;
    success?: boolean;
    statusCode?: number;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isVerified?: boolean;
        //twoFactorEnabled?: boolean;
        phone?: string;
        location?: string;
        businessName?: string;
        businessPhone?: string;
        businessCategory?: string;
        businessAddress?: string;
        gender?: string;
        status?: string;
        profilePicture?: string;
        totalViews?: number;
        totalListings?: number;
        averageRating?: number;
        totalReviews?: number;
        subscriptionPlan?: string;
        subscriptionStartDate?: Date;
        subscriptionEndDate?: Date | null;
        //orderNotifications?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    };
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
