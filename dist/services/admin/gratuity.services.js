"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGratuityService = void 0;
const GratuityConfig_1 = __importDefault(require("../../models/GratuityConfig"));
const errorHandler_1 = require("../../middleware/errorHandler");
const CONFIG_ID = "gratuity_config";
class AdminGratuityService {
    // 🔹 Get current config (admin view)
    async getConfig() {
        return await GratuityConfig_1.default.findById(CONFIG_ID);
    }
    // 🔹 Update config (admin only)
    async updateConfig(data) {
        const config = await GratuityConfig_1.default.findByIdAndUpdate(CONFIG_ID, {
            $set: data
        }, {
            new: true,
            upsert: true
        });
        if (!config) {
            throw new errorHandler_1.AppError("Failed to update gratuity config", 500);
        }
        return config;
    }
    // 🔹 Toggle only (useful for quick admin switch)
    async toggleGratuity(isEnabled) {
        return await GratuityConfig_1.default.findByIdAndUpdate(CONFIG_ID, { $set: { isEnabled } }, { new: true });
    }
}
exports.AdminGratuityService = AdminGratuityService;
