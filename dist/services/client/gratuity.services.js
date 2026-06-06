"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGratuityService = void 0;
const GratuityConfig_1 = __importDefault(require("../../models/GratuityConfig"));
const CONFIG_ID = "gratuity_config";
class UserGratuityService {
    // 🔹 Get current gratuity settings for frontend
    async getCurrentGratuity() {
        let config = await GratuityConfig_1.default.findOne()
            .select("isEnabled title description suggestedPercentages");
        // 🔒 fallback if not initialized
        if (!config) {
            // config = await GratuityConfig.create({
            //     _id: CONFIG_ID,
            //     isEnabled: false,
            //     title: "Support the platform",
            //     suggestedPercentages: [5, 10, 15]
            // });
            config = {
                "message": "Gratuity config not initialized",
                "isEnabled": false,
            };
        }
        return config;
    }
}
exports.UserGratuityService = UserGratuityService;
