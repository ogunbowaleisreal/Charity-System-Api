import mongoose from "mongoose";
import { UpdateClientProfile } from "../../models/clientProfile";
import clientProfile from "../../models/clientProfile";
import { ClientSubscription } from "../../models/clientSubcription";
import { Account } from "../../models/Accounts";
// import { comparePassword } from "../../utils/hash.utils";

export class clientProfileServices {
    async updateClientProfile(
        accountId: mongoose.Types.ObjectId,
        fields: UpdateClientProfile
    ) {
        const allowedFields: (keyof UpdateClientProfile)[] = [
            "businessAddress",
            "operatingCity",
            "operatingCountry",
            "operatingState",
            "positionInCompany",
            "companyName",
            "workEmail",
            "workPhone",
            "workType",
            "phoneCountryCode",
            "workPhoneCountryCode",
            "about",
            "coreNeeds",
            "employeeCapacity",
            "businessCategory",
            "instagram",
            "linkedin",
            "website",
            "youtube",
            "registrationNumber",
            "facebook",
            "x",
            "other",
            "firstName",
            "lastName",
            "profilePicture",
            "email",
            "phoneNumber",
        ];

        let updateAccount = {} as any;

        if (fields.firstName !== undefined) updateAccount.firstName = fields.firstName;
        if (fields.lastName !== undefined) updateAccount.lastName = fields.lastName;
        if (fields.email !== undefined) updateAccount.email = fields.email;
        if (fields.phoneNumber !== undefined) updateAccount.phone = fields.phoneNumber;
        if (fields.workPhoneCountryCode !== undefined)
            updateAccount.workPhoneCountryCode = fields.workPhoneCountryCode;
        if (fields.workPhone !== undefined) updateAccount.workPhone = fields.workPhone;
        if (fields.profilePicture !== undefined)
            updateAccount.picture = fields.profilePicture;

        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updateData[field] = fields[field];
            }
        }

        const updatedData = await clientProfile.findOneAndUpdate(
            { account: accountId },
            { $set: updateData },
            { new: true }
        );

        console.log(updatedData);

        const updatedAccount = await Account.findOneAndUpdate(
            { _id: accountId },
            { $set: updateAccount },
            { new: true }
        );

        /* =======================
           KYC COMPLETION CHECK
           ======================= */

        if (updatedData) {
            const REQUIRED_KYC_FIELDS: (keyof typeof updatedData)[] = [
                "firstName",
                "lastName",
                "email",
                "phoneNumber",
                "businessAddress",
                "operatingCity",
                "operatingCountry",
                "operatingState",
                "positionInCompany",
                "workEmail",
                "workPhone",
                "businessCategory",
                "employeeCapacity",
                "registrationNumber",
            ];

            const isKycComplete = REQUIRED_KYC_FIELDS.every((field) => {
                const value = updatedData[field];
                return value !== undefined && value !== null && value !== "";
            });

            if (isKycComplete && updatedData.kycStatus !== "completed") {
                await clientProfile.updateOne(
                    { _id: updatedData._id },
                    { $set: { kycStatus: "completed" } }
                );
                await Account.updateOne(
                    { _id: accountId },
                    { $set: { kycStatus: "completed" } }
                )
            }

            return updatedData;
        }

        return null;
    }

    // async updateClientProfile(accountId: mongoose.Types.ObjectId, fields: UpdateClientProfile) {

    //     const allowedFields: (keyof UpdateClientProfile)[] = [
    //         "businessAddress",
    //         "operatingCity",
    //         "operatingCountry",
    //         "operatingState",
    //         "positionInCompany",
    //         "workEmail",
    //         "workPhone",
    //         "workType",
    //         "phoneCountryCode",
    //         "workPhoneCountryCode",
    //         "about",
    //         "coreNeeds",
    //         "employeeCapacity",
    //         "businessCategory",
    //         "instagram",
    //         "linkedin",
    //         "website",
    //         "youtube",
    //         "registrationNumber",
    //         "facebook",
    //         "x",
    //         "other",
    //         "firstName",
    //         "lastName",
    //         "profilePicture",
    //         "email",
    //         "phoneNumber",
    //     ];
    //     let updateAccount = {} as any
    //     if (fields.firstName !== undefined) updateAccount.firstName = fields.firstName
    //     if (fields.lastName !== undefined) updateAccount.lastName = fields.lastName
    //     if (fields.email !== undefined) updateAccount.email = fields.email
    //     if (fields.phoneNumber !== undefined) updateAccount.phone = fields.phoneNumber
    //     if (fields.workPhoneCountryCode !== undefined) updateAccount.workPhoneCountryCode = fields.workPhoneCountryCode
    //     if (fields.workPhone !== undefined) updateAccount.workPhone = fields.workPhone
    //     if (fields.profilePicture !== undefined) updateAccount.picture = fields.profilePicture


    //     const updateData: Record<string, any> = {};

    //     for (const field of allowedFields) {
    //         if (fields[field] !== undefined) {
    //             updateData[field] = fields[field];
    //         }
    //     }
    //     //console.log(updateData)

    //     const updatedData = await clientProfile.findOneAndUpdate(
    //         { account: accountId },
    //         { $set: updateData },
    //         { new: true }
    //     )
    //     console.log(updatedData)
    //     const updatedAccount = await Account.findOneAndUpdate(
    //         { _id: accountId },
    //         { $set: updateAccount },
    //         { new: true }
    //     )
    //     if (updatedData) {
    //         return updatedData
    //     }
    //     return null
    // }



    async getClientProfile(clientId: string) {
        // const profile = await clientProfile.findOne({ account: clientId }).populate({ path: "account", select: " subscriptionStatus subscriptionEndDate subscriptionStartDate subscriptionPlan paystackCustomerCode" }).lean()
        const profile = await clientProfile
            .findOne({ account: clientId })
            // .populate({
            //     path: "account",
            //     select: "subscriptionStatus subscriptionEndDate subscriptionStartDate subscriptionPlan paystackCustomerCode",
            //     populate: {
            //         path: "subscriptionPlan",
            //         select: "name amount interval description"
            //     }
            // })
            .lean();

        const subscribtion = await ClientSubscription.findOne({ clientId: clientId, status: { $in: ["active", "non_renewing"] } }).populate('planId').lean()
        if (!subscribtion) {
            return { profile, subscribtion: null }
        }

        if (profile) {
            return { profile, subscribtion }
        }
        // if (profile?.account) {
        //     profile.subscription = profile.account.subscriptionPlan;
        //     delete profile.account.subscriptionPlan;
        // }
        // return null
    }
}