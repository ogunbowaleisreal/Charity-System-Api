import Notification from "../../models/Notification";
import { Types } from "mongoose";

export class NotificationService {
    static async createNotification(data: {
        title: string;
        message: string;
        type: "DONATION" | "WITHDRAWAL" | "GENERAL";
        recipients: Types.ObjectId[];
    }) {
        return await Notification.create(data);
    }

    static async getUserNotifications(userId: Types.ObjectId) {
        const notifications = await Notification.find({
            recipients: userId,
        })
            .sort({ createdAt: -1 })
            .lean();
        // const formatted = notifications.map((n) => ({
        //   _id: n._id,
        //   title: n.title,
        //   message: n.message,
        //   type: n.type,
        //   createdAt: n.createdAt,
        //   isRead: n.readBy.includes(userId),
        // }));
        return notifications.map((n) => ({
            _id: n._id,
            title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt,
            isRead: n.readBy.some((id: Types.ObjectId) => id.equals(userId)),
        }));
    }

    static async markAsRead(
        notificationId: string,
        userId: Types.ObjectId
    ) {
        return await Notification.findByIdAndUpdate(notificationId, {
            $addToSet: { readBy: userId },
        });
    }

    static async markAllAsRead(userId: Types.ObjectId) {
        return await Notification.updateMany(
            { recipients: userId },
            { $addToSet: { readBy: userId } }
        );
    }
}