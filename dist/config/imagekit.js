"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImagekitWebhook = exports.getImagekitSignature = exports.imagekitConfig = exports.imagekit = void 0;
const imagekit_1 = __importDefault(require("imagekit"));
const imagekitConfig = {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
    uploadFolders: {
        logos: "vendor-logos",
        featured: "featured-images",
        portfolio: "portfolio-images",
        banners: "wedding-banners",
        profiles: "profile-pictures",
    },
};
exports.imagekitConfig = imagekitConfig;
exports.imagekit = new imagekit_1.default({
    publicKey: imagekitConfig.publicKey,
    privateKey: imagekitConfig.privateKey,
    urlEndpoint: imagekitConfig.urlEndpoint,
});
const getImagekitSignature = (token, expire) => {
    return exports.imagekit.getAuthenticationParameters(token, expire);
};
exports.getImagekitSignature = getImagekitSignature;
const validateImagekitWebhook = (body, signature) => {
    // Implement webhook signature validation
    const calculatedSignature = exports.imagekit.getAuthenticationParameters(JSON.stringify(body), Date.now() + 3600).signature;
    return calculatedSignature === signature;
};
exports.validateImagekitWebhook = validateImagekitWebhook;
