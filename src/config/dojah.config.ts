// config/dojah.config.ts
export const dojahConfig = {
    appId: process.env.DOJAH_APP_ID!,
    apiKey: process.env.DOJAH_SECRET_KEY!,
    baseUrl: process.env.DOJAH_BASE_URL || "https://api.dojah.io",
};