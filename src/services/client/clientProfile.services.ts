import mongoose from "mongoose";
import { UpdateClientProfile } from "../../models/clientProfile";
import clientProfile from "../../models/clientProfile";
import { ClientSubscription } from "../../models/clientSubcription";
import { Account } from "../../models/Accounts";
import { IAccount } from "../../models/Accounts";
import RefreshToken from "../../models/refresh.token";
// import { comparePassword } from "../../utils/hash.utils";

export class clientProfileServices {
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
        // if (profile?.account) {
        //     profile.subscription = profile.account.subscriptionPlan;
        //     delete profile.account.subscriptionPlan;
        // }
        // return null
    }

    async deleteAccount(userId: mongoose.Types.ObjectId) {
        const updatedData = await Account.findByIdAndUpdate({ _id: userId }, { isDeleted: true }, { new: true });
        const deletedRefreshTokens = await RefreshToken.deleteMany({ userId: userId });
        if (updatedData) {
            return updatedData;
        } else {
            return false;
        }
    }
}