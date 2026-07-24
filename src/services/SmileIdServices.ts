import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SmileIdentityCore = require("smile-identity-core");
// npm install smile-identity-core
// This package ships without its own TypeScript types, hence the require() + local interfaces below.

const { IDApi, WebApi, Utilities, Signature } = SmileIdentityCore;

type VerificationStatus = "verified" | "failed" | "pending" | "error";

export interface ValidateBVNPayload {
    bvn: string;
    firstName: string;
    lastName: string;
    dob: string; // yyyy-mm-dd
    phoneNumber?: string;
}

export interface ValidateBVNResult {
    status: VerificationStatus; // "pending"/"error" only really apply to the request-failed case here — this call is otherwise synchronous
    jobId: string;
    userId: string;
    resultCode?: string;
    resultText?: string; // "ID Number Validated" / "Exact Match" / "Partial Match" / "No Match" etc.
    // Raw field-by-field comparison as returned by Smile ID (e.g. Names: "Exact Match",
    // DOB: "Exact Match", Verify_ID_Number: "Verified"). Shape can vary slightly by
    // ID authority, so it's passed through rather than flattened.
    actions?: Record<string, string>;
    data?: {
        fullName?: string;
        dateOfBirth?: string;
        phoneNumber?: string;
        photo?: string;
    };
}

export interface MatchFaceWithBVNPayload {
    bvn: string;
    selfieBase64: string;
    livenessImagesBase64?: string[];
}

export interface FaceMatchResult {
    status: VerificationStatus;
    jobId: string;
    userId: string;
    confidence?: number;
    resultCode?: string;
    resultText?: string;
    actions?: Record<string, string>;
}

export interface BusinessVerificationPayload {
    country: string;
    idType: "BUSINESS_REGISTRATION" | "TAX_INFORMATION" | "BASIC_BUSINESS_REGISTRATION";
    idNumber: string;
    businessType?: "bn" | "co" | "it"; // required for BUSINESS_REGISTRATION / BASIC_BUSINESS_REGISTRATION in Nigeria
    jobId: string;
    userId: string;
}

export interface BusinessVerificationResult {
    status: "verified" | "failed";
    resultCode?: string;
    resultText?: string;
    data?: {
        companyType?: string;
        country?: string;
        address?: string;
        registrationNumber?: string;
        legalName?: string;
        state?: string;
        status?: string;
        directors?: any[];
        beneficialOwners?: any[];
    };
}

// Shape of the JSON Smile ID POSTs to your callback_url for Biometric KYC.
// (Enhanced/Basic KYC via job_type 5 with no image does NOT go through a
// webhook — its result comes back directly from submit_job.)
export interface SmileWebhookPayload {
    SmileJobID: string;
    PartnerParams: {
        user_id: string;
        job_id: string;
        job_type: number;
        [key: string]: any;
    };
    ResultCode: string;
    ResultText: string;
    IsFinalResult?: string;
    Actions?: Record<string, string>;
    ConfidenceValue?: string;
    signature: string;
    timestamp: string;
    [key: string]: any;
}

export class SmileIDService {
    private idApi: any;
    private webApi: any;
    private utilities: any;
    private signature: any;

    constructor(
        private config: {
            partnerId: string;
            apiKey: string;
            sidServer: "0" | "1"; // '0' sandbox, '1' production
            callbackUrl: string;
        }
    ) {
        this.idApi = new IDApi(config.partnerId, config.apiKey, config.sidServer);
        this.webApi = new WebApi(config.partnerId, config.callbackUrl, config.apiKey, config.sidServer);
        this.utilities = new Utilities(config.partnerId, config.apiKey, config.sidServer);
        this.signature = new Signature(config.partnerId, config.apiKey);
    }

    // =========================================================================
    // 🔹 VALIDATE BVN — Enhanced/Basic KYC, job_type 5, NO images
    // =========================================================================
    // Takes a BVN plus the personal data you hold on the user, and asks Smile ID
    // to check that data against the BVN authority's record.
    //
    // Unlike every other product in this file, THIS ONE IS SYNCHRONOUS: since no
    // selfie/liveness image is attached, Smile ID's classic REST API (the one
    // this SDK talks to) returns the final match result directly in the
    // response — no callback_url/webhook round trip needed. That's confirmed
    // by Smile ID's own SDK docs ("the response is immediate, so there is no
    // need to query the job_status... no images are required").
    //
    // Depending on the ID authority, the response comes back shaped either as
    // Enhanced KYC (returns the actual name/dob/phone on file, plus
    // Verify_ID_Number: "Verified"/"Not Verified") or as Basic KYC (returns
    // only per-field match verdicts like Names: "Exact Match" / "Partial
    // Match" / "No Match", no underlying data). Both are handled below.
    async validateBVN(payload: ValidateBVNPayload, jobId: string, userId: string): Promise<ValidateBVNResult> {
        const partner_params = {
            job_id: jobId,
            user_id: userId,
            job_type: 5,
        };

        const id_info = {
            first_name: payload.firstName,
            last_name: payload.lastName,
            country: "NG",
            id_type: "BVN",
            id_number: payload.bvn,
            dob: payload.dob,
            phone_number: payload.phoneNumber,
        };

        const options = {
            signature: true,
        };

        try {
            const result = await this.idApi.submit_job(partner_params, id_info, options);

            const actions: Record<string, string> = result?.Actions || {};

            // Enhanced-KYC-shaped success: Verify_ID_Number is explicitly "Verified".
            // Basic-KYC-shaped success: ResultText/ResultCode say "Exact Match" (1020).
            // Treat a "Partial Match" (1021) as NOT verified — you may want to route
            // that to manual review instead of outright rejecting; adjust to taste.
            const isVerified =
                actions.Verify_ID_Number === "Verified" ||
                result?.ResultCode === "1020" ||
                result?.ResultText === "Exact Match";

            if (!isVerified) {
                return {
                    status: "failed",
                    jobId,
                    userId,
                    resultCode: result?.ResultCode,
                    resultText: result?.ResultText,
                    actions,
                };
            }

            return {
                status: "verified",
                jobId,
                userId,
                resultCode: result?.ResultCode,
                resultText: result?.ResultText,
                actions,
                data: {
                    fullName: result?.FullName,
                    dateOfBirth: result?.DOB,
                    phoneNumber: result?.PhoneNumber1 || result?.PhoneNumber,
                    photo: result?.Photo,
                },
            };
        } catch (error) {
            return { status: "error", jobId, userId };
        }
    }

    // =========================================================================
    // 🔹 MATCH FACE WITH BVN — Biometric KYC, job_type 1
    // =========================================================================
    // Takes just a BVN and a selfie (Nigeria's BVN lookup only requires the
    // id_number — no name/dob needed here), and asks Smile ID to match the
    // selfie against the BVN's photo on file.
    //
    // This one IS genuinely asynchronous: Smile ID may need human review
    // before giving a final verdict, so the authoritative result arrives via
    // your callback_url (see handleFaceWebhook in KYCService). `return_job_status`
    // below asks for a best-effort same-request read, which is often final for
    // clear-cut cases, but is not guaranteed to be — treat "pending" as "wait
    // for the webhook," not as an error.
    async matchFaceWithBVN(payload: MatchFaceWithBVNPayload, jobId: string, userId: string): Promise<FaceMatchResult> {
        const partner_params = {
            job_id: jobId,
            user_id: userId,
            job_type: 1,
        };

        const id_info = {
            country: "NG",
            id_type: "BVN",
            id_number: payload.bvn,
        };

        const image_details = this.buildSelfieImageDetails(payload);

        const options = {
            signature: true,
            return_job_status: true,
        };

        try {
            const result = await this.webApi.submit_job(partner_params, image_details, id_info, options);
            return this.parseFaceMatchResult(result, jobId, userId);
        } catch (error) {
            return { status: "error", jobId, userId };
        }
    }

    private buildSelfieImageDetails(payload: MatchFaceWithBVNPayload) {
        // image_type_id 2 = selfie (base64), 3 = liveness image (base64).
        const images: Array<{ image_type_id: number; image: string }> = [
            { image_type_id: 2, image: this.stripBase64(payload.selfieBase64) },
        ];

        for (const liveness of payload.livenessImagesBase64 || []) {
            images.push({ image_type_id: 3, image: this.stripBase64(liveness) });
        }

        return images;
    }

    private parseFaceMatchResult(result: any, jobId: string, userId: string): FaceMatchResult {
        const actions: Record<string, string> = result?.Actions || {};
        const confidence = Number(result?.ConfidenceValue) || 0;
        const isFinal = result?.IsFinalResult === "true";

        // NOTE: verify this against a real sandbox response before shipping —
        // Verify_ID_Number covers the BVN lookup half; the selfie-match half is
        // typically reflected in the confidence score and/or a
        // Human_Review_Compare / Update_Registered_Selfie_On_File action
        // depending on whether it needed manual review. Confirm the exact
        // combination Smile ID returns for job_type 1 with BVN in your sandbox.
        const isVerified = isFinal && actions.Verify_ID_Number === "Verified" && confidence >= 90;

        if (!isFinal) {
            return {
                status: "pending",
                jobId,
                userId,
                confidence,
                resultCode: result?.ResultCode,
                resultText: result?.ResultText,
                actions,
            };
        }

        return {
            status: isVerified ? "verified" : "failed",
            jobId,
            userId,
            confidence,
            resultCode: result?.ResultCode,
            resultText: result?.ResultText,
            actions,
        };
    }

    // =========================================================================
    // 🔹 BUSINESS VERIFICATION (KYB / CAC) — job_type 7
    // =========================================================================
    // Has a genuine synchronous REST endpoint (no callback_url = sync), so this
    // returns a FINAL result directly — same shape of behaviour as the old
    // Dojah verifyCAC.
    async submitBusinessVerification(payload: BusinessVerificationPayload): Promise<BusinessVerificationResult> {
        const partner_params = {
            job_id: payload.jobId,
            user_id: payload.userId,
            job_type: 7,
        };

        const id_info: Record<string, any> = {
            country: payload.country,
            id_type: payload.idType,
            id_number: payload.idNumber,
        };

        if (payload.businessType) {
            id_info.business_type = payload.businessType;
        }

        const options = { signature: true };

        try {
            const result = await this.idApi.submit_job(partner_params, id_info, options);

            const isVerified = result?.Actions?.Verify_Business === "Verified";

            if (!isVerified) {
                return {
                    status: "failed",
                    resultCode: result?.ResultCode,
                    resultText: result?.ResultText,
                };
            }

            const info = result?.company_information || {};

            return {
                status: "verified",
                resultCode: result?.ResultCode,
                resultText: result?.ResultText,
                data: {
                    companyType: info.company_type,
                    country: info.country,
                    address: info.address,
                    registrationNumber: info.registration_number,
                    legalName: info.legal_name,
                    state: info.state,
                    status: info.status,
                    directors: result?.directors,
                    beneficialOwners: result?.beneficial_owners,
                },
            };
        } catch (error) {
            return { status: "failed" };
        }
    }

    // =========================
    // 🔹 JOB STATUS (manual reconciliation — e.g. an admin "recheck" button,
    // or a fallback sweep for webhooks that never arrived)
    // =========================
    async getJobStatus(userId: string, jobId: string) {
        const partner_params = {
            user_id: userId,
            job_id: jobId,
            job_type: 1,
        };

        const options = {
            return_history: false,
            return_image_links: false,
        };

        try {
            return await this.utilities.get_job_status(partner_params, options);
        } catch (error) {
            return null;
        }
    }

    // =========================
    // 🔹 WEBHOOK SIGNATURE VERIFICATION
    // Confirms a callback claiming to be from Smile ID actually is, before you
    // trust it and update a KYC record. Only relevant for matchFaceWithBVN —
    // validateBVN never triggers a webhook.
    // =========================
    verifyWebhookSignature(timestamp: string, signature: string): boolean {
        try {
            return this.signature.confirm_signature(timestamp, signature) === true;
        } catch (error) {
            return false;
        }
    }

    // =========================
    // 🧹 HELPERS
    // =========================
    async imageUrlToBase64(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(response.data, "binary").toString("base64");
    }

    private stripBase64(base64: string): string {
        return base64.replace(/^data:image\/\w+;base64,/, "");
    }
}





















// import axios from "axios";
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const SmileIdentityCore = require("smile-identity-core");
// // npm install smile-identity-core
// // This package ships without its own TypeScript types, hence the require() + local interfaces below.

// const { IDApi, WebApi, Utilities, Signature } = SmileIdentityCore;

// type VerificationStatus = "verified" | "failed" | "pending" | "error";

// // =========================================================================
// // IMPORTANT ARCHITECTURAL NOTE (read before wiring this into KYCService)
// // =========================================================================
// // Smile ID's identity products (Enhanced KYC, SmartSelfie Registration/Auth,
// // Biometric KYC) are ASYNCHRONOUS. Submitting a job gets you an accepted
// // job_id/user_id immediately, but the actual verified/failed verdict is
// // delivered later to your `callback_url` as a webhook POST.
// //
// // The `return_job_status` option below asks Smile ID to also try to hand
// // back a same-request result, but per Smile ID's own docs this may NOT be
// // final if the job needs human review — so it's treated here as
// // informative only. The webhook (see handle*Webhook in KYCService) is the
// // source of truth for updating KYC records.
// //
// // Business Verification (KYB) is the exception: it has a genuinely
// // synchronous REST endpoint (no callback_url = sync), so submitBusinessVerification
// // below returns a final result directly, same as the old Dojah verifyCAC.
// //
// // Also note: SmartSelfie Registration/Authentication compares a selfie
// // against a selfie *you previously registered with Smile ID for that
// // user_id* — NOT against the official BVN/ID-authority photo. Dojah's
// // verifyFaceWithBVN compared the selfie directly to the BVN record photo.
// // If you need a selfie-vs-BVN-photo comparison in one shot, that's Smile
// // ID's "Biometric KYC" product (job_type 1) instead — ask if you want that
// // swapped in; you said to keep BVN + face as two separate steps for now.
// // =========================================================================

// export interface EnhancedKYCPayload {
//     bvn: string;
//     firstName: string;
//     lastName: string;
//     dob: string; // yyyy-mm-dd
//     phoneNumber?: string;
// }

// export interface EnhancedKYCResult {
//     status: VerificationStatus;
//     jobId: string;
//     userId: string;
//     resultCode?: string;
//     resultText?: string;
//     data?: {
//         firstName?: string;
//         lastName?: string;
//         fullName?: string;
//         dateOfBirth?: string;
//         phoneNumber?: string;
//         photo?: string;
//     };
// }

// export interface SmartSelfiePayload {
//     userId: string;
//     jobId: string;
//     selfieBase64: string;
//     livenessImagesBase64?: string[];
// }

// export interface SmartSelfieResult {
//     status: VerificationStatus;
//     jobId: string;
//     userId: string;
//     confidence?: number;
//     resultCode?: string;
//     resultText?: string;
// }

// export interface BusinessVerificationPayload {
//     country: string;
//     idType: "BUSINESS_REGISTRATION" | "TAX_INFORMATION" | "BASIC_BUSINESS_REGISTRATION";
//     idNumber: string;
//     businessType?: "bn" | "co" | "it"; // required for BUSINESS_REGISTRATION / BASIC_BUSINESS_REGISTRATION in Nigeria
//     jobId: string;
//     userId: string;
// }

// export interface BusinessVerificationResult {
//     status: "verified" | "failed";
//     resultCode?: string;
//     resultText?: string;
//     data?: {
//         companyType?: string;
//         country?: string;
//         address?: string;
//         registrationNumber?: string;
//         legalName?: string;
//         state?: string;
//         status?: string;
//         directors?: any[];
//         beneficialOwners?: any[];
//     };
// }

// // Shape of the JSON Smile ID POSTs to your callback_url. Field presence
// // varies slightly by job type — treat unlisted fields defensively.
// export interface SmileWebhookPayload {
//     SmileJobID: string;
//     PartnerParams: {
//         user_id: string;
//         job_id: string;
//         job_type: number;
//         [key: string]: any;
//     };
//     ResultCode: string;
//     ResultText: string;
//     IsFinalResult?: string;
//     Actions?: Record<string, string>;
//     ConfidenceValue?: string;
//     FullName?: string;
//     DOB?: string;
//     PhoneNumber1?: string;
//     Photo?: string;
//     signature: string;
//     timestamp: string;
//     [key: string]: any;
// }

// export class SmileIDService {
//     private idApi: any;
//     private webApi: any;
//     private utilities: any;
//     private signature: any;

//     constructor(
//         private config: {
//             partnerId: string;
//             apiKey: string;
//             sidServer: "0" | "1"; // '0' sandbox, '1' production
//             callbackUrl: string;
//         }
//     ) {
//         this.idApi = new IDApi(config.partnerId, config.apiKey, config.sidServer);
//         this.webApi = new WebApi(config.partnerId, config.callbackUrl, config.apiKey, config.sidServer);
//         this.utilities = new Utilities(config.partnerId, config.apiKey, config.sidServer);
//         this.signature = new Signature(config.partnerId, config.apiKey);
//     }

//     // =========================
//     // 🔹 ENHANCED KYC (BVN LOOKUP) — job_type 5
//     // =========================
//     async submitEnhancedKYC(payload: EnhancedKYCPayload, jobId: string, userId: string): Promise<EnhancedKYCResult> {
//         const partner_params = {
//             job_id: jobId,
//             user_id: userId,
//             job_type: 5,
//         };

//         const id_info = {
//             first_name: payload.firstName,
//             last_name: payload.lastName,
//             country: "NG",
//             id_type: "BVN",
//             id_number: payload.bvn,
//             dob: payload.dob,
//             phone_number: payload.phoneNumber,
//         };

//         const options = {
//             signature: true,
//             return_job_status: true,
//         };

//         try {
//             const result = await this.idApi.submit_job(partner_params, id_info, options);

//             // Best-effort in-sync read — NOT guaranteed final. The webhook
//             // (handleBVNWebhook in KYCService) is the actual source of truth.
//             const isVerified =
//                 result?.Actions?.Verify_ID_Number === "Verified" && result?.IsFinalResult === "true";

//             if (!isVerified) {
//                 return {
//                     status: "pending",
//                     jobId,
//                     userId,
//                     resultCode: result?.ResultCode,
//                     resultText: result?.ResultText,
//                 };
//             }

//             return {
//                 status: "verified",
//                 jobId,
//                 userId,
//                 resultCode: result?.ResultCode,
//                 resultText: result?.ResultText,
//                 data: {
//                     fullName: result?.FullName,
//                     dateOfBirth: result?.DOB,
//                     phoneNumber: result?.PhoneNumber1,
//                     photo: result?.Photo,
//                 },
//             };
//         } catch (error) {
//             return { status: "error", jobId, userId };
//         }
//     }

//     // =========================
//     // 🔹 SMARTSELFIE REGISTRATION — job_type 4 (first-time face enrollment for this user_id)
//     // =========================
//     async submitSmartSelfieRegistration(payload: SmartSelfiePayload): Promise<SmartSelfieResult> {
//         const partner_params = {
//             job_id: payload.jobId,
//             user_id: payload.userId,
//             job_type: 4,
//         };

//         const image_details = this.buildSelfieImageDetails(payload);
//         const options = { signature: true, return_job_status: true };

//         try {
//             const result = await this.webApi.submit_job(partner_params, image_details, {}, options);
//             return this.parseSmartSelfieResult(result, payload);
//         } catch (error) {
//             return { status: "error", jobId: payload.jobId, userId: payload.userId };
//         }
//     }

//     // =========================
//     // 🔹 SMARTSELFIE AUTHENTICATION — job_type 2
//     // Requires the SAME user_id to already have a registered selfie on file
//     // (from a prior SmartSelfie Registration, Biometric KYC, or Document Verification).
//     // =========================
//     async submitSmartSelfieAuthentication(payload: SmartSelfiePayload): Promise<SmartSelfieResult> {
//         const partner_params = {
//             job_id: payload.jobId,
//             user_id: payload.userId,
//             job_type: 2,
//         };

//         const image_details = this.buildSelfieImageDetails(payload);
//         const options = { signature: true, return_job_status: true };

//         try {
//             const result = await this.webApi.submit_job(partner_params, image_details, {}, options);
//             return this.parseSmartSelfieResult(result, payload);
//         } catch (error) {
//             return { status: "error", jobId: payload.jobId, userId: payload.userId };
//         }
//     }

//     private buildSelfieImageDetails(payload: SmartSelfiePayload) {
//         // image_type_id 2 = selfie (base64), 3 = liveness image (base64).
//         const images: Array<{ image_type_id: number; image: string }> = [
//             { image_type_id: 2, image: this.stripBase64(payload.selfieBase64) },
//         ];

//         for (const liveness of payload.livenessImagesBase64 || []) {
//             images.push({ image_type_id: 3, image: this.stripBase64(liveness) });
//         }

//         return images;
//     }

//     private parseSmartSelfieResult(result: any, payload: SmartSelfiePayload): SmartSelfieResult {
//         // NOTE: verify this against a real sandbox response before shipping to
//         // production. Smile ID's SmartSelfie result envelope wasn't as precisely
//         // documented as Enhanced KYC / Business Verification's — ResultCode /
//         // ResultText should reliably be present, but confirm the exact
//         // pass/fail signal (ConfidenceValue vs. a dedicated Actions key) for
//         // your job_type/environment via a test job in the sandbox first.
//         const confidence = Number(result?.ConfidenceValue) || 0;
//         const isFinal = result?.IsFinalResult === "true";
//         const isVerified = isFinal && confidence >= 90;

//         return {
//             status: isFinal ? (isVerified ? "verified" : "failed") : "pending",
//             jobId: payload.jobId,
//             userId: payload.userId,
//             confidence,
//             resultCode: result?.ResultCode,
//             resultText: result?.ResultText,
//         };
//     }

//     // =========================
//     // 🔹 BUSINESS VERIFICATION (KYB / CAC) — job_type 7
//     // This one has a genuine synchronous REST endpoint (no callback_url = sync),
//     // so — unlike the products above — this returns a FINAL result directly,
//     // same as the old Dojah verifyCAC.
//     // =========================
//     async submitBusinessVerification(payload: BusinessVerificationPayload): Promise<BusinessVerificationResult> {
//         const partner_params = {
//             job_id: payload.jobId,
//             user_id: payload.userId,
//             job_type: 7,
//         };

//         const id_info: Record<string, any> = {
//             country: payload.country,
//             id_type: payload.idType,
//             id_number: payload.idNumber,
//         };

//         if (payload.businessType) {
//             id_info.business_type = payload.businessType;
//         }

//         const options = { signature: true };

//         try {
//             const result = await this.idApi.submit_job(partner_params, id_info, options);

//             const isVerified = result?.Actions?.Verify_Business === "Verified";

//             if (!isVerified) {
//                 return {
//                     status: "failed",
//                     resultCode: result?.ResultCode,
//                     resultText: result?.ResultText,
//                 };
//             }

//             const info = result?.company_information || {};

//             return {
//                 status: "verified",
//                 resultCode: result?.ResultCode,
//                 resultText: result?.ResultText,
//                 data: {
//                     companyType: info.company_type,
//                     country: info.country,
//                     address: info.address,
//                     registrationNumber: info.registration_number,
//                     legalName: info.legal_name,
//                     state: info.state,
//                     status: info.status,
//                     directors: result?.directors,
//                     beneficialOwners: result?.beneficial_owners,
//                 },
//             };
//         } catch (error) {
//             return { status: "failed" };
//         }
//     }

//     // =========================
//     // 🔹 JOB STATUS (manual reconciliation — e.g. an admin "recheck" button,
//     // or a fallback sweep for webhooks that never arrived)
//     // =========================
//     async getJobStatus(userId: string, jobId: string) {
//         const partner_params = {
//             user_id: userId,
//             job_id: jobId,
//             job_type: 0, // job_type is ignored by job status lookups but required by the SDK signature
//         };

//         const options = {
//             return_history: false,
//             return_image_links: false,
//         };

//         try {
//             return await this.utilities.get_job_status(partner_params, options);
//         } catch (error) {
//             return null;
//         }
//     }

//     // =========================
//     // 🔹 WEBHOOK SIGNATURE VERIFICATION
//     // Confirms a callback claiming to be from Smile ID actually is, before
//     // you trust it and update a KYC record.
//     // =========================
//     verifyWebhookSignature(timestamp: string, signature: string): boolean {
//         try {
//             return this.signature.confirm_signature(timestamp, signature) === true;
//         } catch (error) {
//             return false;
//         }
//     }

//     // =========================
//     // 🧹 HELPERS
//     // =========================
//     async imageUrlToBase64(url: string): Promise<string> {
//         const response = await axios.get(url, { responseType: "arraybuffer" });
//         return Buffer.from(response.data, "binary").toString("base64");
//     }

//     private stripBase64(base64: string): string {
//         return base64.replace(/^data:image\/\w+;base64,/, "");
//     }
// }