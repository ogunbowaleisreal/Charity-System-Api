import { WalletTransaction } from "../../models/transaction";

export class WalletTransactionServices {

    async createWalletTransaction(WalletTransactionData: any) {
        try {
            const WalletTransactionInfo = await WalletTransaction.create(WalletTransactionData);
            return WalletTransactionInfo;
        } catch (error: any) {
            throw new Error(`Failed to create WalletTransaction: ${error.message}`);
        }
    }

    async getWalletTransaction(WalletTransactionId: string) {
        try {
            const WalletTransactionInfo = await WalletTransaction.findById(WalletTransactionId);
            return WalletTransactionInfo;
        } catch (error: any) {
            throw new Error(`Failed to get WalletTransaction: ${error.message}`);
        }
    }

    async getWalletTransactionHistory(clientId: string) {
        try {
            const WalletTransactionInfo = await WalletTransaction.find({ user: clientId });
            return WalletTransactionInfo;
        } catch (error: any) {
            throw new Error(`Failed to get WalletTransaction history: ${error.message}`);
        }
    }
}