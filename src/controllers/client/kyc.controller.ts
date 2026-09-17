import { Response, NextFunction } from "express";
import { KYCService } from "../../services/kyc.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const kycService = new KYCService();

export class KYCController {

    /**
     * One-time submission: NIN slip photo, selfie, address + bill photo,
     * all sent together. Frontend has already uploaded the images and
     * just hands us the URLs.
     */
    async submitKYC(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { ninImageUrl, faceImageUrl, address, addressBillImageUrl } = req.body;

            const result = await kycService.submitKYC(userId, {
                ninImageUrl,
                faceImageUrl,
                address,
                addressBillImageUrl,
            });

            sendSuccessResponse(res, result, `KYC submitted: status is ${result.status}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    /**
     * Only works when a previous submission was rejected. Same payload
     * shape as submitKYC.
     */
    async resubmitKYC(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { ninImageUrl, faceImageUrl, address, addressBillImageUrl } = req.body;

            const result = await kycService.resubmitKYC(userId, {
                ninImageUrl,
                faceImageUrl,
                address,
                addressBillImageUrl,
            });

            sendSuccessResponse(res, result, `KYC resubmitted: status is ${result.status}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async getKYCStatus(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;

            const result = await kycService.getKYCStatus(userId);

            sendSuccessResponse(res, result, "KYC status fetched");
        } catch (error: any) {
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
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);

        }
    }

    /** Business premises utility bill — organizations only */
    async submitUtilityBill(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.userId;
            const { utilityBill } = req.body;

            const result = await kycService.uploadUtilityDocument(userId, utilityBill);

            sendSuccessResponse(res, result, `Utility bill submitted: verification status is: ${result.documentVerification?.utility?.status}`);
        } catch (error: any) {
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);

        }
    }
}
