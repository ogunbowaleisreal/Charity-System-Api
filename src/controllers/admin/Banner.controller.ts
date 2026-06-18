import { Response, NextFunction } from "express";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import bannerService from "../../services/Banner.services";

export class BannerAdminController {

    async createBanner(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banner = await bannerService.createBanner(req.body);

            return sendSuccessResponse(
                res,
                banner,
                "banner created successfully",
                HTTP_STATUS.CREATED
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getAllBanners(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banners = await bannerService.getAllBanners(req.query);

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

    async getBannerById(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banner = await bannerService.getBannerById(
                req.params.bannerId
            );

            return sendSuccessResponse(
                res,
                banner,
                "banner fetched successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async updateBanner(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banner = await bannerService.updateBanner(
                req.params.bannerId,
                req.body
            );

            return sendSuccessResponse(
                res,
                banner,
                "banner updated successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async activateBanner(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banner = await bannerService.activateBanner(
                req.params.bannerId
            );

            return sendSuccessResponse(
                res,
                banner,
                "banner activated successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async deactivateBanner(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const banner = await bannerService.deactivateBanner(
                req.params.bannerId
            );

            return sendSuccessResponse(
                res,
                banner,
                "banner deactivated successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async updateBannerOrder(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { order } = req.body;

            const banner =
                await bannerService.updateBannerOrder(
                    req.params.bannerId,
                    order
                );

            return sendSuccessResponse(
                res,
                banner,
                "banner order updated successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async deleteBanner(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            await bannerService.deleteBanner(
                req.params.bannerId
            );

            return sendSuccessResponse(
                res,
                null,
                "banner deleted successfully"
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}