import mongoose from "mongoose";
import { UpdateClientProfile } from "../../models/clientProfile";
import clientProfile from "../../models/clientProfile";
import { ClientSubscription } from "../../models/clientSubcription";
import { Account } from "../../models/Accounts";
import { IAccount } from "../../models/Accounts";
import RefreshToken from "../../models/refresh.token";
import { ResendEmailService } from "../ResesndServices";
import OTPService from "../otp.services";
// import { comparePassword } from "../../utils/hash.utils";

export class clientProfileServices {
    emailService = new ResendEmailService()
    OtpService = new OTPService()
    async updateClientProfile(
        accountId: mongoose.Types.ObjectId,
        fields: IAccount
    ) {
        const allowedFields: (keyof IAccount)[] = [
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
        ];



        let updateAccount = {} as any;

        const user = await Account.findById(accountId);
        if (!user) throw new Error("Account not found");
        if (user.role == "organization") {
            if (fields.companyName !== undefined) updateAccount.companyName = fields.companyName;
            if (fields.organizationType !== undefined) updateAccount.organizationType = fields.organizationType;
            if (fields.logo !== undefined) updateAccount.logo = fields.logo;
            if (fields.about !== undefined) updateAccount.about = fields.about;
            if (fields.businessAddress !== undefined) updateAccount.businessAddress = fields.businessAddress;
        }

        if (fields.firstName !== undefined) updateAccount.firstName = fields.firstName;
        if (fields.lastName !== undefined) updateAccount.lastName = fields.lastName;
        if (fields.phoneNumber !== undefined) updateAccount.phone = fields.phoneNumber;
        if (fields.snapchat !== undefined) updateAccount.snapchat = fields.snapchat;
        if (fields.tiktok !== undefined) updateAccount.tiktok = fields.tiktok;
        if (fields.country !== undefined) updateAccount.country = fields.country;
        if (fields.state !== undefined) updateAccount.state = fields.state;
        if (fields.gender !== undefined) updateAccount.gender = fields.gender;
        if (fields.dateOfBirth !== undefined) updateAccount.dateOfBirth = fields.dateOfBirth;
        if (fields.houseAddress !== undefined) updateAccount.houseAddress = fields.houseAddress;
        if (fields.visibility !== undefined) updateAccount.visibility = fields.visibility;
        if (fields.profilePicture !== undefined)
            updateAccount.picture = fields.profilePicture;
        if (fields.youtube !== undefined) updateAccount.youtube = fields.youtube;
        if (fields.facebook !== undefined) updateAccount.facebook = fields.facebook;
        if (fields.x !== undefined) updateAccount.x = fields.x;
        if (fields.website !== undefined) updateAccount.website = fields.website;
        if (fields.instagram !== undefined) updateAccount.instagram = fields.instagram;
        if (fields.twoFactorEnabled !== undefined) updateAccount.twoFactorEnabled = fields.twoFactorEnabled
        if (fields.twoFactorWithdrawalEnabled !== undefined) updateAccount.twoFactorWithdrawalEnabled = fields.twoFactorWithdrawalEnabled


        const updatedAccount = await Account.findOneAndUpdate(
            { _id: accountId },
            { $set: updateAccount },
            { new: true }
        );

        return updatedAccount;
    }


    async getClientProfile(clientId: string) {
        // const profile = await clientProfile.findOne({ account: clientId }).populate({ path: "account", select: " subscriptionStatus subscriptionEndDate subscriptionStartDate subscriptionPlan paystackCustomerCode" }).lean()
        const profile = await Account
            .findById(clientId).select("-password")
            .lean();

        if (profile) {
            return { profile }
        }

    }
    async deleteAccount(email: string) {
        const user = await Account.find({ email })
        if (!user) {
            throw new Error("Account not found")
        }
        await this.OtpService.generateAndSendOTP(email, "2fa")

        return { message: "2FA Otp sent to your email" }

    }

    async deleteAccount2FA(userId: mongoose.Types.ObjectId, otp: string) {

        const account = await Account.findById(userId)
        if (!account) {
            throw new Error("Account mot found")
        }
        account.isDeleted = true
        //    AndUpdate({ _id: userId }, { isDeleted: true }, { new: true });
        await this.OtpService.verifyOTP(account.email, otp, "2fa")
        const deletedRefreshTokens = await RefreshToken.deleteMany({ userId: userId });
        if (account) {
            this.emailService.sendAccountDeletedNotification(account.email)
            return account;
        } else {
            return false;
        }

    }
}