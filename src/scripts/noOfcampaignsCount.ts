// scripts/syncCampaignCounts.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Account } from "../models/Accounts";
import Campaign from "../models/Campaign";

async function syncCampaignCounts() {
    try {
        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);
        console.log("MongoDB connected");

        const accounts = await Account.find({}).lean();
        console.log(`Found ${accounts.length} accounts`);

        let updated = 0;
        let zeroed = 0;

        for (const account of accounts) {
            const count = await Campaign.countDocuments({ owner: account._id });

            await Account.findByIdAndUpdate(account._id, {
                noOfCampaigns: count,
            });

            if (count === 0) {
                zeroed++;
            } else {
                updated++;
                console.log(`  ${account.email} → ${count} campaign(s)`);
            }
        }

        console.log("\n===== Campaign Count Summary =====");
        console.log(`✅ Accounts with campaigns:    ${updated}`);
        console.log(`⏭️  Accounts with no campaigns: ${zeroed}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ syncCampaignCounts script failed:", error);
        process.exit(1);
    }
}

syncCampaignCounts();