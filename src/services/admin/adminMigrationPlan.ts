import { Account } from "../../models/Accounts";
import { ClientSubscription } from "../../models/clientSubcription";
import Plan from "../../models/Plan";
import { PaystackService } from "../paystackServices";

export class AdminPlanMigrationService {
    private paystack: PaystackService;

    constructor() {
        this.paystack = new PaystackService();
    }

    /**
     * Migrate all active users from an old plan to a new plan
     * @param oldPlanId - ID of the old plan
     * @param newPlanId - ID of the new plan
     */
    async migratePlan(oldPlanId: string, newPlanId: string) {
        const oldPlan = await Plan.findById(oldPlanId);
        const newPlan = await Plan.findById(newPlanId);

        if (!oldPlan || !newPlan) {
            throw new Error("Old or new plan not found");
        }

        // Fetch all active subscriptions using the old plan
        const oldSubscriptions = await ClientSubscription.find({ planId: oldPlanId, status: "active" });

        for (const sub of oldSubscriptions) {
            try {
                const subscribtion = await this.paystack.getSubscription(sub.paystackSubscriptionCode as string);
                // 1️⃣ Disable old subscription on Paystack
                await this.paystack.cancelSubscription(sub.paystackSubscriptionCode as string, subscribtion.data.email_token);

                // 2️⃣ Mark old subscription as inactive in DB
                sub.status = "cancelled";
                console.log(sub.currentPeriod.end ? sub.currentPeriod.end.toISOString() : sub.currentPeriod.start.toISOString())

                // 3️⃣ Create new subscription on Paystack
                const newSub = await this.paystack.createSubscription({
                    customer: sub.paystackCustomerCode,
                    plan: newPlan.paystackPlanCode,
                    authorization: sub.paystackAuthorizationToken,
                    start_date: sub.currentPeriod.end ? sub.currentPeriod.end.toISOString() : undefined,
                    //metadata: { migratedFrom: oldPlan.paystackPlanCode },
                });

                await ClientSubscription.create({
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
                })

                await Account.updateOne({
                    _id: sub.clientId
                },
                    {
                        plan: newPlanId,
                        subscriptionStartDate: sub.currentPeriod.end,
                    });

                // 4️⃣ Update subscription record with new plan
                //sub.planId = newPlan._id as any;
                //sub.paystackSubscriptionCode = newSub.data.subscription_code;
                //sub.status = "active";


                await sub.save();
            } catch (err: any) {
                console.error(`Failed to migrate subscription for user ${sub.paystackCustomerCode}:`, err.message);
            }
        }

        return { migratedCount: oldSubscriptions.length };
    }
}
