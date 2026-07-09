/**
 * syncBankDetailFlag.ts
 *
 * Checks which users have at least one non-deleted BankDetail record,
 * and updates Account.isBankDetailCreated accordingly (true/false).
 *
 * Usage:
 *   npx ts-node syncBankDetailFlag.ts
 *
 * Requires MONGODB_URI in your .env
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Account } from "../models/Accounts"; // adjust path
import { BankDetail } from "../models/BankDetails"; // adjust path

dotenv.config();

async function run() {
    const uri = process.env.ATLAS_DATABASE_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set in your .env file");
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    try {
        // 1. Get the distinct set of user IDs that have a non-deleted bank detail
        const userIdsWithBankDetail: mongoose.Types.ObjectId[] =
            await BankDetail.distinct("user", { isDeleted: false });

        console.log(
            `Found ${userIdsWithBankDetail.length} account(s) with an active bank detail`
        );

        // 2. Set isBankDetailCreated = true for those accounts
        const trueResult = await Account.updateMany(
            { _id: { $in: userIdsWithBankDetail } },
            { $set: { isBankDetailCreated: true } }
        );

        // 3. Set isBankDetailCreated = false for everyone else
        //    (covers accounts with no bank detail, or only soft-deleted ones)
        const falseResult = await Account.updateMany(
            { _id: { $nin: userIdsWithBankDetail } },
            { $set: { isBankDetailCreated: false } }
        );

        console.log(
            `Marked true: ${trueResult.modifiedCount}, marked false: ${falseResult.modifiedCount}`
        );
    } catch (err) {
        console.error("Failed to sync isBankDetailCreated:", err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

run();