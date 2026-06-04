"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dojahConfig = void 0;
// config/dojah.config.ts
exports.dojahConfig = {
    appId: process.env.DOJAH_APP_ID,
    apiKey: process.env.DOJAH_SECRET_KEY,
    baseUrl: process.env.DOJAH_BASE_URL || "https://api.dojah.io",
};
