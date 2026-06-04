"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanManagementService = void 0;
const Plan_1 = __importDefault(require("../../models/Plan"));
const paystackServices_1 = require("../paystackServices");
const constants_1 = require("../../utils/constants");
const paystack = new paystackServices_1.PaystackService();
class AdminPlanManagementService {
    async createPlan(data) {
        // prevent duplicates
        const existing = await Plan_1.default.findOne({
            name: data.name,
            interval: data.interval,
            status: "active"
        });
        if (existing) {
            throw {
                message: "An active plan with same name and interval already exists",
                statusCode: constants_1.HTTP_STATUS.CONFLICT
            };
        }
        const amountInKobo = paystack.toKobo(data.amount);
        console.log(data);
        // 1️⃣ Create plan on Paystack
        const paystackRes = await paystack.createPlan({
            name: data.name,
            amount: amountInKobo,
            interval: data.interval,
            currency: data.currency || "NGN",
            description: data.description
        });
        const paystackPlanCode = paystackRes?.data?.plan_code;
        if (!paystackPlanCode) {
            throw new Error("Failed to create plan on Paystack");
        }
        // 2️⃣ Save in DB
        const plan = await Plan_1.default.create({
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
    async updatePlan(planId, data) {
        const plan = await Plan_1.default.findById(planId);
        if (!plan) {
            throw {
                message: "Plan not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND
            };
        }
        let update = {};
        if (data.amount !== undefined || data.interval !== undefined) {
            const amountInKobo = paystack.toKobo(data.amount ?? plan.amount);
            update.amount = amountInKobo;
            // update.interval = data.interval ?? plan.interval;
            update.update_existing_subscriptions = true;
        }
        //if (data.currency) update.currency = data.currency;
        if (data.description)
            update.description = data.description;
        if (data.name)
            update.name = data.name;
        await paystack.updatePlan(plan.paystackPlanCode, update);
        // SAFE updates only
        if (data.name !== undefined)
            plan.name = data.name;
        if (data.description !== undefined)
            plan.description = data.description;
        if (data.status !== undefined)
            plan.status = data.status;
        if (data.amount !== undefined) {
            plan.amount = data.amount;
            plan.amountInKobo = paystack.toKobo(data.amount);
        }
        if (data.interval !== undefined)
            plan.interval = data.interval;
        if (data.currency !== undefined)
            plan.currency = data.currency;
        if (data.features !== undefined)
            plan.features = data.features;
        await plan.save();
        return plan;
    }
    async getPlan(planId) {
        const plan = await Plan_1.default.findById(planId);
        if (!plan) {
            throw {
                message: "Plan not found",
                statusCode: constants_1.HTTP_STATUS.NOT_FOUND
            };
        }
        return plan;
    }
    async getAllPlans(page = 1, limit = 10, filters = {}) {
        const skip = (page - 1) * limit;
        const [plans, total] = await Promise.all([
            Plan_1.default.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Plan_1.default.countDocuments(filters)
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
exports.AdminPlanManagementService = AdminPlanManagementService;
