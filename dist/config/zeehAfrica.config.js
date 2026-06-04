"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeehConfig = void 0;
// config/zeehAfrica.config.ts
exports.ZeehConfig = {
    appId: process.env.ZEEH_APP_ID,
    apiKey: process.env.ZEEH_SECRET_KEY,
    baseUrl: process.env.ZEEH_BASE_URL || "https://sandbox.api.zeeh.africa/",
    webhookSecret: process.env.ZEEH_WEBHOOK_SECRET || "",
};
