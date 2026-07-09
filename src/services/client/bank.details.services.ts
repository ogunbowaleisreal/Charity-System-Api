import { BankDetail } from "../../models/BankDetails";
import { Account } from "../../models/Accounts";
import { OTPService } from "../../services/otp.services"; // adjust path to match your project
import { CacheService } from "../cacheServices"; // adjust path to match your project

export type CreateBankDetailsDTO = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
};

export type UpdateBankDetailsDTO = {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
};

export type BankDetailsFilter = {
    page: number;
    limit: number;
    bankName?: string;
    accountName?: string;
    userId?: string;
};

const PENDING_TTL = 600; // 10 minutes, matches OTP expiry

export class BankDetailsService {
    private otpService = new OTPService();

    async createBankDetails(payload: CreateBankDetailsDTO, userId: string) {
        const account = await Account.findById(userId);
        if (!account) throw new Error("User not found");

        const existingBankDetail = await BankDetail.findOne({
            user: userId,
            isDeleted: false,
        });
        if (existingBankDetail) throw new Error("user already has Bank details, try updating");
        const bankDetails = await BankDetail.create({
            ...payload,
            user: userId,
        });

        account.isBankDetailCreated = true;
        await account?.save();
        return bankDetails;
    }

    async getUserBankDetails(userId: string) {
        return await BankDetail.findOne({ user: userId, isDeleted: false });
    }

    // ===== UPDATE FLOW =====

    async requestUpdateOTP(userId: string, payload: UpdateBankDetailsDTO): Promise<void> {
        const existing = await this.getUserBankDetails(userId);
        if (!existing) throw new Error("Bank details not found");

        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        // Stash the intended changes so confirm step knows what to apply
        await CacheService.set(
            `pending_bank_update:${userId}`,
            payload,
            PENDING_TTL
        );

        await this.otpService.generateAndSendOTP(user.email, "2fa");
    }

    async confirmUpdate(userId: string, otp: string) {
        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        const isValid = await this.otpService.verifyOTP(user.email, otp, "2fa");
        if (!isValid) throw new Error("Invalid or expired OTP");

        const pendingKey = `pending_bank_update:${userId}`;
        const pendingPayload = await CacheService.get(pendingKey);
        if (!pendingPayload) {
            throw new Error("No pending bank update found or it has expired, please try again");
        }
        await CacheService.delete(pendingKey);

        const bankDetails = await this.getUserBankDetails(userId);
        if (!bankDetails) throw new Error("Bank details not found");

        Object.assign(bankDetails, pendingPayload as UpdateBankDetailsDTO);
        return await bankDetails.save();
    }

    // ===== DELETE FLOW =====

    async requestDeleteOTP(userId: string): Promise<void> {
        const existing = await this.getUserBankDetails(userId);
        if (!existing) throw new Error("Bank details not found");

        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        await CacheService.set(
            `pending_bank_delete:${userId}`,
            { pendingDelete: true },
            PENDING_TTL
        );

        await this.otpService.generateAndSendOTP(user.email, "2fa");
    }

    async confirmDelete(userId: string, otp: string) {
        const user = await Account.findById(userId);
        if (!user) throw new Error("User not found");

        const isValid = await this.otpService.verifyOTP(user.email, otp, "2fa");
        if (!isValid) throw new Error("Invalid or expired OTP");

        const pendingKey = `pending_bank_delete:${userId}`;
        const pending = await CacheService.get(pendingKey);
        if (!pending) {
            throw new Error("No pending bank deletion found or it has expired, please try again");
        }
        await CacheService.delete(pendingKey);

        const bankDetails = await this.getUserBankDetails(userId);
        if (!bankDetails) throw new Error("Bank details not found");

        bankDetails.isDeleted = true;
        await bankDetails.save();

        user.isBankDetailCreated = false;
        await user.save();
        return bankDetails;
    }
}
// import { BankDetail } from "../../models/BankDetails";
// import { Bank } from "../../models/Banks";
// export type CreateBankDetailsDTO = {
//     bankName: string;
//     accountNumber: string;
//     accountName: string;
//     bankCode: string;
// };

// export type UpdateBankDetailsDTO = {
//     bankName?: string;
//     accountNumber?: string;
//     accountName?: string;
//     bankCode?: string;
// };

// export type BankDetailsFilter = {
//     page: number;
//     limit: number;

//     bankName?: string;

//     accountName?: string;

//     userId?: string;
// };
// export class BankDetailsService {

//     async createBankDetails(
//         payload: CreateBankDetailsDTO,
//         userId: string
//     ) {
//         const existingBankDetail = await BankDetail.findOne({
//             user: userId,
//             isDeleted: false
//         })
//         if (existingBankDetail) throw new Error("user already has Bank details, try updating")
//         return await BankDetail.create({
//             ...payload,
//             user: userId,
//         });
//     }

//     async getUserBankDetails(userId: string) {
//         const bankDetails = await BankDetail.findOne({
//             user: userId,
//             isDeleted: false,
//         });

//         return bankDetails;
//     }

//     async updateBankDetails(
//         bankDetailsId: string,
//         userId: string,
//         payload: UpdateBankDetailsDTO
//     ) {
//         const bankDetails = await BankDetail.findOne({
//             _id: bankDetailsId,
//             user: userId,
//             isDeleted: false,
//         });

//         if (!bankDetails) {
//             throw new Error("Bank details not found");
//         }

//         Object.assign(bankDetails, payload);

//         return await bankDetails.save();
//     }

//     async deleteBankDetails(bankDetailsId: string, userId: string) {
//         const bankDetails = await BankDetail.findOne({
//             _id: bankDetailsId,
//             user: userId,
//             isDeleted: false,
//         });
//         if (!bankDetails) {
//             throw new Error("Bank details not found");
//         }
//         bankDetails.isDeleted = true;
//         return await bankDetails.save();
//     }
// }