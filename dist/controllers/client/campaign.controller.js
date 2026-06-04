"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const campaign_services_1 = require("../../services/client/campaign.services");
const campaignServices = new campaign_services_1.CampaignService();
class CampaignController {
    // =============================
    // 🔹 CAMPAIGNS
    // =============================
    async createCampaign(req, res, next) {
        try {
            const campaign = await campaignServices.createCampaign(req.body, req.user._id);
            return (0, helpers_1.sendSuccessResponse)(res, campaign);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async updateCampaign(req, res, next) {
        try {
            const { campaignId } = req.params;
            const campaign = await campaignServices.updateCampaign(campaignId, req.user.userId, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, campaign);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async deleteCampaign(req, res, next) {
        try {
            const { campaignId } = req.params;
            const campaign = await campaignServices.deleteCampaign(campaignId, req.user.userId);
            return (0, helpers_1.sendSuccessResponse)(res, campaign);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 FETCH
    // =============================
    async getAllCampaigns(req, res, next) {
        try {
            const result = await campaignServices.getAllCampaigns(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, result);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getCampaignById(req, res, next) {
        try {
            const { campaignId } = req.params;
            const campaign = await campaignServices.getCampaignById(campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, campaign);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getUserCampaigns(req, res, next) {
        try {
            const campaigns = await campaignServices.getUserCampaigns(req.user._id, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, campaigns);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 STATS
    // =============================
    async getCampaignStats(req, res, next) {
        try {
            const { campaignId } = req.params;
            const stats = await campaignServices.getCampaignStats(campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, stats);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getUserCampaignStats(req, res, next) {
        try {
            const stats = await campaignServices.getUserCampaignStats(req.user._id);
            return (0, helpers_1.sendSuccessResponse)(res, stats);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 DONATIONS
    // =============================
    async getCampaignDonations(req, res, next) {
        try {
            const { campaignId } = req.params;
            const { filter } = req.query;
            const donations = await campaignServices.getCampaignDonations(campaignId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, donations);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 COMMENTS
    // =============================
    async addComment(req, res, next) {
        try {
            const { campaignId } = req.params;
            const comment = await campaignServices.addComment(campaignId, req.user._id, req.body.message);
            return (0, helpers_1.sendSuccessResponse)(res, comment);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async getCampaignComments(req, res, next) {
        try {
            const { campaignId } = req.params;
            const comments = await campaignServices.getCampaignComments(campaignId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, comments);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    async deleteComment(req, res, next) {
        try {
            const { commentId } = req.params;
            const comment = await campaignServices.deleteComment(commentId, req.user._id);
            return (0, helpers_1.sendSuccessResponse)(res, comment);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 PREFERENCES
    // =============================
    async updatePreferences(req, res, next) {
        try {
            const { campaignId } = req.params;
            const campaign = await campaignServices.updatePreferences(campaignId, req.user._id, req.body);
            return (0, helpers_1.sendSuccessResponse)(res, { campaign });
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
    // =============================
    // 🔹 INTERNAL (WEBHOOK / SYSTEM)
    // =============================
    async confirmDonation(req, res, next) {
        try {
            const { transactionRef } = req.body;
            const donation = await campaignServices.confirmDonation(transactionRef);
            return (0, helpers_1.sendSuccessResponse)(res, donation);
        }
        catch (error) {
            logger_1.default.error(error);
            return (0, helpers_1.sendErrorResponse)(res, error);
        }
    }
}
exports.CampaignController = CampaignController;
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
