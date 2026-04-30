import { Request, Response, NextFunction } from "express";
import { ServiceFeeService } from "../../services/servicefee.services";
import logger from "../../logger";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { HTTP_STATUS } from "../../utils/constants";


const serviceFeeService = new ServiceFeeService();
export class ServiceFeeController {
    async getServiceFee(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const serviceFee = await serviceFeeService.getActiveFee();
            return sendSuccessResponse(res, serviceFee);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    async updateServiceFee(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId;
            const type = req.body.type;
            const value = req.body.value;
            const serviceFee = await serviceFeeService.updateServiceFee(type, value, adminId as string);
            return sendSuccessResponse(res, serviceFee);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

}

