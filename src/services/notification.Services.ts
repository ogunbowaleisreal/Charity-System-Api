import Notification from "../models/Notification";
import { Account } from "../models/Accounts";
import { Types } from "mongoose";

type UserSegment = "allUsers" | "verifiedUsers";

export class NotificationService {

    // -------------------------
    // CREATE (SINGLE USER)
    // -------------------------
    static async createForUser(data: {
        userId: Types.ObjectId;
        title: string;
        message: string;
        type?: "DONATION" | "WITHDRAWAL" | "GENERAL";
    }) {
        return await Notification.create({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || "GENERAL",
            isRead: false
        });
    }

    // -------------------------
    // ADMIN: BROADCAST
    // -------------------------
    static async createBroadcast(data: {
        title: string;
        message: string;
        type?: "GENERAL"
        segment: UserSegment;
    }) {
        const users = await this.resolveUsers(data.segment);

        const notifications = users.map((userId) => ({
            userId,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: false
        }));

        return await Notification.insertMany(notifications);
    }

    static async getAllNotifications(filter: {
        type: "DONATION" | "WITHDRAWAL" | "GENERAL",
        segment: "allUsers" | "verifiedUsers",
    },
        page: number,
        limit: number
    ) {
        const notificatiosn = await Notification.find(filter).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        return {
            notificatiosn,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            }
        }
    }

    // -------------------------
    // GET USER NOTIFICATIONS
    // -------------------------
    static async getUserNotifications(userId: Types.ObjectId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const notification = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments({
            userId: userId,
            // isDeleted: false,
        });
        const totalPages = Math.ceil(total / limit);
        return {
            notification,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            }
        }
    }

    // -------------------------
    // MARK ONE AS READ
    // -------------------------
    static async markAsRead(notificationId: string, userId: Types.ObjectId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true }
        );
    }

    // -------------------------
    // MARK ALL AS READ
    // -------------------------
    static async markAllAsRead(userId: Types.ObjectId) {
        return await Notification.updateMany(
            { userId },
            { isRead: true }
        );
    }

    // -------------------------
    // DELETE (ADMIN OR USER)
    // -------------------------
    static async deleteNotification(notificationId: string, userId?: Types.ObjectId) {
        const filter: any = { _id: notificationId };

        // optional safety: user can only delete own
        if (userId) filter.userId = userId;

        return await Notification.findOneAndDelete(filter);
    }

    // -------------------------
    // RESOLVE AUDIENCE
    // -------------------------
    private static async resolveUsers(segment: UserSegment) {
        if (segment === "allUsers") {
            const users = await Account.find({}, { _id: 1 }).lean();
            return users.map(u => u._id);
        }

        const users = await Account.find({ isVerified: true }, { _id: 1 }).lean();
        return users.map(u => u._id);
    }
}
