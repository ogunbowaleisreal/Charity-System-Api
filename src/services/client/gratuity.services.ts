import GratuityConfig from "../../models/GratuityConfig";

const CONFIG_ID = "gratuity_config";

export class UserGratuityService {

    // 🔹 Get current gratuity settings for frontend
    async getCurrentGratuity() {
        let config = await GratuityConfig.findById(CONFIG_ID)
            .select("isEnabled title description suggestedPercentages");

        // 🔒 fallback if not initialized
        if (!config) {
            config = await GratuityConfig.create({
                _id: CONFIG_ID,
                isEnabled: false,
                title: "Support the platform",
                suggestedPercentages: [5, 10, 15]
            });
        }

        return config;
    }
}