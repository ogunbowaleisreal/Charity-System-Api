import { Request, Response, NextFunction } from "express";
import { BusinessCategoryServices } from "../../services/client/businessCategoryServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const businessCategoryServices = new BusinessCategoryServices()

export class BusinessCategoryController {

    async businessCategory(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const businessCategory = await businessCategoryServices.getBusinessCategory()
            sendSuccessResponse(res, businessCategory, "business category fetched")
        } catch (err: any) {
            logger.error("business category fetch failed")
            next(err)
        }
    }

}