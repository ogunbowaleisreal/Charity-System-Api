import "dotenv/config";
import mongoose from "mongoose";

import { CampaignCategory } from "../../src/models/campaignCategory";

const databaseUrl = process.env.ATLAS_DATABASE_URI;

if (!databaseUrl) {
    throw new Error("ATLAS_DATABASE_URL is not defined");
}

const seed = async () => {
    try {
        await mongoose.connect(databaseUrl);

        console.log("Connected to MongoDB");

        const existingCategory = await CampaignCategory.findOne({
            categoryName: "General",
        });

        if (existingCategory) {
            console.log('Category "General" already exists. Skipping...');
            return;
        }

        await CampaignCategory.create({
            categoryName: "General",
            description: "General campaign category",
            status: "active",
            listingCount: 0,
            isDeleted: false,
        });

        console.log('Created category: "General"');
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

seed();