import mongoose from "mongoose";
import dotenv from "dotenv";

import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { Bank } from "../models/Banks";

dotenv.config();

async function updateWithdrawalBankNames() {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);

        console.log("✅ MongoDB Connected");

        const withdrawals = await WithdrawalRequest.find({
            "bankDetails.bankCode": { $exists: true }
        }).lean();

        console.log(`Found ${withdrawals.length} withdrawals`);

        // Load all banks once
        const banks = await Bank.find().lean();

        const bankMap = new Map(
            banks.map(bank => [bank.code, bank.name])
        );

        let updated = 0;
        let notFound = 0;

        for (const withdrawal of withdrawals) {
            const bankCode = withdrawal.bankDetails.bankCode;

            const bankName = bankMap.get(bankCode);

            if (!bankName) {
                console.log(
                    `❌ Bank not found for code ${bankCode} (Withdrawal ${withdrawal._id})`
                );

                notFound++;
                continue;
            }

            await WithdrawalRequest.updateOne(
                { _id: withdrawal._id },
                {
                    $set: {
                        "bankDetails.bank_name": bankName
                    }
                }
            );

            updated++;

            console.log(
                `✅ Updated ${withdrawal._id} -> ${bankName}`
            );
        }

        console.log(`
================================
Updated: ${updated}
Not Found: ${notFound}
================================
`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

updateWithdrawalBankNames();