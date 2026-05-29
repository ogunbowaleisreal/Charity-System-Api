import { Request, Response, NextFunction } from "express";
import { CampaignCategoryServices } from "../../services/client/campaignCategoryServices";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";

const campaignCategoryServices = new CampaignCategoryServices()

export class CampaignCategoryController {

    async campaignCategory(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
        try {
            const businessCategory = await campaignCategoryServices.getAllCategories(req.query)
            sendSuccessResponse(res, businessCategory, "campaign category fetched")
        } catch (err: any) {
            logger.error("campaign category fetch failed")
            next(err)
        }
    }

}