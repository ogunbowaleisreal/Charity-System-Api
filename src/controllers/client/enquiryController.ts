import { Request, Response, NextFunction } from "express";
import { EnquiryServices } from "../../services/client/enquiryServices";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";

const enquiryService = new EnquiryServices();

export class ClientEnquiryController {
    async createEnquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const enquiry = await enquiryService.createEnquiry(req.body);
            return sendSuccessResponse(
                res,
                enquiry,
                "enquiry submitted successfully",
                HTTP_STATUS.CREATED
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}

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
