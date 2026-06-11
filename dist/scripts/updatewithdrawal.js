"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const WithdrawalRequest_1 = require("../models/WithdrawalRequest");
const Banks_1 = require("../models/Banks");
dotenv_1.default.config();
async function updateWithdrawalBankNames() {
    try {
        // Connect to MongoDB Atlas
        await mongoose_1.default.connect(process.env.ATLAS_DATABASE_URI);
        console.log("✅ MongoDB Connected");
        const withdrawals = await WithdrawalRequest_1.WithdrawalRequest.find({
            "bankDetails.bankCode": { $exists: true }
        }).lean();
        console.log(`Found ${withdrawals.length} withdrawals`);
        // Load all banks once
        const banks = await Banks_1.Bank.find().lean();
        const bankMap = new Map(banks.map(bank => [bank.code, bank.name]));
        let updated = 0;
        let notFound = 0;
        for (const withdrawal of withdrawals) {
            const bankCode = withdrawal.bankDetails.bankCode;
            const bankName = bankMap.get(bankCode);
            if (!bankName) {
                console.log(`❌ Bank not found for code ${bankCode} (Withdrawal ${withdrawal._id})`);
                notFound++;
                continue;
            }
            await WithdrawalRequest_1.WithdrawalRequest.updateOne({ _id: withdrawal._id }, {
                $set: {
                    "bankDetails.bank_name": bankName
                }
            });
            updated++;
            console.log(`✅ Updated ${withdrawal._id} -> ${bankName}`);
        }
        console.log(`
================================
Updated: ${updated}
Not Found: ${notFound}
================================
`);
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}
updateWithdrawalBankNames();
