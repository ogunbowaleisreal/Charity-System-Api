import mongoose, { Schema, model, Document, Types } from "mongoose";

export type FieldStatus = "not_submitted" | "pending" | "verified" | "failed";

interface IReviewableField {
    status: FieldStatus;
    rejectionReason?: string;
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
}

export interface IKYC extends Document {
    userId: Types.ObjectId;
    type: "user" | "organization";

    // =========================================================
    // INDIVIDUAL (MANUAL) KYC — NIN / FACE / ADDRESS
    // Collected together, reviewed by admin, one-time submission.
    // =========================================================

    nin?: IReviewableField & {
        imageUrl: string; // photo of the NIN slip
    };

    face?: IReviewableField & {
        imageUrl: string; // selfie, frontend uploads and hands us the URL
    };

    address?: IReviewableField & {
        address: string;      // the actual address string
        billImageUrl: string; // photo of a recent utility bill
        // NOTE: address + bill are one unit — ONE status covers both,
        // do not split these into separate statuses.
    };

    // =========================================================
    // ORGANIZATION KYC — UNTOUCHED, still Smile ID powered
    // =========================================================

    cacDocument?: string;

    documentVerification?: {
        cac?: {
            status: "pending" | "verified" | "failed";
            provider?: string;
            extractedData?: any;
            verifiedAt?: Date;
            reviewedBy?: Types.ObjectId;
            rejectionReason?: string;
        };
        // Business premises utility bill — organizations only.
        // (Individuals prove address via kyc.address instead.)
        utility?: {
            status: "pending" | "verified" | "failed";
            provider?: string;
            extractedData?: any;
            verifiedAt?: Date;
            reviewedBy?: Types.ObjectId;
            rejectionReason?: string;
        };
    };

    steps: {
        document: {
            cac: {
                submitted: boolean;
                verified: boolean;
                submittedAt?: Date;
            };
            utility: {
                submitted: boolean;
                verified: boolean;
                submittedAt?: Date;
            };
        };
    };

    // =========================================================
    // OVERALL
    // =========================================================

    // 0 -> nothing submitted, 1 -> submitted/pending admin review, 2 -> fully verified
    level: 0 | 1 | 2;

    // not_started         -> nothing submitted yet
    // in_progress         -> some but not all required fields/documents submitted
    // pending_verification -> everything required has been submitted, awaiting admin review
    // verified            -> fully verified
    // rejected            -> at least one field/document failed review
    status: "not_started" | "in_progress" | "pending_verification" | "verified" | "rejected";

    rejectionReason?: string;

    submittedAt?: Date;
    verifiedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const reviewableFieldBase = {
    status: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "failed"],
        default: "not_submitted",
    },
    rejectionReason: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
    },
};

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
            enum: ["user", "organization"],
            required: true,
        },

        // ===== INDIVIDUAL (MANUAL) =====

        nin: {
            imageUrl: String,
            ...reviewableFieldBase,
        },

        face: {
            imageUrl: String,
            ...reviewableFieldBase,
        },

        address: {
            address: String,
            billImageUrl: String,
            ...reviewableFieldBase,
        },

        // ===== ORGANIZATION — UNTOUCHED =====

        cacDocument: String,

        documentVerification: {
            cac: {
                status: {
                    type: String,
                    enum: ["pending", "verified", "failed"],
                    default: "pending",
                },
                provider: String,
                extractedData: Schema.Types.Mixed,
                verifiedAt: Date,
                reviewedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "Admin",
                },
                rejectionReason: String,
            },
            utility: {
                status: {
                    type: String,
                    enum: ["pending", "verified", "failed"],
                    default: "pending",
                },
                provider: String,
                extractedData: Schema.Types.Mixed,
                verifiedAt: Date,
                reviewedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "Admin",
                },
                rejectionReason: String,
            },
        },

        steps: {
            document: {
                cac: {
                    submitted: { type: Boolean, default: false },
                    verified: { type: Boolean, default: false },
                    submittedAt: Date,
                },
                utility: {
                    submitted: { type: Boolean, default: false },
                    verified: { type: Boolean, default: false },
                    submittedAt: Date,
                },
            },
        },

        // ===== OVERALL =====

        level: {
            type: Number,
            enum: [0, 1, 2],
            default: 0,
        },

        status: {
            type: String,
            enum: ["not_started", "in_progress", "pending_verification", "verified", "rejected"],
            default: "not_started",
        },

        rejectionReason: String,

        submittedAt: Date,
        verifiedAt: Date,
    },
    { timestamps: true }
);

KYCSchema.set("toJSON", {
    transform: function (_doc, ret: any) {
        delete ret.__v;
        return ret;
    },
});

export const KYC = model<IKYC>("KYC", KYCSchema);

// import mongoose, { Schema, model, Document, Types } from "mongoose";

// export interface IKYC extends Document {
//     userId: Types.ObjectId;
//     type: "user" | "organization";

//     // ===== INPUT DATA =====
//     bvn?: string;
//     facialImage?: string;

//     // ===== VERIFICATION RESULTS (IMPORTANT) =====
//     bvnVerification?: {
//         status: "pending" | "verified" | "failed";
//         provider?: string;
//         matchedData?: any;
//         verifiedAt?: Date;
//         jobId?: string;
//     };

//     faceVerification?: {
//         status: "pending" | "verified" | "failed";
//         provider?: string;
//         confidenceScore?: number;
//         verifiedAt?: Date;
//         jobId?: string;
//         enrolled?: boolean;
//     };

//     // ===== STEP TRACKING =====
//     steps: {
//         bvn: {
//             submitted: boolean;
//             submittedAt?: Date;
//         };
//         face: {
//             submitted: boolean;
//             submittedAt?: Date;
//         };
//         document: {
//             cac: {
//                 submitted: boolean;
//                 verified: boolean;
//                 submittedAt?: Date;
//             };
//             utility: {
//                 submitted: boolean;
//                 verified: boolean;
//                 submittedAt?: Date;
//             };
//         }
//     };
//     cacDocument?: string;
//     utilityBill?: string;

//     documentVerification?: {
//         cac?: {
//             status: "pending" | "verified" | "failed";
//             provider?: string;
//             extractedData?: any;
//             verifiedAt?: Date;
//             reviewedBy?: Types.ObjectId;
//         };

//         utility?: {
//             status: "pending" | "verified" | "failed";
//             provider?: string;
//             extractedData?: any;
//             verifiedAt?: Date;
//             reviewedBy?: Types.ObjectId;
//         };
//     };

//     livenessVerification?: {
//         status: "pending" | "verified" | "failed";
//         provider?: string;
//         confidenceScore?: number;
//         verifiedAt?: Date;
//     };

//     // ===== KYC LEVEL (DERIVED BUT STORED FOR FAST ACCESS) =====
//     level: 0 | 1 | 2;

//     /*
//         LEVELS:
//         0 -> nothing
//         1 -> BVN submitted/verified
//         2 -> BVN + Face verified
//     */

//     // ===== STATUS =====
//     status: "not_started" | "in_progress" | "pending_verification" | "verified" | "rejected";

//     rejectionReason?: string;

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
//             unique: true,
//         },

//         type: {
//             type: String,
//             enum: ["user", "organization"],
//             required: true,
//         },

//         bvn: {
//             type: String,
//             select: false,
//         },
//         cacDocument: String,
//         utilityBill: String,

//         facialImage: String,

//         bvnVerification: {
//             status: {
//                 type: String,
//                 enum: ["pending", "verified", "failed"],
//                 default: "pending",
//             },
//             provider: String,
//             matchedData: Schema.Types.Mixed,
//             verifiedAt: Date,
//         },

//         faceVerification: {
//             status: {
//                 type: String,
//                 enum: ["pending", "verified", "failed"],
//                 default: "pending",
//             },
//             provider: String,
//             confidenceScore: Number,
//             verifiedAt: Date,
//         },

//         // ADD THIS INSIDE YOUR SCHEMA

//         documentVerification: {
//             status: {
//                 type: String,
//                 enum: ["pending", "verified", "failed"],
//                 default: "pending",
//             },
//             provider: String,
//             type: {
//                 type: String,
//                 enum: ["cac", "utility"],
//             },
//             extractedData: Schema.Types.Mixed,
//             verifiedAt: Date,
//             reviewedBy: {
//                 type: Schema.Types.ObjectId,
//                 ref: "Admin"
//             },
//         },

//         livenessVerification: {
//             status: {
//                 type: String,
//                 enum: ["pending", "verified", "failed"],
//                 default: "pending",
//             },
//             confidenceScore: Number,
//             verifiedAt: Date,

//         },

//         steps: {
//             bvn: {
//                 submitted: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//             face: {
//                 submitted: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//             document: {
//                 completed: { type: Boolean, default: false },
//                 verified: { type: Boolean, default: false },
//                 submittedAt: Date,
//             },
//         },

//         level: {
//             type: Number,
//             enum: [0, 1, 2],
//             default: 0,
//         },

//         status: {
//             type: String,
//             enum: [
//                 "not_started",
//                 "in_progress",
//                 "pending_verification",
//                 "verified",
//                 "rejected",
//             ],
//             default: "not_started",
//         },

//         rejectionReason: String,

//         submittedAt: Date,
//         verifiedAt: Date,
//     },
//     { timestamps: true }
// );

// // auto strip sensitive data
// KYCSchema.set("toJSON", {
//     transform: function (_doc, ret: any) {
//         delete ret.bvn;
//         delete ret.__v;
//         return ret;
//     },
// });

// export const KYC = model<IKYC>("KYC", KYCSchema);