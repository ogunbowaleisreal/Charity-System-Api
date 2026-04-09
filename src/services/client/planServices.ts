import { PaystackService } from "../paystackServices";
import Plan from "../../models/Plan";

export interface planData {
    name: string,
    description: string,
    amount: number,
    interval: "monthly" | "annually" | "daily" | "hourly",
    currency: string,
    update_existing_subscriptions?: boolean

}
const paystack = new PaystackService();

export class PlanServices {
    async createPlan(planData: planData) {

        const response = await paystack.createPlan(planData);
        const newPlan = new Plan(response);
        await newPlan.save();
        return newPlan;

    }

    async getPlan(planCode: string) {
        const plan = await Plan.findOne({ paystackPlanCode: planCode });
        return plan;
    }


    async listPlans() {
        const plans = await Plan.find({ status: "active" });
        return plans;
    }
}