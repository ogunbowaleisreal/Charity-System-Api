// ZeehKycService.ts

import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { IKycProvider } from "../types/zeeh.types";
import {
    ZeehBvnResponse,
    ZeehFaceResponse,
    ZeehCacResponse,
    ZeehUtilityBillResponse,
    ZeehWebhookPayload,
} from "../types/zeeh.types";

export class ZeehKycService implements IKycProvider {
    private client: AxiosInstance;

    constructor(
        private apiKey: string,
        private baseUrl: string,
        private webhookSecret: string // 🔐 for signature verification
    ) {
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Secret_key: this.apiKey,
                "Content-Type": "application/json",
            },
        });
    }

    // 🔹 BVN
    async verifyBVN(bvn: string): Promise<ZeehBvnResponse> {
        try {
            console.log(this.apiKey, this.baseUrl)
            const response = await this.client.post("/nigeria_kyc/lookup_bvn" /*_basic_igree"*/, { bvn });
            return response.data;
        } catch (error) {
            console.log(error)
            this.handleError("BVN Verification", error);
        }
    }

    // 🔹 Face
    async verifyFace(imageUrl: string, bvn: string): Promise<ZeehFaceResponse> {
        try {
            const response = await this.client.post("/nigeria_kyc/lookup_bvn_with_face", {
                imageUrl: imageUrl,
                bvn
            });
            if (response.data.error) throw new Error(response.data.error)
            return response.data;
        } catch (error) {
            this.handleError("Face Verification", error);
        }
    }

    // 🔹 CAC
    async verifyCAC(rcNumber: string): Promise<ZeehCacResponse> {
        try {
            const response = await this.client.post("/kyb/cac", {
                rc_number: rcNumber,
            });
            return response.data;
        } catch (error) {
            this.handleError("CAC Verification", error);
        }
    }

    // 🔹 Utility Bill
    async verifyUtilityBill(
        documentBase64: string
    ): Promise<ZeehUtilityBillResponse> {
        try {
            const response = await this.client.post("/kyc/document", {
                document: this.stripBase64(documentBase64),
                type: "utility_bill",
            });
            return response.data;
        } catch (error) {
            this.handleError("Utility Bill Verification", error);
        }
    }

    // =========================================================
    // 🔐 WEBHOOK SIGNATURE VERIFICATION (CRITICAL)
    // =========================================================

    verifyWebhookSignature(payload: string, signature: string): boolean {
        /**
         * Most providers use HMAC SHA256
         * signature = HMAC(secret, rawBody)
         */

        const expectedSignature = crypto
            .createHmac("sha256", this.webhookSecret)
            .update(payload)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    }

    // =========================================================
    // 📩 WEBHOOK HANDLER (YOU IMPLEMENT LOGIC)
    // =========================================================

    async handleWebhook(payload: ZeehWebhookPayload): Promise<void> {
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

    private stripBase64(base64: string): string {
        return base64.replace(/^data:image\/\w+;base64,/, "");
    }

    // private handleError(context: string, error: any): never {
    //     console.error(`${context} Error:`, error?.response?.data || error.message);
    //     throw new Error(`${context} failed`);
    // }

    private handleError(context: string, error: any): never {
        const detail = error?.response?.data || error?.message || "Unknown error";
        console.error(`${context} Error:`, detail);
        throw new Error(`${context} failed: ${JSON.stringify(detail)}`);
    }
}