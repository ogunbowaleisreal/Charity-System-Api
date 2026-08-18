import { KYC, FieldStatus } from "../models/KYC";
import { Account } from "../models/Accounts";
import { Types } from "mongoose";
import { SmileIDService } from "../services/SmileIdServices";
import { SmileIdConfig } from "../config/smileid.config";
import logger from "../logger";
import { ResendEmailService } from "./ResesndServices";

const smileIdService = new SmileIDService(SmileIdConfig);
const resendEmailService = new ResendEmailService();

export interface SubmitKYCPayload {
    ninImageUrl?: string;
    faceImageUrl?: string;
    address?: string;
    addressBillImageUrl?: string;
}

type ReviewDecision = "verified" | "failed";
type ReviewableFieldName = "nin" | "face" | "address";
type OrgDocumentType = "cac" | "utility";

const FIELD_LABELS: Record<ReviewableFieldName, string> = {
    nin: "NIN",
    face: "Facial Verification",
    address: "Proof of Address",
};

// If you also review org documents (cac/utility) through a similar method,
// this covers those labels too — see note below.
const ORG_DOCUMENT_LABELS: Record<OrgDocumentType, string> = {
    cac: "CAC Document",
    utility: "Utility Bill",
};

export class KYCService {

    async getOrCreateKYC(userId: string) {
        let kyc = await KYC.findOne({ userId });
        const account = await Account.findById(userId);
        if (!account) throw new Error("Account not found");

        if (!kyc) {
            kyc = await KYC.create({
                userId,
                type: account?.role,
                status: "not_started",
                level: 0,
            });
        }

        return kyc;
    }

    private recomputeOverallStatus(kyc: any) {
        if (kyc.type === "organization") {
            this.recomputeOrgStatus(kyc);
        } else {
            this.recomputeIndividualStatus(kyc);
        }
    }

    private recomputeIndividualStatus(kyc: any) {
        const ninStatus: FieldStatus = kyc.nin?.status || "not_submitted";
        const faceStatus: FieldStatus = kyc.face?.status || "not_submitted";
        const addressStatus: FieldStatus = kyc.address?.status || "not_submitted";

        const statuses = [ninStatus, faceStatus, addressStatus];

        const anyFailed = statuses.includes("failed");
        const allVerified = statuses.every((s) => s === "verified");
        const allSubmitted = statuses.every((s) => s !== "not_submitted");
        const anySubmitted = statuses.some((s) => s !== "not_submitted");

        if (anyFailed) {
            kyc.status = "rejected";
            kyc.level = 1;

            const reasons: string[] = [];
            if (ninStatus === "failed" && kyc.nin?.rejectionReason) reasons.push(`NIN: ${kyc.nin.rejectionReason}`);
            if (faceStatus === "failed" && kyc.face?.rejectionReason) reasons.push(`Face: ${kyc.face.rejectionReason}`);
            if (addressStatus === "failed" && kyc.address?.rejectionReason) reasons.push(`Address: ${kyc.address.rejectionReason}`);
            kyc.rejectionReason = reasons.join("; ") || "One or more KYC items failed review";
            return;
        }

        if (allVerified) {
            kyc.status = "verified";
            kyc.level = 2;
            kyc.verifiedAt = new Date();
            kyc.rejectionReason = undefined;
            return;
        }

        // Only surface to admins once EVERY required field is in.
        if (allSubmitted) {
            kyc.status = "pending_verification";
            kyc.level = 1;
            kyc.submittedAt = kyc.submittedAt || new Date();
            return;
        }

        // Some fields submitted, but not all — not admin-visible yet.
        if (anySubmitted) {
            kyc.status = "in_progress";
            kyc.level = 0;
            return;
        }

        kyc.status = "not_started";
        kyc.level = 0;
    }

    private recomputeOrgStatus(kyc: any) {
        const cacStatus = kyc.documentVerification?.cac?.status || "not_submitted";
        const utilityStatus = kyc.documentVerification?.utility?.status || "not_submitted";

        const statuses = [cacStatus, utilityStatus];

        const anyFailed = statuses.includes("failed");
        const allVerified = statuses.every((s: string) => s === "verified");
        const allSubmitted = statuses.every((s: string) => s !== "not_submitted");
        const anySubmitted = statuses.some((s: string) => s !== "not_submitted");

        if (anyFailed) {
            kyc.status = "rejected";
            kyc.level = 1;

            const reasons: string[] = [];
            if (cacStatus === "failed" && kyc.documentVerification?.cac?.rejectionReason) {
                reasons.push(`CAC: ${kyc.documentVerification.cac.rejectionReason}`);
            }
            if (utilityStatus === "failed" && kyc.documentVerification?.utility?.rejectionReason) {
                reasons.push(`Utility bill: ${kyc.documentVerification.utility.rejectionReason}`);
            }
            kyc.rejectionReason = reasons.join("; ") || "One or more documents failed review";
            return;
        }

        if (allVerified) {
            kyc.status = "verified";
            kyc.level = 2;
            kyc.verifiedAt = new Date();
            kyc.rejectionReason = undefined;
            return;
        }

        // Only surface to admins once BOTH documents are in.
        if (allSubmitted) {
            kyc.status = "pending_verification";
            kyc.level = 1;
            kyc.submittedAt = kyc.submittedAt || new Date();
            return;
        }

        // Only one of the two submitted so far — not admin-visible yet.
        if (anySubmitted) {
            kyc.status = "in_progress";
            kyc.level = 0;
            return;
        }

        kyc.status = "not_started";
        kyc.level = 0;
    }

    async submitKYC(userId: string, payload: SubmitKYCPayload) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.status === "verified") {
            throw new Error("KYC has already been verified");
        }

        if (kyc.status === "pending_verification") {
            throw new Error("KYC has already been submitted and is awaiting review");
        }

        const now = new Date();

        if (payload.ninImageUrl) {
            kyc.nin = {
                imageUrl: payload.ninImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        if (payload.faceImageUrl) {
            kyc.face = {
                imageUrl: payload.faceImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        if (payload.address && payload.addressBillImageUrl) {
            kyc.address = {
                address: payload.address,
                billImageUrl: payload.addressBillImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }

    async resubmitKYC(userId: string, payload: SubmitKYCPayload) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.status !== "rejected") {
            throw new Error("Only a rejected KYC can be resubmitted");
        }

        const now = new Date();

        if (payload.ninImageUrl) {
            kyc.nin = {
                imageUrl: payload.ninImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        if (payload.faceImageUrl) {
            kyc.face = {
                imageUrl: payload.faceImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        if (payload.address && payload.addressBillImageUrl) {
            kyc.address = {
                address: payload.address,
                billImageUrl: payload.addressBillImageUrl,
                status: "pending",
                submittedAt: now,
            };
        }

        kyc.rejectionReason = undefined;

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }



    private buildFieldPayload(field: ReviewableFieldName, payload: SubmitKYCPayload) {
        const now = new Date();

        if (field === "nin") {
            if (!payload.ninImageUrl) throw new Error("ninImageUrl is required");
            return { imageUrl: payload.ninImageUrl, status: "pending" as FieldStatus, submittedAt: now };
        }

        if (field === "face") {
            if (!payload.faceImageUrl) throw new Error("faceImageUrl is required");
            return { imageUrl: payload.faceImageUrl, status: "pending" as FieldStatus, submittedAt: now };
        }

        // address
        if (!payload.address || !payload.addressBillImageUrl) {
            throw new Error("address and addressBillImageUrl are both required");
        }
        return {
            address: payload.address,
            billImageUrl: payload.addressBillImageUrl,
            status: "pending" as FieldStatus,
            submittedAt: now,
        };
    }

    /**
     * Submit or update a single field. Can be called independently at any
     * time — users don't need all three ready at once. Overall status only
     * becomes "pending_verification" once nin, face, AND address have all
     * been submitted; until then it sits at "in_progress".
     */
    async submitField(userId: string, field: ReviewableFieldName, payload: SubmitKYCPayload) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.status === "verified") {
            throw new Error("KYC has already been verified");
        }

        if (kyc.status === "pending_verification") {
            throw new Error("KYC has already been fully submitted and is awaiting review");
        }

        const current = (kyc as any)[field];
        if (current?.status === "verified") {
            throw new Error(`${field} has already been verified`);
        }

        (kyc as any)[field] = this.buildFieldPayload(field, payload);

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }

    async submitNIN(userId: string, payload: Pick<SubmitKYCPayload, "ninImageUrl">) {
        return this.submitField(userId, "nin", payload);
    }

    async submitFace(userId: string, payload: Pick<SubmitKYCPayload, "faceImageUrl">) {
        return this.submitField(userId, "face", payload);
    }

    async submitAddress(userId: string, payload: Pick<SubmitKYCPayload, "address" | "addressBillImageUrl">) {
        return this.submitField(userId, "address", payload);
    }

    // =========================================================
    // ADMIN: per-field review
    // =========================================================

    /**
     * Generic per-field reviewer. Use the nin/face/address wrappers below
     * for clearer call sites, they all funnel through here.
     */
    async reviewField(
        userId: string,
        field: ReviewableFieldName,
        decision: ReviewDecision,
        adminId: string,
        rejectionReason?: string
    ) {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found");

        const current = (kyc as any)[field];
        if (!current || current.status === "not_submitted") {
            throw new Error(`${field} has not been submitted yet`);
        }

        if (decision === "failed" && !rejectionReason) {
            throw new Error("rejectionReason is required when failing a field");
        }

        current.status = decision;
        current.reviewedAt = new Date();
        current.reviewedBy = new Types.ObjectId(adminId);
        current.rejectionReason = decision === "failed" ? rejectionReason : undefined;

        const previousOverallStatus = kyc.status;
        this.recomputeOverallStatus(kyc);
        await kyc.save();

        await this.notifyFieldReview(kyc, field, decision, rejectionReason, previousOverallStatus);

        return kyc;
    }

    private async notifyFieldReview(
        kyc: any,
        field: ReviewableFieldName,
        decision: ReviewDecision,
        rejectionReason: string | undefined,
        previousOverallStatus: string
    ) {
        const user = await Account.findById(kyc.userId).select("email");
        if (!user?.email) return;

        const fieldLabel = FIELD_LABELS[field];

        try {
            if (decision === "verified") {
                await resendEmailService.sendKYCFieldVerifiedEmail(user.email, fieldLabel);
            } else {
                // decision === "failed"
                await resendEmailService.sendKYCFieldRejectedEmail(
                    user.email,
                    fieldLabel,
                    rejectionReason!
                );
            }

            if (previousOverallStatus !== "verified" && kyc.status === "verified") {
                await resendEmailService.sendKYCFullyVerifiedEmail(user.email);
            } else if (previousOverallStatus !== "rejected" && kyc.status === "rejected") {
                await resendEmailService.sendKYCRejectedEmail(
                    user.email,
                    rejectionReason ?? "One or more documents did not meet verification requirements."
                );
            }
        } catch (err) {
            console.error(`Failed to send KYC review email to ${user.email}:`, err);
        }
    }

    async reviewNIN(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
        return this.reviewField(userId, "nin", decision, adminId, rejectionReason);
    }

    async reviewFace(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
        return this.reviewField(userId, "face", decision, adminId, rejectionReason);
    }

    async reviewAddress(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
        return this.reviewField(userId, "address", decision, adminId, rejectionReason);
    }

    /**
     * Convenience: approve everything in one action, e.g. for an admin UI
     * that just has a single "Approve KYC" button rather than three.
     */
    async approveAllFields(userId: string, adminId: string) {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found");

        const now = new Date();
        const reviewerId = new Types.ObjectId(adminId);

        (["nin", "face", "address"] as ReviewableFieldName[]).forEach((field) => {
            const current = (kyc as any)[field];
            if (current && current.status === "pending") {
                current.status = "verified";
                current.reviewedAt = now;
                current.reviewedBy = reviewerId;
                current.rejectionReason = undefined;
            }
        });

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }

    /**
     * Convenience: reject the whole KYC in one action (e.g. suspected
     * fraud, duplicate account) rather than failing each field individually.
     */
    async rejectAllFields(userId: string, adminId: string, rejectionReason: string) {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found");

        const now = new Date();
        const reviewerId = new Types.ObjectId(adminId);

        (["nin", "face", "address"] as ReviewableFieldName[]).forEach((field) => {
            const current = (kyc as any)[field];
            if (current && current.status !== "not_submitted") {
                current.status = "failed";
                current.reviewedAt = now;
                current.reviewedBy = reviewerId;
                current.rejectionReason = rejectionReason;
            }
        });

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }

    // =========================================================
    // ADMIN: listing / queue
    // =========================================================

    async getPendingKYCs(filter: any) {
        const { page = 1, limit = 20 } = filter
        const skip = (page - 1) * limit;

        const [kycs, total] = await Promise.all([KYC.find({ status: "pending_verification" })
            .sort({ submittedAt: 1 })
            .skip(skip)
            .limit(Number(limit))
            .populate("userId", "firstName lastName userName profilePicture companyName"),
        KYC.countDocuments({ status: "pending_verification" }),
        ])


        const totalPages = Math.ceil(total / limit);

        return {
            kycs,
            pagination: {
                current_page: Number(page),
                total_pages: totalPages,
                per_page: Number(limit),
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }

    async getKYCByUserId(userId: string) {
        const kyc = await KYC.findOne({ userId }).populate("userId", "firstName lastName userName profilePicture companyName");
        if (!kyc) throw new Error("KYC not found");
        return kyc;
    }

    // =========================================================
    // STATUS FOR FRONTEND
    // =========================================================

    async getKYCStatus(userId: string) {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found");

        const ninStatus: FieldStatus = kyc.nin?.status || "not_submitted";
        const faceStatus: FieldStatus = kyc.face?.status || "not_submitted";
        const addressStatus: FieldStatus = kyc.address?.status || "not_submitted";

        const isNinVerified = ninStatus === "verified";
        const isFaceVerified = faceStatus === "verified";
        const isAddressVerified = addressStatus === "verified";

        const totalFields = 3;
        const completedFields = [isNinVerified, isFaceVerified, isAddressVerified].filter(Boolean).length;
        const progress = Number(((completedFields / totalFields) * 100).toFixed(2));

        let nextAction: string;
        if (kyc.status === "not_started") {
            nextAction = "Submit your NIN, selfie, and address for verification";
        } else if (kyc.status === "in_progress") {
            const missing: string[] = [];
            if (ninStatus === "not_submitted") missing.push("NIN");
            if (faceStatus === "not_submitted") missing.push("selfie");
            if (addressStatus === "not_submitted") missing.push("address");
            nextAction = missing.length
                ? `Still need: ${missing.join(", ")}`
                : "Your KYC is in progress";
        } else if (kyc.status === "rejected") {
            nextAction = "Resubmit your KYC — " + (kyc.rejectionReason || "one or more items were rejected");
        } else if (kyc.status === "verified") {
            nextAction = "Fully verified";
        } else {
            nextAction = "Your KYC is under review";
        }

        return {
            level: kyc.level,
            status: kyc.status,
            progress,

            fields: {
                nin: {
                    submitted: ninStatus !== "not_submitted",
                    status: ninStatus,
                    verified: isNinVerified,
                    rejectionReason: kyc.nin?.rejectionReason || null,
                },
                face: {
                    submitted: faceStatus !== "not_submitted",
                    status: faceStatus,
                    verified: isFaceVerified,
                    rejectionReason: kyc.face?.rejectionReason || null,
                },
                address: {
                    submitted: addressStatus !== "not_submitted",
                    status: addressStatus,
                    verified: isAddressVerified,
                    address: kyc.address?.address || null,
                    rejectionReason: kyc.address?.rejectionReason || null,
                },
            },

            flags: {
                canWithdraw: isNinVerified && isFaceVerified,
                isFullyVerified: isNinVerified && isFaceVerified && isAddressVerified,
            },

            rejectionReason: kyc.rejectionReason || null,
            submittedAt: kyc.submittedAt || null,
            verifiedAt: kyc.verifiedAt || null,
            updatedAt: kyc.updatedAt,
        };
    }

    // =========================================================
    // ORGANIZATION / CAC — still Smile ID powered
    // =========================================================

    async submitCAC(userId: string, cacDocument: string, companyType: string, rcNumber: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.type !== "organization") {
            throw new Error("CAC is only for organizations");
        }

        kyc.cacDocument = cacDocument;
        if (!kyc.steps) kyc.steps = { document: { cac: { submitted: false, verified: false }, utility: { submitted: false, verified: false } } };
        kyc.steps.document.cac.submitted = true;
        kyc.steps.document.cac.submittedAt = new Date();

        const jobId = `cac-${userId}-${Date.now()}`;
        const result = await smileIdService.submitBusinessVerification({
            country: "NG",
            idType: "BUSINESS_REGISTRATION",
            idNumber: rcNumber,
            businessType: companyType as "bn" | "co" | "it",
            jobId,
            userId,
        });

        if (result.status === "verified") {
            kyc.documentVerification = {
                ...kyc.documentVerification,
                cac: {
                    status: "verified",
                    provider: "smile_id",
                    extractedData: result.data,
                    verifiedAt: new Date(),
                },
            };
            kyc.steps.document.cac.verified = true;
        } else {
            kyc.documentVerification = {
                ...kyc.documentVerification,
                cac: {
                    status: "failed",
                    provider: "smile_id",
                    rejectionReason: "CAC verification failed",
                },
            };
        }

        this.recomputeOverallStatus(kyc);
        await kyc.save();
        return kyc;
    }

    async uploadCACDocument(userId: string, cacDocumentUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.type !== "organization") {
            throw new Error("CAC upload only allowed for organization accounts");
        }

        kyc.cacDocument = cacDocumentUrl;
        if (!kyc.steps) kyc.steps = { document: { cac: { submitted: false, verified: false }, utility: { submitted: false, verified: false } } };
        kyc.steps.document.cac.submitted = true;
        kyc.steps.document.cac.submittedAt = new Date();

        kyc.set("documentVerification.cac", {
            status: "pending",
            provider: "manual",
            extractedData: { source: "upload", url: cacDocumentUrl },
        });

        this.recomputeOverallStatus(kyc);
        await kyc.save();
        return kyc;
    }

    /** Business premises utility bill — organizations only */
    async uploadUtilityDocument(userId: string, utilityBillUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.type !== "organization") {
            throw new Error("Utility bill upload only allowed for organization accounts");
        }

        if (!kyc.steps) kyc.steps = { document: { cac: { submitted: false, verified: false }, utility: { submitted: false, verified: false } } };
        kyc.steps.document.utility.submitted = true;
        kyc.steps.document.utility.submittedAt = new Date();

        kyc.set("documentVerification.utility", {
            status: "pending",
            provider: "manual",
            extractedData: { source: "upload", url: utilityBillUrl },
        });

        this.recomputeOverallStatus(kyc);
        await kyc.save();
        return kyc;
    }

    // =========================================================
    // ADMIN: org document review (CAC / utility bill)
    // =========================================================

    /**
     * Generic org-document reviewer. Use reviewCAC/reviewUtility below
     * for clearer call sites, they both funnel through here.
     */
    async reviewDocument(
        userId: string,
        documentType: OrgDocumentType,
        decision: ReviewDecision,
        adminId: string,
        rejectionReason?: string
    ) {
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found");

        if (kyc.type !== "organization") {
            throw new Error(`${documentType} review only applies to organization accounts`);
        }

        const current = kyc.documentVerification?.[documentType];
        if (!current) {
            throw new Error(`${documentType} has not been submitted yet`);
        }

        if (decision === "failed" && !rejectionReason) {
            throw new Error("rejectionReason is required when failing a document");
        }

        current.status = decision;
        current.verifiedAt = decision === "verified" ? new Date() : undefined;
        current.reviewedBy = new Types.ObjectId(adminId);
        current.rejectionReason = decision === "failed" ? rejectionReason : undefined;

        if (kyc.steps?.document?.[documentType]) {
            kyc.steps.document[documentType].verified = decision === "verified";
        }

        this.recomputeOverallStatus(kyc);
        await kyc.save();

        return kyc;
    }

    async reviewCAC(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
        return this.reviewDocument(userId, "cac", decision, adminId, rejectionReason);
    }

    async reviewUtility(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
        return this.reviewDocument(userId, "utility", decision, adminId, rejectionReason);
    }
}


// import { KYC, FieldStatus } from "../models/KYC";
// import { Account } from "../models/Accounts";
// import { Types } from "mongoose";
// import { SmileIDService } from "../services/SmileIdServices";
// import { SmileIdConfig } from "../config/smileid.config";
// import logger from "../logger";

// const smileIdService = new SmileIDService(SmileIdConfig);

// // =========================================================
// // NOTE: BVN verification (Smile ID) is on hold for now.
// // The individual KYC path below is fully manual: NIN slip photo,
// // selfie, and address+bill are collected together in one submission
// // and reviewed by an admin. Organization/CAC flow is untouched and
// // still goes through Smile ID business verification.
// // =========================================================

// export interface SubmitKYCPayload {
//     ninImageUrl: string;
//     faceImageUrl: string;
//     address: string;
//     addressBillImageUrl: string;
// }

// type ReviewDecision = "verified" | "failed";
// type ReviewableFieldName = "nin" | "face" | "address";

// export class KYCService {

//     private async getOrCreateKYC(userId: string) {
//         let kyc = await KYC.findOne({ userId });
//         const account = await Account.findById(userId);
//         if (!account) throw new Error("Account not found");

//         if (!kyc) {
//             kyc = await KYC.create({
//                 userId,
//                 type: account?.role,
//                 status: "not_started",
//                 level: 0,
//             });
//         }

//         return kyc;
//     }

//     /**
//      * Recomputes the overall kyc.status/level from the three field-level
//      * statuses. Call this after any submission or admin review.
//      *
//      * Rules:
//      * - any field "failed"                -> rejected
//      * - all three fields "verified"       -> verified
//      * - anything submitted, none failed   -> pending_verification
//      * - nothing submitted                 -> not_started
//      */
//     private recomputeOverallStatus(kyc: any) {
//         const ninStatus: FieldStatus = kyc.nin?.status || "not_submitted";
//         const faceStatus: FieldStatus = kyc.face?.status || "not_submitted";
//         const addressStatus: FieldStatus = kyc.address?.status || "not_submitted";

//         const statuses = [ninStatus, faceStatus, addressStatus];

//         const anyFailed = statuses.includes("failed");
//         const allVerified = statuses.every((s) => s === "verified");
//         const anySubmittedOrBeyond = statuses.some((s) => s !== "not_submitted");

//         if (anyFailed) {
//             kyc.status = "rejected";
//             kyc.level = 1;

//             const reasons: string[] = [];
//             if (ninStatus === "failed" && kyc.nin?.rejectionReason) reasons.push(`NIN: ${kyc.nin.rejectionReason}`);
//             if (faceStatus === "failed" && kyc.face?.rejectionReason) reasons.push(`Face: ${kyc.face.rejectionReason}`);
//             if (addressStatus === "failed" && kyc.address?.rejectionReason) reasons.push(`Address: ${kyc.address.rejectionReason}`);
//             kyc.rejectionReason = reasons.join("; ") || "One or more KYC items failed review";
//             return;
//         }

//         if (allVerified) {
//             kyc.status = "verified";
//             kyc.level = 2;
//             kyc.verifiedAt = new Date();
//             kyc.rejectionReason = undefined;
//             return;
//         }

//         if (anySubmittedOrBeyond) {
//             kyc.status = "pending_verification";
//             kyc.level = 1;
//             return;
//         }

//         kyc.status = "not_started";
//         kyc.level = 0;
//     }

//     // =========================================================
//     // USER-FACING: single one-time submission
//     // =========================================================

//     /**
//      * Submits NIN, face, and address+bill all at once. This is a one-time
//      * action — call again only via resubmitKYC() if the KYC was rejected.
//      */
//     async submitKYC(userId: string, payload: SubmitKYCPayload) {
//         const kyc = await this.getOrCreateKYC(userId);

//         if (kyc.status === "verified") {
//             throw new Error("KYC has already been verified");
//         }

//         if (kyc.status === "pending_verification") {
//             throw new Error("KYC has already been submitted and is awaiting review");
//         }

//         const now = new Date();

//         kyc.nin = {
//             imageUrl: payload.ninImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.face = {
//             imageUrl: payload.faceImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.address = {
//             address: payload.address,
//             billImageUrl: payload.addressBillImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.submittedAt = now;

//         this.recomputeOverallStatus(kyc);
//         await kyc.save();

//         return kyc;
//     }

//     /**
//      * Only usable when a previous submission was rejected. Resets all
//      * three fields back to pending with fresh data, clears prior
//      * rejection reasons.
//      */
//     async resubmitKYC(userId: string, payload: SubmitKYCPayload) {
//         const kyc = await this.getOrCreateKYC(userId);

//         if (kyc.status !== "rejected") {
//             throw new Error("Only a rejected KYC can be resubmitted");
//         }

//         const now = new Date();

//         kyc.nin = {
//             imageUrl: payload.ninImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.face = {
//             imageUrl: payload.faceImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.address = {
//             address: payload.address,
//             billImageUrl: payload.addressBillImageUrl,
//             status: "pending",
//             submittedAt: now,
//         };

//         kyc.submittedAt = now;
//         kyc.rejectionReason = undefined;

//         this.recomputeOverallStatus(kyc);
//         await kyc.save();

//         return kyc;
//     }

//     // =========================================================
//     // ADMIN: per-field review
//     // =========================================================

//     /**
//      * Generic per-field reviewer. Use the nin/face/address wrappers below
//      * for clearer call sites, they all funnel through here.
//      */
//     async reviewField(
//         userId: string,
//         field: ReviewableFieldName,
//         decision: ReviewDecision,
//         adminId: string,
//         rejectionReason?: string
//     ) {
//         const kyc = await KYC.findOne({ userId });
//         if (!kyc) throw new Error("KYC not found");

//         const current = (kyc as any)[field];
//         if (!current || current.status === "not_submitted") {
//             throw new Error(`${field} has not been submitted yet`);
//         }

//         if (decision === "failed" && !rejectionReason) {
//             throw new Error("rejectionReason is required when failing a field");
//         }

//         current.status = decision;
//         current.reviewedAt = new Date();
//         current.reviewedBy = new Types.ObjectId(adminId);
//         current.rejectionReason = decision === "failed" ? rejectionReason : undefined;

//         this.recomputeOverallStatus(kyc);
//         await kyc.save();

//         return kyc;
//     }

//     async reviewNIN(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
//         return this.reviewField(userId, "nin", decision, adminId, rejectionReason);
//     }

//     async reviewFace(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
//         return this.reviewField(userId, "face", decision, adminId, rejectionReason);
//     }

//     async reviewAddress(userId: string, decision: ReviewDecision, adminId: string, rejectionReason?: string) {
//         return this.reviewField(userId, "address", decision, adminId, rejectionReason);
//     }

//     /**
//      * Convenience: approve everything in one action, e.g. for an admin UI
//      * that just has a single "Approve KYC" button rather than three.
//      */
//     async approveAllFields(userId: string, adminId: string) {
//         const kyc = await KYC.findOne({ userId });
//         if (!kyc) throw new Error("KYC not found");

//         const now = new Date();
//         const reviewerId = new Types.ObjectId(adminId);

//         (["nin", "face", "address"] as ReviewableFieldName[]).forEach((field) => {
//             const current = (kyc as any)[field];
//             if (current && current.status === "pending") {
//                 current.status = "verified";
//                 current.reviewedAt = now;
//                 current.reviewedBy = reviewerId;
//                 current.rejectionReason = undefined;
//             }
//         });

//         this.recomputeOverallStatus(kyc);
//         await kyc.save();

//         return kyc;
//     }

//     /**
//      * Convenience: reject the whole KYC in one action (e.g. suspected
//      * fraud, duplicate account) rather than failing each field individually.
//      */
//     async rejectAllFields(userId: string, adminId: string, rejectionReason: string) {
//         const kyc = await KYC.findOne({ userId });
//         if (!kyc) throw new Error("KYC not found");

//         const now = new Date();
//         const reviewerId = new Types.ObjectId(adminId);

//         (["nin", "face", "address"] as ReviewableFieldName[]).forEach((field) => {
//             const current = (kyc as any)[field];
//             if (current && current.status !== "not_submitted") {
//                 current.status = "failed";
//                 current.reviewedAt = now;
//                 current.reviewedBy = reviewerId;
//                 current.rejectionReason = rejectionReason;
//             }
//         });

//         this.recomputeOverallStatus(kyc);
//         await kyc.save();

//         return kyc;
//     }

//     // =========================================================
//     // ADMIN: listing / queue
//     // =========================================================

//     async getPendingKYCs() {
//         return KYC.find({ status: "pending_verification" }).sort({ submittedAt: 1 });
//     }

//     async getKYCByUserId(userId: string) {
//         const kyc = await KYC.findOne({ userId });
//         if (!kyc) throw new Error("KYC not found");
//         return kyc;
//     }

//     // =========================================================
//     // STATUS FOR FRONTEND
//     // =========================================================

//     async getKYCStatus(userId: string) {
//         const kyc = await KYC.findOne({ userId });
//         if (!kyc) throw new Error("KYC not found");

//         const ninStatus: FieldStatus = kyc.nin?.status || "not_submitted";
//         const faceStatus: FieldStatus = kyc.face?.status || "not_submitted";
//         const addressStatus: FieldStatus = kyc.address?.status || "not_submitted";

//         const isNinVerified = ninStatus === "verified";
//         const isFaceVerified = faceStatus === "verified";
//         const isAddressVerified = addressStatus === "verified";

//         const totalFields = 3;
//         const completedFields = [isNinVerified, isFaceVerified, isAddressVerified].filter(Boolean).length;
//         const progress = Number(((completedFields / totalFields) * 100).toFixed(2));

//         let nextAction: string;
//         if (kyc.status === "not_started") {
//             nextAction = "Submit your NIN, selfie, and address for verification";
//         } else if (kyc.status === "rejected") {
//             nextAction = "Resubmit your KYC — " + (kyc.rejectionReason || "one or more items were rejected");
//         } else if (kyc.status === "verified") {
//             nextAction = "Fully verified";
//         } else {
//             nextAction = "Your KYC is under review";
//         }

//         return {
//             level: kyc.level,
//             status: kyc.status,
//             progress,

//             fields: {
//                 nin: {
//                     submitted: ninStatus !== "not_submitted",
//                     status: ninStatus,
//                     verified: isNinVerified,
//                     rejectionReason: kyc.nin?.rejectionReason || null,
//                 },
//                 face: {
//                     submitted: faceStatus !== "not_submitted",
//                     status: faceStatus,
//                     verified: isFaceVerified,
//                     rejectionReason: kyc.face?.rejectionReason || null,
//                 },
//                 address: {
//                     submitted: addressStatus !== "not_submitted",
//                     status: addressStatus,
//                     verified: isAddressVerified,
//                     address: kyc.address?.address || null,
//                     rejectionReason: kyc.address?.rejectionReason || null,
//                 },
//             },

//             flags: {
//                 canWithdraw: isNinVerified && isFaceVerified,
//                 isFullyVerified: isNinVerified && isFaceVerified && isAddressVerified,
//             },

//             rejectionReason: kyc.rejectionReason || null,
//             submittedAt: kyc.submittedAt || null,
//             verifiedAt: kyc.verifiedAt || null,
//             updatedAt: kyc.updatedAt,
//         };
//     }

//     // =========================================================
//     // ORGANIZATION / CAC — UNTOUCHED, still Smile ID powered
//     // =========================================================

//     async submitCAC(userId: string, cacDocument: string, companyType: string, rcNumber: string) {
//         const kyc = await this.getOrCreateKYC(userId);

//         if (kyc.type !== "organization") {
//             throw new Error("CAC is only for organizations");
//         }

//         kyc.cacDocument = cacDocument;
//         if (!kyc.steps) kyc.steps = { document: { cac: { submitted: false, verified: false } } };
//         kyc.steps.document.cac.submitted = true;
//         kyc.steps.document.cac.submittedAt = new Date();

//         const jobId = `cac-${userId}-${Date.now()}`;
//         const result = await smileIdService.submitBusinessVerification({
//             country: "NG",
//             idType: "BUSINESS_REGISTRATION",
//             idNumber: rcNumber,
//             businessType: companyType as "bn" | "co" | "it",
//             jobId,
//             userId,
//         });

//         if (result.status === "verified") {
//             kyc.documentVerification = {
//                 ...kyc.documentVerification,
//                 cac: {
//                     status: "verified",
//                     provider: "smile_id",
//                     extractedData: result.data,
//                     verifiedAt: new Date(),
//                 },
//             };
//             kyc.steps.document.cac.verified = true;
//         } else {
//             kyc.documentVerification = {
//                 ...kyc.documentVerification,
//                 cac: {
//                     status: "failed",
//                     provider: "smile_id",
//                 },
//             };
//         }

//         await kyc.save();
//         return kyc;
//     }

//     async uploadCACDocument(userId: string, cacDocumentUrl: string) {
//         const kyc = await this.getOrCreateKYC(userId);

//         if (kyc.type !== "organization") {
//             throw new Error("CAC upload only allowed for organization accounts");
//         }

//         kyc.cacDocument = cacDocumentUrl;
//         if (!kyc.steps) kyc.steps = { document: { cac: { submitted: false, verified: false } } };
//         kyc.steps.document.cac.submitted = true;
//         kyc.steps.document.cac.submittedAt = new Date();

//         kyc.documentVerification = {
//             ...kyc.documentVerification,
//             cac: {
//                 status: "pending",
//                 provider: "manual",
//                 extractedData: { source: "upload", url: cacDocumentUrl },
//             },
//         };

//         await kyc.save();
//         return kyc;
//     }
// }