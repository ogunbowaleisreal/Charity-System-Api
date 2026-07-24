import { Donation } from "../../models/Donations";
import { WalletTransaction } from "../../models/transaction";
import { Account } from "../../models/Accounts";
import Campaign from "../../models/Campaign";
import logger from "../../logger";
import axios from "axios";
import { PROVIDERS } from "../../config/providers";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/constants";
import { FlutterwaveService } from "../flutterwave.services";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { Wallet } from "../../models/Wallet";
import { Gratuity } from "../../models/Gratuity";
import { PushNotificationService } from "../pushNotificationService";
import { ServiceFeeService } from "../servicefee.services";
import { startSession } from "mongoose";
import { logAudit } from "../audit.services";
import { AUDIT_ACTIONS, ActorType } from "../../types/auditlogs.types";

const flutterwave = new FlutterwaveService();
const serviceFeeService = new ServiceFeeService();
const provider = PROVIDERS.FLUTTERWAVE;

//const axiosInstance = axios.create({ validateStatus: () => true });

const axiosInstance = axios.create({
    baseURL: provider.baseUrl,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.secretKey}`,
    },
    validateStatus: () => true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === "ECONNABORTED") {
            logger.error("Flutterwave request timeout:", {
                url: error.config?.url,
                timeout: error.config?.timeout,
            });
            throw new AppError(
                "Request timeout - please try again",
                408,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
        throw error;
    }
);

export interface SafeHavenWebhookPayload {
    eventType: string;
    type: "transfer";

    data: {
        queued: boolean;
        limitExceeded: boolean;

        _id: string;
        client: string;
        account: string;

        type: "Inwards" | "Outwards";

        sessionId: string;
        nameEnquiryReference: string;
        paymentReference: string;
        mandateReference: string | null;

        isReversed: boolean;
        reversalReference: string | null;

        provider: "BANK" | string;
        providerChannel: string;
        providerChannelCode: string;

        destinationInstitutionCode: string;

        creditAccountName: string;
        creditAccountNumber: string;
        creditBankVerificationNumber: string | null;
        creditKYCLevel: string;

        debitAccountName: string;
        debitAccountNumber: string;
        realDebitAccountName: string;
        realDebitAccountNumber: string;
        debitBankVerificationNumber: string | null;
        debitKYCLevel: string;

        transactionLocation: string; // "lat,long"
        narration: string;

        amount: number;
        fees: number;
        vat: number;
        stampDuty: number;

        responseCode: string;
        responseMessage: string;

        status: "Completed" | "Pending" | "Failed" | string;

        isDeleted: boolean;

        createdAt: string; // ISO date
        updatedAt: string; // ISO date

        __v: number;
    };
}

export interface IFlutterwaveTransferCompletedWebhook {
    event: "transfer.completed";
    "event.type": "Transfer";

    data: {
        id: number;

        account_number: string;
        bank_name: string;
        bank_code: string;

        fullname: string;

        created_at: string; // ISO date string

        currency: string;
        debit_currency: string;

        amount: number;
        fee: number;

        status: "SUCCESSFUL" | "FAILED" | "PENDING";

        reference: string;

        meta: any | null;

        narration: string;

        approver: string | null;

        complete_message: string;

        requires_approval: number; // 0 | 1
        is_approved: number;       // 0 | 1
    };
}

export interface FlutterwaveWebhookPayload {
    event: string;
    data: {
        id: number;
        tx_ref: string;
        flw_ref: string;
        device_fingerprint: string;
        amount: number;
        currency: string;
        charged_amount: number;
        app_fee: number;
        merchant_fee: number;
        processor_response: string;
        auth_model: string;
        ip: string;
        narration: string;
        status: string;
        payment_type: string;
        created_at: string;
        account_id: number;
        customer: {
            id: number;
            name: string;
            phone_number: string | null;
            email: string;
            created_at: string;
        };
        card: {
            first_6digits: string;
            last_4digits: string;
            issuer: string;
            country: string;
            type: string;
            expiry: string;
        };
    };
    "event.type": string;
}

export interface flutterwaveWebhookPayload {

}

export class webhookServices {
    //private flutterwave = new FlutterwaveService()
    async handleSafeHavenWebhook(payload: SafeHavenWebhookPayload, signature: string) {

        const { eventType, data } = payload;

        console.log(payload)

        switch (eventType) {
            case "account.credit":
                const transaction = await WalletTransaction.create(data);
                return transaction;
            default:
                return null;

            case "account.debit":
                console.log(payload)
                const donation = await Donation.create(data);
                return donation;
        }
    }


    async handleFlutterwaveWebhook(payload: Buffer) {
        try {
            const raw = payload.toString();
            const parsedPayload = JSON.parse(raw)

            const event = parsedPayload.event;
            const eventType = parsedPayload["event.type"];

            // 🔀 Route events cleanly
            if (event === "charge.completed") {
                return this.handleChargeCompleted(
                    parsedPayload as FlutterwaveWebhookPayload
                );
            }

            if (eventType === "transfer.completed") {
                return this.handleTransferCompleted(
                    parsedPayload as IFlutterwaveTransferCompletedWebhook
                );
            }

            //return null;
            logger.error("unhandled event here")

        } catch (error) {
            console.log(error);
        }
    }

    async handleTransferCompleted(
        payload: IFlutterwaveTransferCompletedWebhook
    ) {
        const data = payload.data;
        const status = data.status;

        console.log(payload);

        switch (status) {
            case "SUCCESSFUL": {
                logger.info("Transfer successful");

                const transaction = await WalletTransaction.findOne({ reference: data.reference });
                if (!transaction) throw new Error("Transaction not found");
                if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.reference }); return }
                if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.reference }); return }

                transaction.status = "successful";
                transaction.providerReference = data.reference;
                transaction.providerTransactionId = data.id;

                await transaction.save();

                await Wallet.updateOne(
                    { userId: transaction.userId },
                    { $inc: { lockedBalance: -transaction.amount } }
                );

                // const userWallet = await Wallet.findOne({ userId: transaction.userId });
                // if (!userWallet) throw new Error("Wallet not found");

                // userWallet.lockedBalance -= data.amount;
                // await userWallet.save();

                const request = await WithdrawalRequest.findOne({ reference: data.reference });
                if (!request) throw new Error("Withdrawal request not found");

                request.status = "completed";
                request.providerReference = data.reference;
                request.providerTransactionId = data.id.toString();

                await request.save();
                await logAudit({
                    actorType: ActorType.SYSTEM, // confirmed by Flutterwave webhook, not a direct human action
                    actorId: transaction.userId?.toString() || "system",
                    action: AUDIT_ACTIONS.PAYOUT.SENT,
                    targetType: "WithdrawalRequest",
                    targetId: request._id.toString(),
                    metadata: {
                        reference: data.reference,
                        amount: transaction.amount,
                        fee: data.fee,
                        providerTransactionId: data.id,
                    },
                });

                logger.info("Transfer successful", { reference: data.reference });

                return { transaction, status: "successful" };
            }

            case "FAILED": {
                logger.info("Transfer failed");

                const transaction = await WalletTransaction.findOne({ reference: data.reference });
                if (!transaction) throw new Error("Transaction not found");

                if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.reference }); return }
                if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.reference }); return }

                transaction.status = "failed";
                transaction.providerReference = data.reference;
                transaction.providerTransactionId = data.id;

                await transaction.save();

                await Wallet.updateOne(
                    { userId: transaction.userId },
                    {
                        $inc: {
                            availableBalance: transaction.amount,
                            lockedBalance: -transaction.amount
                        }
                    }
                );

                await logAudit({
                    actorType: ActorType.SYSTEM,
                    actorId: transaction.userId?.toString() || "system",
                    action: AUDIT_ACTIONS.PAYOUT.FAILED,
                    targetType: "WalletTransaction",
                    targetId: transaction._id.toString(),
                    metadata: {
                        reference: data.reference,
                        amount: transaction.amount,
                        complete_message: data.complete_message,
                    },
                });

                return { transaction, status: "failed" };
            }
            default: {
                logger.warn("Unhandled charge status", { status });
                return null;
            }
        }
    }

    private async handleChargeCompleted(
        payload: FlutterwaveWebhookPayload
    ) {

        const session = await startSession();
        session.startTransaction();

        try {

            const data = payload.data;
            const status = data.status;

            logger.info(data)

            if (payload.event === "charge.completed") {
                switch (status) {
                    case "successful": {
                        logger.info("this is undefined event type... treating as successful payment");
                        logger.info("Attempting to verify again from flutterwave...");

                        const transaction = await WalletTransaction.findOne({
                            reference: data.tx_ref
                        }).session(session);

                        if (!transaction) throw new Error("Transaction not found");

                        if (transaction.status === "successful") {
                            logger.info("Transaction already successful", { reference: data.tx_ref });
                            await session.abortTransaction();
                            return;
                        }

                        if (transaction.status === "failed") {
                            logger.info("Transaction already failed", { reference: data.tx_ref });
                            await session.abortTransaction();
                            return;
                        }

                        const campaign = await Campaign.findById(transaction.campaignId)
                            .session(session);

                        if (!campaign) throw new Error("Campaign not found");

                        const response = await flutterwave.verifyTransaction(data.id);
                        console.log(response)

                        if (response.status == "successful") {

                            transaction.status = "successful";
                            transaction.providerReference = data.flw_ref;
                            transaction.providerTransactionId = data.id;
                            transaction.updatedAt = new Date();


                            await transaction.save({ session });

                            logger.info(
                                "Transaction successful, not trying to update campaign and create donation",
                                { reference: data.tx_ref }
                            );

                            const {
                                donationAmount,
                                gratuityAmount,
                                gratuityPercentage,
                                feeType,
                                feeValue
                            } = transaction.metadata as any;

                            const donationCalc = await this.calculateDonation(
                                donationAmount,
                                feeType,
                                feeValue
                            );

                            const donation = await Donation.create([{
                                campaign: transaction.campaignId,
                                amount: donationCalc.grossAmount,
                                serviceFee: donationCalc.fee,
                                netAmount: donationCalc.netAmount,
                                type: transaction.type,
                                donor: transaction.userId,
                                donorName: transaction.fullName,
                                currency: "NGN",
                                paymentProvider: "flutterwave",
                                reference: transaction.reference,
                                donorPhoneNumber: transaction.phoneNumber,
                                isAnonymous: transaction.isAnonymous, //== "Anonymous" ? true : false,
                                //providerR
                                paymentStatus: "success",
                                paymentStatusExtended: "initialized",
                                settlementStatus: "settled",
                                allocationStatus: "allocated_to_campaign",
                                paymentMethod: transaction.method,
                            }], { session });

                            if (gratuityAmount > 0) {
                                await Gratuity.create([{
                                    amount: gratuityAmount,
                                    percentage: gratuityPercentage,
                                    userId: transaction.userId,
                                    fullName: transaction.fullName,
                                    transactionReference: transaction.reference,
                                    campaign: transaction.campaignId,
                                    //purposeTitle: transaction.metadata?.purposeTitle,
                                    currency: "NGN",
                                }], { session });
                            }

                            await Campaign.updateOne(
                                { _id: transaction.campaignId },
                                {
                                    $inc: {
                                        availableBalance: donationCalc.netAmount,
                                        donationCount: 1,
                                        totalRaised: donationCalc.grossAmount
                                    }
                                },
                                { session }
                            );

                            await logAudit({
                                actorType: transaction.userId ? ActorType.USER : ActorType.USER, // see note below
                                actorId: transaction.userId ? transaction.userId.toString() : `guest:${transaction.reference}`,
                                action: AUDIT_ACTIONS.DONATION.CREATED,
                                targetType: "Campaign",
                                targetId: campaign._id.toString(),
                                metadata: {
                                    donationId: donation[0]._id.toString(),
                                    transactionRef: transaction.reference,
                                    grossAmount: donationCalc.grossAmount,
                                    netAmount: donationCalc.netAmount,
                                    serviceFee: donationCalc.fee,
                                    gratuityAmount: gratuityAmount || 0,
                                    isAnonymous: transaction.isAnonymous,
                                    paymentProvider: "flutterwave",
                                },
                                session,
                            });
                            if (transaction.userId) {
                                PushNotificationService.sendToUser(
                                    transaction.userId.toString(),
                                    {
                                        title: "Donation successful",
                                        body: `You have successfully donated ${donationCalc.grossAmount} to ${campaign.title}`,
                                    }
                                ).catch(err => {
                                    logger.error("Push notification failed", err);
                                });

                            }
                        }

                        logger.info("Transaction successful", { reference: data.tx_ref });
                        break;
                    }

                    case "failed": {
                        logger.info("Card transaction ... treating as failed payment");

                        const transaction = await WalletTransaction.findOne({
                            reference: data.tx_ref
                        }).session(session);

                        if (!transaction) throw new Error("Transaction not found");

                        if (transaction.status === "successful") {
                            logger.info("Transaction already successful", { reference: data.tx_ref });
                            return;
                        }

                        if (transaction.status === "failed") {
                            logger.info("Transaction already failed", { reference: data.tx_ref });
                            return;
                        }

                        transaction.status = "failed";
                        transaction.providerReference = data.flw_ref;
                        transaction.providerTransactionId = data.id;

                        await transaction.save({ session });

                        await logAudit({
                            actorType: ActorType.USER,
                            actorId: transaction.userId ? transaction.userId.toString() : `guest:${transaction.reference}`,
                            action: AUDIT_ACTIONS.DONATION.FAILED,
                            targetType: "Campaign",
                            targetId: transaction.campaignId?.toString(),
                            metadata: {
                                transactionRef: transaction.reference,
                                amount: transaction.grossAmount,
                                reason: data.processor_response || data.status,
                            },
                            session,
                        });

                        return { transaction, status: "failed" };
                    }

                    default: {
                        logger.warn("Unhandled charge status", { status });
                        return null;
                    }
                }
            }

            await session.commitTransaction();

        } catch (error: any) {
            await session.abortTransaction();
            logger.error("Transaction failed", { error });
            console.error("FULL WEBHOOK ERROR:", error);
            console.error("STACK:", error?.stack);
            throw error;
        } finally {
            await session.endSession();
        }
    }


    async verifyFlutterwaveWebhook(flutterwaveSignature: string, secret: string): Promise<boolean> {
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

    private async calculateDonation(amount: number, type: string, value: number) {
        //const config = await serviceFeeService.getActiveFee();

        return serviceFeeService.calculate(amount, "donation");
    }


    //: Validate webhook signature (if SafeHaven provides it in future)

    validateSafehavenSignature(payload: string, signature: string, secret: string): boolean {
        const crypto = require("crypto");
        const hash = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
        return hash === signature;
    }

}