import { KYC } from "../../models/KYC";
import { Account } from "../../models/Accounts";
import { Types } from "mongoose";
import { SmileIDService, SmileWebhookPayload } from "../SmileIdServices";
import { SmileIdConfig } from "../../config/smileid.config";
import logger from "../../logger";
import { ZeehKycService } from "../zeehAfrica.services";
import { ZeehConfig } from "../../config/zeehAfrica.config";

const smileIdService = new SmileIDService(SmileIdConfig);
const zeehService = new ZeehKycService(ZeehConfig.apiKey, ZeehConfig.baseUrl, ZeehConfig.webhookSecret);

export class KYCService {

    private async getOrCreateKYC(userId: string) {
        let kyc = await KYC.findOne({ userId });
        const account = await Account.findById(userId)
        if (!account) throw new Error("Account not found")

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

    private updateStatus(kyc: any) {
        const bvnOk = kyc.bvnVerification?.status === "verified";
        const faceOk = kyc.faceVerification?.status === "verified";

        if (bvnOk && faceOk) {
            kyc.level = 2;
            kyc.status = "verified";
            kyc.verifiedAt = new Date();
            return;
        }

        if (bvnOk) {
            kyc.level = 1;
            kyc.status = "in_progress";
            return;
        }

        kyc.level = 0;
        kyc.status = "in_progress";
    }



    async submitBVN(
        userId: string,
        payload: { bvn: string; dob: string, firstName: string, lastName: string }
    ) {
        const kyc = await this.getOrCreateKYC(userId);

        kyc.bvn = payload.bvn;
        kyc.steps.bvn.submitted = true;
        kyc.steps.bvn.submittedAt = new Date();
        kyc.status = "pending_verification";

        // =========================
        // SMILE ID BVN VALIDATION (Enhanced/Basic KYC, job_type 5)
        // =========================
        // No selfie is attached here, so this call is synchronous — the
        // verified/failed verdict comes back directly, no webhook involved.

        const jobId = `bvn-${userId}-${Date.now()}`;
        const result = await smileIdService.validateBVN(payload, jobId, userId);

        if (result.status === "verified") {
            kyc.bvnVerification = {
                status: "verified",
                provider: "smile_id",
                jobId: result.jobId,
                matchedData: {
                    fullName: result.data?.fullName,
                    dateOfBirth: result.data?.dateOfBirth,
                    phoneNumber: result.data?.phoneNumber,
                },
                verifiedAt: new Date(),
            };
        } else if (result.status === "error") {
            kyc.bvnVerification = {
                status: "failed",
                provider: "smile_id",
                jobId: result.jobId,
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "BVN verification could not be submitted to Smile ID";
        } else {
            // "failed": Smile ID responded, but the submitted data didn't match the BVN record.
            kyc.bvnVerification = {
                status: "failed",
                provider: "smile_id",
                jobId: result.jobId,
            };

            kyc.status = "rejected";
            kyc.rejectionReason = result.resultText
                ? `BVN verification failed: ${result.resultText}`
                : "BVN verification failed";
        }

        this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    async submitFace(userId: string, imageUrl: string, livenessImageUrls: string[] = []) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.bvnVerification?.status !== "verified") {
            throw new Error("BVN must be verified first");
        }

        kyc.facialImage = imageUrl;
        kyc.steps.face.submitted = true;
        kyc.steps.face.submittedAt = new Date();
        kyc.status = "pending_verification";

        // =========================
        // SMILE ID FACE MATCH (Biometric KYC, job_type 1)
        // =========================
        // Matches the selfie directly against the BVN's photo on file. This one
        // IS async — a "pending" result here means Smile ID accepted the job
        // and the final verdict will arrive at handleFaceWebhook below.

        const jobId = `face-${userId}-${Date.now()}`;
        const selfieBase64 = await smileIdService.imageUrlToBase64(imageUrl);
        const livenessImagesBase64 = await Promise.all(
            livenessImageUrls.map((url) => smileIdService.imageUrlToBase64(url))
        );

        const result = await smileIdService.matchFaceWithBVN(
            { bvn: kyc.bvn as string, selfieBase64, livenessImagesBase64 },
            jobId,
            userId
        );

        if (result.status === "verified") {
            kyc.faceVerification = {
                status: "verified",
                provider: "smile_id",
                jobId: result.jobId,
                confidenceScore: result.confidence || 0,
                verifiedAt: new Date(),
            };

            kyc.status = "in_progress";
        } else if (result.status === "failed") {
            kyc.faceVerification = {
                status: "failed",
                provider: "smile_id",
                jobId: result.jobId,
                confidenceScore: result.confidence || 0,
            };

            kyc.status = "rejected";
            kyc.rejectionReason = result.resultText || "Face verification failed";
        } else if (result.status === "error") {
            kyc.faceVerification = {
                status: "failed",
                provider: "smile_id",
                jobId: result.jobId,
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "Face verification could not be submitted to Smile ID";
        } else {
            // pending: submission succeeded, awaiting webhook.
            kyc.faceVerification = {
                status: "pending",
                provider: "smile_id",
                jobId: result.jobId,
            };
        }

        this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    /**
     * Smile ID webhook handler for Biometric KYC (face match) results.
     * Wire this up to whatever route receives POSTs to your SMILE_ID_CALLBACK_URL.
     * (Not needed for BVN — validateBVN never goes through a webhook.)
     */
    async handleFaceWebhook(payload: SmileWebhookPayload) {
        const isAuthentic = smileIdService.verifyWebhookSignature(payload.timestamp, payload.signature);
        if (!isAuthentic) {
            throw new Error("Invalid Smile ID webhook signature");
        }

        const userId = payload.PartnerParams?.user_id;
        const kyc = await KYC.findOne({ userId });
        if (!kyc) throw new Error("KYC not found for webhook user_id");

        // NOTE (see caveat in SmileIdServices.ts): confirm this pass/fail signal
        // against a real sandbox response for job_type 1 before relying on it in
        // production.
        const confidence = Number(payload.ConfidenceValue) || 0;
        const isVerified = payload.Actions?.Verify_ID_Number === "Verified" && confidence >= 90;

        if (isVerified) {
            kyc.faceVerification = {
                status: "verified",
                provider: "smile_id",
                jobId: payload.PartnerParams.job_id,
                confidenceScore: confidence,
                verifiedAt: new Date(),
            };

            kyc.status = "in_progress";
        } else {
            kyc.faceVerification = {
                status: "failed",
                provider: "smile_id",
                jobId: payload.PartnerParams.job_id,
                confidenceScore: confidence,
            };

            kyc.status = "rejected";
            kyc.rejectionReason = payload.ResultText || "Face verification failed";
        }

        this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    // =========================
    // UTILITY BILL — kept as manual/admin review only.
    // Smile ID has no equivalent of Dojah's OCR-a-bill-photo product; its closest
    // product ("Digital Address Verification") matches a utility ACCOUNT NUMBER
    // to an address, it doesn't accept a bill photo. This stays manual — same
    // behaviour as uploadUtilityBill below.
    // =========================
    async submitUtilityBill(userId: string, base64: string) {
        const kyc = await this.getOrCreateKYC(userId);

        kyc.steps.document.utility.submitted = true;
        kyc.utilityBill = base64;
        kyc.steps.document.utility.submittedAt = new Date();
        kyc.status = "pending_verification";

        kyc.documentVerification = {
            ...kyc.documentVerification,
            utility: {
                status: "pending", // waiting manual/admin review
                provider: "manual",
            },
        };

        await kyc.save();
        return kyc;
    }

    async submitCAC(userId: string, cacDocument: string, companyType: string, rcNumber: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.type !== "organization") {
            throw new Error("CAC is only for organizations");
        }

        kyc.status = "pending_verification";
        kyc.cacDocument = cacDocument
        kyc.steps.document.cac.submitted = true;
        kyc.steps.document.cac.submittedAt = new Date();

        // =========================
        // SMILE ID BUSINESS VERIFICATION (CAC / RC NUMBER LOOKUP)
        // =========================
        // Synchronous, so this stays close to the old Dojah shape: submit, get a
        // final verdict back immediately.

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
                },
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "CAC verification failed";
        }

        await kyc.save();
        return kyc;
    }


    async uploadCACDocument(userId: string, cacDocumentUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.type !== "organization") {
            throw new Error("CAC upload only allowed for organization accounts");
        }

        // ===== STORE FILE =====
        kyc.cacDocument = cacDocumentUrl;

        // ===== STEP TRACKING =====
        kyc.steps.document.cac.submitted = true;
        kyc.steps.document.cac.submittedAt = new Date();

        // ===== MANUAL STATUS =====
        kyc.documentVerification = {
            ...kyc.documentVerification,
            cac: {
                status: "pending", // waiting manual/admin review
                provider: "manual",
                extractedData: {
                    source: "upload",
                    url: cacDocumentUrl,
                },
            },
        };

        kyc.status = "pending_verification";

        await kyc.save();
        return kyc;
    }

    async uploadUtilityBill(userId: string, utilityBillUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        // ===== STORE FILE =====
        kyc.utilityBill = utilityBillUrl;

        // ===== STEP TRACKING =====
        kyc.steps.document.utility.submitted = true;
        kyc.steps.document.utility.submittedAt = new Date();

        // ===== MANUAL STATUS =====
        kyc.documentVerification = {
            ...kyc.documentVerification,
            utility: {
                status: "pending",
                provider: "manual",
                extractedData: {
                    source: "upload",
                    url: utilityBillUrl,
                },
            },
        };

        kyc.status = "pending_verification";

        await kyc.save();
        return kyc;
    }


    async getKYCStatus(userId: string) {
        const kyc = await KYC.findOne({ userId }).select("+bvn");

        if (!kyc) {
            throw new Error("KYC not found");
        }

        // ===== STATES =====
        const bvnStatus = kyc.bvnVerification?.status || "not_submitted";
        const livenessStatus = kyc.livenessVerification?.status || "not_submitted";
        const faceStatus = kyc.faceVerification?.status || "not_submitted";

        const cacStatus = kyc.documentVerification?.cac?.status || "not_submitted";
        const utilityStatus = kyc.documentVerification?.utility?.status || "not_submitted";

        const isBVNVerified = bvnStatus === "verified";
        // const isLivenessVerified = livenessStatus === "verified";
        const isFaceVerified = faceStatus === "verified";

        const isCACVerified = cacStatus === "verified";
        const isUtilityVerified = utilityStatus === "verified";

        // ===== DOCUMENT LOGIC (BASED ON TYPE) =====
        const isDocumentVerified =
            kyc.type === "organization" ? isCACVerified : isUtilityVerified;

        const documentSubmitted =
            kyc.type === "organization"
                ? kyc.steps.document?.cac?.submitted || false
                : kyc.steps.document?.utility?.submitted || false;

        // ===== PROGRESS =====
        let completedSteps = 0;
        let totalSteps = 4;

        if (isBVNVerified) completedSteps++;
        // if (isLivenessVerified) completedSteps++;
        if (isFaceVerified) completedSteps++;
        if (isDocumentVerified) completedSteps++;

        const progress = Number(((completedSteps / totalSteps) * 100).toFixed(2));

        // ===== NEXT ACTION =====
        let nextAction: string;

        if (!isBVNVerified) {
            nextAction = "Submit BVN for verification";
            // } else if (!isLivenessVerified) {
            //     nextAction = "Complete liveness check";
        } else if (!isFaceVerified) {
            nextAction = "Complete facial verification";
        } else if (!documentSubmitted) {
            nextAction =
                kyc.type === "organization"
                    ? "Provide RC number for CAC verification"
                    : "Upload utility bill";
        } else if (!isDocumentVerified) {
            nextAction = "Document under review";
        } else {
            nextAction = "Fully verified";
        }

        // ===== FLAGS =====
        const flags = {
            //canTransact: isBVNVerified,
            canWithdraw: isBVNVerified /*&& isLivenessVerified*/ && isFaceVerified,
            isFullyVerified:
                isBVNVerified &&
                // isLivenessVerified &&
                isFaceVerified &&
                isDocumentVerified,
        };

        return {
            level: kyc.level,
            status: kyc.status,

            progress,

            steps: {
                bvn: {
                    submitted: kyc.steps.bvn.submitted,
                    status: bvnStatus,
                    verified: isBVNVerified,
                },
                // liveness: {
                //     status: livenessStatus,
                //     verified: isLivenessVerified,
                // },
                face: {
                    submitted: kyc.steps.face.submitted,
                    status: faceStatus,
                    verified: isFaceVerified,
                },
                document: {
                    cac: {
                        submitted: kyc.steps.document?.cac?.submitted || false,
                        status: cacStatus,
                        verified: isCACVerified,
                    },
                    utility: {
                        submitted: kyc.steps.document?.utility?.submitted || false,
                        status: utilityStatus,
                        verified: isUtilityVerified,
                    },
                },
            },

            documents: {
                cac:
                    kyc.documentVerification?.cac?.extractedData || null,
                utility:
                    kyc.documentVerification?.utility?.extractedData || null,
            },

            nextAction,
            flags,

            rejectionReason: kyc.rejectionReason || null,

            updatedAt: kyc.updatedAt,
        };
    }


}
