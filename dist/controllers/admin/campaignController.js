"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignAdminController = void 0;
const campaignManagement_1 = require("../../services/admin/campaignManagement");
const helpers_1 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
const logger_1 = __importDefault(require("../../logger"));
const campaignAdminService = new campaignManagement_1.CampaignAdminService();
class CampaignAdminController {
    // =========================
    // 📊 GET ALL CAMPAIGNS
    // =========================
    async getAllCampaigns(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const campaigns = await campaignAdminService.getAllCampaigns(req.query);
            return (0, helpers_1.sendSuccessResponse)(res, campaigns, "campaigns retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async getCampaignStats(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const { campaignId } = req.params;
            const stats = await campaignAdminService.getCampaignStats(campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, stats);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async suspendCampaign(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const campaignId = req.params.campaignId;
            console.log(campaignId);
            const stats = await campaignAdminService.suspendCampaign(campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, stats, "campaign suspended");
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    async unsuspendCampaign(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const campaignId = req.params.campaignId;
            const stats = await campaignAdminService.unsuspendCampaign(campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, stats, "campaign unsuspended");
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    // =========================
    // 🎯 GET CAMPAIGN BY ID
    // =========================
    async getCampaignById(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const campaign = await campaignAdminService.getCampaignById(req.params.campaignId);
            return (0, helpers_1.sendSuccessResponse)(res, campaign, "campaign retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    // =========================
    // 💬 GET CAMPAIGN COMMENTS
    // =========================
    async getCampaignComments(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const comments = await campaignAdminService.getCampaignComments(req.params.campaignId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, comments, "comments retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
    // =========================
    // 💰 GET CAMPAIGN DONATIONS
    // =========================
    async getCampaignDonations(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const donations = await campaignAdminService.getCampaignDonations(req.params.campaignId, req.query);
            return (0, helpers_1.sendSuccessResponse)(res, donations, "donations retrieved successfully", constants_1.HTTP_STATUS.OK);
        }
        catch (err) {
            logger_1.default.error(err.message);
            next(err);
        }
    }
}
exports.CampaignAdminController = CampaignAdminController;
