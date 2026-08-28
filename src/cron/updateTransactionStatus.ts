import { WalletTransaction } from "../models/transaction";
import cron from "node-cron";

cron.schedule("*/5 * * * *", async () => {
    console.log("Running transaction expiry job...");
    await expireStaleTransactions();
});
async function expireStaleTransactions() {
    const EXPIRY_TIME = 45 * 60 * 1000; // 15 minutes
    const cutoff = new Date(Date.now() - EXPIRY_TIME);

    const result = await WalletTransaction.updateMany(
        {
            status: "pending",
            providerTransactionId: { $in: [null, undefined] },
            category: { $in: ["donation", "withdrawal"] },
            createdAt: { $lte: cutoff },
        },
        {
            $set: { status: "expired" },
        }
    );

    console.log(`Expired ${result.modifiedCount} transactions`);
}