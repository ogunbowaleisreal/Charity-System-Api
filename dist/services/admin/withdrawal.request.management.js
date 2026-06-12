"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalAdminService = void 0;
const mongoose_1 = require("mongoose");
const WithdrawalRequest_1 = require("../../models/WithdrawalRequest");
const transaction_1 = require("../../models/transaction");
const logger_1 = __importDefault(require("../../logger"));
const flutterwave_services_1 = require("../flutterwave.services");
const crypto_1 = __importDefault(require("crypto"));
const Wallet_1 = require("../../models/Wallet");
const servicefee_services_1 = require("../servicefee.services");
const flutterwave = new flutterwave_services_1.FlutterwaveService();
class WithdrawalAdminService {
    constructor() {
        // constructor(private flutterwaveService: any) { }
        this.serviceFeeService = new servicefee_services_1.ServiceFeeService();
    }
    // =========================
    // 📊 GET ALL REQUESTS (ADMIN)
    // =========================
    async getWithdrawalRequests(filters) {
        const { status } = filters;
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (status)
            query.status = status;
        const [data, total] = await Promise.all([
            WithdrawalRequest_1.WithdrawalRequest.find(query)
                .populate("userId", "email firstName lastName role phoneNumber logo profilePicture")
                .populate("reviewedBy", "firstName lastName adminLevel phoneNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            WithdrawalRequest_1.WithdrawalRequest.countDocuments(query),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }
    // =========================
    // ❌ REJECT REQUEST
    // =========================
    async rejectWithdrawal(requestId, adminId, reason) {
        const request = await WithdrawalRequest_1.WithdrawalRequest.findById(requestId);
        if (!request)
            throw new Error("Request not found");
        if (request.status !== "pending") {
            throw new Error("Only pending requests can be rejected");
        }
        const wallet = await Wallet_1.Wallet.findOne({ userId: request.userId });
        if (!wallet)
            throw new Error("Wallet not found");
        wallet.availableBalance += request.amount;
        wallet.lockedBalance -= request.amount;
        await wallet.save();
        request.status = "rejected";
        request.reviewedBy = new mongoose_1.Types.ObjectId(adminId);
        request.reviewedAt = new Date();
        request.rejectionReason = reason;
        await request.save();
        return request;
    }
    // =========================
    // ✅ APPROVE + PROCESS
    // =========================
    async approveAndProcessWithdrawal(requestId, adminId) {
        const request = await WithdrawalRequest_1.WithdrawalRequest.findById(requestId);
        if (!request)
            throw new Error("Request not found");
        if (request.status !== "pending") {
            throw new Error("Request already processed");
        }
        // 🔒 lock it
        request.status = "processing";
        request.reviewedBy = new mongoose_1.Types.ObjectId(adminId);
        request.reviewedAt = new Date();
        await request.save();
        try {
            const config = await this.serviceFeeService.getActiveFee("withdrawal");
            const amountDetails = await this.serviceFeeService.calculate(request.amount, "withdrawal");
            const reference = `WIT_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`; //crypto.randomUUID();
            await transaction_1.WalletTransaction.create({
                userId: request.userId,
                campaignId: request.campaignId,
                type: "user",
                category: "withdrawal",
                status: "pending",
                amount: request.amount,
                currency: request.currency,
                grossAmount: request.amount,
                netAmount: await amountDetails.netAmount,
                fullName: request.bankDetails.accountName,
                serviceCharge: amountDetails.fee,
                method: "bank_transfer",
                provider: "flutterwave",
                reference: reference,
                providerReference: reference,
                //   providerTransactionId: transfer.id,
                balanceBefore: 0, // 🔴 you should calculate this properly
                balanceAfter: 0, // 🔴 same here
            });
            request.status = "processing";
            request.providerReference = reference;
            request.reference = reference;
            //request.providerTransactionId = String(transfer.id);
            request.processedAt = new Date();
            await request.save();
            // =========================
            // 🚀 INITIATE TRANSFER
            // =========================
            const transfer = await flutterwave.initiateTransfer({
                accountBank: request.bankDetails.bankCode,
                accountNumber: request.bankDetails.accountNumber,
                amount: amountDetails.netAmount,
                narration: request.narration,
                reference: reference,
                callbackUrl: process.env.FLUTTERWAVE_WEBHOOK_URL,
                beneficiaryName: request.bankDetails.accountName,
            });
            return request;
        }
        catch (error) {
            logger_1.default.error("Withdrawal processing failed", { error });
            request.status = "failed";
            await request.save();
            throw new Error("Transfer failed");
        }
    }
}
exports.WithdrawalAdminService = WithdrawalAdminService;
