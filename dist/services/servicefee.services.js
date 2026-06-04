"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeService = void 0;
const ServiceFee_1 = require("../models/ServiceFee");
class ServiceFeeService {
    async getActiveFee() {
        const config = await ServiceFee_1.ServiceFeeConfig.findOne({ isActive: true });
        if (!config) {
            return {
                type: "percentage",
                value: 0,
            };
        }
        return config;
    }
    calculate(amount, config) {
        if (amount <= 0) {
            throw new Error("Invalid amount");
        }
        let fee = 0;
        if (config.type === "percentage") {
            fee = (config.value / 100) * amount;
        }
        if (config.type === "flat") {
            fee = config.value;
        }
        // ⚠️ Prevent invalid cases
        if (fee > amount) {
            fee = amount; // clamp (or throw error depending on your policy)
        }
        const net = amount - fee;
        return {
            grossAmount: Number(amount.toFixed(2)), // what donor sees
            fee: Number(fee.toFixed(2)), // hidden platform cut
            netAmount: Number(net.toFixed(2)), // what org receives
            feeType: config.type,
            feeValue: config.value,
        };
    }
    async updateServiceFee(type, value, adminId) {
        await ServiceFee_1.ServiceFeeConfig.updateMany({ isActive: true }, {
            isActive: false,
            effectiveTo: new Date(),
        });
        return ServiceFee_1.ServiceFeeConfig.create({
            type,
            value,
            isActive: true,
            effectiveFrom: new Date(),
            createdBy: adminId,
        });
    }
}
exports.ServiceFeeService = ServiceFeeService;
