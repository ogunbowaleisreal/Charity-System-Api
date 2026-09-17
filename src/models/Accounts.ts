import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IAccount extends Document {
    // ===== BASIC AUTH =====
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    phoneNumber: string;
    password: string;

    role: "user" | "organization";

    provider: "local" | "google" | "apple";
    googleId?: string;
    appleId?: string;
    noOfCampaigns: number

    // ===== VERIFICATION =====
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;

    // ===== PASSWORD RESET =====
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;

    // ===== PROFILE (PERSONAL) =====
    fullName?: string;
    gender?: string;
    dateOfBirth?: Date;
    houseAddress?: string;
    country?: string;
    state?: string;
    visibility?: boolean;
    profilePicture?: string;

    // ===== PROFILE (ORG) =====
    companyName?: string;
    organizationType?: string;
    logo?: string;
    about?: string;
    businessAddress?: string;
    wallet: Types.ObjectId

    // ===== SOCIALS =====
    website?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    snapchat?: string;

    // ===== KYC =====
    kycStatus: "pending" | "verified";

    // personal KYC
    facialVerification?: string;
    bvn?: string;

    // org KYC
    cacDocument?: string;

    addressVerification?: string; // utility bill

    // ===== SECURITY =====
    twoFactorEnabled: boolean;
    twoFactorWithdrawalEnabled: boolean;
    isDeleted: boolean;
    //lastLogin?: Date;
    loginAttempts: number;
    lastLoginIp: string;
    lastLoginLocation: {};

    //======BANK DETAILS =======//
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;

    // ===== SYSTEM =====
    status: "active" | "suspended" | "deleted";
    isWalletPinSet: boolean
    isBankDetailCreated: boolean
    lastLogin?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
    {
        // ===== BASIC AUTH =====
        firstName: { type: String },
        lastName: { type: String },
        userName: {
            type: String,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            // unique: true,
        },

        password: {
            type: String,
            required: function (this: IAccount) {
                return this.provider === "local";
            },
        },
        // dateOfBirth: Date,

        role: {
            type: String,
            enum: ["user", "organization"],
            required: true,
        },

        provider: {
            type: String,
            enum: ["local", "google", "apple"],
            default: "local",
        },
        noOfCampaigns: {
            type: Number,
            default: 0
        },
        wallet: {
            type: Schema.Types.ObjectId,
            ref: "Wallet"
        },

        googleId: {
            type: String,
            default: null,
        },
        appleId: {
            type: String,
            default: null,
        },

        // ===== VERIFICATION =====
        isVerified: {
            type: Boolean,
            default: false,
        },
        twoFactorWithdrawalEnabled: {
            type: Boolean,
            default: false,
        },
        isWalletPinSet: {
            type: Boolean,
            default: false
        },
        isBankDetailCreated: {
            type: Boolean,
            default: false
        },

        otp: String,
        otpExpires: Date,

        // ===== PASSWORD RESET =====
        resetPasswordToken: String,
        resetPasswordExpires: Date,

        // ===== PROFILE (PERSONAL) =====
        fullName: String,
        gender: {
            type: String,
        },
        profilePicture: String,

        dateOfBirth: Date,
        houseAddress: String,
        country: String,
        state: String,

        visibility: {
            type: Boolean,
            default: true,
        },

        // ===== PROFILE (ORG) =====
        companyName: {
            type: String,
            required: function (this: IAccount) {
                return this.role === "organization";
            },
        },

        organizationType: {
            type: String,
            enum: ["NGO", "Governmental", "Hospital", "Church", "Orphanage", "Other"],
            required: function (this: IAccount) {
                return this.role === "organization";
            },
        },

        logo: {
            type: String,
            // required: function (this: IAccount) {
            //     return this.role === "organization";
            // },
        },
        about: {
            type: String,
            // required: function (this: IAccount) {
            //     return this.role === "organization";
            // }
        },
        businessAddress: {
            type: String,
            // required: function (this: IAccount) {
            //     return this.role === "organization";
            // },
        },


        // ===== SOCIALS =====
        website: String,
        instagram: String,
        facebook: String,
        x: String,
        tiktok: String,
        youtube: String,
        snapchat: String,

        // ===== KYC =====
        kycStatus: {
            type: String,
            enum: ["pending", "verified"],
            default: "pending",
        },

        facialVerification: String,
        bvn: {
            type: String,
            // required: function (this: IAccount) {
            //     return this.role === "user";
            // },
        },

        cacDocument: {
            type: String,
            // required: function (this: IAccount) {
            //     return this.role === "organization";
            // },
        },

        addressVerification: String,

        // =======BANK DETAILS =======//
        bankName: String,
        accountNumber: String,
        accountName: String,
        bankCode: String,

        // ===== SECURITY =====
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        // ===== SYSTEM =====
        status: {
            type: String,
            enum: ["active", "suspended", "deleted"],
            default: "active",
        },

        lastLogin: Date,
    },
    { timestamps: true }
);


// 🔥 Hide sensitive fields (same pattern you used)
AccountSchema.set("toJSON", {
    transform: function (doc, ret: any) {
        delete ret.password;
        delete ret.otp;
        delete ret.resetPasswordToken;
        delete ret.__v;
        return ret;
    },
});

export const Account = model<IAccount>("Account", AccountSchema);
