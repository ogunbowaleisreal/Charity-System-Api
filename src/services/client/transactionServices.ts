import transaction from "../../models/transaction";

export class transactionServices {

    async createTransaction(transactionData: any) {
        try {
            const transactionInfo = await transaction.create(transactionData);
            return transaction;
        } catch (error: any) {
            throw new Error(`Failed to create transaction: ${error.message}`);
        }
    }

    async getTransaction(transactionId: string) {
        try {
            const transactionInfo = await transaction.findById(transactionId);
            return transactionInfo;
        } catch (error: any) {
            throw new Error(`Failed to get transaction: ${error.message}`);
        }
    }

    async getTransactionHistory(clientId: string) {
        try {
            const transactionInfo = await transaction.find({ user: clientId });
            return transactionInfo;
        } catch (error: any) {
            throw new Error(`Failed to get transaction history: ${error.message}`);
        }
    }
}