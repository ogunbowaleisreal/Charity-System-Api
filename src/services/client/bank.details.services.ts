import { BankDetail } from "../../models/BankDetails";
import { Bank } from "../../models/Banks";
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
export class BankDetailsService {

    async createBankDetails(
        payload: CreateBankDetailsDTO,
        userId: string
    ) {
        const existingBankDetail = await BankDetail.findOne({
            user: userId,
            isDeleted: false
        })
        if (existingBankDetail) throw new Error("user already has Bank details, try updating")
        return await BankDetail.create({
            ...payload,
            user: userId,
        });
    }

    async getUserBankDetails(userId: string) {
        const bankDetails = await BankDetail.findOne({
            user: userId,
            isDeleted: false,
        });

        return bankDetails;
    }

    async updateBankDetails(
        bankDetailsId: string,
        userId: string,
        payload: UpdateBankDetailsDTO
    ) {
        const bankDetails = await BankDetail.findOne({
            _id: bankDetailsId,
            user: userId,
            isDeleted: false,
        });

        if (!bankDetails) {
            throw new Error("Bank details not found");
        }

        Object.assign(bankDetails, payload);

        return await bankDetails.save();
    }

    async deleteBankDetails(bankDetailsId: string, userId: string) {
        const bankDetails = await BankDetail.findOne({
            _id: bankDetailsId,
            user: userId,
            isDeleted: false,
        });
        if (!bankDetails) {
            throw new Error("Bank details not found");
        }
        bankDetails.isDeleted = true;
        return await bankDetails.save();
    }
}