"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_Services_1 = require("../../services/notification.Services");
const helpers_1 = require("../../utils/helpers");
const logger_1 = __importDefault(require("../../logger"));
//const NotificationService = new NotificationService();
class NotificationController {
    static async getAllNotifications(req, res, next) {
        try {
            const filter = req.query;
            const { page, limit, ...query } = req.query;
            // const page = Number(req.query.page) || 1;
            // const limit = Number(req.query.limit) || 10;
            const notifications = await notification_Services_1.NotificationService.getAllNotifications(query, parseInt(page), parseInt(limit)); //await NotificationService.getAllNotifications(page, limit);
            (0, helpers_1.sendSuccessResponse)(res, notifications, "notifications retrieved successfully", 200);
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
    }
    static async createNotification(req, res, next) {
        try {
            const data = req.body;
            const notification = await notification_Services_1.NotificationService.createBroadcast(data);
            (0, helpers_1.sendSuccessResponse)(res, notification, "Notification created successfully", 201);
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
    }
    ;
    static async deleteNotification(req, res, next) {
        try {
            const notificationId = req.params.notificationId;
            const notification = await notification_Services_1.NotificationService.deleteNotification(notificationId);
            (0, helpers_1.sendSuccessResponse)(res, notification, "Notification deleted successfully", 200);
        }
        catch (error) {
            logger_1.default.error(error.message);
            (0, helpers_1.sendErrorResponse)(res, error.message, 400);
        }
    }
    ;
}
exports.NotificationController = NotificationController;
