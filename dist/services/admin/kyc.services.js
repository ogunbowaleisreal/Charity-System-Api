"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminKYCService = void 0;
const KYC_1 = require("../../models/KYC");
const mongoose_1 = require("mongoose");
class AdminKYCService {
    // =========================
    // 🔹 GET PENDING KYC DOCUMENTS
    // =========================
    async getPendingKYC(filters) {
        const { page = 1, limit = 10, type, documentType } = filters;
        const query = {};
        if (type)
            query.type = type;
        // 🔥 core logic
        if (documentType === "cac") {
            query["documentVerification.cac.status"] = "pending";
        }
        else if (documentType === "utility") {
            query["documentVerification.utility.status"] = "pending";
        }
        else {
            query.$or = [
                { "documentVerification.cac.status": "pending" },
                { "documentVerification.utility.status": "pending" }
            ];
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            KYC_1.KYC.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            KYC_1.KYC.countDocuments(query)
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    // =========================
    // 🔹 APPROVE DOCUMENT
    // =========================
    async approveDocument(userId, adminId, documentType) {
        const kyc = await KYC_1.KYC.findOne({ userId });
        if (!kyc)
            throw new Error("KYC not found");
        const path = `documentVerification.${documentType}`;
        // Ensure document exists
        if (!kyc.documentVerification?.[documentType]) {
            throw new Error(`${documentType} not submitted`);
        }
        // Update
        kyc.documentVerification[documentType] = {
            ...kyc.documentVerification[documentType],
            status: "verified",
            verifiedAt: new Date(),
            reviewedBy: new mongoose_1.Types.ObjectId(adminId),
        };
        kyc.steps.document[documentType].verified = true;
        this.updateOverallStatus(kyc);
        await kyc.save();
        return kyc;
    }
    // =========================
    // 🔹 REJECT DOCUMENT
    // =========================
    async rejectDocument(userId, adminId, documentType, reason) {
        const kyc = await KYC_1.KYC.findOne({ userId });
        if (!kyc)
            throw new Error("KYC not found");
        if (!kyc.documentVerification?.[documentType]) {
            throw new Error(`${documentType} not submitted`);
        }
        kyc.documentVerification[documentType] = {
            ...kyc.documentVerification[documentType],
            status: "failed",
            reviewedBy: new mongoose_1.Types.ObjectId(adminId),
        };
        kyc.status = "rejected";
        kyc.rejectionReason = reason;
        await kyc.save();
        return kyc;
    }
    // =========================
    // 🔹 GET SINGLE KYC (FOR REVIEW SCREEN)
    // =========================
    async getKYCDetails(userId) {
        const kyc = await KYC_1.KYC.findOne({ userId }).lean();
        if (!kyc)
            throw new Error("KYC not found");
        return kyc;
    }
    // =========================
    // 🔹 GET COUNTS (DASHBOARD)
    // =========================
    async getPendingCounts() {
        const [cacCount, utilityCount] = await Promise.all([
            KYC_1.KYC.countDocuments({
                "documentVerification.cac.status": "pending"
            }),
            KYC_1.KYC.countDocuments({
                "documentVerification.utility.status": "pending"
            }),
        ]);
        return {
            total: cacCount + utilityCount,
            cac: cacCount,
            utility: utilityCount,
        };
    }
    // =========================
    // 🔒 PRIVATE: UPDATE STATUS
    // =========================
    updateOverallStatus(kyc) {
        const bvnOk = kyc.bvnVerification?.status === "verified";
        const faceOk = kyc.faceVerification?.status === "verified";
        const cacOk = kyc.documentVerification?.cac?.status === "verified";
        const utilityOk = kyc.documentVerification?.utility?.status === "verified";
        const docOk = kyc.type === "organization" ? cacOk : utilityOk;
        if (bvnOk && faceOk && docOk) {
            kyc.status = "verified";
            kyc.level = 2;
            kyc.verifiedAt = new Date();
            return;
        }
        if (bvnOk && faceOk) {
            kyc.status = "pending_verification";
            kyc.level = 2;
            return;
        }
        if (bvnOk) {
            kyc.status = "in_progress";
            kyc.level = 1;
            return;
        }
        kyc.status = "in_progress";
        kyc.level = 0;
    }
}
exports.AdminKYCService = AdminKYCService;
