import crypto from "crypto";

/**
 * Generates a secure webhook secret
 */
function generateWebhookSecret(length = 32): string {
    return crypto.randomBytes(length).toString("hex");
}

const secret = generateWebhookSecret();

console.log("🔐 Your webhook secret:");
console.log(secret);