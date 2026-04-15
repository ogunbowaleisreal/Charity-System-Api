import { Wallet } from "../../models/Wallet";
import { WalletTransaction } from "../../models/transaction";
import Campaign from "../../models/Campaign";
import { AppError } from "../../middleware/errorHandler";
import { startSession } from "mongoose";

export class WithdrawalService {
    async withdrawFundsToWallet(
        campaignId: string,
        amount: number,
        narration: string
    ) {

        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new AppError("Campaign not found", 404);
        if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);

        const userWallet = await Wallet.findOne({
            userId: campaign.owner,
        });

        if (!userWallet) throw new AppError("Wallet not found", 404);


        if (campaign.availableBalance < amount) {
            throw new AppError("Insufficient balance", 400);
        }

        // 1. LOCK FUNDS
        campaign.availableBalance -= amount;
        //campaign.frozenBalance += amount;
        campaign.totalWithdrawn += amount;
        await campaign.save();

        // 2. UPDATE WALLET
        userWallet.availableBalance += amount;
        await userWallet.save();


        const transaction = await WalletTransaction.create({
            wallet: userWallet._id,
            amount,
            type: "donation",
            status: "success",
            narration,

        })

        // try {
        //     // 2. INITIATE TRANSFER
        //     const res = await safeHaven.initiateTransfer({
        //         amount,
        //         account_number: campaign.payoutAccount.accountNumber,
        //         bank_code: campaign.payoutAccount.bankCode,
        //         narration,
        //         reference: `wd_${Date.now()}`,
        //     });

        //     // 3. FINALIZE
        //     campaign.frozenBalance -= amount;
        //     campaign.totalWithdrawn += amount;

        //     await campaign.save();

        //     return res;
        // } catch (error) {
        //     // 4. ROLLBACK
        //     campaign.availableBalance += amount;
        //     campaign.frozenBalance -= amount;

        //     await campaign.save();
        //     throw error;
        // }
    }

    // =========================
    // 🔹 WITHDRAW FUNDS
    // =========================
    async applyForWithdrawalToBank(
        walletId: string,
        amount: number,
        accountName: string,
        bankCode: string,
        bank_name: string,
        accountNumber: string,
        narration: string
    ) {
        const wallet = await Wallet.findById(walletId);

        if (!wallet) throw new AppError("Wallet not found", 404);

        if (wallet.availableBalance < amount) {
            throw new AppError("Insufficient balance", 400);
        }

        // 1. LOCK FUNDS
        wallet.availableBalance -= amount;
        // wallet.frozenBalance += amount;
        await wallet.save();

        const newTransaction = new WalletTransaction({
            wallet: walletId,
            amount,
            type: "withdrawal",
            status: "pending",
            narration,
            method: "bank_transfer",
            bankDetails: {
                bankName: bank_name,
                accountNumber,
                accountName: accountName,
            },
        });
        await newTransaction.save();


    }
}