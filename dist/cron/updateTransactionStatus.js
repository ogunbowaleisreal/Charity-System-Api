"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_1 = require("../models/transaction");
const node_cron_1 = __importDefault(require("node-cron"));
node_cron_1.default.schedule("*/5 * * * *", async () => {
    console.log("Running transaction expiry job...");
    await expireStaleTransactions();
});
async function expireStaleTransactions() {
    const EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes
    const cutoff = new Date(Date.now() - EXPIRY_TIME);
    const result = await transaction_1.WalletTransaction.updateMany({
        status: "pending",
        providerTransactionId: { $in: [null, undefined] },
        category: { $in: ["donation", "withdrawal"] },
        createdAt: { $lte: cutoff },
    }, {
        $set: { status: "expired" },
    });
    console.log(`Expired ${result.modifiedCount} transactions`);
}
