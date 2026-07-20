"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCController = void 0;
const Kyc_services_1 = require("../../services/client/Kyc.services");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const kycService = new Kyc_services_1.KYCService();
class KYCController {
    // async startKYC(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.user.user_id;
    //         const result = await kycService.startKYC(userId);
    //         sendSuccessResponse(res, result, "KYC initialized");
    //     } catch (error: any) {
    //         next(error);
    //     }
    // }
    async submitBVN(req, res, next) {
        try {
            const userId = req.user.userId;
            const { bvn } = req.body;
            const result = await kycService.submitBVN(userId, { bvn: bvn, dob: req.body.dob });
            (0, helpers_1.sendSuccessResponse)(res, result, `BVN submitted: verifiation status: ${result.bvnVerification?.status}`);
        }
        catch (error) {
            (0, helpers_1.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
    async submitFace(req, res, next) {
        try {
            const userId = req.user.user_id;
            const fileUrl = req.body?.fileUrl;
            const result = await kycService.submitFace(userId, fileUrl);
            (0, helpers_1.sendSuccessResponse)(res, result, `Facial verification submitted:verification status is : ${result.faceVerification?.status}`);
        }
        catch (error) {
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
    async verifyCac(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { rcNumber, companyType, cacDocument } = req.body;
            const result = await kycService.uploadCACDocument(userId, cacDocument);
            (0, helpers_1.sendSuccessResponse)(res, result, `CAC submitted successfully: verification status is: ${result.documentVerification?.cac?.status}`);
        }
        catch (error) {
            next(error);
        }
    }
    async submitUtilityBill(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { utilityBill } = req.body;
            const result = await kycService.uploadUtilityBill(userId, utilityBill);
            (0, helpers_1.sendSuccessResponse)(res, result, `Utility bill submitted: verification status is: ${result.documentVerification?.utility?.status}`);
        }
        catch (error) {
            next(error);
        }
    }
    async getKYCStatus(req, res, next) {
        try {
            const userId = req.user.user_id;
            const result = await kycService.getKYCStatus(userId);
            (0, helpers_1.sendSuccessResponse)(res, result, "KYC status fetched");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.KYCController = KYCController;
