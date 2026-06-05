"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationService = void 0;
const mongoose_1 = require("mongoose");
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const Donations_1 = require("../../models/Donations");
const safeHaven_services_1 = require("../../services/safeHaven.services");
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../utils/constants");
const wallet_1 = require("../../models/wallet");
const transaction_1 = require("../../models/transaction");
const Accounts_1 = require("../../models/Accounts");
const flutterwave_services_1 = require("../flutterwave.services");
const logger_1 = __importDefault(require("../../logger"));
const ServiceFee_1 = require("../../models/ServiceFee");
const safeHaven = new safeHaven_services_1.SaveHavenService();
const flutterwave = new flutterwave_services_1.FlutterwaveService();
class DonationService {
    // =========================
    // 🔹 INITIATE DONATION
    // =========================
    async initiateDonation(data) {
        //const reference = `don_${Date.now()}`;
        const reference = `DON_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`; //crypto.randomUUID();
        const user = await Accounts_1.Account.findOne({ email: data.email });
        if (!user) {
            logger_1.default.info("User not found, Creating donation for guest user", { email: data.email });
            // throw new AppError("User not found, Creating donation for guest user", 400);
        }
        const campaign = await Campaign_1.default.findById(data.campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        if (campaign.isActive == false)
            throw new Error("Campaign is not active or has been suspended, ");
        if (campaign.status == "completed" || campaign.status == "upcoming")
            throw new Error("Campaign is still upcoming or has been completed");
        const amountData = this.computeDonationBreakdown(data.amount, data.gratuityPercentage || 0);
        const serviceFee = await ServiceFee_1.ServiceFeeConfig.findOne({ isActive: true });
        // if(!serviceFee) 
        const transaction = await transaction_1.WalletTransaction.create({
            //walletId: user.walletId,
            category: "donation",
            //type: "donation",
            status: "pending",
            amount: amountData.totalAmount,
            currency: "NGN",
            method: "bank_transfer",
            gratuityAmount: amountData.gratuityAmount,
            gratuityPercentage: amountData.gratuityPercentage,
            campaignId: campaign._id,
            provider: "flutterwave",
            netAmount: amountData.donationAmount,
            grossAmount: amountData.totalAmount,
            reference: reference,
            idempotencyKey: reference,
            fullName: `${data.firstname} ${data.lastname}`,
            type: user ? "user" : "guest",
            serviceCharge: serviceFee ? serviceFee.value : 0,
            userId: user ? user._id : null, //user._id,
            metadata: {
                campaignId: campaign._id,
                donationAmount: amountData.donationAmount,
                gratuityAmount: amountData.gratuityAmount,
                gratuityPercentage: amountData.gratuityPercentage,
                totalAmount: amountData.totalAmount,
                feeType: serviceFee ? serviceFee.type : "none",
                feeValue: serviceFee ? serviceFee.value : 0,
            },
        });
        const linkExpiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        // 2. Initiate payment with Flutterwave
        const res = await flutterwave.initiateCardPayment({
            txRef: reference,
            amount: amountData.totalAmount, // convert to kobo
            currency: "NGN",
            redirectUrl: `${process.env.BASE_URL}/donations`,
            customerEmail: data.email,
            customerName: `${data.firstname} ${data.lastname}`,
            link_expiration: linkExpiration
            // customerPhone: data.phone,
            //lastname: data.lastname,
            //  reference,
        });
        return {
            transaction,
            checkoutUrl: res.paymentUrl,
            expiresAt: res.expiresAt,
            reference,
            // transactionRef: res.reference,
            //res
        };
    }
    async retryDonation(data) {
        const donation = await Donations_1.Donation.findById(data.donationId);
        if (!donation)
            throw new Error("Donation not found");
        if (donation.paymentStatus !== "failed")
            throw new Error("Donation is not failed");
    }
    async verifyPayment(reference) {
        const transaction = await transaction_1.WalletTransaction.findOne({ reference });
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (transaction.status === "successful") {
            logger_1.default.info("Transaction successful", { reference });
            return { transaction, "status": "successful" }; //transaction
        }
        if (transaction.status === "failed") {
            logger_1.default.info("Transaction failed", { reference });
            //throw new Error("Transaction failed")
            return { transaction, "status": "failed" }; //transaction
        }
        if (transaction.status === "expired") {
            logger_1.default.info("Transaction expired", { reference });
            //throw new Error("Transaction expired")
            return { transaction, "status": "expired" };
        }
        const transactionId = transaction.providerTransactionId;
        const response = await flutterwave.verifyTransaction(transactionId);
        if (response.status == "successful") {
            transaction.status = "successful";
            await transaction.save();
            return { transaction, "status": "successful" };
        }
        return { transaction, "status": "pending" };
    }
    async initiateDonationForGuest(data) {
        //const reference = `don_${Date.now()}`;
        const reference = crypto_1.default.randomUUID();
        const campaign = await Campaign_1.default.findById(data.campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        if (campaign.status == "ongoing" || campaign.status == "upcoming")
            throw new errorHandler_1.AppError("Campaign is still ongoing or has not started yet", 400);
        // 1. Create donation FIRST (critical for idempotency)
        const donation = await Donations_1.Donation.create({
            campaign: data.campaignId,
            type: "guest",
            //donor: null,
            amount: data.amount,
            donorName: `${data.firstname} ${data.lastname}`,
            currency: "NGN",
            paymentProvider: "safe haven",
            transactionRef: reference,
            idempotencyKey: reference,
            paymentStatus: "pending",
            paymentStatusExtended: "initialized",
            settlementStatus: "unsettled",
            allocationStatus: "unallocated",
            paymentMethod: data.paymentMethod,
            donorEmailSnapshot: data.email,
        });
        const linkExpiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        if (data.paymentMethod === "card") {
            const res = await flutterwave.initiateCardPayment({
                txRef: reference,
                amount: data.amount * 100, // convert to kobo
                currency: "NGN",
                redirectUrl: `${process.env.BASE_URL}/api/v1/webhooks/flutterwave/callback`,
                customerEmail: data.email,
                customerName: `${data.firstname} ${data.lastname}`,
                link_expiration: linkExpiration
            });
            return {
                donation,
                checkoutUrl: res.paymentUrl,
                expiresAt: res.expiresAt,
                reference,
                transactionRef: res.reference,
            };
        }
        // bank transfer (virtual account)
        const va = await safeHaven.createVirtualAccount({
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            amount: data.amount,
            reference,
        });
        return {
            donation,
            virtualAccount: va,
        };
    }
    async googlePay(token, userId, paymentDetails) {
        const campaign = await Campaign_1.default.findById(paymentDetails.campaignId);
        if (!campaign)
            throw new Error("Campaign not found");
        if (campaign.status == "ongoing" || campaign.status == "upcoming")
            throw new errorHandler_1.AppError("Campaign is still ongoing or has not started yet", 400);
        //  if (!donation) throw new Error("Donation not found");
        const user = await Accounts_1.Account.findById(userId);
        if (!user)
            throw new Error("User not found");
        const reference = `don_${Date.now()}`;
        const idempotencyKey = crypto_1.default.randomUUID();
        const donation = await Donations_1.Donation.create({
            campaign: paymentDetails.campaignId,
            type: "user",
            donor: user._id,
            amount: paymentDetails.amount,
            donorName: `${paymentDetails.firstname} ${paymentDetails.lastname}`,
            currency: "NGN",
            paymentProvider: "flutterwave",
            transactionRef: reference,
            idempotencyKey: idempotencyKey,
            paymentStatus: "pending",
            paymentStatusExtended: "initialized",
            settlementStatus: "unsettled",
            allocationStatus: "unallocated",
            paymentMethod: "google pay",
            //donorEmailSnapshot: paymentDetails.donorEmailSnapshot,
        });
    }
    async getUserDonations(userId, query) {
        const { page, limit } = query;
        const donations = await Donations_1.Donation.find({ donor: userId, type: "user" }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
        const total = await Donations_1.Donation.countDocuments({ donor: userId, type: "user" });
        const totalPages = Math.ceil(total / limit);
        return {
            donations, pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1
            }
        };
    }
    //     // =========================================
    //     // 🔹 VERIFY DONATION (MANUAL / FRONTEND)
    //     // =========================================
    async verifyDonation(transactionRef) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const donation = await Donations_1.Donation.findOne({
                transactionRef,
            }).session(session);
            if (!donation)
                throw new Error("Donation not found");
            // =============================
            // IDEMPOTENCY CHECK
            // =============================
            if (donation.paymentStatus === "success") {
                return donation;
            }
            // =============================
            // 🔴 SIMULATE PROVIDER VERIFY
            // =============================
            const paymentSuccessful = true;
            if (!paymentSuccessful) {
                donation.paymentStatus = "failed";
                donation.paymentStatusExtended = "failed";
                await donation.save({ session });
                await session.commitTransaction();
                return donation;
            }
            // =============================
            // UPDATE DONATION
            // =============================
            donation.paymentStatus = "success";
            donation.paymentStatusExtended = "success";
            donation.paidAt = new Date();
            // =============================
            // UPDATE CAMPAIGN LEDGER
            // =============================
            const campaign = await Campaign_1.default.findById(donation.campaign).session(session);
            if (!campaign)
                throw new Error("Campaign not found");
            campaign.totalRaised += donation.amount;
            campaign.availableBalance += donation.amount;
            campaign.donationCount += 1;
            donation.allocationStatus = "allocated_to_campaign";
            donation.allocatedAt = new Date();
            await donation.save({ session });
            await campaign.save({ session });
            await session.commitTransaction();
            return donation;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    // =========================
    // 🔹 WEBHOOK HANDLER (CRITICAL)
    // =========================
    async handleWebhook(payload, signature) {
        // 1. VERIFY SIGNATURE
        this.verifyWebhookSignature(payload, signature);
        const reference = payload.referenceCode || payload.reference;
        console.log(payload);
        const { type, data } = payload;
        const donation = await Donations_1.Donation.findOne({
            transactionRef: reference,
        });
        if (!donation)
            return;
        // 2. IDEMPOTENCY CHECK
        if (donation.paymentStatus === "success") {
            return donation;
        }
        // 3. VERIFY WITH SAFEHAVEN (VERY IMPORTANT)
        const verification = await safeHaven.verifyPayment(reference);
        if (verification.status !== "successful") {
            donation.paymentStatus = "failed";
            donation.paymentStatusExtended = "failed";
            await donation.save();
            return donation;
        }
        // 4. UPDATE DONATION
        donation.paymentStatus = "success";
        donation.paymentStatusExtended = "success";
        donation.settlementStatus = "settled";
        donation.paidAt = new Date();
        await donation.save();
        // 5. UPDATE CAMPAIGN LEDGER
        await Campaign_1.default.findByIdAndUpdate(donation.campaign, {
            $inc: {
                totalRaised: donation.amount,
                availableBalance: donation.amount,
                donationCount: 1,
            },
        });
        return donation;
    }
    // =========================
    // 🔹 WITHDRAW FUNDS
    // =========================
    async withdrawFundsToWallet(campaignId, amount, narration) {
        const campaign = await Campaign_1.default.findById(campaignId);
        if (!campaign)
            throw new errorHandler_1.AppError("Campaign not found", 404);
        if (campaign.status == "ongoing" || campaign.status == "upcoming")
            throw new errorHandler_1.AppError("Campaign is still ongoing or has not started yet", 400);
        const userWallet = await wallet_1.Wallet.findOne({
            userId: campaign.owner,
        });
        if (!userWallet)
            throw new errorHandler_1.AppError("Wallet not found", 404);
        if (campaign.availableBalance < amount) {
            throw new errorHandler_1.AppError("Insufficient balance", 400);
        }
        // 1. LOCK FUNDS
        campaign.availableBalance -= amount;
        campaign.frozenBalance += amount;
        await campaign.save();
        // 2. UPDATE WALLET
        userWallet.availableBalance += amount;
        await userWallet.save();
        // try {
        //     // 2. INITIATE TRANSFER
        //     const res = await safeHaven.initiateTransfer({
        //         amount,
        //         account_number: campaign.payoutAccount.accountNumber,
        //         bank_code: campaign.payoutAccount.bankCode,
        //         narration,
        //         reference: `wd_${Date.now()}`,
        //     });
        //     // 3. FINALIZE
        //     campaign.frozenBalance -= amount;
        //     campaign.totalWithdrawn += amount;
        //     await campaign.save();
        //     return res;
        // } catch (error) {
        //     // 4. ROLLBACK
        //     campaign.availableBalance += amount;
        //     campaign.frozenBalance -= amount;
        //     await campaign.save();
        //     throw error;
        // }
    }
    // 🔒 PRIVATE: internal gratuity calculation
    calculateGratuity(donationAmount, gratuityPercentage = 0) {
        if (donationAmount <= 0) {
            throw new Error("Invalid donation amount");
        }
        if (gratuityPercentage < 0) {
            throw new Error("Invalid gratuity percentage");
        }
        const gratuityAmount = (donationAmount * gratuityPercentage) / 100;
        const totalAmount = donationAmount + gratuityAmount;
        return {
            donationAmount: Number(donationAmount.toFixed(2)),
            gratuityPercentage,
            gratuityAmount: Number(gratuityAmount.toFixed(2)),
            totalAmount: Number(totalAmount.toFixed(2)),
        };
    }
    // ✅ PUBLIC: what your service actually uses
    computeDonationBreakdown(donationAmount, gratuityPercentage) {
        return this.calculateGratuity(donationAmount, gratuityPercentage || 0);
    }
    // =========================
    // 🔹 WITHDRAW FUNDS
    // =========================
    async applyForWithdrawalToBank(walletId, amount, accountName, bankCode, bank_name, accountNumber, narration) {
        const wallet = await wallet_1.Wallet.findById(walletId);
        if (!wallet)
            throw new errorHandler_1.AppError("Wallet not found", 404);
        if (wallet.availableBalance < amount) {
            throw new errorHandler_1.AppError("Insufficient balance", 400);
        }
        // 1. LOCK FUNDS
        wallet.availableBalance -= amount;
        // wallet.frozenBalance += amount;
        await wallet.save();
        const newTransaction = new transaction_1.WalletTransaction({
            wallet: walletId,
            amount,
            type: "withdrawal",
            status: "pending",
            narration,
            method: "bank_transfer",
            bankDetails: {
                bankName: bank_name,
                accountNumber,
                accountName: accountName,
            },
        });
        await newTransaction.save();
        // try {
        //     // 2. INITIATE TRANSFER
        //     const res = await safeHaven.initiateTransfer({
        //         amount,
        //         account_number: accountNumber,
        //         bank_code: bankCode,
        //         narration,
        //         reference: `wd_${Date.now()}`,
        //     });
        //     // 3. FINALIZE
        //     wallet.frozenBalance -= amount;
        //     wallet.totalWithdrawn += amount;
        //     await wallet.save();
        //     return res;
        // } catch (error) {
        //     // 4. ROLLBACK
        //     wallet.availableBalance += amount;
        //     wallet.frozenBalance -= amount;
        //     await wallet.save();
        //     throw error;
        // }
    }
    // =========================
    // 🔹 SIGNATURE VERIFICATION
    // =========================
    verifyWebhookSignature(payload, signature) {
        const secret = process.env.SAFEHAVEN_WEBHOOK_SECRET;
        const hash = crypto_1.default
            .createHmac("sha256", secret)
            .update(JSON.stringify(payload))
            .digest("hex");
        if (hash !== signature) {
            throw new errorHandler_1.AppError("Invalid webhook signature", constants_1.HTTP_STATUS.UNAUTHORIZED);
        }
    }
}
exports.DonationService = DonationService;
// import { Types, startSession } from "mongoose";
// import crypto from "crypto";
// import { Donation } from "../../models/Donations";
// import Campaign from "../../models/Campaign";
// import logger from "../../logger";
// export class DonationService {
//     // =========================================
//     // 🔹 CREATE DONATION (INIT PAYMENT)
//     // =========================================
//     async createDonation(data: any, userId?: Types.ObjectId | null) {
//         const session = await startSession();
//         session.startTransaction();
//         try {
//             const {
//                 campaignId,
//                 amount,
//                 paymentMethod,
//                 donorName,
//                 isAnonymous,
//             } = data;
//             // =============================
//             // VALIDATION
//             // =============================
//             const campaign = await Campaign.findById(campaignId).session(session);
//             if (!campaign || campaign.isDeleted) {
//                 throw new Error("Campaign not found");
//             }
//             if (!campaign.isActive) {
//                 throw new Error("Campaign is not active");
//             }
//             // =============================
//             // IDEMPOTENCY KEY
//             // =============================
//             const idempotencyKey = crypto
//                 .createHash("sha256")
//                 .update(`${userId || "anon"}-${campaignId}-${amount}-${Date.now()}`)
//                 .digest("hex");
//             // =============================
//             // CREATE DONATION RECORD
//             // =============================
//             const donation = await Donation.create(
//                 [
//                     {
//                         campaign: campaignId,
//                         donor: userId || null,
//                         donorName,
//                         amount,
//                         currency: "NGN",
//                         paymentProvider: "safe haven",
//                         transactionRef: `TX-${Date.now()}`,
//                         paymentStatus: "pending",
//                         isAnonymous: isAnonymous || false,
//                         idempotencyKey,
//                         paymentStatusExtended: "initialized",
//                         settlementStatus: "unsettled",
//                         allocationStatus: "unallocated",
//                         paymentMethod,
//                     },
//                 ],
//                 { session }
//             );
//             // =============================
//             // 🔴 CALL PAYMENT PROVIDER
//             // (MOCK / SAFEHAVEN INTEGRATION POINT)
//             // =============================
//             const paymentLink = `https://payment-link/${donation[0].transactionRef}`;
//             await session.commitTransaction();
//             return {
//                 donation: donation[0],
//                 paymentLink,
//             };
//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }
//     // =========================================
//     // 🔹 VERIFY DONATION (MANUAL / FRONTEND)
//     // =========================================
//     async verifyDonation(transactionRef: string) {
//         const session = await startSession();
//         session.startTransaction();
//         try {
//             const donation = await Donation.findOne({
//                 transactionRef,
//             }).session(session);
//             if (!donation) throw new Error("Donation not found");
//             // =============================
//             // IDEMPOTENCY CHECK
//             // =============================
//             if (donation.paymentStatus === "success") {
//                 return donation;
//             }
//             // =============================
//             // 🔴 SIMULATE PROVIDER VERIFY
//             // =============================
//             const paymentSuccessful = true;
//             if (!paymentSuccessful) {
//                 donation.paymentStatus = "failed";
//                 donation.paymentStatusExtended = "failed";
//                 await donation.save({ session });
//                 await session.commitTransaction();
//                 return donation;
//             }
//             // =============================
//             // UPDATE DONATION
//             // =============================
//             donation.paymentStatus = "success";
//             donation.paymentStatusExtended = "success";
//             donation.paidAt = new Date();
//             // =============================
//             // UPDATE CAMPAIGN LEDGER
//             // =============================
//             const campaign = await Campaign.findById(donation.campaign).session(session);
//             if (!campaign) throw new Error("Campaign not found");
//             campaign.totalRaised += donation.amount;
//             campaign.availableBalance += donation.amount;
//             campaign.donationCount += 1;
//             donation.allocationStatus = "allocated_to_campaign";
//             donation.allocatedAt = new Date();
//             await donation.save({ session });
//             await campaign.save({ session });
//             await session.commitTransaction();
//             return donation;
//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }
//     // =========================================
//     // 🔹 GET SINGLE DONATION
//     // =========================================
//     async getDonationById(donationId: string) {
//         const donation = await Donation.findById(donationId)
//             .populate("campaign")
//             .populate("donor");
//         if (!donation) throw new Error("Donation not found");
//         return donation;
//     }
//     // =========================================
//     // 🔹 USER DONATIONS
//     // =========================================
//     async getUserDonations(userId: Types.ObjectId, query: any) {
//         const { page = 1, limit = 10 } = query;
//         const donations = await Donation.find({ donor: userId })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .sort({ createdAt: -1 });
//         return donations;
//     }
//     // =========================================
//     // 🔹 CAMPAIGN DONATIONS
//     // =========================================
//     async getCampaignDonations(campaignId: string, query: any) {
//         const { page = 1, limit = 10 } = query;
//         const donations = await Donation.find({ campaign: campaignId })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .sort({ createdAt: -1 });
//         return donations;
//     }
//     // =========================================
//     // 🔹 HANDLE WEBHOOK (CRITICAL)
//     // =========================================
//     async handleWebhook(payload: any) {
//         const session = await startSession();
//         session.startTransaction();
//         try {
//             const { transactionRef, status } = payload;
//             const donation = await Donation.findOne({
//                 transactionRef,
//             }).session(session);
//             if (!donation) throw new Error("Donation not found");
//             // =============================
//             // IDEMPOTENCY
//             // =============================
//             if (donation.paymentStatus === "success") {
//                 await session.commitTransaction();
//                 return donation;
//             }
//             if (status !== "success") {
//                 donation.paymentStatus = "failed";
//                 donation.paymentStatusExtended = "failed";
//                 await donation.save({ session });
//                 await session.commitTransaction();
//                 return donation;
//             }
//             // =============================
//             // SUCCESS FLOW
//             // =============================
//             donation.paymentStatus = "success";
//             donation.paymentStatusExtended = "success";
//             donation.paidAt = new Date();
//             const campaign = await Campaign.findById(donation.campaign).session(session);
//             if (!campaign) throw new Error("Campaign not found");
//             campaign.totalRaised += donation.amount;
//             campaign.availableBalance += donation.amount;
//             campaign.donationCount += 1;
//             donation.allocationStatus = "allocated_to_campaign";
//             donation.allocatedAt = new Date();
//             await donation.save({ session });
//             await campaign.save({ session });
//             await session.commitTransaction();
//             return donation;
//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }
// }
