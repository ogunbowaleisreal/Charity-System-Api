import { Request, Response, NextFunction } from "express";
import { ServiceFeeService } from "../services/servicefee.services";
import logger from "../logger";
import { sendSuccessResponse, sendErrorResponse } from "../utils/helpers";
import { HTTP_STATUS } from "../utils/constants";
import { AuthenticatedClientRequest } from "../middleware/auth";
import { Donation } from "../models/Donations";


const serviceFeeService = new ServiceFeeService();
export class ServiceFeeController {
    async getServiceFee(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const serviceFee = await serviceFeeService.getActiveFee("donation");
            return sendSuccessResponse(res, serviceFee);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

}

