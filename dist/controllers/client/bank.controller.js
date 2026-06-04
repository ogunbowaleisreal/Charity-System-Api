"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankController = void 0;
const Banks_1 = require("../../models/Banks");
const helpers_1 = require("../../utils/helpers");
class BankController {
    async getBanks(req, res) {
        const banks = await Banks_1.Bank.find({
            isActive: true,
        })
            .sort({ name: 1 })
            .select("name code");
        return (0, helpers_1.sendSuccessResponse)(res, banks, "Banks fetched successfully");
    }
}
exports.BankController = BankController;
