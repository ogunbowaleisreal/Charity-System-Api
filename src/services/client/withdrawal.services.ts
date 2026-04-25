import { Wallet } from "../../models/Wallet";
import { WalletTransaction } from "../../models/transaction";
import Campaign from "../../models/Campaign";
import { AppError } from "../../middleware/errorHandler";
import { WithdrawalRequest } from "../../models/WithdrawalRequest";
import { HTTP_STATUS } from "../../utils/constants";
import crypto from "crypto";
import { FlutterwaveService } from "../flutterwave.services";
import { Account } from "../../models/Accounts";
import OTPService from "../otp.services";
import { startSession } from "mongoose";


const flutterwave = new FlutterwaveService();
const otpService = new OTPService();

export class WithdrawalService {
    async withdrawFundsToWallet(
        userId: string,
        campaignId: string,
        amount: number,
        narration: string
    ) {
        try {

            const session = await startSession();
            session.startTransaction();

            const user = await Account.findById(userId);
            if (!user) throw new AppError("User not found", 404);

            const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; //crypto.randomUUID();


            const campaign = await Campaign.findById(campaignId);

            if (!campaign) throw new AppError("Campaign not found", 404);
            if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);

            if (campaign.owner.toString() != userId) throw new AppError("Unauthorized, ypu are not the owner of this campaign", 401);

            const userWallet = await Wallet.findOne({
                userId: campaign.owner,
            });

            if (!userWallet) throw new AppError("Wallet not found", 404);


            if (campaign.availableBalance < amount) {
                throw new AppError("Insufficient balance", 400);
            }

            if (user.twoFactorWithdrawalEnabled == true) {
                const otp = await otpService.generateAndSendOTP(user.email, "2fa");

                return {
                    "success": true,
                    "message": "Just one more step! We've sent a verification code to your email. Please check your inbox and enter the code to complete your withdrawl.",
                    "statusCode": HTTP_STATUS.NO_CONTENT
                }


            }


            await Campaign.updateOne(
                { _id: campaignId },
                {
                    $inc: {
                        availableBalance: -amount,
                        totalWithdrawn: amount
                    }
                },
                { session }
            );

            await Wallet.updateOne(
                { userId },
                {
                    $inc: { availableBalance: amount }
                },
                { session }
            );

            await WalletTransaction.create([{
                wallet: userWallet._id,
                amount,
                type: "user",
                status: "success",
                category: "wallet_credit",
                narration,
                reference
            }], { session });

            await session.commitTransaction();
        } catch (err) {
            // await session.abortTransaction();
            throw err;
        }

        // // 1. LOCK FUNDS
        // campaign.availableBalance -= amount;
        // //campaign.frozenBalance += amount;
        // campaign.totalWithdrawn += amount;
        // await campaign.save();

        // // 2. UPDATE WALLET
        // userWallet.availableBalance += amount;
        // await userWallet.save();


        // const transaction = await WalletTransaction.create({
        //     wallet: userWallet._id,
        //     amount,
        //     type: "user",
        //     status: "success",
        //     category: "wallet_credit",
        //     narration,
        //     reference: reference,
        // })

        // return transaction

    }

    async verifyWithdrawal2fa(userId: string, campaignId: string, otp: string, amount: number, narration: string) {
        const user = await Account.findById(userId);
        if (!user) throw new AppError("User not found", 404);
        const isValidOTP = await otpService.verifyOTP(user.email, otp, "2fa");
        if (!isValidOTP) {
            throw new AppError("Invalid or expired OTP", 400);
        }

        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new AppError("Campaign not found", 404);


        const userWallet = await Wallet.findOne({
            userId: userId,
        });
        if (!userWallet) throw new AppError("Wallet not found", 404);

        const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;


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

    async getAllBanks() {
        const banks = await flutterwave.getBanks();
        return banks;
    }
}