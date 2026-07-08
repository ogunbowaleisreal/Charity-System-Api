import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import {
    sendSuccessResponse,
    sendErrorResponse,
} from "../../utils/helpers";
import { DonationService } from "../../services/client/donations.services";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const donationService = new DonationService();

export type initiateDonation = {
    campaignId: string;
    email: string;
    firstname: string;
    lastname: string;
    amount: number;
    paymentMethod: "card" | "bank_transfer";
    gratuityPercentage?: number;
}

export type googlePayDetails = {
    amount: number;
    currency: string;
    email: string;
    firstname: string;
    lastname: string;
    campaignId: string;
}

export class DonationController {
    // =============================
    // 🔹 INITIATE DONATION
    // =============================
    async initiateDonation(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const donation = await donationService.initiateDonation(
                req.user?.userId,
                req.body as initiateDonation
            );

            return sendSuccessResponse(res, donation);
        } catch (error: any) {
            logger.error("Initiate donation error:", error);
            return sendErrorResponse(res, error.message);
        }
    }

    async initiateDonationForGuest(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const donation = await donationService.initiateDonationForGuest(
                req.body as initiateDonation
            );

            return sendSuccessResponse(res, donation);
        } catch (error: any) {
            logger.error("Initiate donation error:", error);
            return sendErrorResponse(res, error);
        }
    }

    async getUserDonations(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const donations = await donationService.getUserDonations(
                req.user?.userId,
                req.query as any
            );

            return sendSuccessResponse(res, donations);
        } catch (error: any) {
            logger.error("Get user donations error:", error);
            return sendErrorResponse(res, error);
        }
    }

    async googlePay(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const userId = req.user?._id;
            const { token, paymentDetails } = req.body;
            const donationId = req.params.donationId;

            const payment = await donationService.googlePay(
                token,
                userId,
                paymentDetails as googlePayDetails
            );

            return sendSuccessResponse(res, payment);
        } catch (error: any) {
            logger.error("Google pay error:", error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 PAY WITH VIRTUAL ACCOUNT
    // =============================
    // async createVirtualAccount(
    //     req: AuthenticatedClientRequest,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { donationId } = req.body;

    //         const account = await donationService(
    //             donationId,
    //             req.user
    //         );

    //         return sendSuccessResponse(res, account);
    //     } catch (error: any) {
    //         logger.error("Create VA error:", error);
    //         return sendErrorResponse(res, error);
    //     }
    // }

    // // =============================
    // // 🔹 PAY WITH CARD
    // // =============================
    // async initiateCardPayment(
    //     req: AuthenticatedClientRequest,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { donationId } = req.body;

    //         const payment = await donationService.initiateCardPayment(
    //             donationId,
    //             req.user
    //         );

    //         return sendSuccessResponse(res, payment);
    //     } catch (error: any) {
    //         logger.error("Card payment error:", error);
    //         return sendErrorResponse(res, error);
    //     }
    // }

    // =============================
    // 🔹 VERIFY PAYMENT (MANUAL FALLBACK)
    // =============================
    async verifyPayment(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { reference } = req.params;

            const result = await donationService.verifyPayment(reference);

            return sendSuccessResponse(res, result);
        } catch (error: any) {
            logger.error("Verify payment error:", error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 WEBHOOK HANDLER (CRITICAL)
    // =============================
    async handleWebhook(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const signature = req.headers["x-safehaven-signature"] as string;

            await donationService.handleWebhook(req.body, signature);

            // IMPORTANT: Always return 200 quickly
            return res.status(200).json({ received: true });
        } catch (error: any) {
            logger.error("Webhook error:", error);

            // Never expose error to SafeHaven
            return res.status(200).json({ received: true });
        }
    }

    // =============================
    // 🔹 GET USER DONATIONS
    // =============================
    // async getUserDonations(
    //     req: AuthenticatedClientRequest,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const donations = await donationService.getUserDonations(
    //             req.user._id,
    //             req.query as any
    //         );

    //         return sendSuccessResponse(res, donations);
    //     } catch (error: any) {
    //         logger.error("Get user donations error:", error);
    //         return sendErrorResponse(res, error);
    //     }
    // }

    // =============================
    // 🔹 GET CAMPAIGN DONATIONS
    // =============================
    // async getCampaignDonations(
    //     req: Request,
    //     res: Response,
    //     next: NextFunction
    // ) {
    //     try {
    //         const { campaignId } = req.params;

    //         const donations =
    //             await donationService.getCampaignDonations(
    //                 campaignId,
    //                 req.query as any
    //             );

    //         return sendSuccessResponse(res, donations);
    //     } catch (error: any) {
    //         logger.error("Get campaign donations error:", error);
    //         return sendErrorResponse(res, error);
    //     }
    // }
}
// import { Request, Response, NextFunction } from "express";
// import logger from "../../logger";
// import {
//     sendSuccessResponse,
//     sendErrorResponse,
// } from "../../utils/helpers";
// import { DonationService } from "../../services/client/donations.services";
// import { AuthenticatedClientRequest } from "../../middleware/auth";

// const donationServices = new DonationService();

// export class DonationController {
//     // =============================
//     // 🔹 CREATE DONATION (INIT PAYMENT)
//     // =============================
//     async createDonation(
//         req: AuthenticatedClientRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const donation = await donationServices.createDonation(
//                 req.body,
//                 req.user?._id || null // supports anonymous
//             );

//             return sendSuccessResponse(res, donation);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =============================
//     // 🔹 VERIFY / CONFIRM PAYMENT
//     // =============================
//     async verifyDonation(
//         req: Request,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { transactionRef } = req.body;

//             const donation = await donationServices.verifyDonation(
//                 transactionRef
//             );

//             return sendSuccessResponse(res, donation);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =============================
//     // 🔹 GET SINGLE DONATION
//     // =============================
//     async getDonationById(
//         req: Request,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { donationId } = req.params;

//             const donation = await donationServices.getDonationById(
//                 donationId
//             );

//             return sendSuccessResponse(res, donation);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =============================
//     // 🔹 USER DONATIONS
//     // =============================
//     async getUserDonations(
//         req: AuthenticatedClientRequest,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const donations = await donationServices.getUserDonations(
//                 req.user._id,
//                 req.query as any
//             );

//             return sendSuccessResponse(res, donations);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =============================
//     // 🔹 CAMPAIGN DONATIONS
//     // =============================
//     async getCampaignDonations(
//         req: Request,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const { campaignId } = req.params;

//             const donations =
//                 await donationServices.getCampaignDonations(
//                     campaignId,
//                     req.query as any
//                 );

//             return sendSuccessResponse(res, donations);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     // =============================
//     // 🔹 INTERNAL (WEBHOOK)
//     // =============================
//     async handleWebhook(
//         req: Request,
//         res: Response,
//         next: NextFunction
//     ) {
//         try {
//             const payload = req.body;

//             const result =
//                 await donationServices.handleWebhook(payload);

//             return sendSuccessResponse(res, result);
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }
// }