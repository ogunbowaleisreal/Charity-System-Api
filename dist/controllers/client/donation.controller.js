"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const donations_services_1 = require("../../services/client/donations.services");
const donationService = new donations_services_1.DonationService();
class DonationController {
    // =============================
    // 🔹 INITIATE DONATION
    // =============================
    async initiateDonation(req, res, next) {
        try {
            const donation = await donationService.initiateDonation(req.user?.userId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, donation);
        }
        catch (error) {
            logger_1.default.error("Initiate donation error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error.message);
        }
    }
    async initiateDonationForGuest(req, res, next) {
        try {
            const donation = await donationService.initiateDonationForGuest(req.body);
            return (0, helpers_1.sendSuccessResponse)(res, donation);
        }
        catch (error) {
            logger_1.default.error("Initiate donation error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getUserDonations(req, res, next) {
        try {
            const donations = await donationService.getUserDonations(req.user?.userId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, donations);
        }
        catch (error) {
            logger_1.default.error("Get user donations error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async googlePay(req, res, next) {
        try {
            const userId = req.user?._id;
            const { token, paymentDetails } = req.body;
            const donationId = req.params.donationId;
            const payment = await donationService.googlePay(token, userId, paymentDetails);
            return (0, helpers_1.sendSuccessResponse)(res, payment);
        }
        catch (error) {
            logger_1.default.error("Google pay error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
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
    async verifyPayment(req, res, next) {
        try {
            const { reference } = req.params;
            const result = await donationService.verifyPayment(reference);
            return (0, helpers_1.sendSuccessResponse)(res, result);
        }
        catch (error) {
            logger_1.default.error("Verify payment error:", error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 WEBHOOK HANDLER (CRITICAL)
    // =============================
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers["x-safehaven-signature"];
            await donationService.handleWebhook(req.body, signature);
            // IMPORTANT: Always return 200 quickly
            return res.status(200).json({ received: true });
        }
        catch (error) {
            logger_1.default.error("Webhook error:", error);
            // Never expose error to SafeHaven
            return res.status(200).json({ received: true });
        }
    }
}
exports.DonationController = DonationController;
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
