// config/smileid.config.ts

export const SmileIdConfig = {
    // Found in the Smile ID portal side nav ("Partner ID")
    partnerId: process.env.SMILE_ID_PARTNER_ID as string,

    // Developer section of the Smile ID portal. Sandbox and production keys are different.
    apiKey: process.env.SMILE_ID_API_KEY as string,

    // '0' = sandbox, '1' = production. Kept as a string because that's what
    // the smile-identity-core SDK expects.
    sidServer: (process.env.SMILE_ID_ENV === "production" ? "1" : "0") as "0" | "1",

    // Where Smile ID will POST the async job result. Must be a publicly
    // reachable URL (no auth headers are sent by Smile ID on the callback).
    callbackUrl: process.env.SMILE_ID_CALLBACK_URL as string,
};