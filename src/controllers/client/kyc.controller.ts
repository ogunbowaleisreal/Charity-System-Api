import { Request, Response, NextFunction } from "express";
import { KYCService } from "../../services/client/Kyc.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const kycService = new KYCService();

export class KYCController {

    async submitBVN(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { bvn, firstName, lastName, dob } = req.body;

            const result = await kycService.submitBVN(userId, { bvn, firstName, lastName, dob });

            sendSuccessResponse(res, result, `BVN submitted: verification status: ${result.bvnVerification?.status}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async submitFace(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { imageUrl, livenessImageUrls } = req.body;

            const result = await kycService.submitFace(userId, imageUrl, livenessImageUrls || []);

            sendSuccessResponse(res, result, `Facial verification submitted: verification status is: ${result.faceVerification?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Smile ID webhook — receives async Biometric KYC (face match) results.
     * Wire this to your SMILE_ID_CALLBACK_URL route, e.g.:
     *   router.post("/webhooks/smile-id/face", kycController.smileIdFaceWebhook)
     * No auth middleware here — Smile ID authenticates via signature in the payload,
     * verified inside kycService.handleFaceWebhook.
     */
    async smileIdFaceWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            await kycService.handleFaceWebhook(req.body);

            // Acknowledge receipt so Smile ID doesn't retry.
            res.status(HTTP_STATUS.OK).json({ received: true });
        } catch (error: any) {
            logger.error("Smile ID face webhook error", error);
            // Still avoid leaking internals to Smile ID's retry logic;
            // a 400 tells them the payload/signature was rejected.
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async verifyCac(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { cacDocument } = req.body;

            const result = await kycService.uploadCACDocument(userId, cacDocument);

            sendSuccessResponse(res, result, `CAC submitted successfully: verification status is: ${result.documentVerification?.cac?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    async submitUtilityBill(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { utilityBill } = req.body;

            const result = await kycService.uploadUtilityBill(userId, utilityBill);

            sendSuccessResponse(res, result, `Utility bill submitted: verification status is: ${result.documentVerification?.utility?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    async getKYCStatus(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;

            const result = await kycService.getKYCStatus(userId);

            sendSuccessResponse(res, result, "KYC status fetched");
        } catch (error: any) {
            next(error);
        }
    }
}
