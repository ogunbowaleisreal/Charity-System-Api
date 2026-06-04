"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class PaystackService {
    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!this.secretKey) {
            throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
        }
        this.client = axios_1.default.create({
            baseURL: "https://api.paystack.co",
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                "Content-Type": "application/json",
            },
        });
    }
    // Create a customer
    async createCustomer(customerData) {
        try {
            const response = await this.client.post("/customer", customerData);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create customer: ${error.response?.data?.message || error.message}`);
        }
    }
    // Get customer by email or customer code
    async getCustomer(identifier) {
        try {
            const response = await this.client.get(`/customer/${identifier}`);
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Failed to get customer: ${error.response?.data?.message || error.message}`);
        }
    }
    // Create a plan
    async createPlan(planData) {
        try {
            const response = await this.client.post("/plan", {
                ...planData,
                interval: planData.interval === "annually" ? "annually" : "monthly",
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create plan: ${error.response?.data?.message || error.message}`);
        }
    }
    // Get plan by plan code
    async getPlan(planCode) {
        try {
            const response = await this.client.get(`/plan/${planCode}`);
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Failed to get plan: ${error.response?.data?.message || error.message}`);
        }
    }
    // List all plans
    async listPlans() {
        try {
            const response = await this.client.get("/plan");
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to list plans: ${error.response?.data?.message || error.message}`);
        }
    }
    // Create a subscription
    async createSubscription(subscriptionData) {
        try {
            const response = await this.client.post("/subscription", subscriptionData);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to create subscription: ${error.response?.data?.message || error.message}`);
        }
    }
    // Get subscription by subscription code
    async getSubscription(subscriptionCode) {
        try {
            const response = await this.client.get(`/subscription/${subscriptionCode}`);
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Failed to get subscription: ${error.response?.data?.message || error.message}`);
        }
    }
    async cancelSubscription(subscriptionCode, token) {
        try {
            // 1️⃣ Check subscription status first
            const subscriptionRes = await this.client.get(`/subscription/${subscriptionCode}`);
            const subscription = subscriptionRes.data?.data;
            console.log(subscription);
            if (!subscription) {
                throw new Error("Subscription not found on Paystack");
            }
            if (subscription.status !== "active") {
                throw new Error(`Subscription is already ${subscription.status} and cannot be cancelled`);
            }
            // 2️⃣ Cancel subscription
            const response = await this.client.post(`/subscription/disable`, {
                code: subscriptionCode,
                token: token
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to cancel subscription: ${error.response?.data?.message || error.message}`);
        }
    }
    // Cancel a subscription
    // async cancelSubscription(subscriptionCode: string, token: string) {
    //     try {
    //         const response = await this.client.post(`/subscription/disable`, {
    //             code: subscriptionCode,
    //             token: token,
    //         });
    //         return response.data;
    //     } catch (error: any) {
    //         throw new Error(
    //             `Failed to cancel subscription: ${error.response?.data?.message || error.message
    //             }`
    //         );
    //     }
    // }
    // Initialize transaction
    async initializeTransaction(transactionData) {
        try {
            const response = await this.client.post("/transaction/initialize", {
                ...transactionData,
                currency: transactionData.currency || "NGN",
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to initialize transaction: ${error.response?.data?.message || error.message}`);
        }
    }
    async updatePlan(planCode, planData) {
        try {
            const response = await this.client.put(`/plan/${planCode}`, {
                ...planData,
                interval: planData.interval === "annually" ? "annually" : "monthly",
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to update plan: ${error.response?.data?.message || error.message}`);
        }
    }
    // Verify transaction
    async verifyTransaction(reference) {
        try {
            const response = await this.client.get(`/transaction/verify/${reference}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to verify transaction: ${error.response?.data?.message || error.message}`);
        }
    }
    async getCustomerDetails(customerCode) {
        try {
            const response = await this.client(`/customer/${customerCode}`);
            return response.data.data;
        }
        catch (error) {
            console.error("Failed to fetch Paystack customer details", error.response?.data || error.message);
            throw new Error("Unable to fetch customer");
        }
    }
    async generateSubscriptionUpdateLink(subscriptionCode) {
        try {
            const response = await this.client.get(`/subscription/${subscriptionCode}/manage/link`);
            return response.data.data.link;
        }
        catch (error) {
            throw new Error(`Failed to generate subscription update link: ${error.response?.data?.message || error.message}`);
        }
    }
    async getLatestReusableAuthorization(customerCode) {
        const customer = await this.getCustomerDetails(customerCode);
        if (!customer.authorizations || customer.authorizations.length === 0) {
            throw new Error("Customer has no saved authorization tokens");
        }
        // get last reusable auth
        const reusable = customer.authorizations
            .filter((a) => a.reusable)
            .pop();
        if (!reusable) {
            throw new Error("No reusable authorization found for this customer");
        }
        return reusable.authorization_code;
    }
    // Get transaction
    async getTransaction(transactionId) {
        try {
            const response = await this.client.get(`/transaction/${transactionId}`);
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(`Failed to get transaction: ${error.response?.data?.message || error.message}`);
        }
    }
    // List transactions
    async listTransactions(params) {
        try {
            const response = await this.client.get("/transaction", { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to list transactions: ${error.response?.data?.message || error.message}`);
        }
    }
    // Verify webhook signature
    verifyWebhookSignature(payload, signature) {
        try {
            const hash = crypto_1.default
                .createHmac("sha512", this.secretKey)
                .update(payload)
                .digest("hex");
            return hash === signature;
        }
        catch (error) {
            return false;
        }
    }
    // async terminateSubscription(subscriptionCode: string) {
    //     try {
    //         const response = await this.client.post(`/subscription/disable`, {
    //             code: subscriptionCode,
    //         });
    //         return response.data;
    //     } catch (error: any) {
    //         throw new Error(
    //             `Failed to terminate subscription: ${error.response?.data?.message || error.message
    //             }`
    //         );
    //     }
    // }
    // Generate reference
    generateReference(prefix = "tx") {
        return `${prefix}_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`;
    }
    // Convert amount to kobo (Paystack uses kobo for NGN)
    toKobo(naira) {
        return Math.round(naira * 100);
    }
    // Convert amount from kobo to naira
    fromKobo(kobo) {
        return kobo / 100;
    }
}
exports.PaystackService = PaystackService;
