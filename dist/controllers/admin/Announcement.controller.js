"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnounceController = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helpers_1 = require("../../utils/helpers");
const announcements_services_1 = require("../../services/announcements.services");
const announcementService = new announcements_services_1.AnnouncementService();
class AnnounceController {
    async createAnnouncement(req, res, next) {
        try {
            const adminId = req.admin?.adminId;
            const payload = { ...req.body, createdBy: adminId };
            const response = await announcementService.createAnnouncement(payload);
            logger_1.default.info("Announcement sending ....");
            if (response) {
                logger_1.default.info("announcement completed");
                (0, helpers_1.sendSuccessResponse)(res, response, "announcement completed", 201);
            }
        }
        catch (err) {
            logger_1.default.info("Announcement failed");
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    async resendAnnouncement(req, res, next) {
        try {
            const response = await announcementService.resendAnnouncement(req.params.announcementId);
            logger_1.default.info("Announcement sending ....");
            if (response) {
                logger_1.default.info("announcement completed");
                (0, helpers_1.sendSuccessResponse)(res, response, "announcement completed", 201);
            }
        }
        catch (err) {
            logger_1.default.info("Announcement failed");
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    async deleteAnnouncement(req, res, next) {
        try {
            const response = await announcementService.deleteAnnouncement(req.params.announcementId);
            logger_1.default.info("Announcement deleting ....");
            if (response) {
                logger_1.default.info("announcement completed");
                (0, helpers_1.sendSuccessResponse)(res, response, "announcement completed", 201);
            }
        }
        catch (err) {
            logger_1.default.info("Announcement failed");
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
    async getAllAnnouncements(req, res, next) {
        try {
            const response = await announcementService.getAllAnnouncements(req.query);
            logger_1.default.info("Announcement getting ....");
            if (response) {
                logger_1.default.info("announcement completed");
                (0, helpers_1.sendSuccessResponse)(res, response, "announcement completed", 201);
            }
        }
        catch (err) {
            logger_1.default.info("Announcement failed");
            (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode);
        }
    }
}
exports.AnnounceController = AnnounceController;
