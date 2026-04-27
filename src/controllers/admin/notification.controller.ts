import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../../services/notification.Services";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";
import { HTTP_STATUS } from "../../utils/constants";
import { send } from "process";

//const NotificationService = new NotificationService();

export class NotificationController {
    static async getAllNotifications(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const filter = req.query;
            const { page, limit, ...query } = req.query
            // const page = Number(req.query.page) || 1;
            // const limit = Number(req.query.limit) || 10;
            const notifications = await NotificationService.getAllNotifications(query, parseInt(page as string), parseInt(limit as string)); //await NotificationService.getAllNotifications(page, limit);
            sendSuccessResponse(res, notifications, "notifications retrieved successfully", 200);
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);
        }
    }


    static async createNotification(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = req.body;
            const notification = await NotificationService.createBroadcast(data);
            sendSuccessResponse(res, notification, "Notification created successfully", 201);
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);
        }
    };

    static async deleteNotification(req: AdminAuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const notificationId = req.params.notificationId;
            const notification = await NotificationService.deleteNotification(notificationId);
            sendSuccessResponse(res, notification, "Notification deleted successfully", 200);
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);
        }
    };

}