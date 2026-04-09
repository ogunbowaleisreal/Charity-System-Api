import { Account } from "../../models/Accounts";


export class AccountServices {

    async getAllAccounts() {
        const accounts = await Account.find({})
        if (accounts) {
            return accounts
        }
        throw new Error("Accounts not found")
    }

    async getAccount(accountId: string) {
        const account = await Account.findById(accountId).select("-password")
        if (account) {
            return account
        }
        throw new Error("Account not found")
    }
    // async getClientAccount(clientId: string) {
    //     const clientAccount = await Account.findById(clientId).select("-password")
    //     if (clientAccount) {
    //         return clientAccount
    //     }
    //     return null
    // }

    // async getConsultantAccount(consultantId: string) {
    //     const clientAccount = await Account.findById(consultantId).select("-password")
    //     if (clientAccount) {
    //         return clientAccount
    //     }
    //     return null
    // }
}