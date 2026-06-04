"use strict";
// scripts/syncBanks.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Banks_1 = require("../models/Banks");
const flutterwave_services_1 = require("../services/flutterwave.services");
const flutterwaveService = new flutterwave_services_1.FlutterwaveService();
async function syncBanks() {
    try {
        await mongoose_1.default.connect(process.env.ATLAS_DATABASE_URI);
        console.log("MongoDB connected");
        const banks = await flutterwaveService.getBanks();
        console.log(`Fetched ${banks.length} banks`);
        for (const bank of banks) {
            await Banks_1.Bank.findOneAndUpdate({
                code: bank.code,
            }, {
                name: bank.name,
                code: bank.code,
                //slug: bank.slug,
                //country: bank.country,
                //currency: bank.currency,
                //type: bank.type,
                isActive: true,
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            });
        }
        console.log("Bank sync completed");
        process.exit(0);
    }
    catch (error) {
        console.error("Bank sync failed:", error);
        process.exit(1);
    }
}
syncBanks();
