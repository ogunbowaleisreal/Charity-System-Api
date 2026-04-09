import Plan, { IPlan } from "../../models/Plan";
import { PaystackService } from "../paystackServices";
import { HTTP_STATUS } from "../../utils/constants";
import { planData } from "../client/planServices";

const paystack = new PaystackService();

export interface CreatePlanDTO {
    name: string;
    description?: string;
    amount: number; // naira
    interval: "monthly" | "annually" | "hourly" | "daily";
    currency?: string;
    type?: string;
    features: [string]
}

export interface UpdatePlanDTO {
    name?: string;
    description?: string;
    amount?: number;
    interval?: "monthly" | "annually" | "hourly";
    currency?: string;
    // type?: string;
    update_existing_subscriptions?: boolean;
    status?: "active" | "inactive";
    features: [string]
}

export type planFilter = {
    interval?: "monthly" | "annually";
    status?: "active" | "inactive";
}

export class AdminPlanManagementService {

    async createPlan(data: CreatePlanDTO) {
        // prevent duplicates
        const existing = await Plan.findOne({
            name: data.name,
            interval: data.interval,
            status: "active"
        });

        if (existing) {
            throw {
                message: "An active plan with same name and interval already exists",
                statusCode: HTTP_STATUS.CONFLICT
            };
        }

        const amountInKobo = paystack.toKobo(data.amount);
        console.log(data)

        // 1️⃣ Create plan on Paystack
        const paystackRes = await paystack.createPlan({
            name: data.name,
            amount: amountInKobo,
            interval: data.interval,
            currency: data.currency || "NGN",
            description: data.description as string
        });

        const paystackPlanCode = paystackRes?.data?.plan_code;
        if (!paystackPlanCode) {
            throw new Error("Failed to create plan on Paystack");
        }

        // 2️⃣ Save in DB
        const plan = await Plan.create({
            name: data.name,
            description: data.description,
            amount: data.amount,
            interval: data.interval,
            currency: data.currency || "NGN",
            paystackPlanCode,
            amountInKobo,
            features: data.features,
            status: "active",
            type: data.type
        });

        return plan;
    }

    async updatePlan(planId: string, data: UpdatePlanDTO) {
        const plan = await Plan.findById(planId);
        if (!plan) {
            throw {
                message: "Plan not found",
                statusCode: HTTP_STATUS.NOT_FOUND
            };
        }
        let update = {

        } as planData
        if (data.amount !== undefined || data.interval !== undefined) {
            const amountInKobo = paystack.toKobo(data.amount ?? plan.amount);
            update.amount = amountInKobo;
            // update.interval = data.interval ?? plan.interval;
            update.update_existing_subscriptions = true;
        }
        //if (data.currency) update.currency = data.currency;
        if (data.description) update.description = data.description;
        if (data.name) update.name = data.name;


        await paystack.updatePlan(plan.paystackPlanCode as string, update as planData);

        // SAFE updates only
        if (data.name !== undefined) plan.name = data.name;
        if (data.description !== undefined) plan.description = data.description;
        if (data.status !== undefined) plan.status = data.status;
        if (data.amount !== undefined) {
            plan.amount = data.amount;
            plan.amountInKobo = paystack.toKobo(data.amount);
        }
        if (data.interval !== undefined) plan.interval = data.interval;
        if (data.currency !== undefined) plan.currency = data.currency;
        if (data.features !== undefined) plan.features = data.features;

        await plan.save();
        return plan;
    }

    async getPlan(planId: string) {
        const plan = await Plan.findById(planId);
        if (!plan) {
            throw {
                message: "Plan not found",
                statusCode: HTTP_STATUS.NOT_FOUND
            };
        }
        return plan;
    }

    async getAllPlans(page = 1, limit = 10, filters: planFilter = {}) {

        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            Plan.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Plan.countDocuments(filters)
        ]);

        return {
            data: plans,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
