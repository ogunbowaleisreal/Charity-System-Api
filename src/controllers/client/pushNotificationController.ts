import { Request, Response } from "express";
import { PushNotificationService } from "../../services/pushNotificationService";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/helpers";
import logger from "../../logger";
import { Account } from "../../models/Accounts";

export class Notification {

    static async registerToken(req: AuthenticatedClientRequest, res: Response) {
        try {
            const userId = req.user?.userId; // assuming auth middleware
            const { token, platform } = req.body;
            const account = await Account.findById(userId);
            if (!account) throw new Error("Account not found");

            // if (account.role === "user") throw new Error("Unauthorized client account");


            await PushNotificationService.saveToken(userId, token, platform);
            logger.info("Token registered");
            // auto subscribe to jobs topic
            await PushNotificationService.subscribeToTopic(token, "Requests");
            sendSuccessResponse(res, "Token registered");
        } catch (error: any) {
            logger.error(error.message);
            sendErrorResponse(res, error.message, 400);

        }

        //       res.status(200).json({ message: "Token registered" });
    }

    // optional admin trigger
    // static async sendJobNotification(req: Request, res: Response) {
    // try {
    //     const { title, body } = req.body;

    //     await NotificationService.sendToTopic("jobs", title, body);
    //     logger.info("Notification sent");
    //     sendSuccessResponse(res, "Notification sent");

    //  //   res.status(200).json({ message: "Notification sent" });
    // }catch(error: any) {
    //     sendErrorResponse(res, error.message, 400);
    //     logger.error(error.message);
    // }
    // }
}