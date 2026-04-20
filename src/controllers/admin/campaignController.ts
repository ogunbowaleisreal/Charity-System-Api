import { Response, NextFunction } from "express";
import { CampaignAdminService } from "../../services/admin/campaignManagement";
import { sendSuccessResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

const campaignAdminService = new CampaignAdminService();

export class CampaignAdminController {

    // =========================
    // 📊 GET ALL CAMPAIGNS
    // =========================
    async getAllCampaigns(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const adminId = req.admin?.adminId;

            const campaigns = await campaignAdminService.getAllCampaigns(req.query);

            return sendSuccessResponse(
                res,
                campaigns,
                "campaigns retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async getCampaignStats(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId;
            const { campaignId } = req.params;
            const stats = await campaignAdminService.getCampaignStats(campaignId);
            return sendSuccessResponse(res, stats);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async suspendCampaign(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId;
            const { campaignId } = req.params;
            const stats = await campaignAdminService.suspendCampaign(campaignId);
            return sendSuccessResponse(res, stats);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    async unsuspendCampaign(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.adminId;
            const { campaignId } = req.params;
            const stats = await campaignAdminService.unsuspendCampaign(campaignId);
            return sendSuccessResponse(res, stats);
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 🎯 GET CAMPAIGN BY ID
    // =========================
    async getCampaignById(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const adminId = req.admin?.adminId;

            const campaign = await campaignAdminService.getCampaignById(
                req.params.campaign_id
            );

            return sendSuccessResponse(
                res,
                campaign,
                "campaign retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 💬 GET CAMPAIGN COMMENTS
    // =========================
    async getCampaignComments(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const adminId = req.admin?.adminId;

            const comments = await campaignAdminService.getCampaignComments(
                req.params.campaign_id,
                req.query
            );

            return sendSuccessResponse(
                res,
                comments,
                "comments retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }

    // =========================
    // 💰 GET CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(
        req: AdminAuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const adminId = req.admin?.adminId;

            const donations = await campaignAdminService.getCampaignDonations(
                req.params.campaign_id,
                req.query
            );

            return sendSuccessResponse(
                res,
                donations,
                "donations retrieved successfully",
                HTTP_STATUS.OK
            );
        } catch (err: any) {
            logger.error(err.message);
            next(err);
        }
    }
}