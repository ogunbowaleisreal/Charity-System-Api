"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientProfileServices = void 0;
const Accounts_1 = require("../../models/Accounts");
const refresh_token_1 = __importDefault(require("../../models/refresh.token"));
const ResesndServices_1 = require("../ResesndServices");
const otp_services_1 = __importDefault(require("../otp.services"));
const bcryptutils_1 = __importDefault(require("../../utils/bcryptutils"));
// import { comparePassword } from "../../utils/hash.utils";
class clientProfileServices {
    constructor() {
        this.emailService = new ResesndServices_1.ResendEmailService();
        this.OtpService = new otp_services_1.default();
    }
    // AuthService = new authService()
    async updateClientProfile(accountId, fields) {
        const allowedFields = [
            "businessAddress",
            "twoFactorEnabled",
            "twoFactorWithdrawalEnabled",
            "organizationType",
            "companyName",
            "about",
            "instagram",
            "website",
            "youtube",
            "facebook",
            "x",
            "dateOfBirth",
            "firstName",
            "lastName",
            "profilePicture",
            "phoneNumber",
            "logo",
            "about",
            "snapchat",
            "tiktok",
            "country",
            "state",
            "gender",
            "dateOfBirth",
            "houseAddress",
            "visibility",
            "bankName",
            "accountNumber",
            "accountName",
            "bankCode",
        ];
        let updateAccount = {};
        const user = await Accounts_1.Account.findById(accountId);
        if (!user)
            throw new Error("Account not found");
        if (user.role == "organization") {
            if (fields.companyName !== undefined)
                updateAccount.companyName = fields.companyName;
            if (fields.organizationType !== undefined)
                updateAccount.organizationType = fields.organizationType;
            if (fields.logo !== undefined)
                updateAccount.logo = fields.logo;
            if (fields.about !== undefined)
                updateAccount.about = fields.about;
            if (fields.businessAddress !== undefined)
                updateAccount.businessAddress = fields.businessAddress;
        }
        if (fields.firstName !== undefined)
            updateAccount.firstName = fields.firstName;
        if (fields.lastName !== undefined)
            updateAccount.lastName = fields.lastName;
        if (fields.phoneNumber !== undefined)
            updateAccount.phoneNumber = fields.phoneNumber;
        if (fields.snapchat !== undefined)
            updateAccount.snapchat = fields.snapchat;
        if (fields.tiktok !== undefined)
            updateAccount.tiktok = fields.tiktok;
        if (fields.country !== undefined)
            updateAccount.country = fields.country;
        if (fields.state !== undefined)
            updateAccount.state = fields.state;
        if (fields.gender !== undefined)
            updateAccount.gender = fields.gender;
        if (fields.dateOfBirth !== undefined)
            updateAccount.dateOfBirth = fields.dateOfBirth;
        if (fields.houseAddress !== undefined)
            updateAccount.houseAddress = fields.houseAddress;
        if (fields.visibility !== undefined)
            updateAccount.visibility = fields.visibility;
        if (fields.profilePicture !== undefined)
            updateAccount.profilePicture = fields.profilePicture;
        if (fields.youtube !== undefined)
            updateAccount.youtube = fields.youtube;
        if (fields.facebook !== undefined)
            updateAccount.facebook = fields.facebook;
        if (fields.x !== undefined)
            updateAccount.x = fields.x;
        if (fields.website !== undefined)
            updateAccount.website = fields.website;
        if (fields.instagram !== undefined)
            updateAccount.instagram = fields.instagram;
        // if (fields.bankName !== undefined) updateAccount.bankName = fields.bankName
        // if (fields.accountNumber !== undefined) updateAccount.accountNumber = fields.accountNumber
        // if (fields.accountName !== undefined) updateAccount.accountName = fields.accountName
        // if (fields.bankCode !== undefined) updateAccount.bankCode = fields.bankCode
        //if (fields.twoFactorEnabled !== undefined) updateAccount.twoFactorEnabled = fields.twoFactorEnabled
        if (fields.twoFactorWithdrawalEnabled !== undefined)
            updateAccount.twoFactorWithdrawalEnabled = fields.twoFactorWithdrawalEnabled;
        const updatedAccount = await Accounts_1.Account.findOneAndUpdate({ _id: accountId }, { $set: updateAccount }, { new: true });
        return updatedAccount;
    }
    async getClientProfile(clientId) {
        // const profile = await clientProfile.findOne({ account: clientId }).populate({ path: "account", select: " subscriptionStatus subscriptionEndDate subscriptionStartDate subscriptionPlan paystackCustomerCode" }).lean()
        const profile = await Accounts_1.Account
            .findById(clientId).select("-password")
            .lean();
        if (profile) {
            return profile;
        }
    }
    async deleteAccount(userId, password, reason) {
        const user = await Accounts_1.Account.findById(userId);
        if (!user) {
            throw new Error("Account not found");
        }
        const verified = await bcryptutils_1.default.comparePassword(password, user.password);
        if (!verified) {
            throw new Error("Invalid password");
        }
        user.isDeleted = true;
        await user.save();
        const deletedRefreshTokens = await refresh_token_1.default.deleteMany({ userId: userId });
        if (deletedRefreshTokens.deletedCount && deletedRefreshTokens.deletedCount > 0) {
            await this.emailService.sendAccountDeletedNotification(user.email, reason);
            return true;
        }
        else {
            return false;
        }
        // await this.OtpService.generateAndSendOTP(email, "2fa")
        ///   return { message: "2FA Otp sent to your email" }
    }
    async deleteAccount2FA(userId, otp, reason) {
        const account = await Accounts_1.Account.findById(userId);
        if (!account) {
            throw new Error("Account mot found");
        }
        account.isDeleted = true;
        //    AndUpdate({ _id: userId }, { isDeleted: true }, { new: true });
        await this.OtpService.verifyOTP(account.email, otp, "2fa");
        if (account) {
            this.emailService.sendAccountDeletedNotification(account.email, reason);
            return account;
        }
        else {
            return false;
        }
    }
    async enableTwoFactorAuth(accountId) {
        const account = await Accounts_1.Account.findById(accountId);
        if (!account) {
            throw new Error("Account not found");
        }
        // if (account.twoFactorEnabled) {
        //     throw new Error("Two-factor authentication is already enabled");
        // }
        account.twoFactorEnabled = true;
        await account.save();
        return {
            twoFactorEnabled: account.twoFactorEnabled,
            message: account.twoFactorEnabled ? "2FA toggled on" : "2FA toggled off"
        };
    }
    async disableTwoFactorAuth(accountId) {
        const account = await Accounts_1.Account.findById(accountId);
        if (!account) {
            throw new Error("Account not found");
        }
        // if (!account.twoFactorEnabled) {
        //     throw new Error("Two-factor authentication is already disabled");
        // }
        account.twoFactorEnabled = false;
        await account.save();
        return {
            twoFactorEnabled: account.twoFactorEnabled,
            message: account.twoFactorEnabled ? "2FA toggled on" : "2FA toggled off"
        };
    }
}
exports.clientProfileServices = clientProfileServices;
