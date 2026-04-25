import { Schema, Document, Types, model } from "mongoose";

export interface IDonation extends Document {
    campaign: Types.ObjectId;

    donor?: Types.ObjectId; // optional (anonymous users)
    donorName?: string;     // snapshot (important!)

    amount: number;

    serviceFee: number;

    netAmount: number;

    currency: string;

    // ===== PAYMENT =====
    paymentProvider: "safe haven" | "google pay" | "manual";
    reference: string; // unique (VERY IMPORTANT)
    paymentStatus: "pending" | "success" | "failed";

    // ===== OPTIONS =====
    isAnonymous: boolean;

    // ===== METADATA =====
    message?: string; // optional donor message

    // ===== SYSTEM =====
    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;

    // =========================
    // 🔴 NEW: PROVIDER TRACKING (SAFEHAVEN FLOW)
    // =========================
    providerTransactionId: string; // NEW - ID from SafeHaven
    providerReference: string; // NEW - external payment reference

    // =========================
    // 🔴 NEW: IDEMPOTENCY / SAFETY
    // =========================
    idempotencyKey: string; // NEW - prevents duplicate payments/webhooks

    type: "user" | "guest",

    // =========================
    // 🔴 NEW: PAYMENT FLOW STATE MACHINE
    // =========================
    paymentStatusExtended:
    | "initialized"
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | "reversed"; // NEW - more accurate lifecycle

    settlementStatus: "unsettled" | "settled" | "failed"; // NEW

    allocationStatus:
    | "unallocated"
    | "allocated_to_campaign"
    | "reversed"; // NEW

    // =========================
    // 🔴 NEW: TIMESTAMPS FOR RECONCILIATION
    // =========================
    paidAt?: Date; // NEW
    settledAt?: Date; // NEW
    allocatedAt?: Date; // NEW

    // =========================
    // 🔴 NEW: PAYMENT METHOD DETAILS
    // =========================
    paymentMethod: "card" | "bank_transfer" | "virtual_account"; // NEW
    sourceBank?: string; // NEW
    sourceAccountLast4?: string; // NEW

    // =========================
    // 🔴 NEW: DONOR SNAPSHOT (AUDIT SAFETY)
    // =========================
    donorEmailSnapshot?: string; // NEW
    donorPhoneSnapshot?: string; // NEW

    // =========================
    // 🔴 NEW: FRAUD / SECURITY
    // =========================
    ipAddress?: string; // NEW
    userAgent?: string; // NEW
    deviceFingerprint?: string; // NEW

    // =========================
    // 🔴 NEW: GEO INFO (OPTIONAL)
    // =========================
    geoLocation?: {
        country: string;
        region: string;
    }; // NEW
}

const DonationSchema = new Schema<IDonation>(
    {
        campaign: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },

        donor: {
            type: Schema.Types.ObjectId,
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
            enum: ["safe haven", "google pay", "manual"],
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
        idempotencyKey: {
            type: String,
            required: true,
        },

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
    },
    { timestamps: true }
);

export const Donation = model<IDonation>("Donation", DonationSchema);
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