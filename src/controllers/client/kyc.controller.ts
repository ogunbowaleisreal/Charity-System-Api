import { Request, Response, NextFunction } from "express";
import { KYCService } from "../../services/client/Kyc.services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const kycService = new KYCService();

export class KYCController {

    // async startKYC(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.user.user_id;

    //         const result = await kycService.startKYC(userId);

    //         sendSuccessResponse(res, result, "KYC initialized");
    //     } catch (error: any) {
    //         next(error);
    //     }
    // }

    async submitBVN(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.user_id;
            const { bvn } = req.body;

            const result = await kycService.submitBVN(userId, bvn);

            sendSuccessResponse(res, result, `BVN submitted: verifiation status: ${result.bvnVerification?.status}`);
        } catch (error: any) {
            sendErrorResponse(
                res,
                error.message,
                HTTP_STATUS.BAD_REQUEST
            );
        }
    }

    async submitFace(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.user_id;
            const fileUrl = req.body?.path;

            const result = await kycService.submitFace(userId, fileUrl);

            sendSuccessResponse(res, result, `Facial verification submitted:verification status is : ${result.faceVerification?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    // async submitDocument(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.user.user_id;
    //         const fileUrl = req.body.fileUrl;

    //         const result = await kycService.submitDocument(userId, fileUrl);

    //         sendSuccessResponse(res, result, "Document submitted");
    //     } catch (error: any) {
    //         next(error);
    //     }
    // }

    async verifyCac(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.user_id;
            const { rcNumber, companyType, cacDocument } = req.body;

            const result = await kycService.submitCAC(userId, cacDocument, companyType, rcNumber);

            sendSuccessResponse(res, result, `CAC submitted successfully: verification status is: ${result.documentVerification?.cac?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    async submitUtilityBill(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.user_id;
            const { utilityBill } = req.body;

            const result = await kycService.submitUtilityBill(userId, utilityBill);

            sendSuccessResponse(res, result, `Utility bill submitted: verification status is: ${result.documentVerification?.utility?.status}`);
        } catch (error: any) {
            next(error);
        }
    }

    async getKYCStatus(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user.user_id;

            const result = await kycService.getKYCStatus(userId);

            sendSuccessResponse(res, result, "KYC status fetched");
        } catch (error: any) {
            next(error);
        }
    }
}