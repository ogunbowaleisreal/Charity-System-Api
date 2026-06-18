import { Response, NextFunction } from "express";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { sendSuccessResponse } from "../../utils/helpers";
import logger from "../../logger";
import bannerService from "../../services/Banner.services";

export class BannerController {

    async getActiveBanners(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banners =
                await bannerService.getActiveBanners();

            return sendSuccessResponse(
                res,
                banners,
                "banners fetched successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getBannersByCategory(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { category } = req.params;

            const banners =
                await bannerService.getBannersByCategory(
                    category
                );

            return sendSuccessResponse(
                res,
                banners,
                "banners fetched successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}