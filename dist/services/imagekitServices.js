"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageKitService = void 0;
const imagekit_1 = require("../config/imagekit");
class ImageKitService {
    async generateUploadSignatureWithDetails(folder, fileName) {
        const token = Date.now().toString();
        const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes instead of 1 hour
        const authParams = imagekit_1.imagekit.getAuthenticationParameters(token, expire);
        return {
            signature: authParams.signature,
            expire: authParams.expire,
            token: authParams.token,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            uploadOptions: {
                folder: `floatthr/${folder}`,
                fileName: fileName,
                useUniqueFileName: true,
                transformation: {
                    pre: this.getTransformationByFolder(folder),
                },
            },
        };
    }
    async generateUploadSignature() {
        const token = Date.now().toString();
        const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes instead of 1 hour
        const authParams = imagekit_1.imagekit.getAuthenticationParameters(token, expire);
        return {
            signature: authParams.signature,
            expire: authParams.expire,
            token: authParams.token,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        };
    }
    getTransformationByFolder(folder) {
        const transformations = {
            "vendor-logos": "w-200,h-200,c-maintain_ratio",
            "featured-images": "w-800,q-85",
            "portfolio-images": "w-800,q-80",
            "portfolio-videos": "",
            banners: "w-1200,q-90",
        };
        return transformations[folder] || "w-800,q-80";
    }
}
exports.ImageKitService = ImageKitService;
