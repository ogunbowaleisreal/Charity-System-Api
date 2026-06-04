"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveHavenService = void 0;
const providers_1 = require("../config/providers");
const logger_1 = __importDefault(require("../logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../utils/constants");
const axios_1 = __importDefault(require("axios"));
class SaveHavenService {
    constructor() {
        this.provider = providers_1.PROVIDERS.SAVEHAVEN;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.tokenRefreshPromise = null;
        this.client = axios_1.default.create({
            baseURL: this.provider.baseUrl,
            headers: {
                "Content-Type": "application/json",
            },
            validateStatus: () => true,
        });
    }
    async authenticate() {
        // If a refresh is already in progress, wait for it
        if (this.tokenRefreshPromise) {
            logger_1.default.info("Token refresh already in progress, waiting...");
            return this.tokenRefreshPromise;
        }
        // Start the refresh and store the promise
        this.tokenRefreshPromise = this._doAuthenticate();
        try {
            const token = await this.tokenRefreshPromise;
            return token;
        }
        finally {
            // Clear the promise when done (success or failure)
            this.tokenRefreshPromise = null;
        }
    }
    async _doAuthenticate() {
        try {
            const response = await axios_1.default.post(`${this.provider.baseUrl}/oauth2/token`, {
                grant_type: "client_credentials",
                client_id: this.provider.clientId,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: this.provider.clientAssertion,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
                validateStatus: () => true,
            });
            if (response.status < 200 || response.status >= 300) {
                logger_1.default.error("SafeHaven authentication failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Authentication failed", response.status, constants_1.ERROR_CODES.AUTHENTICATION_ERROR);
            }
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
            this.client.defaults.headers.common["Authorization"] = `Bearer ${this.accessToken}`;
            logger_1.default.info("SafeHaven authentication successful");
            return this.accessToken;
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            logger_1.default.error("SafeHaven authentication error:", error.message);
            throw new errorHandler_1.AppError("Authentication failed", 401, constants_1.ERROR_CODES.AUTHENTICATION_ERROR);
        }
    }
    // Ensure valid token before making requests
    async ensureAuthenticated() {
        if (!this.accessToken ||
            !this.tokenExpiry ||
            Date.now() >= this.tokenExpiry - 60000 // Refresh 1 minute before expiry
        ) {
            await this.authenticate();
        }
    }
    // Helper to handle token expiration and retry
    async executeWithAuth(operation) {
        try {
            await this.ensureAuthenticated();
            return await operation();
        }
        catch (error) {
            const status = error.response?.status || error.status;
            // Token expired or unauthorized - retry once
            if (status === 401 || status === 403) {
                logger_1.default.info("Token expired or unauthorized, refreshing token...");
                this.accessToken = null;
                this.tokenExpiry = null;
                await this.ensureAuthenticated();
                logger_1.default.info("Retrying operation with new token...");
                return await operation();
            }
            throw error;
        }
    }
    // Helper to check if response is successful based on status code
    isSuccessResponse(status) {
        return status >= 200 && status < 300;
    }
    // Name Enquiry (Required before transfers)
    async nameEnquiry(accountNumber, bankCode) {
        // Sandbox Mock
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking name enquiry");
            const mockResponse = this.getMockResponse("nameEnquiry", {
                accountNumber,
                bankCode,
            });
            return {
                accountName: mockResponse.data.accountName,
                accountNumber: mockResponse.data.accountNumber,
                sessionId: mockResponse.data.sessionId,
                bankCode: mockResponse.data.bankCode,
            };
        }
        return this.executeWithAuth(async () => {
            const response = await this.client.post("/transfers/name-enquiry", {
                accountNumber,
                bankCode,
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Name enquiry failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Name enquiry failed", response.status, constants_1.ERROR_CODES.VALIDATION_ERROR);
            }
            logger_1.default.info(`Name enquiry successful: ${accountNumber}`);
            return {
                accountName: response.data.data.accountName,
                accountNumber: response.data.data.accountNumber,
                sessionId: response.data.data.sessionId,
                bankCode: response.data.data.bankCode,
            };
        });
    }
    // Get list of banks
    async getBanks(country = "NG") {
        return this.executeWithAuth(async () => {
            const response = await this.client.get("/banks", {
                params: { country },
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to fetch banks:", {
                    status: response.status,
                    data: response.data,
                    endpoint: "/banks",
                    params: { country },
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to fetch banks", response.status, constants_1.ERROR_CODES.THIRD_PARTY_ERROR);
            }
            logger_1.default.info(`Fetched banks for ${country}`);
            return response.data.data;
        });
    }
    // Initiate Identity Verification (Step 1)
    async initiateIdentityVerification(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking identity verification initiation");
            const mockResponse = this.getMockResponse("initiateIdentityVerification", {
                type: data.identityType.toUpperCase(),
                number: data.identityNumber,
                debitAccountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT,
            });
            return {
                identityId: mockResponse.data._id,
                message: mockResponse.message,
            };
        }
        return this.executeWithAuth(async () => {
            const payload = {
                type: data.identityType.toUpperCase(),
                number: data.identityNumber,
                debitAccountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT,
            };
            const response = await this.client.post("/identity/v2", payload);
            logger_1.default.info("SafeHaven identity verification response:", {
                status: response.status,
                data: response.data,
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                const errors = response.data?.error;
                // Handle array of errors
                if (Array.isArray(errors)) {
                    throw new errorHandler_1.AppError(errors.join(", "), response.status, constants_1.ERROR_CODES.VALIDATION_ERROR);
                }
                throw new errorHandler_1.AppError(response.data?.message || "Identity verification initiation failed", response.status, constants_1.ERROR_CODES.VALIDATION_ERROR);
            }
            const identityId = response.data.data?._id;
            return {
                identityId: identityId || "",
                message: response.data.message || "Record fetched successfully",
            };
        });
    }
    // Validate Identity with OTP (Step 2)
    async validateIdentity(data) {
        return this.executeWithAuth(async () => {
            // Sandbox mock
            if (this.provider.isSandBox) {
                logger_1.default.info("🧪 SANDBOX MODE: Mocking identity validation");
                const mockResponse = this.getMockResponse("validateIdentity", {
                    identityId: data.identityId,
                    type: data.identificationType,
                    otp: data.otp,
                });
                // Handle mock failure
                if (mockResponse.statusCode !== 0) {
                    throw new errorHandler_1.AppError(mockResponse.message, 400, constants_1.ERROR_CODES.VALIDATION_ERROR);
                }
                return {
                    verified: true,
                    message: mockResponse.message,
                };
            }
            const response = await this.client.post("/identity/v2/validate", {
                identityId: data.identityId,
                type: data.identificationType,
                otp: data.otp,
            });
            logger_1.default.info("SaveHaven validation response:", {
                status: response.status,
                data: response.data,
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                throw new errorHandler_1.AppError(response.data?.message || "Identity validation failed", response.status, constants_1.ERROR_CODES.VALIDATION_ERROR);
            }
            logger_1.default.info(` Identity validated successfully: ${data.identityId}`);
            return {
                verified: true,
                message: response.data.message || "Identity validated successfully",
            };
        });
    }
    // Create virtual account for wallet funding (temporary)
    async createVirtualAccount(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking virtual account creation");
            const mockResponse = this.getMockResponse("createVirtualAccount", data);
            return {
                account_number: mockResponse.data.accountNumber,
                account_name: mockResponse.data.accountName,
                bank_name: "Safe Haven MFB",
                bank_code: mockResponse.data.bankCode,
                reference: data.reference,
                status: mockResponse.data.status,
                created_at: mockResponse.data.createdAt,
                expires_at: mockResponse.data.expiryDate,
            };
        }
        return this.executeWithAuth(async () => {
            const response = await this.client.post("/virtual-accounts", {
                validFor: 900,
                amountControl: "Fixed",
                amount: data.amount,
                externalReference: data.reference,
                email: data.email,
                callbackUrl: `${process.env.BASE_URL}/api/webhooks/savehaven/payment`,
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to create virtual account:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to create virtual account", response.status, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
            }
            logger_1.default.info(`Created virtual account for ${data.email}`);
            return response.data.data;
        });
    }
    // Create permanent sub-account (requires prior identity verification)
    async createSubAccount(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking sub-account creation");
            const mockResponse = this.getMockResponse("createSubAccount", data);
            return {
                account_number: mockResponse.data.accountNumber,
                account_name: mockResponse.data.accountName,
                bank_name: "Safe Haven MFB",
                bank_code: "000",
                reference: data.externalReference,
                status: "active",
                created_at: mockResponse.data.createdAt,
            };
        }
        return this.executeWithAuth(async () => {
            const payload = {
                externalReference: data.externalReference,
                phoneNumber: data.phoneNumber,
                emailAddress: data.emailAddress,
                identityId: data.identityId,
                callbackUrl: `${process.env.APP_URL}/api/webhooks/savehaven/subaccount`,
                autoSweep: false,
            };
            logger_1.default.info("Creating sub-account with payload:", payload);
            const response = await this.client.post("/accounts/v2/subaccount", payload);
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to create sub-account:", {
                    status: response.status,
                    data: response.data,
                });
                if (response.status === 403) {
                    throw new errorHandler_1.AppError("Access forbidden. Check API credentials or account permissions.", 403, constants_1.ERROR_CODES.AUTHENTICATION_ERROR);
                }
                throw new errorHandler_1.AppError(response.data?.message || "Failed to create sub-account", response.status, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
            }
            logger_1.default.info(`Created sub-account for ${data.emailAddress}`);
            return response.data.data;
        });
    }
    // Verify payment/transaction (for wallet funding confirmation)
    async verifyPayment(reference) {
        // Sandbox Mock
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking payment verification");
            const mockResponse = this.getMockResponse("verifyPayment", { reference });
            return mockResponse.data;
        }
        return this.executeWithAuth(async () => {
            const response = await this.client.get(`/checkout/${reference}/verify`);
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Payment verification failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Payment verification failed", response.status, constants_1.ERROR_CODES.VALIDATION_ERROR);
            }
            logger_1.default.info(`Verified payment: ${reference}`);
            return response.data.data;
        });
    }
    // Initiate transfer/payout (FIXED: uses correct endpoint and requires sessionId)
    async initiateTransfer(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking transfer initiation");
            const mockResponse = this.getMockResponse("initiateTransfer", data);
            return mockResponse.data;
        }
        return this.executeWithAuth(async () => {
            // If no sessionId provided, do name enquiry first
            let sessionId = data.sessionId;
            if (!sessionId) {
                const enquiry = await this.nameEnquiry(data.account_number, data.bank_code);
                sessionId = enquiry.sessionId;
                logger_1.default.info(`Name enquiry completed, sessionId: ${sessionId}`);
            }
            // Now initiate transfer with sessionId
            const response = await this.client.post("/transfers", {
                amount: data.amount,
                narration: data.narration,
                sessionId: sessionId,
                callbackUrl: `${process.env.BASE_URL}/api/v1/webhooks/savehaven`,
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Transfer failed:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Transfer failed", response.status, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
            }
            logger_1.default.info(`Initiated transfer: ${data.reference}`);
            return response.data.data;
        });
    }
    async createVirtualAccountForTransfer(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking virtual account creation");
            const mockResponse = this.getMockResponse("createVirtualAccount", data);
            return {
                account_number: mockResponse.data.accountNumber,
                account_name: mockResponse.data.accountName,
                bank_name: "Safe Haven MFB",
                bank_code: mockResponse.data.bankCode,
                reference: data.reference,
                status: mockResponse.data.status,
                created_at: mockResponse.data.createdAt,
                expires_at: mockResponse.data.expiryDate,
            };
        }
        return this.executeWithAuth(async () => {
            const response = await this.client.post("/virtual-accounts", {
                validFor: 900,
                amountControl: "Fixed",
                externalReference: data.reference,
                email: data.email,
                callbackUrl: `${process.env.BASE_URL}/api/webhooks/savehaven/payment`,
            });
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to create virtual account:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to create virtual account", response.status, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
            }
            logger_1.default.info(`Created virtual account for ${data.email}`);
            return response.data.data;
        });
    }
    // Initiate Card Payment via Checkout.js
    // Creates a checkout session for card payment
    async initiateCardPayment(data) {
        if (this.provider.isSandBox) {
            logger_1.default.info("🧪 SANDBOX MODE: Mocking card payment initiation");
            const mockResponse = this.getMockResponse("initiateCardPayment", data);
            return {
                checkoutUrl: mockResponse.data.checkoutUrl,
                reference: data.reference,
                expiresAt: mockResponse.data.expiresAt,
            };
        }
        return this.executeWithAuth(async () => {
            const payload = {
                amount: data.amount,
                customerEmail: data.email,
                customerName: `${data.firstname} ${data.lastname}`,
                reference: data.reference,
                callbackUrl: `${process.env.BASE_URL}/api/webhooks/savehaven/checkout`,
                channels: ["card"], // Only card payment
                metadata: {
                    userId: data.email,
                    paymentType: "wallet_funding",
                },
            };
            const response = await this.client.post("/checkout/initialize", payload);
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to initiate card payment:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to initiate card payment", response.status, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
            }
            logger_1.default.info(`Initiated card payment for ${data.email}`);
            return {
                checkoutUrl: response.data.data.authorizationUrl || response.data.data.checkoutUrl,
                reference: data.reference,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
            };
        });
    }
    // Get account transactions
    async getTransactions(data) {
        return this.executeWithAuth(async () => {
            const response = await this.client.get("/transactions", {
                params: {
                    accountNumber: data.accountNumber,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    page: data.page || 1,
                    pageSize: data.pageSize || 50,
                },
            });
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to fetch transactions:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to fetch transactions", response.status, constants_1.ERROR_CODES.THIRD_PARTY_ERROR);
            }
            logger_1.default.info("Fetched transactions");
            return response.data.data;
        });
    }
    // Get account balance
    async getAccountBalance(accountNumber) {
        return this.executeWithAuth(async () => {
            const response = await this.client.get(`/accounts/${accountNumber}/balance`);
            // Check HTTP status code for success
            if (!this.isSuccessResponse(response.status)) {
                logger_1.default.error("Failed to get balance:", {
                    status: response.status,
                    data: response.data,
                });
                throw new errorHandler_1.AppError(response.data?.message || "Failed to get balance", response.status, constants_1.ERROR_CODES.THIRD_PARTY_ERROR);
            }
            logger_1.default.info(`Fetched balance for account: ${accountNumber}`);
            return response.data.data.availableBalance || response.data.data.balance;
        });
    }
    // Mock data generator for sandbox environment
    getMockResponse(method, data) {
        const timestamp = new Date().toISOString();
        switch (method) {
            case "nameEnquiry":
                return {
                    statusCode: 0,
                    responseCode: "00",
                    message: "Name enquiry successful",
                    data: {
                        responseCode: "00",
                        responseMessage: "Successful",
                        sessionId: `SESS_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                        bankCode: data?.bankCode || "000",
                        accountNumber: data?.accountNumber || "0000000000",
                        accountName: "SANDBOX TEST ACCOUNT",
                        kycLevel: "3",
                        bvn: "22222222222",
                    },
                };
            case "initiateIdentityVerification":
                return {
                    statusCode: 0,
                    data: {
                        _id: `ID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        clientId: "sandbox_client_id",
                        identityNumber: data?.number || "22222222222",
                        type: data?.type || "BVN",
                        amount: 50,
                        status: "pending",
                        debitAccountNumber: data?.debitAccountNumber || "",
                        vat: 0,
                        stampDuty: 0,
                        isDeleted: false,
                        otpVerified: false,
                        otpResendCount: 0,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        __v: 0,
                        debitMessage: "Successful",
                        debitResponsCode: 0,
                        debitSessionId: `SESS_${Date.now()}`,
                        otpId: `OTP_${Date.now()}`,
                        providerResponse: "OTP sent successfully",
                    },
                    message: "Record fetched successfully",
                };
            case "validateIdentity":
                // Simulate success if OTP is "123456", failure otherwise
                const isValidOtp = data?.otp === "123456" || data?.otp === "111111";
                if (!isValidOtp) {
                    return {
                        statusCode: 400,
                        message: "Invalid OTP",
                        data: null,
                    };
                }
                return {
                    statusCode: 0,
                    message: "Identity validated successfully",
                    data: {
                        _id: data?.identityId || `ID_${Date.now()}`,
                        clientId: "sandbox_client_id",
                        identityNumber: "22222222222",
                        type: data?.type || "BVN",
                        amount: 50,
                        status: "verified",
                        debitAccountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT || "",
                        vat: 0,
                        stampDuty: 0,
                        isDeleted: false,
                        otpVerified: true,
                        otpResendCount: 0,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        __v: 0,
                        debitMessage: "Successful",
                        debitResponsCode: 0,
                        debitSessionId: `SESS_${Date.now()}`,
                        otpId: `OTP_${Date.now()}`,
                        providerResponse: {
                            firstName: "SANDBOX",
                            lastName: "USER",
                            middleName: "TEST",
                            dateOfBirth: "1990-01-01",
                            phone: "08012345678",
                            bvn: "22222222222",
                        },
                    },
                };
            case "createVirtualAccount":
                return {
                    statusCode: 0,
                    message: "Virtual account created successfully",
                    data: {
                        _id: `VA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        client: "sandbox_client_id",
                        bankCode: "000",
                        accountNumber: `90${Math.floor(10000000 + Math.random() * 90000000)}`,
                        accountName: `${data?.firstname?.toUpperCase() || "SANDBOX"} ${data?.lastname?.toUpperCase() || "USER"}`,
                        currencyCode: "NGN",
                        bvn: data?.bvn || "",
                        validFor: 900,
                        amountControl: "Fixed",
                        amount: data?.amount || 0,
                        expiryDate: new Date(Date.now() + 900000).toISOString(), // 15 mins from now
                        callbackUrl: `${process.env.BASE_URL}/api/webhooks/savehaven/payment`,
                        settlementAccount: {
                            accountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT || "",
                            bankCode: "000",
                        },
                        status: "active",
                        isDeleted: false,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        __v: 0,
                    },
                };
            case "verifyPayment":
                return {
                    statusCode: 0,
                    message: "Transaction verified successfully",
                    data: {
                        channels: ["card", "bank_transfer"],
                        _id: `TXN_${Date.now()}`,
                        client: "sandbox_client_id",
                        merchantName: "SANDBOX MERCHANT",
                        oauthClientId: "sandbox_oauth_client",
                        referenceCode: data?.reference || `REF_${Date.now()}`,
                        customer: {
                            email: "sandbox@example.com",
                            name: "Sandbox User",
                        },
                        currencyCode: "NGN",
                        amount: 100000, // 1000 NGN in kobo
                        feeBearer: "customer",
                        fees: 150,
                        vat: 12,
                        stampDuty: 50,
                        customIconUrl: "",
                        redirectUrl: "",
                        webhookUrl: `${process.env.BASE_URL}/api/webhooks/savehaven/payment`,
                        settlementAccount: {
                            accountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT || "",
                            bankCode: "000",
                        },
                        settlementStatus: "settled",
                        settlementReference: `SETTLE_${Date.now()}`,
                        channelDetails: {
                            channel: "bank_transfer",
                            method: "virtual_account",
                        },
                        paymentDetails: {
                            paidAt: timestamp,
                            amount: data?.amount || 100000,
                        },
                        status: "successful",
                        isDeleted: false,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        __v: 0,
                    },
                };
            case "initiateTransfer":
                return {
                    statusCode: 0,
                    responseCode: "00",
                    message: "Transfer initiated successfully",
                    data: {
                        _id: `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        client: "sandbox_client_id",
                        account: process.env.SAFEHAVEN_SWEEP_ACCOUNT || "",
                        type: "transfer",
                        sessionId: `SESS_${Date.now()}`,
                        nameEnquiryReference: data?.sessionId || `SESS_${Date.now()}`,
                        paymentReference: data?.reference || `PAY_${Date.now()}`,
                        mandateReference: "",
                        isReversed: false,
                        reversalReference: "",
                        provider: "SafeHaven",
                        providerChannel: "NIP",
                        providerChannelCode: "03",
                        destinationInstitutionCode: data?.bank_code || "000",
                        creditAccountName: "SANDBOX BENEFICIARY",
                        creditAccountNumber: data?.account_number || "0000000000",
                        creditBankVerificationNumber: "",
                        creditKYCLevel: "3",
                        debitAccountName: "SANDBOX MERCHANT",
                        debitAccountNumber: process.env.SAFEHAVEN_SWEEP_ACCOUNT || "",
                        debitBankVerificationNumber: "",
                        debitKYCLevel: "3",
                        transactionLocation: "NG",
                        narration: data?.narration || "Transfer",
                        amount: data?.amount || 0,
                        fees: Math.floor((data?.amount || 0) * 0.001), // 0.1% fee
                        vat: Math.floor((data?.amount || 0) * 0.00075), // VAT on fee
                        stampDuty: data?.amount >= 1000000 ? 50 : 0, // Stamp duty for amounts >= 10k NGN
                        responseCode: "00",
                        responseMessage: "Successful",
                        status: "success",
                        isDeleted: false,
                        createdAt: timestamp,
                        createdBy: "system",
                        updatedAt: timestamp,
                        __v: 0,
                        approvedAt: timestamp,
                        approvedBy: "system",
                    },
                };
            case "createSubAccount":
                return {
                    statusCode: 0,
                    message: "Sub-account created successfully",
                    data: {
                        _id: `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        client: "sandbox_client_id",
                        accountProduct: "savings",
                        accountNumber: `10${Math.floor(10000000 + Math.random() * 90000000)}`,
                        accountName: `${data?.emailAddress?.split("@")[0]?.toUpperCase() || "SANDBOX"} USER`,
                        accountType: "subaccount",
                        currencyCode: "NGN",
                        bvn: "22222222222",
                        identityId: data?.identityId || "",
                        accountBalance: 0,
                        bookBalance: 0,
                        callbackUrl: `${process.env.APP_URL}/api/webhooks/savehaven/subaccount`,
                        isSubAccount: true,
                        subAccountDetails: {
                            externalReference: data?.externalReference || `EXT_${Date.now()}`,
                            phoneNumber: data?.phoneNumber || "+2348000000000",
                            emailAddress: data?.emailAddress || "sandbox@example.com",
                            autoSweep: false,
                        },
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        nin: "",
                        __v: 0,
                        cbaAccountId: `CBA_${Date.now()}`,
                    },
                };
            case "initiateCardPayment":
                return {
                    statusCode: 0,
                    message: "Checkout initialized successfully",
                    data: {
                        checkoutUrl: `https://checkout-sandbox.safehavenmfb.com/pay/${data.reference}`,
                        reference: data.reference,
                        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                        amount: data.amount,
                    },
                };
            default:
                return null;
        }
    }
}
exports.SaveHavenService = SaveHavenService;
