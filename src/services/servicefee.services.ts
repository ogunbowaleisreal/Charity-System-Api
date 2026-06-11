import { ServiceFeeConfig } from "../models/ServiceFee";

export type ServiceFeeCategory =
    | "donation"
    | "withdrawal";

export class ServiceFeeService {

    /**
     * Get active fee config for a category
     */
    async getActiveFee(category: ServiceFeeCategory) {
        const config = await ServiceFeeConfig.findOne({
            category,
            isActive: true,
        });

        if (!config) {
            return {
                category,
                type: "percentage",
                value: 0,
            };
        }

        return config;
    }

    /**
     * Calculate fee automatically by category
     */
    async calculate(
        amount: number,
        category: ServiceFeeCategory
    ) {
        if (amount <= 0) {
            throw new Error("Invalid amount");
        }

        const config = await this.getActiveFee(category);

        let fee = 0;

        if (config.type === "percentage") {
            fee = (config.value / 100) * amount;
        }

        if (config.type === "flat") {
            fee = config.value;
        }

        if (fee > amount) {
            fee = amount;
        }

        const net = amount - fee;

        return {
            grossAmount: Number(amount.toFixed(2)),
            fee: Number(fee.toFixed(2)),
            netAmount: Number(net.toFixed(2)),
            feeType: config.type,
            feeValue: config.value,
            category,
        };
    }

    /**
     * Create or replace fee config
     */
    async updateServiceFee(
        category: ServiceFeeCategory,
        type: "percentage" | "flat",
        value: number,
        adminId: string
    ) {
        await ServiceFeeConfig.updateMany(
            {
                category,
                isActive: true,
            },
            {
                isActive: false,
            }
        );

        return ServiceFeeConfig.create({
            category,
            type,
            value,
            isActive: true,
            createdBy: adminId,
        });
    }

    /**
     * Get donation fee
     */
    async getDonationFee() {
        return this.getActiveFee("donation");
    }

    /**
     * Get withdrawal fee
     */
    async getWithdrawalFee() {
        return this.getActiveFee("withdrawal");
    }

    /**
     * Calculate donation fee
     */
    async calculateDonationFee(amount: number) {
        return this.calculate(amount, "donation");
    }

    /**
     * Calculate withdrawal fee
     */
    async calculateWithdrawalFee(amount: number) {
        return this.calculate(amount, "withdrawal");
    }
}

export default new ServiceFeeService();
// import { ServiceFeeConfig } from "../models/ServiceFee";
// export class ServiceFeeService {
//     async getActiveFee() {
//         const config = await ServiceFeeConfig.findOne({ isActive: true });

//         if (!config) {
//             return {
//                 type: "percentage",
//                 value: 0,
//             };
//         }

//         return config;
//     }

//     calculate(amount: number, config: { type: string; value: number }) {
//         if (amount <= 0) {
//             throw new Error("Invalid amount");
//         }

//         let fee = 0;

//         if (config.type === "percentage") {
//             fee = (config.value / 100) * amount;
//         }

//         if (config.type === "flat") {
//             fee = config.value;
//         }

//         // ⚠️ Prevent invalid cases
//         if (fee > amount) {
//             fee = amount; // clamp (or throw error depending on your policy)
//         }

//         const net = amount - fee;

//         return {
//             grossAmount: Number(amount.toFixed(2)), // what donor sees
//             fee: Number(fee.toFixed(2)),            // hidden platform cut
//             netAmount: Number(net.toFixed(2)),      // what org receives
//             feeType: config.type,
//             feeValue: config.value,
//         };
//     }
//     async updateServiceFee(type: "percentage" | "flat", value: number, adminId: string) {
//         await ServiceFeeConfig.updateMany(
//             { isActive: true },
//             {
//                 isActive: false,
//                 effectiveTo: new Date(),
//             }
//         );

//         return ServiceFeeConfig.create({
//             type,
//             value,
//             isActive: true,
//             effectiveFrom: new Date(),
//             createdBy: adminId,
//         });
//     }
// }