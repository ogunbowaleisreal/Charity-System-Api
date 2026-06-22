// scripts/linkWallets.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Account } from "../models/Accounts";
import { Wallet } from "../models/Wallet";

async function linkWallets() {
    try {
        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);
        console.log("MongoDB connected");

        const accounts = await Account.find({}).lean();
        console.log(`Found ${accounts.length} accounts`);

        let linked = 0;
        let missing = 0;
        let alreadyLinked = 0;

        for (const account of accounts) {
            // skip if wallet is already linked
            if (account.wallet) {
                alreadyLinked++;
                continue;
            }

            const wallet = await Wallet.findOne({ userId: account._id }).lean();

            if (!wallet) {
                console.warn(`No wallet found for account: ${account.email}`);
                missing++;
                continue;
            }

            await Account.findByIdAndUpdate(account._id, {
                wallet: wallet._id,
            });

            linked++;
        }

        console.log("\n===== Wallet Link Summary =====");
        console.log(`✅ Linked:          ${linked}`);
        console.log(`⏭️  Already linked:  ${alreadyLinked}`);
        console.log(`⚠️  No wallet found: ${missing}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ linkWallets script failed:", error);
        process.exit(1);
    }
}

linkWallets();