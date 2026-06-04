"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanMigrationService = void 0;
const Accounts_1 = require("../../models/Accounts");
const clientSubcription_1 = require("../../models/clientSubcription");
const Plan_1 = __importDefault(require("../../models/Plan"));
const paystackServices_1 = require("../paystackServices");
class AdminPlanMigrationService {
    constructor() {
        this.paystack = new paystackServices_1.PaystackService();
    }
    /**
     * Migrate all active users from an old plan to a new plan
     * @param oldPlanId - ID of the old plan
     * @param newPlanId - ID of the new plan
     */
    async migratePlan(oldPlanId, newPlanId) {
        const oldPlan = await Plan_1.default.findById(oldPlanId);
        const newPlan = await Plan_1.default.findById(newPlanId);
        if (!oldPlan || !newPlan) {
            throw new Error("Old or new plan not found");
        }
        // Fetch all active subscriptions using the old plan
        const oldSubscriptions = await clientSubcription_1.ClientSubscription.find({ planId: oldPlanId, status: "active" });
        for (const sub of oldSubscriptions) {
            try {
                const subscribtion = await this.paystack.getSubscription(sub.paystackSubscriptionCode);
                // 1️⃣ Disable old subscription on Paystack
                await this.paystack.cancelSubscription(sub.paystackSubscriptionCode, subscribtion.data.email_token);
                // 2️⃣ Mark old subscription as inactive in DB
                sub.status = "cancelled";
                console.log(sub.currentPeriod.end ? sub.currentPeriod.end.toISOString() : sub.currentPeriod.start.toISOString());
                // 3️⃣ Create new subscription on Paystack
                const newSub = await this.paystack.createSubscription({
                    customer: sub.paystackCustomerCode,
                    plan: newPlan.paystackPlanCode,
                    authorization: sub.paystackAuthorizationToken,
                    start_date: sub.currentPeriod.end ? sub.currentPeriod.end.toISOString() : undefined,
                    //metadata: { migratedFrom: oldPlan.paystackPlanCode },
                });
                await clientSubcription_1.ClientSubscription.create({
                    clientId: sub.clientId,
                    planId: newPlanId,
                    paystackSubscriptionCode: newSub.data.subscription_code,
                    status: "pending",
                    paystackCustomerCode: sub.paystackCustomerCode,
                    paystackAuthorizationToken: sub.paystackAuthorizationToken,
                    type: "migration",
                    currentPeriod: {
                        start: sub.currentPeriod.end,
                        end: null
                    }
                });
                await Accounts_1.Account.updateOne({
                    _id: sub.clientId
                }, {
                    plan: newPlanId,
                    subscriptionStartDate: sub.currentPeriod.end,
                });
                // 4️⃣ Update subscription record with new plan
                //sub.planId = newPlan._id as any;
                //sub.paystackSubscriptionCode = newSub.data.subscription_code;
                //sub.status = "active";
                await sub.save();
            }
            catch (err) {
                console.error(`Failed to migrate subscription for user ${sub.paystackCustomerCode}:`, err.message);
            }
        }
        return { migratedCount: oldSubscriptions.length };
    }
}
exports.AdminPlanMigrationService = AdminPlanMigrationService;
