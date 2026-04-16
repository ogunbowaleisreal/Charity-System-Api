import { Donation } from "../../models/Donations";
import { WalletTransaction } from "../../models/transaction";
import { Account } from "../../models/Accounts";
import Campaign from "../../models/Campaign";
import { saasservicemgmt_v1beta1 } from "googleapis";
import Crypto from "crypto";
import logger from "../../logger";
import axios from "axios";
import { PROVIDERS } from "../../config/providers";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/constants";
import { FlutterwaveService } from "../flutterwave.services";

const flutterwave = new FlutterwaveService();

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

            const parsedPayload = JSON.parse(payload.toString()) as FlutterwaveWebhookPayload;
            const eventType = parsedPayload["event.type"];
            const event = parsedPayload.event;
            const data = parsedPayload.data;

            console.log(parsedPayload);
            if (event == "charge.completed") {

                switch (eventType) {
                    case undefined: {
                        console.log("this is undefined event type... treating as successful payment")
                        logger.info("this is undefined event type... treating as successful payment")
                        logger.info("Attempting to verify again from flutterwave...");
                        const transaction = await WalletTransaction.findOne({ reference: data.tx_ref });
                        if (!transaction) throw new Error("Transaction not found")
                        const response = await flutterwave.verifyTransaction(transaction.providerTransactionId);

                        if (response.status == "successful") {
                            transaction.status = "successful"
                            transaction.providerReference = data.flw_ref
                            transaction.providerTransactionId = data.id
                            await transaction.save()
                            logger.info("Transaction successful, not trying to update campaign and create donation", { reference: data.tx_ref })
                            //return { transaction, "status": "successful" }

                            const donation = await Donation.create({
                                campaign: transaction.campaignId,
                                amount: data.amount,
                                type: "user",
                                donor: transaction.userId,
                                donorName: transaction.fullName,
                                currency: "NGN",
                                paymentProvider: "flutterwave",
                                reference: transaction.reference,
                                // idempotencyKey: transaction.idempotencyKey,
                                paymentStatus: "successful",
                                paymentStatusExtended: "initialized",
                                settlementStatus: "settled",
                                allocationStatus: "allocated",
                                paymentMethod: transaction.method,
                                // donorEmailSnapshot: data.email,
                            });

                            const campaign = await Campaign.findById(transaction.campaignId);
                            if (!campaign) throw new Error("Campaign not found");
                            if (campaign.isActive == false) throw new Error("Campaign is not active");
                            if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);
                            campaign.availableBalance += data.amount;
                            campaign.donationCount += 1;
                            campaign.totalRaised += data.amount;
                            // campaign.
                            await campaign.save();

                            break;
                            // return transaction;
                        }
                    }


                    case "CARD_TRANSACTION": {
                        logger.info("Card transaction ... treating as failed payment");
                        const transaction = await WalletTransaction.findOne({ reference: data.tx_ref });
                        if (!transaction) throw new Error("Transaction not found")
                        transaction.status = "failed"
                        transaction.providerReference = data.flw_ref
                        transaction.providerTransactionId = data.id
                        await transaction.save()
                        return { transaction, "status": "failed" }
                    }

                    default:
                        return null;
                }
            }
        } catch (error) {
            console.log(error)
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