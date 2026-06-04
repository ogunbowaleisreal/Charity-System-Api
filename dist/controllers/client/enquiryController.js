"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientEnquiryController = void 0;
const enquiryServices_1 = require("../../services/client/enquiryServices");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const enquiryService = new enquiryServices_1.EnquiryServices();
class ClientEnquiryController {
    async createEnquiry(req, res, next) {
        try {
            const enquiry = await enquiryService.createEnquiry(req.body);
            return (0, helpers_1.sendSuccessResponse)(res, enquiry, "enquiry submitted successfully", constants_1.HTTP_STATUS.CREATED);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.ClientEnquiryController = ClientEnquiryController;
// import { Request, Response, NextFunction } from "express";
// import { EnquiryServices } from "../../services/client/enquiryServices";
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
