import { KYC } from "../../models/KYC";
import { Account } from "../../models/Accounts";
import { Types } from "mongoose";
import { DojahService } from "../DojahServices";
import { dojahConfig } from "../../config/dojah.config";
import logger from "../../logger";
import { ZeehKycService } from "../zeehAfrica.services";
import { ZeehConfig } from "../../config/zeehAfrica.config";

const dojahService = new DojahService(dojahConfig);
const zeehService = new ZeehKycService(ZeehConfig.apiKey, ZeehConfig.baseUrl, ZeehConfig.webhookSecret);

export class KYCService {

    private async getOrCreateKYC(userId: string) {
        let kyc = await KYC.findOne({ userId });

        if (!kyc) {
            kyc = await KYC.create({
                userId,
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
        payload: {
            bvn: string;
            dob: string;
        }
    ) {
        const kyc = await this.getOrCreateKYC(userId);

        kyc.bvn = payload.bvn;
        kyc.steps.bvn.submitted = true;
        kyc.steps.bvn.submittedAt = new Date();
        kyc.status = "pending_verification";

        // =========================
        // ZEEH BVN VERIFICATION ONLY
        // =========================

        const result = await zeehService.verifyBVN(payload.bvn);

        const isVerified =
            result?.success === true &&
            result?.data &&
            result?.data?.firstName;

        // =========================
        // SUCCESS
        // =========================

        if (isVerified && result?.data.dateOfBirth == payload.dob) {
            kyc.bvnVerification = {
                status: "verified",
                provider: "zeeh",
                matchedData: {
                    firstName: result.data.firstName,
                    middleName: result.data.middleName,
                    lastName: result.data.lastName,
                    dateOfBirth: result.data.dateOfBirth,
                    phoneNumber: result.data.phoneNumber,
                },
                verifiedAt: new Date(),
            };
        }

        // =========================
        // FAILURE
        // =========================

        else {
            kyc.bvnVerification = {
                status: "failed",
                provider: "zeeh",
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "BVN verification failed";
        }

        // =========================
        // STATE UPDATE
        // =========================

        this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    async submitFace(userId: string, imageUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (kyc.bvnVerification?.status !== "verified") {
            throw new Error("BVN must be verified first");
        }

        kyc.facialImage = imageUrl;

        kyc.steps.face.submitted = true;
        kyc.steps.face.submittedAt = new Date();
        kyc.status = "pending_verification";

        // =========================
        // ZEEH FACE VERIFICATION
        // =========================

        const result = await zeehService.verifyFace(
            kyc.bvn as any,
            imageUrl,
        );

        const isVerified =
            result?.success === true &&
            result?.data?.face_data.confidence >= 85;

        // =========================
        // SUCCESS
        // =========================

        if (isVerified) {
            kyc.faceVerification = {
                status: "verified",
                provider: "zeeh",
                confidenceScore: result.data.face_data.confidence || 0,
                verifiedAt: new Date(),
            };

            kyc.status = "in_progress";
        }

        // =========================
        // FAILURE
        // =========================

        else {
            kyc.faceVerification = {
                status: "failed",
                provider: "zeeh",
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "Face verification failed";
        }

        this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }



    async submitUtilityBill(userId: string, base64: string) {
        const kyc = await this.getOrCreateKYC(userId);

        kyc.steps.document.utility.submitted = true;
        kyc.utilityBill = base64
        kyc.steps.document.utility.submittedAt = new Date();
        kyc.status = "pending_verification";

        const result = await dojahService.verifyUtilityBill(base64);

        if (result.status === "verified") {
            kyc.documentVerification = {
                ...kyc.documentVerification,
                utility: {
                    status: "verified",
                    provider: "dojah",
                    extractedData: result.data,
                    verifiedAt: new Date(),
                },
            };

            kyc.steps.document.utility.verified = true;

            // kyc.steps.document.verified = true;
        } else {
            kyc.documentVerification = {
                ...kyc.documentVerification,
                utility: {
                    status: "verified",
                    provider: "dojah",
                },
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "Utility bill verification failed";
        }

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

        const result = await dojahService.verifyCAC(rcNumber, companyType);

        if (result.status === "verified") {
            kyc.documentVerification = {
                ...kyc.documentVerification,
                cac: {
                    status: "verified",
                    provider: "dojah",
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
                    provider: "dojah",
                },
            };

            //   kyc.steps.document.cac.verified = true;
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

        // if (kyc.type !== "user") {
        //     throw new Error("Utility bill upload only allowed for personal accounts");
        // }

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