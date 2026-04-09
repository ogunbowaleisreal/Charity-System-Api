import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { planData } from "./client/planServices";

export interface PaystackCustomer {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, any>;
}

export interface PaystackPlan {
    name: string;
    plan_code: string;
    amount: number; // in kobo
    interval: "monthly" | "annually";
    currency?: string;
    description?: string;
}

export interface PaystackSubscription {
    customer?: string; // customer code
    plan: string; // plan code
    start_date?: string;
    authorization?: string;
    metadata?: Record<string, any>;
}

export interface PaystackTransaction {
    email: string;
    amount: number; // in kobo
    currency?: string;
    reference?: string;
    callback_url?: string;
    plan?: string;
    metadata?: Record<string, any>;
}

export class PaystackService {
    private client: AxiosInstance;
    private secretKey: string;

    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY!;

        if (!this.secretKey) {
            throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
        }

        this.client = axios.create({
            baseURL: "https://api.paystack.co",
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                "Content-Type": "application/json",
            },
        });
    }

    // Create a customer
    async createCustomer(customerData: PaystackCustomer) {
        try {
            const response = await this.client.post("/customer", customerData);
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to create customer: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Get customer by email or customer code
    async getCustomer(identifier: string) {
        try {
            const response = await this.client.get(`/customer/${identifier}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Failed to get customer: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Create a plan
    async createPlan(planData: planData) {
        try {
            const response = await this.client.post("/plan", {
                ...planData,
                interval: planData.interval === "annually" ? "annually" : "monthly",
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to create plan: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Get plan by plan code
    async getPlan(planCode: string) {
        try {
            const response = await this.client.get(`/plan/${planCode}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Failed to get plan: ${error.response?.data?.message || error.message}`
            );
        }
    }

    // List all plans
    async listPlans() {
        try {
            const response = await this.client.get("/plan");
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to list plans: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Create a subscription
    async createSubscription(subscriptionData: PaystackSubscription) {
        try {
            const response = await this.client.post(
                "/subscription",
                subscriptionData
            );
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to create subscription: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Get subscription by subscription code
    async getSubscription(subscriptionCode: string) {
        try {
            const response = await this.client.get(
                `/subscription/${subscriptionCode}`
            );
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Failed to get subscription: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    async cancelSubscription(subscriptionCode: string, token: string) {
        try {
            // 1️⃣ Check subscription status first
            const subscriptionRes = await this.client.get(`/subscription/${subscriptionCode}`);
            const subscription = subscriptionRes.data?.data;
            console.log(subscription)


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
        } catch (error: any) {
            throw new Error(
                `Failed to cancel subscription: ${error.response?.data?.message || error.message}`
            );
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
    async initializeTransaction(transactionData: PaystackTransaction) {
        try {
            const response = await this.client.post("/transaction/initialize", {
                ...transactionData,
                currency: transactionData.currency || "NGN",
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to initialize transaction: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    async updatePlan(planCode: string, planData: planData) {
        try {
            const response = await this.client.put(`/plan/${planCode}`, {
                ...planData,
                interval: planData.interval === "annually" ? "annually" : "monthly",
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to update plan: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Verify transaction
    async verifyTransaction(reference: string) {
        try {
            const response = await this.client.get(
                `/transaction/verify/${reference}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to verify transaction: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    async getCustomerDetails(customerCode: string) {
        try {
            const response = await this.client(`/customer/${customerCode}`);
            return response.data.data;
        } catch (error: any) {
            console.error("Failed to fetch Paystack customer details", error.response?.data || error.message);
            throw new Error("Unable to fetch customer");
        }
    }

    async generateSubscriptionUpdateLink(subscriptionCode: string) {
        try {
            const response = await this.client.get(
                `/subscription/${subscriptionCode}/manage/link`
            );

            return response.data.data.link;
        } catch (error: any) {
            throw new Error(
                `Failed to generate subscription update link: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    async getLatestReusableAuthorization(customerCode: string) {
        const customer = await this.getCustomerDetails(customerCode);

        if (!customer.authorizations || customer.authorizations.length === 0) {
            throw new Error("Customer has no saved authorization tokens");
        }

        // get last reusable auth
        const reusable = customer.authorizations
            .filter((a: any) => a.reusable)
            .pop();

        if (!reusable) {
            throw new Error("No reusable authorization found for this customer");
        }

        return reusable.authorization_code;
    }

    // Get transaction
    async getTransaction(transactionId: string) {
        try {
            const response = await this.client.get(`/transaction/${transactionId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw new Error(
                `Failed to get transaction: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // List transactions
    async listTransactions(params?: {
        customer?: string;
        status?: string;
        from?: string;
        to?: string;
        amount?: number;
        perPage?: number;
        page?: number;
    }) {
        try {
            const response = await this.client.get("/transaction", { params });
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Failed to list transactions: ${error.response?.data?.message || error.message
                }`
            );
        }
    }

    // Verify webhook signature
    verifyWebhookSignature(payload: Buffer, signature: string): boolean {
        try {
            const hash = crypto
                .createHmac("sha512", this.secretKey)
                .update(payload)
                .digest("hex");

            return hash === signature;
        } catch (error) {
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
    generateReference(prefix: string = "tx"): string {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    }

    // Convert amount to kobo (Paystack uses kobo for NGN)
    toKobo(naira: number): number {
        return Math.round(naira * 100);
    }

    // Convert amount from kobo to naira
    fromKobo(kobo: number): number {
        return kobo / 100;
    }
}
