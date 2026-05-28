// scripts/syncBanks.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Bank } from "../models/Banks";
import { FlutterwaveService } from "../services/flutterwave.services";



const flutterwaveService = new FlutterwaveService();

async function syncBanks() {
    try {
        await mongoose.connect(process.env.ATLAS_DATABASE_URI!);

        console.log("MongoDB connected");

        const banks = await flutterwaveService.getBanks();

        console.log(`Fetched ${banks.length} banks`);

        for (const bank of banks) {
            await Bank.findOneAndUpdate(
                {
                    code: bank.code,
                },
                {
                    name: bank.name,
                    code: bank.code,
                    //slug: bank.slug,
                    //country: bank.country,
                    //currency: bank.currency,
                    //type: bank.type,
                    isActive: true,
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            );
        }

        console.log("Bank sync completed");

        process.exit(0);
    } catch (error) {
        console.error("Bank sync failed:", error);

        process.exit(1);
    }
}

syncBanks();