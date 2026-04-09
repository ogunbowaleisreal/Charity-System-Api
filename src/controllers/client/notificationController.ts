import { Request, Response } from "express";
import Notification from "../../models/Notification";
import { sendSuccessResponse } from "../../utils/helpers";
import { sendErrorResponse } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
//import { NotificationService } from "../../services/admin/notificationService";
import logger from "../../logger";
import { AuthenticatedClientRequest } from "../../middleware/auth";
import { NotificationService } from "../../services/client/notificationServices"; // 👈 added

export class NotificationController {

    getMyNotifications = async (req: AuthenticatedClientRequest, res: Response) => {
        try {
            const userId = req.user.userId;

            const formatted = await NotificationService.getUserNotifications(userId);

            logger.info("notifications fetched successfully");
            sendSuccessResponse(res, formatted, "notifications retrieved successfully", 200);

        } catch (error: any) {
            logger.error("notifications fetch failed", error.message);
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    markAsRead = async (req: AuthenticatedClientRequest, res: Response) => {
        try {
            const userId = req.user.userId;
            const { notificationId } = req.params;
            console.log(notificationId, userId)

            await NotificationService.markAsRead(notificationId, userId);

            sendSuccessResponse(res, null, "Marked as read", 200);

        } catch (error: any) {
            logger.error("mark as read failed", error.message);
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    };

    markAllAsRead = async (req: AuthenticatedClientRequest, res: Response) => {
        try {
            const userId = req.user.userId;

            await NotificationService.markAllAsRead(userId);

            sendSuccessResponse(res, null, "All notifications read", 200);

        } catch (error: any) {
            logger.error("mark all as read failed", error.message);
            sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    };
}

// export class NotificationController {

//     getMyNotifications = async (req: AuthenticatedClientRequest, res: Response) => {
//         try {
//             const userId = req.user.userId;

//             const notifications = await Notification.find({
//                 recipients: userId,
//             })
//                 .sort({ createdAt: -1 })
//                 .lean();

//             const formatted = notifications.map((n) => ({
//                 ...n,
//                 isRead: n.readBy.includes(userId),
//             }));
//             logger.info("notifications fetched successfully");
//             sendSuccessResponse(res, formatted, "notifications retrieved successfully", 200);
//             // const formatted = notifications.map((n) => ({
//             //     ...n,
//             //     isRead: n.readBy.includes(userId),
//             // }));

//             // res.json(formatted);
//         } catch (error: any) {
//             logger.error("notifications fetch failed", error.message);
//             sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
//         }
//     }

//     markAsRead = async (req: AuthenticatedClientRequest, res: Response) => {
//         try {
//             const userId = req.user.userId;
//             const { notificationId } = req.params;

//             await Notification.findByIdAndUpdate(notificationId, {
//                 $addToSet: { readBy: userId }, // prevents duplicates
//             });
//             sendSuccessResponse(res, null, "Marked as read", 200);

//             // res.json({ message: "Marked as read" });
//         } catch (error: any) {
//             logger.error("mark as read failed", error.message);
//             sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
//         }
//     };

//     markAllAsRead = async (req: AuthenticatedClientRequest, res: Response) => {
//         try {
//             const userId = req.user.userId;

//             await Notification.updateMany(
//                 { recipients: userId },
//                 { $addToSet: { readBy: userId } }
//             );

//             sendSuccessResponse(res, null, "All notifications read", 200);

//             res.json({ message: "All notifications read" });
//         } catch (error: any) {
//             logger.error("mark all as read failed", error.message);
//             sendErrorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
//         }
//     };


// }