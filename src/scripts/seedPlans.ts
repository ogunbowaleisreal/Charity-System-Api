// plan.seeder.ts
import mongoose from "mongoose";
import Plan from "../models/Plan"; // <-- adjust path
import { PaystackService } from "../services/paystackServices"; // <-- adjust path
import dotenv from "dotenv";

dotenv.config();

// -----------------------------
// 1. PAYSTACK SERVICE
// -----------------------------
const paystack = new PaystackService();

// -----------------------------
// 2. PLANS YOU WANT TO SEED
// -----------------------------
const seedPlans = [
    {
        name: "Essential",
        description: "Basic monthly access",
        amount: 5000, // NGN
        interval: "monthly",
        currency: "NGN",
    },
    {
        name: "Growth",
        description: "Monthly upgraded features",
        amount: 15000,
        interval: "monthly",
        currency: "NGN",
    },
    {
        name: "premium",
        description: "Annual premium plan",
        amount: 100000,
        interval: "annually",
        currency: "NGN",
    },
];

// -----------------------------
// 3. CREATE PAYSTACK PLAN
// -----------------------------
async function createPaystackPlan(plan: any) {
    const payload = {
        name: plan.name,
        amount: plan.amount * 100, // Convert NGN → KOBO
        interval: plan.interval,
        currency: plan.currency,
        description: plan.description,
    };

    const ps = await paystack.createPlan(payload);
    return ps.data.plan_code;
}

// -----------------------------
// 4. SEED FUNCTION
// -----------------------------
async function seed() {
    try {
        console.log("🌱 Connecting to DB...");
        await mongoose.connect(process.env.ATLAS_DATABASE_URI as string);
        console.log("✅ Database connected");

        for (const plan of seedPlans) {
            const exists = await Plan.findOne({ name: plan.name });

            if (exists) {
                console.log(`⚠️ Skipped: ${plan.name} already exists`);
                continue;
            }

            console.log(`➡ Creating Paystack plan: ${plan.name}`);
            const planCode = await createPaystackPlan(plan);

            await Plan.create({
                name: plan.name,
                description: plan.description,
                amount: plan.amount,
                amountInKobo: plan.amount * 100,
                interval: plan.interval,
                currency: "NGN",
                paystackPlanCode: planCode,
                status: "active",
            });

            console.log(`✅ Created ${plan.name} → Paystack Code: ${planCode}`);
        }

        console.log("\n🎉 DONE SEEDING PLANS");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

seed();
