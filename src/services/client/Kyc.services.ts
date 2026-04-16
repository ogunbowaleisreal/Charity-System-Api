import { KYC } from "../../models/KYC";
import { Account } from "../../models/Accounts";
import { Types } from "mongoose";

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


    async submitBVN(userId: string, bvn: string) {
        const kyc = await this.getOrCreateKYC(userId);

        kyc.bvn = bvn;
        kyc.steps.bvn.submitted = true;
        kyc.steps.bvn.submittedAt = new Date();

        kyc.status = "pending_verification";

        // 🔥 provider call placeholder
        const result = await this.verifyBVN(bvn);

        if (result.status === "verified") {
            kyc.bvnVerification = {
                status: "verified",
                provider: "mock",
                matchedData: result.data,
                verifiedAt: new Date(),
            };

            kyc.level = 1;
        } else {
            kyc.bvnVerification = {
                status: "failed",
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "BVN verification failed";
        }

        this.updateStatus(kyc);

        await kyc.save();
        return kyc;
    }



    async submitFace(userId: string, fileUrl: string) {
        const kyc = await this.getOrCreateKYC(userId);

        if (!kyc.bvnVerification || kyc.bvnVerification.status !== "verified") {
            throw new Error("BVN must be verified first");
        }

        kyc.facialImage = fileUrl;
        kyc.steps.face.submitted = true;
        kyc.steps.face.submittedAt = new Date();

        kyc.status = "pending_verification";

        const result = await this.verifyFace(fileUrl, kyc.bvn);

        if (result.status === "verified") {
            kyc.faceVerification = {
                status: "verified",
                provider: "mock",
                confidenceScore: 0.95,
                verifiedAt: new Date(),
            };

            kyc.level = 2;
        } else {
            kyc.faceVerification = {
                status: "failed",
            };

            kyc.status = "rejected";
            kyc.rejectionReason = "Face mismatch";
        }

        this.updateStatus(kyc);

        await kyc.save();
        return kyc;
    }


    async submitDocument(userId: string, fileUrl: string) {
        const kyc = await KYC.findOne({ userId });

        if (!kyc) throw new Error("KYC not initialized");

        // ===== STORE DOCUMENT =====
        if (kyc.type === "organization") {
            kyc.cacDocument = fileUrl;
        } else {
            kyc.utilityBill = fileUrl;
        }

        // ===== STEP TRACKING =====
        kyc.steps.document.completed = true;
        kyc.steps.document.submittedAt = new Date();

        // ===== STATUS UPDATE =====
        kyc.status = "pending_verification";

        this.updateStatus(kyc);

        await kyc.save();

        return kyc;
    }

    // async submitDocument(userId: string, fileUrl: string) {
    //     const kyc = await KYC.findOne({ userId });

    //     if (!kyc) throw new Error("KYC not initialized");

    //     if (kyc.type === "organization") {
    //         kyc.cacDocument = fileUrl;
    //     } else {
    //         kyc.utilityBill = fileUrl;
    //     }

    //     kyc.steps.document.completed = true;
    //     kyc.steps.document.submittedAt = new Date();

    //     this.updateStatus(kyc);

    //     await kyc.save();

    //     return kyc;
    // }


    async getKYCStatus(userId: string) {
        const kyc = await KYC.findOne({ userId }).select("+bvn");

        if (!kyc) {
            throw new Error("KYC not found");
        }

        const bvnStatus = kyc.bvnVerification?.status || "not_submitted";
        const faceStatus = kyc.faceVerification?.status || "not_submitted";

        const isBVNVerified = bvnStatus === "verified";
        const isFaceVerified = faceStatus === "verified";

        // ===== DOCUMENT STATE =====
        const documentOk =
            kyc.type === "organization"
                ? !!kyc.cacDocument
                : !!kyc.utilityBill;

        const documentSubmitted = kyc.steps.document.completed;

        // ===== PROGRESS CALCULATION =====
        let completedSteps = 0;
        let totalSteps = 3;

        if (isBVNVerified) completedSteps++;
        if (isFaceVerified) completedSteps++;
        if (documentOk) completedSteps++;

        const progress = Number(((completedSteps / totalSteps) * 100).toFixed(2));

        // ===== NEXT ACTION LOGIC =====
        let nextAction: string;

        if (!isBVNVerified) {
            nextAction = "Submit BVN for verification";
        } else if (!isFaceVerified) {
            nextAction = "Complete facial verification";
        } else if (!documentOk) {
            nextAction = "Upload required document";
        } else {
            nextAction = "Fully verified";
        }

        // ===== FLAGS =====
        const flags = {
            canTransact: isBVNVerified,
            canWithdraw: isBVNVerified && isFaceVerified,
            isFullyVerified: isBVNVerified && isFaceVerified && documentOk,
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
                face: {
                    submitted: kyc.steps.face.submitted,
                    status: faceStatus,
                    verified: isFaceVerified,
                },
                document: {
                    submitted: documentSubmitted,
                    uploaded: documentOk,
                    type: kyc.type === "organization" ? "cacDocument" : "utilityBill",
                },
            },

            documents: {
                cacDocument: kyc.cacDocument || null,
                utilityBill: kyc.utilityBill || null,
            },

            nextAction,
            flags,

            rejectionReason: kyc.rejectionReason || null,

            updatedAt: kyc.updatedAt,
        };
    }

}