"use strict";
// ZeehKycService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeehKycService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class ZeehKycService {
    constructor(apiKey, baseUrl, webhookSecret // 🔐 for signature verification
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.webhookSecret = webhookSecret;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                Secret_key: this.apiKey,
                "Content-Type": "application/json",
            },
        });
    }
    // 🔹 BVN
    async verifyBVN(bvn) {
        try {
            console.log(this.apiKey, this.baseUrl);
            const response = await this.client.post("/nigeria_kyc/lookup_bvn" /*_basic_igree"*/, { bvn });
            return response.data;
        }
        catch (error) {
            console.log(error);
            this.handleError("BVN Verification", error);
        }
    }
    // 🔹 Face
    async verifyFace(imageUrl, bvn) {
        try {
            const response = await this.client.post("/nigeria_kyc/lookup_bvn_with_face", {
                imageUrl: imageUrl,
                bvn
            });
            if (response.data.error)
                throw new Error(response.data.error);
            return response.data;
        }
        catch (error) {
            this.handleError("Face Verification", error);
        }
    }
    // 🔹 CAC
    async verifyCAC(rcNumber) {
        try {
            const response = await this.client.post("/kyb/cac", {
                rc_number: rcNumber,
            });
            return response.data;
        }
        catch (error) {
            this.handleError("CAC Verification", error);
        }
    }
    // 🔹 Utility Bill
    async verifyUtilityBill(documentBase64) {
        try {
            const response = await this.client.post("/kyc/document", {
                document: this.stripBase64(documentBase64),
                type: "utility_bill",
            });
            return response.data;
        }
        catch (error) {
            this.handleError("Utility Bill Verification", error);
        }
    }
    // =========================================================
    // 🔐 WEBHOOK SIGNATURE VERIFICATION (CRITICAL)
    // =========================================================
    verifyWebhookSignature(payload, signature) {
        /**
         * Most providers use HMAC SHA256
         * signature = HMAC(secret, rawBody)
         */
        const expectedSignature = crypto_1.default
            .createHmac("sha256", this.webhookSecret)
            .update(payload)
            .digest("hex");
        return crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    }
    // =========================================================
    // 📩 WEBHOOK HANDLER (YOU IMPLEMENT LOGIC)
    // =========================================================
    async handleWebhook(payload) {
        /**
         * You will:
         * - switch(event)
         * - update DB
         * - mark KYC status
         */
        switch (payload.event) {
            case "kyc.success":
                break;
            case "kyc.failed":
                break;
            case "face.verification.completed":
                break;
            case "document.verification.completed":
                break;
            default:
                break;
        }
        // 👉 YOU implement logic here
    }
    // =========================================================
    // 🔧 HELPERS
    // =========================================================
    stripBase64(base64) {
        return base64.replace(/^data:image\/\w+;base64,/, "");
    }
    // private handleError(context: string, error: any): never {
    //     console.error(`${context} Error:`, error?.response?.data || error.message);
    //     throw new Error(`${context} failed`);
    // }
    handleError(context, error) {
        const detail = error?.response?.data || error?.message || "Unknown error";
        console.error(`${context} Error:`, detail);
        throw new Error(`${context} failed: ${JSON.stringify(detail)}`);
    }
}
exports.ZeehKycService = ZeehKycService;
