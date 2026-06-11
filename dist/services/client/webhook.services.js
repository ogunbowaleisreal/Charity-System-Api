"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookServices = void 0;
const Donations_1 = require("../../models/Donations");
const transaction_1 = require("../../models/transaction");
const Campaign_1 = __importDefault(require("../../models/Campaign"));
const logger_1 = __importDefault(require("../../logger"));
const axios_1 = __importDefault(require("axios"));
const providers_1 = require("../../config/providers");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../utils/constants");
const flutterwave_services_1 = require("../flutterwave.services");
const WithdrawalRequest_1 = require("../../models/WithdrawalRequest");
const wallet_1 = require("../../models/wallet");
const Gratuity_1 = require("../../models/Gratuity");
const pushNotificationService_1 = require("../pushNotificationService");
const servicefee_services_1 = require("../servicefee.services");
const mongoose_1 = require("mongoose");
const flutterwave = new flutterwave_services_1.FlutterwaveService();
const serviceFeeService = new servicefee_services_1.ServiceFeeService();
const provider = providers_1.PROVIDERS.FLUTTERWAVE;
//const axiosInstance = axios.create({ validateStatus: () => true });
const axiosInstance = axios_1.default.create({
    baseURL: provider.baseUrl,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.secretKey}`,
    },
    validateStatus: () => true,
});
axiosInstance.interceptors.response.use((response) => response, (error) => {
    if (error.code === "ECONNABORTED") {
        logger_1.default.error("Flutterwave request timeout:", {
            url: error.config?.url,
            timeout: error.config?.timeout,
        });
        throw new errorHandler_1.AppError("Request timeout - please try again", 408, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
    }
    throw error;
});
class webhookServices {
    //private flutterwave = new FlutterwaveService()
    async handleSafeHavenWebhook(payload, signature) {
        const { eventType, data } = payload;
        console.log(payload);
        switch (eventType) {
            case "account.credit":
                const transaction = await transaction_1.WalletTransaction.create(data);
                return transaction;
            default:
                return null;
            case "account.debit":
                console.log(payload);
                const donation = await Donations_1.Donation.create(data);
                return donation;
        }
    }
    async handleFlutterwaveWebhook(payload) {
        try {
            const raw = payload.toString();
            const parsedPayload = JSON.parse(raw);
            const event = parsedPayload.event;
            const eventType = parsedPayload["event.type"];
            // 🔀 Route events cleanly
            if (event === "charge.completed") {
                return this.handleChargeCompleted(parsedPayload);
            }
            if (eventType === "transfer.completed") {
                return this.handleTransferCompleted(parsedPayload);
            }
            //return null;
            logger_1.default.error("unhandled event here");
        }
        catch (error) {
            console.log(error);
        }
    }
    async handleTransferCompleted(payload) {
        const data = payload.data;
        const status = data.status;
        console.log(payload);
        switch (status) {
            case "SUCCESSFUL": {
                logger_1.default.info("Transfer successful");
                const transaction = await transaction_1.WalletTransaction.findOne({ reference: data.reference });
                if (!transaction)
                    throw new Error("Transaction not found");
                if (transaction.status === "successful") {
                    logger_1.default.info("Transaction already successful", { reference: data.reference });
                    return;
                }
                if (transaction.status === "failed") {
                    logger_1.default.info("Transaction already failed", { reference: data.reference });
                    return;
                }
                transaction.status = "successful";
                transaction.providerReference = data.reference;
                transaction.providerTransactionId = data.id;
                await transaction.save();
                await wallet_1.Wallet.updateOne({ userId: transaction.userId }, { $inc: { lockedBalance: -transaction.amount } });
                // const userWallet = await Wallet.findOne({ userId: transaction.userId });
                // if (!userWallet) throw new Error("Wallet not found");
                // userWallet.lockedBalance -= data.amount;
                // await userWallet.save();
                const request = await WithdrawalRequest_1.WithdrawalRequest.findOne({ reference: data.reference });
                if (!request)
                    throw new Error("Withdrawal request not found");
                request.status = "completed";
                request.providerReference = data.reference;
                request.providerTransactionId = data.id.toString();
                await request.save();
                logger_1.default.info("Transfer successful", { reference: data.reference });
                return { transaction, status: "successful" };
            }
            case "FAILED": {
                logger_1.default.info("Transfer failed");
                const transaction = await transaction_1.WalletTransaction.findOne({ reference: data.reference });
                if (!transaction)
                    throw new Error("Transaction not found");
                if (transaction.status === "successful") {
                    logger_1.default.info("Transaction already successful", { reference: data.reference });
                    return;
                }
                if (transaction.status === "failed") {
                    logger_1.default.info("Transaction already failed", { reference: data.reference });
                    return;
                }
                transaction.status = "failed";
                transaction.providerReference = data.reference;
                transaction.providerTransactionId = data.id;
                await transaction.save();
                await wallet_1.Wallet.updateOne({ userId: transaction.userId }, {
                    $inc: {
                        availableBalance: transaction.amount,
                        lockedBalance: -transaction.amount
                    }
                });
                // const userWallet = await Wallet.findOne({ userId: transaction.userId });
                // if (!userWallet) throw new Error("Wallet not found");
                // userWallet.availableBalance += data.amount;
                // userWallet.lockedBalance -= data.amount;
                // await userWallet.save();
                return { transaction, status: "failed" };
            }
            default: {
                logger_1.default.warn("Unhandled charge status", { status });
                return null;
            }
        }
    }
    async handleChargeCompleted(payload) {
        const session = await (0, mongoose_1.startSession)();
        session.startTransaction();
        try {
            const data = payload.data;
            const status = data.status;
            logger_1.default.info(data);
            if (payload.event === "charge.completed") {
                switch (status) {
                    case "successful": {
                        logger_1.default.info("this is undefined event type... treating as successful payment");
                        logger_1.default.info("Attempting to verify again from flutterwave...");
                        const transaction = await transaction_1.WalletTransaction.findOne({
                            reference: data.tx_ref
                        }).session(session);
                        if (!transaction)
                            throw new Error("Transaction not found");
                        if (transaction.status === "successful") {
                            logger_1.default.info("Transaction already successful", { reference: data.tx_ref });
                            await session.abortTransaction();
                            return;
                        }
                        if (transaction.status === "failed") {
                            logger_1.default.info("Transaction already failed", { reference: data.tx_ref });
                            await session.abortTransaction();
                            return;
                        }
                        const campaign = await Campaign_1.default.findById(transaction.campaignId)
                            .session(session);
                        if (!campaign)
                            throw new Error("Campaign not found");
                        const response = await flutterwave.verifyTransaction(data.id);
                        console.log(response);
                        if (response.status == "successful") {
                            transaction.status = "successful";
                            transaction.providerReference = data.flw_ref;
                            transaction.providerTransactionId = data.id;
                            transaction.updatedAt = new Date();
                            await transaction.save({ session });
                            logger_1.default.info("Transaction successful, not trying to update campaign and create donation", { reference: data.tx_ref });
                            const { donationAmount, gratuityAmount, gratuityPercentage, feeType, feeValue } = transaction.metadata;
                            const donationCalc = await this.calculateDonation(donationAmount, feeType, feeValue);
                            const donation = await Donations_1.Donation.create([{
                                    campaign: transaction.campaignId,
                                    amount: donationCalc.grossAmount,
                                    serviceFee: donationCalc.fee,
                                    netAmount: donationCalc.netAmount,
                                    type: "user",
                                    donor: transaction.userId,
                                    donorName: transaction.fullName,
                                    currency: "NGN",
                                    paymentProvider: "flutterwave",
                                    reference: transaction.reference,
                                    //providerR
                                    paymentStatus: "success",
                                    paymentStatusExtended: "initialized",
                                    settlementStatus: "settled",
                                    allocationStatus: "allocated_to_campaign",
                                    paymentMethod: transaction.method,
                                }], { session });
                            if (gratuityAmount > 0) {
                                await Gratuity_1.Gratuity.create([{
                                        amount: gratuityAmount,
                                        percentage: gratuityPercentage,
                                        userId: transaction.userId,
                                        transactionReference: transaction.reference,
                                        campaign: transaction.campaignId,
                                        //purposeTitle: transaction.metadata?.purposeTitle,
                                        currency: "NGN",
                                    }], { session });
                            }
                            await Campaign_1.default.updateOne({ _id: transaction.campaignId }, {
                                $inc: {
                                    availableBalance: donationCalc.netAmount,
                                    donationCount: 1,
                                    totalRaised: donationCalc.grossAmount
                                }
                            }, { session });
                            if (transaction.userId) {
                                pushNotificationService_1.PushNotificationService.sendToUser(transaction.userId.toString(), {
                                    title: "Donation successful",
                                    body: `You have successfully donated ${donationCalc.grossAmount} to ${campaign.title}`,
                                }).catch(err => {
                                    logger_1.default.error("Push notification failed", err);
                                });
                            }
                        }
                        logger_1.default.info("Transaction successful", { reference: data.tx_ref });
                        break;
                    }
                    case "failed": {
                        logger_1.default.info("Card transaction ... treating as failed payment");
                        const transaction = await transaction_1.WalletTransaction.findOne({
                            reference: data.tx_ref
                        }).session(session);
                        if (!transaction)
                            throw new Error("Transaction not found");
                        if (transaction.status === "successful") {
                            logger_1.default.info("Transaction already successful", { reference: data.tx_ref });
                            return;
                        }
                        if (transaction.status === "failed") {
                            logger_1.default.info("Transaction already failed", { reference: data.tx_ref });
                            return;
                        }
                        transaction.status = "failed";
                        transaction.providerReference = data.flw_ref;
                        transaction.providerTransactionId = data.id;
                        await transaction.save({ session });
                        return { transaction, status: "failed" };
                    }
                    default: {
                        logger_1.default.warn("Unhandled charge status", { status });
                        return null;
                    }
                }
            }
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error("Transaction failed", { error });
            console.error("FULL WEBHOOK ERROR:", error);
            console.error("STACK:", error?.stack);
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    // private async handleChargeCompleted(
    //     payload: FlutterwaveWebhookPayload
    // ) {
    //     const data = payload.data;
    //     const status = data.status;
    //     if (payload.event === "charge.completed") {
    //         switch (status) {
    //             case "successful": {
    //                 //console.log("this is undefined event type... treating as successful payment");
    //                 logger.info("this is undefined event type... treating as successful payment");
    //                 logger.info("Attempting to verify again from flutterwave...");
    //                 const transaction = await WalletTransaction.findOne({ reference: data.tx_ref });
    //                 if (!transaction) throw new Error("Transaction not found");
    //                 if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.tx_ref }); return }
    //                 if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.tx_ref }); return }
    //                 const campaign = await Campaign.findById(transaction.campaignId);
    //                 if (!campaign) throw new Error("Campaign not found");
    //                 // if (campaign.isActive == false) throw new Error("Campaign is not active");
    //                 // if (campaign.status == "completed" || campaign.status == "upcoming")
    //                 //     throw new AppError("Campaign has completed or has not started yet", 400);
    //                 const response = await flutterwave.verifyTransaction(data.id);
    //                 if (response.status == "successful") {
    //                     transaction.status = "successful";
    //                     transaction.providerReference = data.flw_ref;
    //                     transaction.providerTransactionId = data.id;
    //                     await transaction.save();
    //                     logger.info("Transaction successful, not trying to update campaign and create donation", { reference: data.tx_ref });
    //                     const {
    //                         donationAmount,
    //                         gratuityAmount,
    //                         gratuityPercentage,
    //                         feeType,
    //                         feeValue
    //                     } = transaction.metadata as any;
    //                     // const donationAmount = transaction.metadata?.donationAmount;
    //                     const donationCalc = await this.calculateDonation(donationAmount, feeType, feeValue);
    //                     const donation = await Donation.create({
    //                         campaign: transaction.campaignId,
    //                         amount: donationCalc.grossAmount,
    //                         serviceFee: donationCalc.fee,
    //                         netAmount: donationCalc.netAmount,
    //                         type: "user",
    //                         donor: transaction.userId,
    //                         donorName: transaction.fullName,
    //                         currency: "NGN",
    //                         paymentProvider: "flutterwave",
    //                         reference: transaction.reference,
    //                         paymentStatus: "successful",
    //                         paymentStatusExtended: "initialized",
    //                         settlementStatus: "settled",
    //                         allocationStatus: "allocated",
    //                         paymentMethod: transaction.method,
    //                     });
    //                     if (gratuityAmount > 0) {
    //                         await Gratuity.create({
    //                             amount: gratuityAmount,
    //                             percentage: gratuityPercentage,
    //                             userId: transaction.userId,
    //                             transactionReference: transaction.reference,
    //                             campaign: transaction.campaignId,
    //                             purposeTitle: transaction.metadata?.purposeTitle, // snapshot
    //                             currency: "NGN",
    //                         });
    //                     }
    //                     await Campaign.updateOne(
    //                         { _id: transaction.campaignId },
    //                         {
    //                             $inc: {
    //                                 availableBalance: donationCalc.netAmount,  // ✅ correct
    //                                 donationCount: 1,
    //                                 totalRaised: donationCalc.grossAmount      // ✅ correct
    //                             }
    //                         }
    //                     );
    //                     // campaign.availableBalance += data.amount;
    //                     // campaign.donationCount += 1;
    //                     // campaign.totalRaised += data.amount;
    //                     PushNotificationService.sendToUser(transaction.userId.toString(),
    //                         {
    //                             title: "Donation successful",
    //                             body: `You have successfully donated ${donationCalc.grossAmount} to ${campaign.title}`,
    //                         }
    //                     ).catch(err => {
    //                         logger.error("Push notification failed", err);
    //                     });
    //                 }
    //                 logger.info("Transaction successful", { reference: data.tx_ref });
    //                 break;
    //             }
    //             case "failed": {
    //                 logger.info("Card transaction ... treating as failed payment");
    //                 const transaction = await WalletTransaction.findOne({ reference: data.tx_ref });
    //                 if (!transaction) throw new Error("Transaction not found");
    //                 if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.tx_ref }); return }
    //                 if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.tx_ref }); return }
    //                 transaction.status = "failed";
    //                 transaction.providerReference = data.flw_ref;
    //                 transaction.providerTransactionId = data.id;
    //                 await transaction.save();
    //                 return { transaction, status: "failed" };
    //             }
    //             default: {
    //                 logger.warn("Unhandled charge status", { status });
    //                 return null;
    //             }
    //         }
    //     }
    // }
    async verifyFlutterwaveWebhook(flutterwaveSignature, secret) {
        // const secretHash = process.env.FLW_SECRET_HASH;
        // const secretHash = process.env.FLW_SECRET_HASH;
        if (!secret) {
            throw new Error("Missing FLW_SECRET_HASH in environment variables");
        }
        // Flutterwave sends this header
        //   const flutterwaveSignature = req.headers["verif-hash"] as string;
        if (!flutterwaveSignature) {
            return false;
        }
        // IMPORTANT: Flutterwave usually sends plain hash comparison (NOT HMAC of body)
        // So verification is direct match
        return flutterwaveSignature === secret;
    }
    // private calculateDonation(amount: number) {
    //     const SERVICE_FEE_PERCENT = Number(process.env.SERVICE_FEE_PERCENT || 0);
    //     const fee = (SERVICE_FEE_PERCENT / 100) * amount;
    //     const net = amount - fee;
    //     return {
    //         grossAmount: amount,
    //         fee: Number(fee.toFixed(2)),
    //         netAmount: Number(net.toFixed(2))
    //     };
    // }
    async calculateDonation(amount, type, value) {
        //const config = await serviceFeeService.getActiveFee();
        return serviceFeeService.calculate(amount, "donation");
    }
    //: Validate webhook signature (if SafeHaven provides it in future)
    validateSafehavenSignature(payload, signature, secret) {
        const crypto = require("crypto");
        const hash = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
        return hash === signature;
    }
}
exports.webhookServices = webhookServices;
