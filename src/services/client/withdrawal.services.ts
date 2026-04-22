import { Wallet } from "../../models/Wallet";
import { WalletTransaction } from "../../models/transaction";
import Campaign from "../../models/Campaign";
import { AppError } from "../../middleware/errorHandler";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { startSession } from "mongoose";
import crypto from "crypto";
import { FlutterwaveService } from "../flutterwave.services";


const flutterwave = new FlutterwaveService();

export class WithdrawalService {
    async withdrawFundsToWallet(
        campaignId: string,
        amount: number,
        narration: string
    ) {

        const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; //crypto.randomUUID();


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
            type: "user",
            status: "success",
            category: "wallet_credit",
            narration,
            reference: reference,
        })

        return transaction

    }

    // =========================
    // 🔹 WITHDRAW FUNDS
    // =========================
    async applyForWithdrawalToBank(
        userId: string,
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
        wallet.lockedBalance += amount;
        await wallet.save();



        const withdrawalRequest = await WithdrawalRequest.create({
            wallet: walletId,
            userId,
            amount,
            type: "withdrawal",
            status: "pending",
            narration,
            method: "bank_transfer",
            bankDetails: {
                bankCode: bankCode,
                accountNumber,
                accountName: accountName,
            },
        });

        // const newTransaction = new WalletTransaction({
        //     wallet: walletId,
        //     amount,
        //     type: "withdrawal",
        //     status: "pending",
        //     narration,
        //     method: "bank_transfer",
        //     bankDetails: {
        //         bankName: bank_name,
        //         accountNumber,
        //         accountName: accountName,
        //     },
        // });
        // await newTransaction.save();

        return withdrawalRequest

    }
}