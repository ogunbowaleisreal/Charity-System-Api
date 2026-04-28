import GratuityConfig from "../../models/GratuityConfig";
import { AppError } from "../../middleware/errorHandler";

const CONFIG_ID = "gratuity_config";

export class AdminGratuityService {

    // 🔹 Get current config (admin view)
    async getConfig() {
        return await GratuityConfig.findById(CONFIG_ID);
    }

    // 🔹 Update config (admin only)
    async updateConfig(data: {
        isEnabled?: boolean;
        title?: string;
        description?: string;
        suggestedPercentages?: number[];
    }) {
        const config = await GratuityConfig.findByIdAndUpdate(
            CONFIG_ID,
            {
                $set: data
            },
            {
                new: true,
                upsert: true
            }
        );

        if (!config) {
            throw new AppError("Failed to update gratuity config", 500);
        }

        return config;
    }

    // 🔹 Toggle only (useful for quick admin switch)
    async toggleGratuity(isEnabled: boolean) {
        return await GratuityConfig.findByIdAndUpdate(
            CONFIG_ID,
            { $set: { isEnabled } },
            { new: true }
        );
    }
}