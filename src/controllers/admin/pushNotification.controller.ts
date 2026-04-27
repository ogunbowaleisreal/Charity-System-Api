import { Request, Response, NextFunction } from "express";
import { PushNotificationService } from "../../services/pushNotificationService";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { AdminAuthenticatedRequest } from "../../types/admin.management";

//const notificationService = new PushNotificationService();

export class PushNotificationController {

    async sendToTopic(req: AdminAuthenticatedRequest, res: Response) {
        try {
            const { topic, title, body } = req.body;
            await PushNotificationService.sendToTopic(topic, title, body);
            sendSuccessResponse(res, "Notification sent to topic");
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);
        }
    }

    async sendToUsers(req: AdminAuthenticatedRequest, res: Response) {
        try {
            const { title, body } = req.body;
            // if(type === "all") {

            await PushNotificationService.sendToUsers({ title, body });
            // }
            // await PushNotificationService.sendToUser({ title, body });
            sendSuccessResponse(res, "Notification sent to user");
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);
        }
    }
}