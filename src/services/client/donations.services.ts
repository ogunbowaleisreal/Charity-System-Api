import { Types, startSession } from "mongoose";
import Campaign from "../../models/Campaign";
import { Donation } from "../../models/Donations";
import { SaveHavenService } from "../../services/safeHaven.services";
import crypto from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { HTTP_STATUS } from "../../utils/constants";
import { Wallet } from "../../models/Wallet";
import { WalletTransaction } from "../../models/transaction";
import { Account } from "../../models/Accounts";
import { FlutterwaveService } from "../flutterwave.services";
import logger from "../../logger";
import { ServiceFeeConfig } from "../../models/ServiceFee";
import { logAudit } from "../../services/audit.services";
import { ActorType, AUDIT_ACTIONS } from "../../types/auditlogs.types";
import { isValidEmail, isValidPhoneNumber, normalizePhoneNumber } from "../../utils/helpers";

const safeHaven = new SaveHavenService();
const flutterwave = new FlutterwaveService();

export type donationFilter = {
    page: number,
    limit: number
}
export type googlePayDetails = {
    amount: number;
    currency: string;
    email: string;
    firstname: string;
    lastname: string;
    campaignId: string;
}

const SUPPORTED_CURRENCIES = {
    NGN: { min: 100 },   // adjust to your own minimums
    USD: { min: 1 },
} as const;
type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

export class DonationService {
    // =========================
    // 🔹 INITIATE DONATION
    // =========================


    async initiateDonation(userId: string, data: {
        campaignId: string;
        email: string;
        firstname?: string;
        lastname?: string;
        phoneNumber?: string
        amount: number;
        gratuityPercentage?: number
        donateAnonymously?: boolean
        isInternational?: boolean;
        // paymentMethod: "card" | "bank_transfer";
    }) {
        if (!data.email && data.donateAnonymously == true) throw new Error("Email is required for anonymous donations")
        if (!data.phoneNumber && data.donateAnonymously == true) throw new Error("Phone number is required for anonymous donations")

        if (!isValidEmail(data.email)) {
            throw new Error("Invalid email address provided");
        }
        data.email = data.email.trim().toLowerCase();

        const currency: SupportedCurrency = data.isInternational ? "USD" : "NGN";
        const scope = data.isInternational ? "international" : "local";

        if (data.amount < SUPPORTED_CURRENCIES[currency].min) {
            throw new Error(`Minimum donation is ${SUPPORTED_CURRENCIES[currency].min} ${currency}`);
        }

        const reference = `DON_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; //crypto.randomUUID();
        const user = await Account.findById(userId) as any
        if (user) {
            logger.info("User found, Creating donation for registered user", { email: data.email });
            data.firstname = user.firstName;
            data.lastname = user.lastName;
        }
        if (!data.firstname || !data.lastname || !data.amount) throw new Error(" insufficient information")

        const campaign = await Campaign.findById(data.campaignId);
        if (!campaign) throw new Error("Campaign not found");
        if (campaign.isActive == false) throw new Error("Campaign is not active or has been suspended, ");
        if (campaign.status == "completed" || campaign.status == "upcoming") throw new Error("Campaign is still upcoming or has been completed");

        const rate = currency === "NGN" ? 1 : await flutterwave.getUsdNgnRate();
        if (!rate || rate <= 0) throw new Error("Exchange rate not configured");

        const breakdown = this.computeDonationBreakdown(data.amount, data.gratuityPercentage || 0);
        const toNgn = (n: number) => Math.round(n * rate * 100) / 100;

        const amountData = {
            donationAmount: toNgn(breakdown.donationAmount),
            gratuityAmount: toNgn(breakdown.gratuityAmount),
            gratuityPercentage: breakdown.gratuityPercentage,
            totalAmount: toNgn(breakdown.totalAmount),
        };

        const serviceFee = await ServiceFeeConfig.findOne({ isActive: true })
        const transaction = await WalletTransaction.create({
            //walletId: user.walletId,
            category: "donation",
            //type: "donation",
            status: "pending",
            amount: amountData.totalAmount,
            currency: "NGN",
            paymentCurrency: currency,
            paymentAmount: breakdown.totalAmount,
            exchangeRate: rate,
            method: "bank_transfer",
            gratuityAmount: amountData.gratuityAmount,
            gratuityPercentage: amountData.gratuityPercentage,
            campaignId: campaign._id,
            provider: "flutterwave",
            phoneNumber: data.phoneNumber,
            // netAmount: amountData.donationAmount,
            grossAmount: amountData.totalAmount,
            reference: reference,
            isAnonymous: data.donateAnonymously,
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
                isAnonymous: data.donateAnonymously

            },
        });
        const linkExpiration = new Date(
            Date.now() + 15 * 60 * 1000
        ).toISOString();

        // 2. Initiate payment with Flutterwave
        const res = await flutterwave.initiateCardPayment({
            txRef: reference,
            amount: breakdown.totalAmount,
            // amount: amountData.totalAmount, // convert to kobo
            currency,
            redirectUrl: `${process.env.REDIRECT_URL}`,
            customerEmail: data.email,
            customerName: data.donateAnonymously ? "Anonymous" : `${data.firstname} ${data.lastname}`,
            link_expiration: linkExpiration,
            customerPhone: data.phoneNumber,
            //lastname: data.lastname,
            //  reference,
        });
        await logAudit({
            actorType: ActorType.USER,
            actorId: user ? user._id.toString() : `guest:${data.email}`,
            actorEmail: data.email,
            action: AUDIT_ACTIONS.DONATION.INITIATED,
            targetType: "Campaign",
            targetId: campaign._id.toString(),
            metadata: {
                transactionId: transaction._id.toString(),
                reference,
                amount: amountData.totalAmount,
                currency,
                isAnonymous: !!data.donateAnonymously,
                donorType: user ? "user" : "guest",
            },
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

    async retryDonation(data: {
        donationId: string;
        reference: string;
    }) {
        const donation = await Donation.findById(data.donationId);
        if (!donation) throw new Error("Donation not found");
        if (donation.paymentStatus !== "failed") throw new Error("Donation is not failed");

    }


    async verifyPayment(reference: string) {
        const transaction = await WalletTransaction.findOne({ reference })
        if (!transaction) {
            throw new Error("Transaction not found")
        }
        if (transaction.status === "successful") {
            logger.info("Transaction successful", { reference })
            return { transaction, "status": "successful" } //transaction
        }
        if (transaction.status === "failed") {
            logger.info("Transaction failed", { reference })
            //throw new Error("Transaction failed")
            return { transaction, "status": "failed" } //transaction
        }

        if (transaction.status === "expired") {
            logger.info("Transaction expired", { reference })
            //throw new Error("Transaction expired")
            return { transaction, "status": "expired" }
        }

        const transactionId = transaction.providerTransactionId

        const response = await flutterwave.verifyTransaction(transactionId);

        if (response.status == "successful") {
            transaction.status = "successful"
            await transaction.save()
            return { transaction, "status": "successful" }
        }
        return { transaction, "status": "pending" }

    }


    async initiateDonationForGuest(data: {
        campaignId: string;
        amount: number;
        paymentMethod: "card" | "bank_transfer";
        firstname: string;
        lastname: string;
        email: string;
    }) {
        //const reference = `don_${Date.now()}`;
        const reference = crypto.randomUUID();
        const campaign = await Campaign.findById(data.campaignId);
        if (!campaign) throw new Error("Campaign not found");
        if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);

        // 1. Create donation FIRST (critical for idempotency)
        const donation = await Donation.create({
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
        const linkExpiration = new Date(
            Date.now() + 15 * 60 * 1000
        ).toISOString();

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

    async googlePay(token: string, userId: string, paymentDetails: googlePayDetails) {
        const campaign = await Campaign.findById(paymentDetails.campaignId);
        if (!campaign) throw new Error("Campaign not found");
        if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);
        //  if (!donation) throw new Error("Donation not found");

        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        const reference = `don_${Date.now()}`;
        const idempotencyKey = crypto.randomUUID();

        const donation = await Donation.create({
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

    async getUserDonations(userId: string, query: donationFilter) {
        const { page, limit } = query;

        const filter = {
            type: "user",
            $or: [
                { donor: userId },
                { campaignOwner: userId },
            ],
        };

        const donations = await Donation.find(filter)
            .populate("donor", "firstName lastName profilePicture logo country state")
            .populate({
                path: "campaign",
                select: "title image description owner",
                populate: {
                    path: "owner",
                    select: "firstName lastName profilePicture logo email country state",
                },
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Donation.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        return {
            donations,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }

    //     // =========================================
    //     // 🔹 VERIFY DONATION (MANUAL / FRONTEND)
    //     // =========================================
    async verifyDonation(transactionRef: string) {
        const session = await startSession();
        session.startTransaction();

        try {
            const donation = await Donation.findOne({
                transactionRef,
            }).session(session);

            if (!donation) throw new Error("Donation not found");

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
            const campaign = await Campaign.findById(donation.campaign).session(session);

            if (!campaign) throw new Error("Campaign not found");

            campaign.totalRaised += donation.amount;
            campaign.availableBalance += donation.amount;
            campaign.donationCount += 1;

            donation.allocationStatus = "allocated_to_campaign";
            donation.allocatedAt = new Date();

            await donation.save({ session });
            await campaign.save({ session });

            await session.commitTransaction();

            return donation;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // =========================
    // 🔹 WEBHOOK HANDLER (CRITICAL)
    // =========================
    async handleWebhook(payload: any, signature: string) {
        // 1. VERIFY SIGNATURE
        this.verifyWebhookSignature(payload, signature);

        const reference = payload.referenceCode || payload.reference;
        console.log(payload)

        const { type, data } = payload;

        const donation = await Donation.findOne({
            transactionRef: reference,
        });

        if (!donation) return;

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
        await Campaign.findByIdAndUpdate(donation.campaign, {
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
    async withdrawFundsToWallet(
        campaignId: string,
        amount: number,
        narration: string
    ) {
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new AppError("Campaign not found", 404);
        if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);

        const userWallet = await Wallet.findOne({
            userId: campaign.owner,
        });

        if (!userWallet) throw new AppError("Wallet not found", 404);


        if (campaign.availableBalance < amount) {
            throw new AppError("Insufficient balance", 400);
        }

        // 1. LOCK FUNDS
        campaign.availableBalance -= amount;
        campaign.frozenBalance += amount;
        await campaign.save();

        // 2. UPDATE WALLET
        userWallet.availableBalance += amount;
        await userWallet.save();
    }


    // 🔒 PRIVATE: internal gratuity calculation
    calculateGratuity(
        donationAmount: number,
        gratuityPercentage: number = 0
    ) {
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
    computeDonationBreakdown(
        donationAmount: number,
        gratuityPercentage?: number
    ) {
        return this.calculateGratuity(
            donationAmount,
            gratuityPercentage || 0
        );
    }

    // =========================
    // 🔹 WITHDRAW FUNDS
    // =========================
    async applyForWithdrawalToBank(
        walletId: string,
        amount: number,
        accountName: string,
        bankCode: string,
        bank_name: string,
        accountNumber: string,
        narration: string
    ) {
        const wallet = await Wallet.findById(walletId);

        if (!wallet) throw new AppError("Wallet not found", 404);

        if (wallet.availableBalance < amount) {
            throw new AppError("Insufficient balance", 400);
        }

        // 1. LOCK FUNDS
        wallet.availableBalance -= amount;
        // wallet.frozenBalance += amount;
        await wallet.save();

        const newTransaction = new WalletTransaction({
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
    }

    // =========================
    // 🔹 SIGNATURE VERIFICATION
    // =========================
    private verifyWebhookSignature(payload: any, signature: string) {
        const secret = process.env.SAFEHAVEN_WEBHOOK_SECRET!;

        const hash = crypto
            .createHmac("sha256", secret)
            .update(JSON.stringify(payload))
            .digest("hex");

        if (hash !== signature) {
            throw new AppError(
                "Invalid webhook signature",
                HTTP_STATUS.UNAUTHORIZED
            );
        }
    }
}
