"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const helpers_1 = require("../../utils/helpers");
const helpers_2 = require("../../utils/helpers");
const constants_1 = require("../../utils/constants");
//import { NotificationService } from "../../services/admin/notificationService";
const logger_1 = __importDefault(require("../../logger"));
const notification_Services_1 = require("../../services/notification.Services"); // 👈 added
class NotificationController {
    constructor() {
        this.getMyNotifications = async (req, res) => {
            try {
                const userId = req.user.userId;
                // const page = parseInt(req.query.page as string)
                // const limit = parseInt(req.query.limit as string)
                const formatted = await notification_Services_1.NotificationService.getUserNotifications(userId, req.query);
                logger_1.default.info("notifications fetched successfully");
                (0, helpers_1.sendSuccessResponse)(res, formatted, "notifications retrieved successfully", 200);
            }
            catch (error) {
                logger_1.default.error("notifications fetch failed", error.message);
                (0, helpers_2.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.markAsRead = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { notificationId } = req.params;
                console.log(notificationId, userId);
                await notification_Services_1.NotificationService.markAsRead(notificationId, userId);
                (0, helpers_1.sendSuccessResponse)(res, null, "Marked as read", 200);
            }
            catch (error) {
                logger_1.default.error("mark as read failed", error.message);
                (0, helpers_2.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.markAllAsRead = async (req, res) => {
            try {
                const userId = req.user.userId;
                await notification_Services_1.NotificationService.markAllAsRead(userId);
                (0, helpers_1.sendSuccessResponse)(res, null, "All notifications read", 200);
            }
            catch (error) {
                logger_1.default.error("mark all as read failed", error.message);
                (0, helpers_2.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
        this.deleteNotification = async (req, res) => {
            try {
                const userId = req.user.userId;
                const { notificationId } = req.params;
                await notification_Services_1.NotificationService.deleteNotification(notificationId);
                (0, helpers_1.sendSuccessResponse)(res, null, "Notification deleted", 200);
            }
            catch (error) {
                logger_1.default.error("delete notification failed", error.message);
                (0, helpers_2.sendErrorResponse)(res, error.message, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        };
    }
}
exports.NotificationController = NotificationController;
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
