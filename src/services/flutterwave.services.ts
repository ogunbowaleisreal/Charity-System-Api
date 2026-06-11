import { PROVIDERS } from "../config/providers";
import logger from "../logger";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/constants";
import { formatPhoneNumber } from "../utils/helpers";
import axios, { AxiosInstance } from "axios";
//import { webhookServices } from "./client/webhook.services";
import { IFlutterwaveTransferCompletedWebhook } from "./client/webhook.services";
import { Wallet } from "../models/wallet";
import { WalletTransaction } from "../models/transaction";
import { WithdrawalRequest } from "../models/WithdrawalRequest";

export interface FlutterwaveAccountData {
    account_number: string;
    account_reference: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    email: string;
    bvn: string;
    amount?: number;
    split_code?: string;
    tx_ref: string;
    frequency: string;
    duration?: string;
    is_permanent: boolean;
    created_at: string;
    expiry_date?: string;
}

const mockTransferCompletedWebhook: IFlutterwaveTransferCompletedWebhook = {
    event: "transfer.completed",
    "event.type": "Transfer",

    data: {
        id: 26251,

        account_number: "1234567840",
        bank_name: "ACCESS BANK NIGERIA",
        bank_code: "044",

        fullname: "Flutterwave Developers",

        created_at: new Date().toISOString(),

        currency: "NGN",
        debit_currency: "NGN",

        amount: 5500,
        fee: 45,

        status: "SUCCESSFUL",

        reference: "akhlm-pstmnpyt-rfxx007_PMCKDU_1",

        meta: null,

        narration: "Withdrawal payout",

        approver: null,

        complete_message: "Transfer completed successfully",

        requires_approval: 0,
        is_approved: 1,
    },
};

export interface FlutterwaveCreateAccountRes {
    status: string;
    message: string;
    data: FlutterwaveAccountData;
}

export interface FlutterwaveTransferResponse {
    status: string;
    message: string;
    data: {
        id: number;
        account_number: string;
        bank_code: string;
        full_name: string;
        created_at: string;
        currency: string;
        debit_currency: string;
        amount: number;
        fee: number;
        status: "NEW" | "PENDING" | "SUCCESSFUL" | "FAILED";
        reference: string;
        meta: Record<string, unknown> | null;
        narration: string;
        complete_message: string;
        requires_approval: number;
        is_approved: number;
        bank_name: string;
    };
}

export interface FlutterwaveBankData {
    id: number;
    code: string;
    name: string;
}

export interface FlutterwaveTransferData {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency?: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta?: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
}

export interface FlutterwaveBalanceData {
    currency: string;
    available_balance: number;
    ledger_balance: number;
}

export interface FlutterwavePaymentInitResponse {
    paymentUrl: string;
    reference: string;
    expiresAt: string;
}

export interface FlutterwaveUSSDResponse {
    ussdCode: string;
    paymentCode: string;
    reference: string;
}

const mockNameEnquiryResponse = (bank_code: string, accountNumber: string) => {
    return {
        accountNumber: accountNumber,
        accountName: "John Doe",
        bankCode: bank_code,
    };
}
// const webhookService = new webhookServices()
export class FlutterwaveService {
    private client: AxiosInstance;
    private provider = PROVIDERS.FLUTTERWAVE;
    // private webhookService = new webhookServices()
    // private webhookService
    //private webhookService


    constructor() {
        // this.webhookService = new webhookServices()
        this.client = axios.create({
            baseURL: this.provider.baseUrl,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.provider.secretKey}`,
            },
            validateStatus: () => true,
        });

        this.client.interceptors.response.use(
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

                // const userWallet = await Wallet.findOne({ userId: transaction.userId });
                // if (!userWallet) throw new Error("Wallet not found");

                // userWallet.availableBalance += data.amount;
                // userWallet.lockedBalance -= data.amount;
                // await userWallet.save();

                return { transaction, status: "failed" };
            }
            default: {
                logger.warn("Unhandled charge status", { status });
                return null;
            }
        }
    }
    // async handleTransferCompleted(
    //     payload: IFlutterwaveTransferCompletedWebhook
    // ) {
    //     const data = payload.data;
    //     const status = data.status;

    //     console.log(payload);

    //     switch (status) {
    //         case "SUCCESSFUL": {
    //             logger.info("Transfer successful");

    //             const transaction = await WalletTransaction.findOne({ reference: data.reference });
    //             if (!transaction) throw new Error("Transaction not found");
    //             if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.reference }); return }
    //             if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.reference }); return }

    //             transaction.status = "successful";
    //             transaction.providerReference = data.reference;
    //             transaction.providerTransactionId = data.id;

    //             await transaction.save();

    //             await Wallet.updateOne(
    //                 { userId: transaction.userId },
    //                 { $inc: { lockedBalance: -data.amount } }
    //             );

    //             // const userWallet = await Wallet.findOne({ userId: transaction.userId });
    //             // if (!userWallet) throw new Error("Wallet not found");

    //             // userWallet.lockedBalance -= data.amount;
    //             // await userWallet.save();

    //             const request = await WithdrawalRequest.findOne({ reference: data.reference });
    //             if (!request) throw new Error("Withdrawal request not found");

    //             request.status = "completed";
    //             request.providerReference = data.reference;
    //             request.providerTransactionId = data.id.toString();

    //             await request.save();

    //             logger.info("Transfer successful", { reference: data.reference });

    //             return { transaction, status: "successful" };
    //         }

    //         case "FAILED": {
    //             logger.info("Transfer failed");

    //             const transaction = await WalletTransaction.findOne({ reference: data.reference });
    //             if (!transaction) throw new Error("Transaction not found");

    //             if (transaction.status === "successful") { logger.info("Transaction already successful", { reference: data.reference }); return }
    //             if (transaction.status === "failed") { logger.info("Transaction already failed", { reference: data.reference }); return }

    //             transaction.status = "failed";
    //             transaction.providerReference = data.reference;
    //             transaction.providerTransactionId = data.id;

    //             await transaction.save();

    //             await Wallet.updateOne(
    //                 { userId: transaction.userId },
    //                 {
    //                     $inc: {
    //                         availableBalance: data.amount,
    //                         lockedBalance: -data.amount
    //                     }
    //                 }
    //             );

    //             // const userWallet = await Wallet.findOne({ userId: transaction.userId });
    //             // if (!userWallet) throw new Error("Wallet not found");

    //             // userWallet.availableBalance += data.amount;
    //             // userWallet.lockedBalance -= data.amount;
    //             // await userWallet.save();

    //             return { transaction, status: "failed" };
    //         }
    //         default: {
    //             logger.warn("Unhandled charge status", { status });
    //             return null;
    //         }
    //     }
    // }

    private isSuccessResponse(status: string): boolean {
        return status === "success";
    }

    async nameEnquiry(
        accountNumber: string,
        accountBank: string
    ): Promise<{ accountNumber: string; accountName: string; bankCode: string }> {
        try {
            if (process.env.NODE_ENV === "development") {
                return mockNameEnquiryResponse(accountBank, accountNumber);

            }
            const response = await this.client.post("/accounts/resolve", {
                account_number: accountNumber,
                account_bank: accountBank,
            });

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Flutterwave name enquiry failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Account verification failed",
                    response.status,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }
            // console.log(response)

            logger.info(`Flutterwave: Verified account: ${accountNumber}`);
            return {
                accountNumber: response.data.data.account_number,
                accountName: response.data.data.account_name,
                bankCode: accountBank,
            }

        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error verifying bank account:", error);
            throw new AppError(
                error.response?.data?.message || "Account verification failed",
                error.response?.status || 400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    // Get list of Nigerian banks
    async getBanks(country: string = "NG"): Promise<FlutterwaveBankData[]> {
        try {
            const response = await this.client.get(`/banks/${country}`);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to fetch banks:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to fetch banks",
                    response.status,
                    ERROR_CODES.THIRD_PARTY_ERROR
                );
            }

            logger.info(`Flutterwave: Fetched banks for ${country}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error fetching banks:", error);
            throw new AppError(
                "Failed to fetch banks",
                500,
                ERROR_CODES.THIRD_PARTY_ERROR
            );
        }
    }

    // Create Virtual Account Number (VAN)
    // Can be temporary or permanent based on is_permanent flag
    async createVirtualAccount(data: {
        email: string;
        firstname: string;
        lastname: string;
        reference: string;
        bvn: string;
        phone?: string;
        isPermanent?: boolean;
        amount?: number; // For temporary accounts
    }): Promise<FlutterwaveAccountData> {
        try {
            const payload: any = {
                email: data.email,
                is_permanent: data.isPermanent !== false, // Default to true
                bvn: data.bvn,
                tx_ref: data.reference,
                firstname: data.firstname,
                lastname: data.lastname,
                narration: `${data.firstname} ${data.lastname}`,
            };

            // Add phone if provided
            if (data.phone) {
                payload.phonenumber = data.phone.startsWith("234")
                    ? data.phone
                    : "234" + data.phone.replace(/^0/, "");
            }

            // For temporary accounts, amount is required
            if (!data.isPermanent && data.amount) {
                payload.amount = data.amount;
            }

            logger.info("Creating Flutterwave virtual account:", {
                email: payload.email,
                isPermanent: payload.is_permanent,
            });

            const response = await this.client.post(
                "/virtual-account-numbers",
                payload
            );

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to create virtual account:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to create virtual account",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Created virtual account for ${data.email}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error creating virtual account:", error);
            throw new AppError(
                error.response?.data?.message || "Failed to create virtual account",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    async createVirtualAccountForTransfer(data: {
        email: string;
        firstname: string;
        lastname: string;
        reference: string;
        bvn: string;
        phone?: string;
        isPermanent?: boolean;
        amount?: number;
    }): Promise<FlutterwaveAccountData> {
        try {
            const payload: any = {
                email: data.email,
                is_permanent: data.isPermanent !== false,
                bvn: data.bvn,
                tx_ref: data.reference,
                firstname: data.firstname,
                lastname: data.lastname,
                narration: `${data.firstname} ${data.lastname}`,
            };

            if (data.phone) {
                payload.phonenumber = formatPhoneNumber(data.phone);
                logger.debug("Formatted phone number:", {
                    original: data.phone,
                    formatted: payload.phonenumber,
                });
            }

            if (!data.isPermanent && data.amount) {
                payload.amount = data.amount;
            }

            const response = await this.client.post(
                "/virtual-account-numbers",
                payload
            );

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                throw new AppError(
                    response.data?.message || "Failed to create virtual account",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Created virtual account for ${data.email}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error creating virtual account:", error);
            throw new AppError(
                error.response?.data?.message || "Failed to create virtual account",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Initiate Card Payment
    async initiateCardPayment(data: {
        txRef: string;
        amount: number;
        currency?: string;
        redirectUrl: string;
        customerEmail: string;
        customerName: string;
        customerPhone?: string;
        link_expiration: string
    }): Promise<FlutterwavePaymentInitResponse> {
        try {
            const payload: any = {
                tx_ref: data.txRef,
                amount: data.amount,
                currency: data.currency || "NGN",
                redirect_url: data.redirectUrl,
                customer: {
                    email: data.customerEmail,
                    name: data.customerName,
                    phonenumber: data.customerPhone,
                },
                customizations: {
                    title: "Wallet Funding",
                    description: "Fund your wallet",
                },
                payment_options: "card", // Only card
                link_expiration: data.link_expiration
            };

            const response = await this.client.post("/payments", payload);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                throw new AppError(
                    response.data?.message || "Card payment initiation failed",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Card payment initiated: ${data.txRef}`);
            return {
                paymentUrl: response.data.data.link,
                reference: data.txRef,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error initiating card payment:", error);
            throw new AppError(
                error.response?.data?.message || "Card payment initiation failed",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Initiate Mobile Money Payment
    async initiateMobileMoneyPayment(data: {
        txRef: string;
        amount: number;
        currency: string; // e.g., "KES" for M-PESA, "GHS" for Ghana Mobile Money
        customerEmail: string;
        customerName: string;
        customerPhone: string;
        network?: string; // e.g., "MTN", "VODAFONE", "TIGO"
    }): Promise<FlutterwavePaymentInitResponse> {
        try {
            const payload: any = {
                tx_ref: data.txRef,
                amount: data.amount,
                currency: data.currency,
                redirect_url: `${process.env.BASE_URL}/api/v1/webhooks/flutterwave/callback`,
                customer: {
                    email: data.customerEmail,
                    name: data.customerName,
                    phonenumber: data.customerPhone,
                },
                customizations: {
                    title: "Wallet Funding",
                    description: "Fund your wallet via Mobile Money",
                },
                payment_options: "mobilemoneyghana", // Or other mobile money options
            };

            if (data.network) {
                payload.network = data.network;
            }

            const response = await this.client.post("/payments", payload);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                throw new AppError(
                    response.data?.message || "Mobile money payment initiation failed",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Mobile money payment initiated: ${data.txRef}`);
            return {
                paymentUrl: response.data.data.link,
                reference: data.txRef,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error(
                "Flutterwave: Error initiating mobile money payment:",
                error
            );
            throw new AppError(
                error.response?.data?.message ||
                "Mobile money payment initiation failed",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Get Virtual Account Details
    async getVirtualAccountDetails(
        orderRef: string
    ): Promise<FlutterwaveAccountData> {
        try {
            const response = await this.client.get(
                `/virtual-account-numbers/${orderRef}`
            );

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to get virtual account details:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to get account details",
                    response.status,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }

            logger.info(`Flutterwave: Retrieved account details: ${orderRef}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error getting account details:", error);
            throw new AppError(
                error.response?.data?.message || "Failed to get account details",
                error.response?.status || 400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    // Update BVN for existing virtual account
    async updateVirtualAccountBVN(data: {
        orderRef: string;
        bvn: string;
    }): Promise<FlutterwaveAccountData> {
        try {
            const response = await this.client.put(
                `/virtual-account-numbers/${data.orderRef}`,
                {
                    bvn: data.bvn,
                }
            );

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to update virtual account BVN:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to update account BVN",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Updated BVN for account: ${data.orderRef}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error updating account BVN:", error);
            throw new AppError(
                error.response?.data?.message || "Failed to update account BVN",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Verify Transaction
    async verifyTransaction(transactionId: number): Promise<any> {
        try {
            const response = await this.client.get(
                `/transactions/${transactionId}/verify`
            );

            if (
                response.status !== 200 || response.data.status !== "success"
                // !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Transaction verification failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Transaction verification failed",
                    response.status,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }

            if (response.data.data.status !== "successful") {
                return response.data.data
            }

            logger.info(`Flutterwave: Verified transaction: ${transactionId}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error verifying transaction:", error);
            throw new AppError(
                error.response?.data?.message || "Transaction verification failed",
                error.response?.status || 400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    // Initiate Transfer/Payout
    async initiateTransfer(data: {
        accountBank: string;
        accountNumber: string;
        amount: number;
        narration: string;
        reference: string;
        currency?: string;
        callbackUrl?: string;
        beneficiaryName?: string;
    }): Promise<FlutterwaveTransferData> {
        try {
            const payload: any = {
                account_bank: data.accountBank,
                account_number: data.accountNumber,
                amount: data.amount,
                narration: data.narration,
                currency: data.currency || "NGN",
                reference: data.reference,
                callback_url: data.callbackUrl,
                debit_currency: data.currency || "NGN",
            };

            // Add beneficiary name if provided
            if (data.beneficiaryName) {
                payload.beneficiary_name = data.beneficiaryName;
            }
            if (process.env.NODE_ENV == "development") {
                const date = Date().toString()
                console.log(payload)
                mockTransferCompletedWebhook.data.reference = payload.reference
                mockTransferCompletedWebhook.data.account_number = payload.account_number
                mockTransferCompletedWebhook.data.bank_code = payload.account_bank
                mockTransferCompletedWebhook.data.created_at = date
                mockTransferCompletedWebhook.data.fullname = "John Doe"
                mockTransferCompletedWebhook.data.amount = payload.amount
                mockTransferCompletedWebhook.data.narration = payload.narration

                await this.handleTransferCompleted(mockTransferCompletedWebhook)
                return {
                    id: 26251,
                    account_number: data.accountNumber,
                    bank_code: data.accountBank,
                    full_name: "John Doe",
                    created_at: date,
                    currency: payload.currency,
                    debit_currency: "NGN",
                    amount: data.amount,
                    fee: 45,
                    status: "NEW",
                    reference: data.reference,
                    meta: null,
                    narration: payload.narration,
                    complete_message: "",
                    requires_approval: 0,
                    is_approved: 1,
                    bank_name: "ACCESS BANK NIGERIA (Mock)",
                }
            }

            logger.info("Initiating Flutterwave transfer:", {
                reference: data.reference,
                amount: data.amount,
                accountNumber: data.accountNumber,
            });

            const response = await this.client.post("/transfers", payload);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Transfer initiation failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Transfer failed",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Transfer initiated: ${data.reference}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error initiating transfer:", error);
            throw new AppError(
                error.response?.data?.message || "Transfer failed",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Get Transfer Details/Status
    async getTransferStatus(
        transferId: string
    ): Promise<FlutterwaveTransferData> {
        try {
            const response = await this.client.get(`/transfers/${transferId}`);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to get transfer status:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to get transfer status",
                    response.status,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }

            logger.info(`Flutterwave: Retrieved transfer status: ${transferId}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error getting transfer status:", error);
            throw new AppError(
                error.response?.data?.message || "Failed to get transfer status",
                error.response?.status || 400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    // Retry Failed Transfer
    async retryTransfer(transferId: string): Promise<FlutterwaveTransferData> {
        try {
            const response = await this.client.post(
                `/transfers/${transferId}/retries`
            );

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Transfer retry failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Transfer retry failed",
                    response.status,
                    ERROR_CODES.SERVICE_UNAVAILABLE
                );
            }

            logger.info(`Flutterwave: Retried transfer: ${transferId}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error retrying transfer:", error);
            throw new AppError(
                error.response?.data?.message || "Transfer retry failed",
                error.response?.status || 400,
                ERROR_CODES.SERVICE_UNAVAILABLE
            );
        }
    }

    // Get Transfer Fee
    async getTransferFee(
        amount: number,
        currency: string = "NGN"
    ): Promise<number> {
        try {
            const response = await this.client.get("/transfers/fee", {
                params: {
                    amount,
                    currency,
                },
            });

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.warn("Failed to get transfer fee, using default");
                // Return default fee if API call fails
                return this.calculateDefaultFee(amount);
            }

            logger.info(`Flutterwave: Retrieved transfer fee for amount: ${amount}`);
            return response.data.data[0]?.fee || this.calculateDefaultFee(amount);
        } catch (error: any) {
            logger.error("Flutterwave: Error getting transfer fee:", error);
            return this.calculateDefaultFee(amount);
        }
    }

    // Calculate default transfer fee (fallback)
    private calculateDefaultFee(amount: number): number {
        // Flutterwave typical fee structure
        if (amount <= 5000) return 10.75;
        if (amount <= 50000) return 26.88;
        return 53.75;
    }

    // Get Wallet Balance
    async getWalletBalance(
        currency: string = "NGN"
    ): Promise<FlutterwaveBalanceData> {
        try {
            const response = await this.client.get(`/balances/${currency}`);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to get wallet balance:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to get wallet balance",
                    response.status,
                    ERROR_CODES.THIRD_PARTY_ERROR
                );
            }

            logger.info(`Flutterwave: Retrieved wallet balance for ${currency}`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error getting wallet balance:", error);
            throw new AppError(
                "Failed to get wallet balance",
                500,
                ERROR_CODES.THIRD_PARTY_ERROR
            );
        }
    }

    // Verify BVN
    async verifyBVN(bvn: string): Promise<any> {
        try {
            const response = await this.client.get(`/kyc/bvns/${bvn}`);

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("BVN verification failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "BVN verification failed",
                    response.status,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }

            logger.info(`Flutterwave: Verified BVN: ${bvn.substring(0, 3)}***`);
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error verifying BVN:", error);
            throw new AppError(
                error.response?.data?.message || "BVN verification failed",
                error.response?.status || 400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    // Get Transactions
    async getTransactions(params?: {
        from?: string;
        to?: string;
        page?: number;
        currency?: string;
        status?: string;
    }): Promise<any> {
        try {
            const response = await this.client.get("/transactions", {
                params: {
                    from: params?.from,
                    to: params?.to,
                    page: params?.page || 1,
                    currency: params?.currency,
                    status: params?.status,
                },
            });

            if (
                response.status !== 200 ||
                !this.isSuccessResponse(response.data.status)
            ) {
                logger.error("Failed to get transactions:", {
                    status: response.status,
                    data: response.data,
                });
                throw new AppError(
                    response.data?.message || "Failed to get transactions",
                    response.status,
                    ERROR_CODES.THIRD_PARTY_ERROR
                );
            }

            logger.info("Flutterwave: Retrieved transactions");
            return response.data.data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;

            logger.error("Flutterwave: Error getting transactions:", error);
            throw new AppError(
                "Failed to get transactions",
                500,
                ERROR_CODES.THIRD_PARTY_ERROR
            );
        }
    }
}
