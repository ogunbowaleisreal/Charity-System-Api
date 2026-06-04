"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanServices = void 0;
const paystackServices_1 = require("../paystackServices");
const Plan_1 = __importDefault(require("../../models/Plan"));
const paystack = new paystackServices_1.PaystackService();
class PlanServices {
    async createPlan(planData) {
        const response = await paystack.createPlan(planData);
        const newPlan = new Plan_1.default(response);
        await newPlan.save();
        return newPlan;
    }
    async getPlan(planCode) {
        const plan = await Plan_1.default.findOne({ paystackPlanCode: planCode });
        return plan;
    }
    async listPlans() {
        const plans = await Plan_1.default.find({ status: "active" });
        return plans;
    }
}
exports.PlanServices = PlanServices;
