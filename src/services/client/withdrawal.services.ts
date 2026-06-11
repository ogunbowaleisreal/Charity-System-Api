import { Wallet } from "../../models/wallet";
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
import logger from "../../logger";
import { PushNotificationService } from "../pushNotificationService";
import { ResendEmailService } from "../ResesndServices";
import CacheService from "../cacheServices";
import bcryptUtil from "../../utils/bcryptutils";
import { is } from "zod/locales";


const flutterwave = new FlutterwaveService();
const otpService = new OTPService();
const emailService = new ResendEmailService()

export class WithdrawalService {
    async withdrawFundsToWallet(
        userId: string,
        campaignId: string,
        walletPin: string,
        amount: number,
        narration: string
    ) {
        try {

            const session = await startSession();
            session.startTransaction();

            const isVerified = await this.verifyWalletPin(userId, walletPin);
            if (!isVerified) throw new Error("Invalid wallet pin");

            const user = await Account.findById(userId);
            if (!user) throw new Error("User not found");

            const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`; //crypto.randomUUID();


            const campaign = await Campaign.findById(campaignId);

            if (!campaign) throw new Error("Campaign not found");
            //  if (campaign.status == "ongoing" || campaign.status == "upcoming") throw new AppError("Campaign is still ongoing or has not started yet", 400);

            // if (campaign.owner.toString() != userId) throw new AppError("Unauthorized, ypu are not the owner of this campaign", 401);

            const userWallet = await Wallet.findOne({
                userId: userId,
            });

            if (!userWallet) throw new Error("Wallet not found");

            if (campaign.availableBalance < amount) {
                throw new Error("Insufficient balance",);
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
                status: "successful",
                fullName: `${user.firstName} ${user.lastName}`,
                category: "wallet_credit",
                provider: "flutterwave",
                method: "wallet",
                narration,
                reference
            }], { session });
            await PushNotificationService.sendToUser(userId, {
                title: "Withdrawal",
                body: `You have successfully withdrawn ${amount} from ${campaign.title} campaign`,
            });

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

    async firstTimeWalletPinSet(userId: string, pin: string) {
        if (!/^\d{4}$/.test(pin)) {
            throw new AppError("PIN must be exactly 4 digits", 400);
        }
        const hashedPin = await bcryptUtil.hashPassword(pin)

        // await Wallet.updateOne(
        //     { userId },
        //     {
        //         $set: {
        //             walletPin: hashedPin,
        //         },
        //     }
        // )
        const user = await Account.findById(userId)
        if (!user) throw new Error("User not found");
        const wallet = await Wallet.findOne({ userId }).select("+walletPin")
        if (!wallet) throw new Error("Wallet not found")
        if (wallet.walletPin) {
            throw new Error(
                "Wallet PIN has already been set, try reseting "
            );
        }
        wallet.walletPin = hashedPin
        await wallet.save()

        user.isWalletPinSet = true
        await user.save()
    }

    async resetWalletPin(userId: string) {

        //const userId = req.user.userId
        const account = await Account.findById(userId)
        if (!account) {
            throw new Error("error retrieving user account")
        }
        await otpService.generateAndSendOTP(account.email, "password_reset")
    }

    async verifyWalletPinResetOTP(userId: string, otp: string) {
        const user = await Account.findById(userId);
        if (!user) throw new AppError("User not found", 404);
        const isValidOTP = await otpService.verifyOTP(user.email, otp, "password_reset");
        if (!isValidOTP) {
            throw new AppError("Invalid or expired OTP", 400);
        }
        await CacheService.set(
            `wallet_pin_reset_verified:${user.email}`,
            true,
            600
        );
        return true
    }

    async getUserWallet(userId: string) {
        const wallet = await Wallet.findOne({ userId: userId }).lean();
        if (!wallet) throw new Error("Wallet not found");
        return wallet
    }

    async setWalletPin(userId: string, Pin: string) {
        if (!/^\d{4}$/.test(Pin)) {
            throw new AppError("PIN must be exactly 4 digits", 400);
        }

        const user = await Account.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const verified = await CacheService.get(
            `wallet_pin_reset_verified:${user.email}`
        );

        if (!verified) {
            throw new Error("OTP verification required");
        }

        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) throw new Error("Wallet not found");

        // ✅ hash ONCE
        const hashedPin = await bcryptUtil.hashPassword(Pin);

        wallet.walletPin = hashedPin;
        await wallet.save();
        user.isWalletPinSet = true
        await user.save()

        await CacheService.delete(
            `wallet_pin_reset_verified:${user.email}`
        );

        return true;
    }

    // async setWalletPin(userId: string, Pin: string) {
    //     if (!/^\d{6}$/.test(Pin)) {
    //         throw new AppError("PIN must be exactly 6 digits", 400);
    //     }
    //     const newPin = await bcryptUtil.hashPassword(Pin);
    //     const user = await Account.findById(userId).lean();
    //     if (!user) {
    //         throw new Error("User not found");
    //     }
    //     const verified = await CacheService.get(
    //         `wallet_pin_reset_verified:${user.email}`
    //     );

    //     if (!verified) {
    //         throw new Error("OTP verification required");
    //     }

    //     const wallet = await Wallet.findOne({
    //         userId: user._id
    //     })
    //     if (!wallet) throw new Error("Wallet not found");
    //     const hashedPin =
    //         await bcryptUtil.hashPassword(newPin);

    //     wallet.walletPin = hashedPin;
    //     await wallet?.save();

    //     // clear verification session
    //     await CacheService.delete(
    //         `wallet_pin_reset_verified:${user.email}`
    //     );

    //     return true;
    // }

    async verifyWalletPin(userId: string, walletPin: string) {
        const wallet = await Wallet.findOne({ userId }).select("+walletPin").lean();
        if (!wallet) throw new AppError("wallet retrieval failed", 404);
        // console.log(wallet.walletPin)
        //console.log(wallet, walletPin)
        const isValidPin = await bcryptUtil.comparePassword(walletPin, wallet.walletPin);
        if (!isValidPin) {
            throw new AppError("Invalid wallet pin", 400);
        }
        return true
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
        amount: number,
        walletId?: string,
        accountName?: string,
        bankCode?: string,
        bank_name?: string,
        accountNumber?: string,
        narration?: string
    ) {
        console.log(userId)
        const user = await Account.findById(userId)
        if (!user) throw new Error("Account not found")

        if (user.twoFactorWithdrawalEnabled) {
            await otpService.generateAndSendOTP(user.email, "2fa")
            return { message: "Otp sent to email to confirm withdrawal", status: 201 }
        }
        const wallet = await Wallet.findById(walletId);

        if (!wallet) throw new Error("Wallet not found");
        //if(!ammount)

        if (wallet.availableBalance < amount) {
            throw new Error("Insufficient balance");
        }

        // 1. LOCK FUNDS
        wallet.availableBalance -= amount;
        wallet.lockedBalance += amount;
        await wallet.save();

        const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;



        const withdrawalRequest = await WithdrawalRequest.create({
            wallet: walletId,
            userId,
            amount,
            type: "withdrawal",
            status: "pending",
            availableBalanceAtRequest: wallet.availableBalance,
            narration,
            method: "bank_transfer",
            reference,
            bankDetails: {
                bankCode: bankCode,
                accountNumber,
                accountName: accountName,
                bank_name
            },
        });

        await emailService.sendNewWwithdrawalRequestNotification(withdrawalRequest)
        //await PushNotificationService.sendToUsers()

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

    async verifyWithdrawalRequest2FA(
        userId: string,
        amount: number,
        otp: string,
        walletId?: string,
        accountName?: string,
        bankCode?: string,
        bank_name?: string,
        accountNumber?: string,
        narration?: string
    ) {
        const user = await Account.findById(userId)
        if (!user) throw new Error("user account not found ")

        const isVerified = await otpService.verifyOTP(user.email, otp, "2fa")
        if (!isVerified) throw new Error("OTP verification failed")
        const wallet = await Wallet.findById(walletId);

        if (!wallet) throw new Error("Wallet not found");
        //if(!ammount)

        if (wallet.availableBalance < amount) {
            throw new Error("Insufficient balance");
        }

        // 1. LOCK FUNDS
        wallet.availableBalance -= amount;
        wallet.lockedBalance += amount;
        await wallet.save();

        const reference = `WIT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;


        const withdrawalRequest = await WithdrawalRequest.create({
            wallet: walletId,
            userId,
            amount,
            type: "withdrawal",
            status: "pending",
            availableBalanceAtRequest: wallet.availableBalance,
            narration,
            method: "bank_transfer",
            bankDetails: {
                bankCode: bankCode,
                accountNumber,
                accountName: accountName,
            },
            reference
        });

        await emailService.sendNewWwithdrawalRequestNotification(withdrawalRequest)
        //await PushNotificationService.sendToUsers()  
        return withdrawalRequest

    }

    async toggle2faWithdrawal(userId: string, toggle: boolean) {
        const user = await Account.findById(userId)
        if (!user) throw new Error("user account not found ")
        if (toggle) {
            user.twoFactorWithdrawalEnabled = true
            user.save()
            return { message: "2fa has been enabled", user, status: 200 }
        }
        user.twoFactorWithdrawalEnabled = false
        user.save()
        return { message: "2fa has been disabled", user, status: 200 }
    }

    async getAllBanks() {
        const banks = await flutterwave.getBanks();
        return banks;
    }
}