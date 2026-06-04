"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnquiryController = void 0;
const enquiryServices_1 = require("../../services/admin/enquiryServices");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const enquiryService = new enquiryServices_1.AdminEnquiryServices();
class AdminEnquiryController {
    async getAllEnquiries(req, res, next) {
        try {
            const enquiries = await enquiryService.getAllEnquiries(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, enquiries, "enquiries retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getEnquiryById(req, res, next) {
        try {
            const enquiry = await enquiryService.getEnquiryById(req.params.enquiryId);
            return (0, helpers_1.sendSuccessResponse)(res, enquiry, "enquiry retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async deleteEnquiry(req, res, next) {
        try {
            const deleted = await enquiryService.deleteEnquiry(req.params.enquiryId);
            return (0, helpers_1.sendSuccessResponse)(res, deleted, "enquiry deleted successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.AdminEnquiryController = AdminEnquiryController;
// import { Request, Response, NextFunction } from "express";
// import { EnquiryServices } from "../../services/admin/enquiryServices";
// import { sendSuccessResponse } from "../../utils/helpers";
// import { HTTP_STATUS } from "../../utils/constants";
// import logger from "../../logger";
// import { AdminAuthenticatedRequest } from "../../types/admin.management";
// const enquiryService = new EnquiryServices();
// export class EnquiryController {
//     async createEnquiry(req: Request, res: Response, next: NextFunction) {
//         try {
//             const enquiry = await enquiryService.createEnquiry(req.body);
//             return sendSuccessResponse(
//                 res,
//                 enquiry,
//                 "enquiry submitted successfully",
//                 HTTP_STATUS.CREATED
//             );
//         } catch (err: any) {
//             logger.error(err.message);
//             next(err);
//         }
//     }
//     async getAllEnquiries(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
//         try {
//             const enquiries = await enquiryService.getAllEnquiries(req.query);
//             return sendSuccessResponse(
//                 res,
//                 enquiries,
//                 "enquiries retrieved successfully",
//                 HTTP_STATUS.OK
//             );
//         } catch (err: any) {
//             logger.error(err.message);
//             next(err);
//         }
//     }
//     async getEnquiryDetails(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
//         try {
//             const enquiry = await enquiryService.getEnquiryById(req.params.enquiryId);
//             return sendSuccessResponse(
//                 res,
//                 enquiry,
//                 "enquiry retrieved successfully",
//                 HTTP_STATUS.OK
//             );
//         } catch (err: any) {
//             logger.error(err.message);
//             next(err);
//         }
//     }
//     async deleteEnquiry(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
//         try {
//             const deleted = await enquiryService.deleteEnquiry(req.params.enquiryId);
//             return sendSuccessResponse(
//                 res,
//                 deleted,
//                 "enquiry deleted successfully",
//                 HTTP_STATUS.OK
//             );
//         } catch (err: any) {
//             logger.error(err.message);
//             next(err);
//         }
//     }
// }
