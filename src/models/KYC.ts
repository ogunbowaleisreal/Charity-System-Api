import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IKYC extends Document {
    userId: Types.ObjectId;

    type: "personal" | "organization";

    // ===== KYC DATA =====
    bvn?: string;
    facialImage?: string;
    cacDocument?: string;
    utilityBill?: string;

    // ===== STEP TRACKING =====
    steps: {
        bvn: {
            completed: boolean;
            verified: boolean;
            submittedAt?: Date;
        };
        face: {
            completed: boolean;
            verified: boolean;
            submittedAt?: Date;
        };
        document: {
            completed: boolean;
            verified: boolean;
            submittedAt?: Date;
        };
    };

    // ===== STATUS =====
    status:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "pending_verification"
    | "verified"
    | "rejected";

    rejectionReason?: string;

    // ===== AUDIT =====
    submittedAt?: Date;
    verifiedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const KYCSchema = new Schema<IKYC>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
            unique: true, // one KYC per user
        },

        type: {
            type: String,
            enum: ["user", "organization"],
            required: true,
        },

        // ===== KYC DATA =====
        bvn: {
            type: String,
            select: false, // 🔐 hides by default
        },

        facialImage: String,
        cacDocument: String,
        utilityBill: String,

        // ===== STEP TRACKING =====
        steps: {
            bvn: {
                completed: { type: Boolean, default: false },
                verified: { type: Boolean, default: false },
                submittedAt: Date,
            },
            face: {
                completed: { type: Boolean, default: false },
                verified: { type: Boolean, default: false },
                submittedAt: Date,
            },
            document: {
                completed: { type: Boolean, default: false },
                verified: { type: Boolean, default: false },
                submittedAt: Date,
            },
        },

        // ===== STATUS =====
        status: {
            type: String,
            enum: [
                "not_started",
                "in_progress",
                "pending_review",
                "verified",
                "rejected",
            ],
            default: "not_started",
        },

        rejectionReason: String,

        // ===== AUDIT =====
        submittedAt: Date,
        verifiedAt: Date,
    },
    { timestamps: true }
);


// 🔐 Extra protection when sending to client
KYCSchema.set("toJSON", {
    transform: function (doc, ret: any) {
        delete ret.bvn;
        delete ret.__v;
        return ret;
    },
});

export const KYC = model<IKYC>("KYC", KYCSchema);