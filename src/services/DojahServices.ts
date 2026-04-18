import axios, { AxiosInstance } from "axios";

type VerificationStatus = "verified" | "failed";

export class DojahService {
    private client: AxiosInstance;

    constructor(private config: {
        appId: string;
        apiKey: string;
        baseUrl?: string;
    }) {
        this.client = axios.create({
            baseURL: config.baseUrl || "https://api.dojah.io",
            headers: {
                AppId: config.appId,
                Authorization: config.apiKey,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
    }



    // =========================
    // 🔹 BVN VALIDATION (WITH USER DATA MATCH)
    // =========================
    async validateBVN(data: {
        bvn: string;
        firstName: string;
        lastName: string;
        dob: string; // YYYY-MM-DD
    }): Promise<{
        status: VerificationStatus;
        data?: any;
    }> {
        try {
            const response = await this.client.get("/api/v1/kyc/bvn", {
                params: {
                    bvn: data.bvn,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    dob: data.dob,
                },
            });

            const entity = response.data?.entity;

            const isMatch =
                entity?.bvn?.status &&
                entity?.first_name?.status &&
                entity?.last_name?.status;

            return {
                status: isMatch ? "verified" : "failed",
                data: entity,
            };
        } catch {
            return { status: "failed" };
        }
    }

    async verifyBVN(bvn: string): Promise<{
        status: "verified" | "failed";
        data?: any;
    }> {
        try {
            const response = await this.client.get("/api/v1/kyc/bvn/full", {
                params: { bvn },
            });

            if (!response.data?.entity?.bvn) {
                return { status: "failed" };
            }

            return {
                status: "verified",
                data: response.data.entity,
            };
        } catch (error) {
            return { status: "failed" };
        }
    }



    // =========================
    // 🔹 FACE ↔ BVN VERIFICATION
    // =========================
    async verifyFaceWithBVN(data: {
        bvn: string;
        selfieBase64: string;
    }): Promise<{
        status: VerificationStatus;
        confidence?: number;
        data?: any;
    }> {
        try {
            const clean = this.stripBase64(data.selfieBase64);

            const response = await this.client.post(
                "/api/v1/kyc/bvn/verify",
                {
                    bvn: data.bvn,
                    selfie_image: clean,
                }
            );

            const result = response.data?.entity?.selfie_verification;

            const confidence = result?.confidence_value || 0;

            return {
                status: confidence >= 90 ? "verified" : "failed",
                confidence,
                data: response.data?.entity,
            };
        } catch {
            return { status: "failed" };
        }
    }

    // =========================
    // 🔹 LIVENESS DETECTION
    // =========================
    async verifyLiveness(selfieBase64: string): Promise<{
        status: VerificationStatus;
        confidence?: number;
        data?: any;
    }> {
        try {
            const clean = this.stripBase64(selfieBase64);

            const response = await this.client.post(
                "/api/v1/kyc/liveness",
                {
                    image: clean,
                }
            );

            const confidence = response.data?.entity?.confidence || 0;

            return {
                status: confidence >= 90 ? "verified" : "failed",
                confidence,
                data: response.data?.entity,
            };
        } catch {
            return { status: "failed" };
        }
    }

    // =========================
    // 🔹 CAC (RC NUMBER LOOKUP)
    // =========================
    async verifyCAC(rcNumber: string): Promise<{
        status: VerificationStatus;
        data?: any;
    }> {
        try {
            const response = await this.client.get("/api/v1/kyc/cac/basuc", {
                params: { rc_number: rcNumber, },
            });

            if (!response.data?.entity) {
                return { status: "failed" };
            }

            return {
                status: "verified",
                data: response.data.entity,
            };
        } catch {
            return { status: "failed" };
        }
    }

    // =========================
    // 🔹 UTILITY BILL OCR
    // =========================
    async verifyUtilityBill(base64: string): Promise<{
        status: VerificationStatus;
        data?: any;
    }> {
        try {
            const clean = this.stripBase64(base64);

            const response = await this.client.post(
                "/api/v1/kyc/document",
                {
                    document_type: "utility_bill",
                    document: clean,
                }
            );

            const extracted = response.data?.entity;

            return {
                status: extracted ? "verified" : "failed",
                data: extracted,
            };
        } catch {
            return { status: "failed" };
        }
    }

    // =========================
    // 🧹 HELPERS
    // =========================
    private stripBase64(base64: string): string {
        return base64.replace(/^data:image\/\w+;base64,/, "");
    }
}