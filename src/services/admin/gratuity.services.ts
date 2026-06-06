import GratuityConfig from "../../models/GratuityConfig";
import { AppError } from "../../middleware/errorHandler";

const CONFIG_ID = "gratuity_config";

export class AdminGratuityService {

    // 🔹 Get current config (admin view)
    async getConfig() {
        return await GratuityConfig.findOne();
    }

    async createConfig(data: {
        isEnabled?: boolean;
        title?: string;
        description?: string;
        suggestedPercentages?: number[];
    }) {

        const existingConfig =
            await GratuityConfig.findOne();

        if (existingConfig) {
            throw new AppError(
                "Gratuity config already exists",
                400
            );
        }

        return await GratuityConfig.create(data);
    }

    // 🔹 Update config (admin only)
    async updateConfig(gratuityId: string, data: {
        isEnabled?: boolean;
        title?: string;
        description?: string;
        suggestedPercentages?: number[];
    }) {
        const config = await GratuityConfig.findByIdAndUpdate(
            gratuityId,
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
    async toggleGratuity(gratuityId: string, isEnabled: boolean) {
        return await GratuityConfig.findByIdAndUpdate(
            gratuityId,
            { $set: { isEnabled } },
            { new: true }
        );
    }
}