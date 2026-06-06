"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankDetailsService = void 0;
const BankDetails_1 = require("../../models/BankDetails");
class BankDetailsService {
    async createBankDetails(payload, userId) {
        const existingBankDetail = await BankDetails_1.BankDetail.findOne({
            user: userId,
            isDeleted: false
        });
        if (existingBankDetail)
            throw new Error("user already has Bank details, try updating");
        return await BankDetails_1.BankDetail.create({
            ...payload,
            user: userId,
        });
    }
    async getUserBankDetails(userId) {
        const bankDetails = await BankDetails_1.BankDetail.findOne({
            user: userId,
            isDeleted: false,
        });
        return bankDetails;
    }
    async updateBankDetails(bankDetailsId, userId, payload) {
        const bankDetails = await BankDetails_1.BankDetail.findOne({
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
    async deleteBankDetails(bankDetailsId, userId) {
        const bankDetails = await BankDetails_1.BankDetail.findOne({
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
exports.BankDetailsService = BankDetailsService;
