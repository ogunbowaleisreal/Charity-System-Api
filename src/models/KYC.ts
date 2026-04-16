import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IKYC extends Document {
    userId: Types.ObjectId;
    type: "personal" | "organization";

    // ===== INPUT DATA =====
    bvn?: string;
    facialImage?: string;

    // ===== VERIFICATION RESULTS (IMPORTANT) =====
    bvnVerification?: {
        status: "pending" | "verified" | "failed";
        provider?: string;
        matchedData?: any;
        verifiedAt?: Date;
    };

    faceVerification?: {
        status: "pending" | "verified" | "failed";
        provider?: string;
        confidenceScore?: number;
        verifiedAt?: Date;
    };

    // ===== STEP TRACKING =====
    steps: {
        bvn: {
            submitted: boolean;
            submittedAt?: Date;
        };
        face: {
            submitted: boolean;
            submittedAt?: Date;
        };
        document: {
            completed: boolean;
            verified: boolean;
            submittedAt?: Date;
        };
    };
    cacDocument?: string;
    utilityBill?: string;

    // ===== KYC LEVEL (DERIVED BUT STORED FOR FAST ACCESS) =====
    level: 0 | 1 | 2;

    /*
        LEVELS:
        0 -> nothing
        1 -> BVN submitted/verified
        2 -> BVN + Face verified
    */

    // ===== STATUS =====
    status: "not_started" | "in_progress" | "pending_verification" | "verified" | "rejected";

    rejectionReason?: string;

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
            unique: true,
        },

        type: {
            type: String,
            enum: ["personal", "organization"],
            required: true,
        },

        bvn: {
            type: String,
            select: false,
        },
        cacDocument: String,
        utilityBill: String,

        facialImage: String,

        bvnVerification: {
            status: {
                type: String,
                enum: ["pending", "verified", "failed"],
                default: "pending",
            },
            provider: String,
            matchedData: Schema.Types.Mixed,
            verifiedAt: Date,
        },

        faceVerification: {
            status: {
                type: String,
                enum: ["pending", "verified", "failed"],
                default: "pending",
            },
            provider: String,
            confidenceScore: Number,
            verifiedAt: Date,
        },

        steps: {
            bvn: {
                submitted: { type: Boolean, default: false },
                submittedAt: Date,
            },
            face: {
                submitted: { type: Boolean, default: false },
                submittedAt: Date,
            },
        },

        level: {
            type: Number,
            enum: [0, 1, 2],
            default: 0,
        },

        status: {
            type: String,
            enum: [
                "not_started",
                "in_progress",
                "pending_verification",
                "verified",
                "rejected",
            ],
            default: "not_started",
        },

        rejectionReason: String,

        submittedAt: Date,
        verifiedAt: Date,
    },
    { timestamps: true }
);

// auto strip sensitive data
KYCSchema.set("toJSON", {
    transform: function (_doc, ret: any) {
        delete ret.bvn;
        delete ret.__v;
        return ret;
    },
});

export const KYC = model<IKYC>("KYC", KYCSchema);
// import mongoose, { Schema, model, Document, Types } from "mongoose";

// export interface IKYC extends Document {
//     userId: Types.ObjectId;

//     type: "personal" | "organization";

//     // ===== KYC DATA =====
//     bvn?: string;
//     facialImage?: string;
//     cacDocument?: string;
//     utilityBill?: string;

//     // ===== STEP TRACKING =====
//     steps: {
//         bvn: {
//             completed: boolean;
//             verified: boolean;
//             submittedAt?: Date;
//         };
//         face: {
//             completed: boolean;
//             verified: boolean;
//             submittedAt?: Date;
//         };
//         document: {
//             completed: boolean;
//             verified: boolean;
//             submittedAt?: Date;
//         };
//     };

//     // ===== STATUS =====
//     status:
//     | "not_started"
//     | "in_progress"
//     | "pending_review"
//     | "pending_verification"
//     | "verified"
//     | "rejected";

//     rejectionReason?: string;

//     // ===== AUDIT =====
//     submittedAt?: Date;
//     verifiedAt?: Date;

//     createdAt: Date;
//     updatedAt: Date;
// }

// const KYCSchema = new Schema<IKYC>(
//     {
//         userId: {
//             type: Schema.Types.ObjectId,
//             ref: "Account",
//             required: true,
//             unique: true, // one KYC per user
//         },

//         type: {
//             type: String,
//             enum: ["user", "organization"],
//             required: true,
//         },

//         // ===== KYC DATA =====
//         bvn: {
//             type: String,
//             select: false, // 🔐 hides by default
//         },

//         facialImage: String,
//         cacDocument: String,
//         utilityBill: String,

//         // ===== STEP TRACKING =====
//         steps: {
//             bvn: {
//                 completed: { type: Boolean, default: false },
//                 verified: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//             face: {
//                 completed: { type: Boolean, default: false },
//                 verified: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//             document: {
//                 completed: { type: Boolean, default: false },
//                 verified: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//         },

//         // ===== STATUS =====
//         status: {
//             type: String,
//             enum: [
//                 "not_started",
//                 "in_progress",
//                 "pending_review",
//                 "verified",
//                 "rejected",
//             ],
//             default: "not_started",
//         },

//         rejectionReason: String,

//         // ===== AUDIT =====
//         submittedAt: Date,
//         verifiedAt: Date,
//     },
//     { timestamps: true }
// );


// // 🔐 Extra protection when sending to client
// KYCSchema.set("toJSON", {
//     transform: function (doc, ret: any) {
//         delete ret.bvn;
//         delete ret.__v;
//         return ret;
//     },
// });

// export const KYC = model<IKYC>("KYC", KYCSchema);