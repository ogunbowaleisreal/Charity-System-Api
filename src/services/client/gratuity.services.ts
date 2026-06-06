import GratuityConfig from "../../models/GratuityConfig";

const CONFIG_ID = "gratuity_config";

export class UserGratuityService {

    // 🔹 Get current gratuity settings for frontend
    async getCurrentGratuity() {
        let config = await GratuityConfig.findOne()
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
            } as any
        }

        return config;
    }
}