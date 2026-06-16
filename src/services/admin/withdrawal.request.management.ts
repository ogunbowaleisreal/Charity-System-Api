import { Types } from "mongoose";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { WalletTransaction } from "../../models/transaction";
import Campaign from "../../models/Campaign";
import {
    buildPagination,
    formatPagination,
    PaginationQuery
} from "../../utils/admin/paginationUtills";
import logger from "../../logger";
import { FlutterwaveService } from "../flutterwave.services";
import crypto from "crypto";
import { Wallet } from "../../models/Wallet";
import { ServiceFeeService } from "../servicefee.services";
import { DashboardService } from "./dashboardStatistics";
import { sendPaginatedResponse } from "../../utils/helpers";

const flutterwave = new FlutterwaveService();
const dashboard = new DashboardService()

export class WithdrawalAdminService {
    // constructor(private flutterwaveService: any) { }
    serviceFeeService = new ServiceFeeService()

    // =========================
    // 📊 GET ALL REQUESTS (ADMIN)
    // =========================

    async getWithdrawalRequests(filters: any) {
        const { status, userId, startDate, endDate, search } = filters;

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;

        const { skip } = buildPagination(page, limit);

        const query: any = {};

        if (status) query.status = status;

        // 🔍 search
        if (search) {
            query.$or = [
                {
                    firstName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    userName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    companyName: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // 📅 date range
        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        if (userId) {
            query.userId = new Types.ObjectId(userId);

            const withdrawalRequestsStats =
                await dashboard.getUserWithdrawalRequestStats(
                    new Types.ObjectId(userId)
                );

            const [data, total] = await Promise.all([
                WithdrawalRequest.find(query)
                    .populate(
                        "userId",
                        "email firstName lastName role phoneNumber logo profilePicture"
                    )
                    .populate(
                        "reviewedBy",
                        "firstName lastName adminLevel phoneNumber"
                    )
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),

                WithdrawalRequest.countDocuments(query),
            ]);

            return formatPagination(
                { data, withdrawalRequestsStats },
                total,
                page,
                limit
            );
        }

        const withdrawalRequestsStats =
            await dashboard.getWithdrawalRequestStats();

        const [data, total] = await Promise.all([
            WithdrawalRequest.find(query)
                .populate(
                    "userId",
                    "email firstName lastName role phoneNumber logo profilePicture"
                )
                .populate(
                    "reviewedBy",
                    "firstName lastName adminLevel phoneNumber"
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            WithdrawalRequest.countDocuments(query),
        ]);

        return formatPagination(
            { data, withdrawalRequestsStats },
            total,
            page,
            limit
        );
    }

    // async getWithdrawalRequests(filters: any) {
    //     const { status, userId, startDate, endDate } = filters;

    //     const page = parseInt(filters.page) || 1;
    //     const limit = parseInt(filters.limit) || 10;

    //     const { skip } = buildPagination(page, limit);

    //     const query: any = {};
    //     if (status) query.status = status;

    //     // 📅 date range
    //     if (startDate || endDate) {
    //         query.createdAt = {};
    //         if (startDate) query.createdAt.$gte = new Date(startDate);
    //         if (endDate) query.createdAt.$lte = new Date(endDate);
    //     }

    //     if (userId) {
    //         query.userId = new Types.ObjectId(userId);

    //         const withdrawalRequestsStats = await dashboard.getUserWithdrawalRequestStats(new Types.ObjectId(userId))
    //         const [data, total] = await Promise.all([
    //             WithdrawalRequest.find(query)
    //                 .populate("userId", "email firstName lastName role phoneNumber logo profilePicture")
    //                 .populate("reviewedBy", "firstName lastName adminLevel phoneNumber")
    //                 .sort({ createdAt: -1 })
    //                 .skip(skip)
    //                 .limit(limit),

    //             WithdrawalRequest.countDocuments(query),
    //         ]);
    //         return formatPagination({ data, withdrawalRequestsStats }, total, page, limit)
    //     }

    //     const withdrawalRequestsStats = await dashboard.getWithdrawalRequestStats()

    //     const [data, total] = await Promise.all([
    //         WithdrawalRequest.find(query)
    //             .populate("userId", "email firstName lastName role phoneNumber logo profilePicture")
    //             .populate("reviewedBy", "firstName lastName adminLevel phoneNumber")
    //             .sort({ createdAt: -1 })
    //             .skip(skip)
    //             .limit(limit),

    //         WithdrawalRequest.countDocuments(query),
    //     ]);

    //     return formatPagination({ data, withdrawalRequestsStats }, total, page, limit)
    // }

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
            const config = await this.serviceFeeService.getActiveFee("withdrawal")
            const amountDetails = await this.serviceFeeService.calculate(request.amount, "withdrawal")

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
                netAmount: await amountDetails.netAmount,
                fullName: request.bankDetails.accountName,
                serviceCharge: amountDetails.fee,
                method: "bank_transfer",
                provider: "flutterwave",
                reference: reference,
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
                amount: amountDetails.netAmount,
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