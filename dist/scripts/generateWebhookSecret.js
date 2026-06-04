"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a secure webhook secret
 */
function generateWebhookSecret(length = 32) {
    return crypto_1.default.randomBytes(length).toString("hex");
}
const secret = generateWebhookSecret();
console.log("🔐 Your webhook secret:");
console.log(secret);
