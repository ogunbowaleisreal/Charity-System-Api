"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountServices = void 0;
const Accounts_1 = require("../../models/Accounts");
class AccountServices {
    async getAllAccounts() {
        const accounts = await Accounts_1.Account.find({});
        if (accounts) {
            return accounts;
        }
        throw new Error("Accounts not found");
    }
    async getAccount(accountId) {
        const account = await Accounts_1.Account.findById(accountId).select("-password");
        if (account) {
            return account;
        }
        throw new Error("Account not found");
    }
}
exports.AccountServices = AccountServices;
