import mongoose, { Schema, model, Document } from "mongoose";

export interface IAccount extends Document {
    // ===== BASIC AUTH =====
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;

    role: "user" | "organization";

    provider: "local" | "google" | "apple";
    googleId?: string;
    appleId?: string;

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
    lastLogin?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
    {
        // ===== BASIC AUTH =====
        firstName: { type: String },
        lastName: { type: String },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            unique: true,
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
// import mongoose, { Schema, model, Document } from 'mongoose';
// import { BusinessCategory } from './BusinessCategory';

// export interface IUser extends Document {
//     firstName: string;
//     lastName: string;
//     email: string;
//     password?: string | null;
//     createdAt: Date;
//     updatedAt: Date;
//     //type: string;
//     picture?: string;
//     provider?: 'google' | 'local';
//     role: string;
//     //status: string;
//     phone: string;
//     gender: string;
//     companyName: string;
//     contactPerson: string
//     businessCategory: Schema.Types.ObjectId;
//     status: "pending" | "active" | "restricted" | "shadowBanned";
//     paystackCustomerId?: string;
//     paystackCustomerCode?: string;
//     googleId: string;
//     phoneCountryCode: string;
//     verified: boolean;
//     loginAttempts: number;
//     lastLoginIp: string;
//     lastLoginLocation: {};
//     workCountryPhoneCode: string;
//     lockUntil?: Date | null | undefined;
//     lastLogin?: Date;
//     kycStatus: "pending" | "completed"
//     assignedConsultant: Schema.Types.ObjectId;
//     experienceLevel: string;
//     passwordHistory: string[];
//     subscriptionTransactionReference: string,
//     deletedAt?: Date | null;
//     subscriptionStatus?: "active" | "cancelled" | "expired" | "pending" | "past_due";
//     subscriptionPlan?: "free" | "basic";
//     subscriptionStartDate?: Date;
//     subscriptionEndDate?: Date;
//     suspensionEndDate?: Date | null;
//     paystackAuthorizationToken: string;
// }

// const accountSchema = new Schema<IUser>({
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     picture: { type: String, required: false },
//     companyName: {
//         type: "String",
//         required: function (this: IUser) {
//             return this.role == "client"
//         }
//     },
//     // assignedConsultant: {
//     //     type: Schema.Types.ObjectId,
//     //     ref: "Account",
//     //     validate: {
//     //         validator: function (this: IUser) {
//     //             return this.role == "client"
//     //         }
//     //     }
//     // },
//     // experienceLevel: {
//     //     type: "String",
//     //     enum: ["Intern", "Junior", "Intermediate", "Senior", "Executive"],
//     //     required: function (this: IUser) {
//     //         return this.role == "consultant"
//     //     }
//     // },
//     businessCategory: {
//         type: Schema.Types.ObjectId,
//         ref: "BusinessCategory",
//         required: function (this: IUser) {
//             return this.role == "client"
//         },
//         validate: {
//             validator: async function (value: string) {
//                 // Only validate if role is client
//                 if (this.role !== "client") return true;

//                 // Check if the category exists in the DB
//                 const category = await BusinessCategory.findById(value);
//                 return !!category; // true if found, false otherwise
//             },
//             message: (props: any) => `Business category '${props.value}' does not exist.`
//         }
//     },
//     phoneCountryCode: {
//         type: "String",
//         required: true
//     },
//     workCountryPhoneCode: {
//         type: "String",

//     },
//     contactPerson: {
//         type: String,
//         required: false,
//         default: null
//     },
//     kycStatus: {
//         type: "String",
//         enum: ["pending", "completed"],
//         default: "pending"
//     },
//     phone: {
//         type: "String",
//         required: true,
//     },
//     gender: {
//         type: "String",
//         required: function (this: IUser) {
//             return this.role == "consultant"
//         }
//     },
//     lastLogin: {
//         type: Date
//     },
//     lastLoginIp: {
//         type: String,
//         default: null
//     },
//     lastLoginLocation: {
//         type: {},
//         default: null
//     },
//     status: {
//         type: String,
//         enum: ["pending", "active", "suspended", "shadowBanned"],
//         default: "active"
//     },
//     paystackCustomerCode: {
//         type: String,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     paystackCustomerId: {
//         type: String,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     paystackAuthorizationToken: {
//         type: String,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     subscriptionPlan: {
//         type: Schema.Types.ObjectId,
//         //enum: ["free", "Essential", "Growth", "Premium"],
//         ref: "Plan",
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     subscriptionStartDate: {
//         type: Date,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     subscriptionEndDate: {
//         type: Date,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     subscriptionTransactionReference: {
//         type: String,
//         validate: {
//             validator: function (this: IUser) {
//                 return this.role == "client"
//             }
//         }
//     },
//     subscriptionStatus: {
//         type: String,
//         enum: ["none", "active", "expired", "cancelled", "past_due", "non_renewing"],
//         default: "none"
//     },
//     // subscriptionPlan: {
//     //     type: String,
//     //     enum: ["essential", "growth", "premium", null],
//     //     default: null
//     // },
//     //type: { type: String, enum: ["client", "consultant"], required: true },
//     provider: { type: String, enum: ['google', 'local'], default: 'local' },
//     role: { type: String, enum: ["client", "consultant"], required: true },
//     googleId: { type: String, default: null, required: false },
//     verified: { type: Boolean }
// }, { timestamps: true });
// accountSchema.set("toJSON", {
//     transform: function (doc, ret: any) {
//         delete ret.password;
//         delete ret.passwordHistory;
//         delete ret.lockUntil;
//         delete ret.deletedAt;

//         // Paystack sensitive fields
//         delete ret.paystackCustomerCode;
//         delete ret.paystackCustomerId;

//         // Internal fields
//         delete ret.__v;

//         return ret;
//     }
// });

// export const Account = model<IUser>('Account', accountSchema);