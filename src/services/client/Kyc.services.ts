import { KYC } from "../../models/KYC";
import { Account } from "../../models/Accounts";
import { Types } from "mongoose";

export class KYCService {

    async startKYC(userId: string) {
        const existing = await KYC.findOne({ userId });

        if (existing) {
            return existing;
        }

        const account = await Account.findById(userId);
        if (!account) throw new Error("Account not found");

        const kyc = await KYC.create({
            userId: new Types.ObjectId(userId),
            type: account.role === "user" ? "user" : "organization",
        });

        return kyc;
    }

    async submitBVN(userId: string, bvn: string) {
        const kyc = await KYC.findOne({ userId });

        if (!kyc) throw new Error("KYC not initialized");

        // Optional: prevent resubmission after success
        if (kyc.steps.bvn.verified) {
            throw new Error("BVN already verified");
        }

        // 🔐 (encrypt in production)
        kyc.bvn = bvn;

        kyc.steps.bvn.completed = true;
        kyc.steps.bvn.submittedAt = new Date();

        // 🔥 Call provider
        const result = await this.verifyBVN(bvn);

        if (result.status === "verified") {
            kyc.steps.bvn.verified = true;
        } else if (result.status === "failed") {
            kyc.status = "rejected";
            kyc.rejectionReason = "Invalid BVN";
        } else {
            // async verification case
            kyc.status = "pending_verification";
        }

        await this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    private async verifyBVN(bvn: string) {
        // 🔥 Replace with real provider (Dojah, Smile Identity, etc.)

        // Simulated response
        if (bvn.length === 11) {
            return {
                status: "verified",
                data: {
                    firstName: "John",
                    lastName: "Doe",
                    dob: "1995-01-01"
                }
            };
        }

        return { status: "failed" };
    }

    // async submitBVN(userId: string, bvn: string) {
    //     const kyc = await KYC.findOne({ userId });

    //     if (!kyc) throw new Error("KYC not initialized");

    //     // 🔐 (encrypt this in real app)
    //     kyc.bvn = bvn;

    //     kyc.steps.bvn.completed = true;
    //     kyc.steps.bvn.submittedAt = new Date();

    //     await this.updateStatus(kyc);

    //     await kyc.save();

    //     return kyc;
    // }

    async submitFace(userId: string, fileUrl: string) {
        const kyc = await KYC.findOne({ userId });

        if (!kyc) throw new Error("KYC not initialized");

        if (!kyc.steps.bvn.completed) {
            throw new Error("BVN must be submitted first");
        }

        kyc.facialImage = fileUrl;

        kyc.steps.face.completed = true;
        kyc.steps.face.submittedAt = new Date();

        // 🔥 Call provider
        const result = await this.verifyFace(fileUrl, kyc.bvn);

        if (result.status === "verified") {
            kyc.steps.face.verified = true;
        } else if (result.status === "failed") {
            kyc.status = "rejected";
            kyc.rejectionReason = "Face mismatch";
        } else {
            // pending (async case)
            kyc.status = "pending_verification";
        }

        await this.updateStatus(kyc);
        await kyc.save();

        return kyc;
    }

    // async submitFace(userId: string, fileUrl: string) {
    //     const kyc = await KYC.findOne({ userId });

    //     if (!kyc) throw new Error("KYC not initialized");

    //     kyc.facialImage = fileUrl;

    //     kyc.steps.face.completed = true;
    //     kyc.steps.face.submittedAt = new Date();

    //     await this.updateStatus(kyc);

    //     await kyc.save();

    //     return kyc;
    // }

    async submitDocument(userId: string, fileUrl: string) {
        const kyc = await KYC.findOne({ userId });

        if (!kyc) throw new Error("KYC not initialized");

        if (kyc.type === "organization") {
            kyc.cacDocument = fileUrl;
        } else {
            kyc.utilityBill = fileUrl;
        }

        kyc.steps.document.completed = true;
        kyc.steps.document.submittedAt = new Date();

        await this.updateStatus(kyc);

        await kyc.save();

        return kyc;
    }

    async getKYCStatus(userId: string) {
        const kyc = await KYC.findOne({ userId });

        if (!kyc) throw new Error("KYC not found");

        return {
            status: kyc.status,
            steps: kyc.steps,
        };
    }

    private async updateStatus(kyc: any) {
        const { bvn, face, document } = kyc.steps;

        let allVerified = false;

        if (kyc.type === "personal") {
            allVerified =
                bvn.verified &&
                face.verified &&
                document.verified;
        } else {
            allVerified =
                bvn.verified &&
                document.verified;
        }

        if (allVerified) {
            kyc.status = "verified";
            kyc.verifiedAt = new Date();
        }
    }

    // 🔥 CORE LOGIC
    // private async updateStatus(kyc: any) {
    //     const { bvn, face, document } = kyc.steps;

    //     // 👇 dynamic logic based on type
    //     let allCompleted = false;

    //     if (kyc.type === "personal") {
    //         allCompleted =
    //             bvn.completed &&
    //             face.completed &&
    //             document.completed;
    //     } else {
    //         // orgs don’t need face (adjust if needed)
    //         allCompleted =
    //             bvn.completed &&
    //             document.completed;
    //     }

    //     if (allCompleted) {
    //         kyc.status = "pending_review";
    //         kyc.submittedAt = new Date();
    //     } else {
    //         kyc.status = "in_progress";
    //     }
    // }

    private async verifyFace(imageUrl: string, bvn?: string) {
        // simulate external API
        // replace with Dojah / Smile Identity later

        return {
            status: "verified", // or "failed" or "pending"
        };
    }
}