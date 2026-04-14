import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import {
    sendSuccessResponse,
    sendErrorResponse,
} from "../../utils/helpers";
import { CampaignService } from "../../services/client/campaign.services";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { strictEqual } from "assert";

const campaignServices = new CampaignService();

export class CampaignController {
    // =============================
    // 🔹 CAMPAIGNS
    // =============================

    async createCampaign(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const campaign = await campaignServices.createCampaign(
                req.body,
                req.user._id
            );

            return sendSuccessResponse(res, campaign);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async updateCampaign(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const campaign = await campaignServices.updateCampaign(
                campaignId,
                req.user._id,
                req.body
            );

            return sendSuccessResponse(res, campaign);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async deleteCampaign(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const campaign = await campaignServices.deleteCampaign(
                campaignId,
                req.user._id
            );

            return sendSuccessResponse(res, campaign);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 FETCH
    // =============================

    async getAllCampaigns(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result = await campaignServices.getAllCampaigns(
                req.query as any
            );

            return sendSuccessResponse(res, result);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async getCampaignById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const campaign = await campaignServices.getCampaignById(
                campaignId
            );

            return sendSuccessResponse(res, campaign);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async getUserCampaigns(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const campaigns = await campaignServices.getUserCampaigns(
                req.user._id,
                req.query as any
            );

            return sendSuccessResponse(res, campaigns);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 STATS
    // =============================

    async getCampaignStats(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const stats = await campaignServices.getCampaignStats(
                campaignId
            );

            return sendSuccessResponse(res, stats);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async getUserCampaignStats(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const stats = await campaignServices.getUserCampaignStats(
                req.user._id
            );

            return sendSuccessResponse(res, stats);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 DONATIONS
    // =============================

    async getCampaignDonations(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;
            const { filter } = req.query;

            const donations =
                await campaignServices.getCampaignDonations(
                    campaignId,
                    req.query as any
                );

            return sendSuccessResponse(res, donations);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 COMMENTS
    // =============================

    async addComment(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const comment = await campaignServices.addComment(
                campaignId,
                req.user._id,
                req.body.message
            );

            return sendSuccessResponse(res, comment);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async getCampaignComments(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;


            const comments =
                await campaignServices.getCampaignComments(campaignId, req.query as any);

            return sendSuccessResponse(res, comments);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    async deleteComment(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { commentId } = req.params;

            const comment = await campaignServices.deleteComment(
                commentId,
                req.user._id
            );

            return sendSuccessResponse(res, comment);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 PREFERENCES
    // =============================

    async updatePreferences(
        req: AuthenticatedClientRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { campaignId } = req.params;

            const campaign =
                await campaignServices.updatePreferences(
                    campaignId,
                    req.user._id,
                    req.body
                );

            return sendSuccessResponse(res, { campaign });
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }

    // =============================
    // 🔹 INTERNAL (WEBHOOK / SYSTEM)
    // =============================

    async confirmDonation(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { transactionRef } = req.body;

            const donation =
                await campaignServices.confirmDonation(transactionRef);

            return sendSuccessResponse(res, donation);
        } catch (error: any) {
            logger.error(error);
            return sendErrorResponse(res, error);
        }
    }
}
// import { Request, Response, NextFunction } from "express";
// import logger from "../../logger";
// import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
// import { CampaignService } from "../../services/client/campaign.services";
// import { AuthenticatedClientRequest } from "../../middleware/auth";

// const campaignServices = new CampaignService()

// export class CampaignController {
//     async getCampaigns(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const campaigns = await campaignServices.getUserCampaigns(req.user._id)
//             return sendSuccessResponse(res, { campaigns });
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }

//     async createCampaign(req: AuthenticatedClientRequest, res: Response, next: NextFunction) {
//         try {
//             const campaign = await campaignServices.createCampaign(req.user._id, req.body)
//             return sendSuccessResponse(res, { campaign });
//         } catch (error: any) {
//             logger.error(error);
//             return sendErrorResponse(res, error);
//         }
//     }
// }