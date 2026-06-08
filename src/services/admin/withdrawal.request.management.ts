import { Types } from "mongoose";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { WalletTransaction } from "../../models/transaction";
import Campaign from "../../models/Campaign";
import logger from "../../logger";
import { FlutterwaveService } from "../flutterwave.services";
import crypto from "crypto";
import { Wallet } from "../../models/wallet";
import { parse } from "path";

const flutterwave = new FlutterwaveService();

export class WithdrawalAdminService {
    // constructor(private flutterwaveService: any) { }

    // =========================
    // 📊 GET ALL REQUESTS (ADMIN)
    // =========================
    async getWithdrawalRequests(filters: any) {
        const { status } = filters;

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;

        const skip = (page - 1) * limit;

        const query: any = {};
        if (status) query.status = status;

        const [data, total] = await Promise.all([
            WithdrawalRequest.find(query)
                .populate("userId", "email firstName lastName role phoneNumber logo profilePicture")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            WithdrawalRequest.countDocuments(query),
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
    async rejectWithdrawal(
        requestId: string,
        adminId: string,
        reason: string
    ) {
        const request = await WithdrawalRequest.findById(requestId);

        if (!request) throw new Error("Request not found");

        if (request.status !== "pending") {
            throw new Error("Only pending requests can be rejected");
        }
        const wallet = await Wallet.findOne({ userId: request.userId });

        if (!wallet) throw new Error("Wallet not found");

        wallet.availableBalance += request.amount;
        wallet.lockedBalance -= request.amount;
        await wallet.save();

        request.status = "rejected";
        request.reviewedBy = new Types.ObjectId(adminId);
        request.reviewedAt = new Date();
        request.rejectionReason = reason;

        await request.save();

        return request;
    }

    // =========================
    // ✅ APPROVE + PROCESS
    // =========================
    async approveAndProcessWithdrawal(
        requestId: string,
        adminId: string
    ) {
        const request = await WithdrawalRequest.findById(requestId);

        if (!request) throw new Error("Request not found");

        if (request.status !== "pending") {
            throw new Error("Request already processed");
        }

        // 🔒 lock it
        request.status = "processing";
        request.reviewedBy = new Types.ObjectId(adminId);
        request.reviewedAt = new Date();
        await request.save();

        try {

            const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; //crypto.randomUUID();

            await WalletTransaction.create({
                userId: request.userId,
                campaignId: request.campaignId,
                type: "user",
                category: "withdrawal",
                status: "pending",
                amount: request.amount,
                currency: request.currency,
                grossAmount: request.amount,
                netAmount: request.amount,
                fullName: request.bankDetails.accountName,
                method: "bank_transfer",
                provider: "flutterwave",
                reference: request.reference,
                providerReference: reference,
                //   providerTransactionId: transfer.id,
                balanceBefore: 0, // 🔴 you should calculate this properly
                balanceAfter: 0,  // 🔴 same here
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
                amount: request.amount,
                narration: request.narration,
                reference: reference,
                callbackUrl: process.env.FLUTTERWAVE_WEBHOOK_URL,
                beneficiaryName: request.bankDetails.accountName,
            });


            return request;

        } catch (error: any) {
            logger.error("Withdrawal processing failed", { error });

            request.status = "failed";
            await request.save();

            throw new Error("Transfer failed");
        }
    }
}