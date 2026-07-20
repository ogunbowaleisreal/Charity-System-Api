"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const Accounts_1 = require("../models/Accounts");
class NotificationService {
    // -------------------------
    // CREATE (SINGLE USER)
    // -------------------------
    static async createForUser(data) {
        return await Notification_1.default.create({
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
    static async createBroadcast(data) {
        const users = await this.resolveUsers(data.segment);
        const notifications = users.map((userId) => ({
            userId,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: false
        }));
        return await Notification_1.default.insertMany(notifications);
    }
    // async subscribeForUpdates(email: string) {
    // }
    static async getAllNotifications(filter, page = 1, limit = 10) {
        const notificatiosn = await Notification_1.default.find(filter).sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const total = await Notification_1.default.countDocuments(filter);
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
        };
    }
    // -------------------------
    // GET USER NOTIFICATIONS
    // -------------------------
    static async getUserNotifications(userId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        // remove pagination params
        const { page: _page, limit: _limit, ...filterQuery } = query;
        // always enforce userId
        const finalQuery = {
            userId,
            ...filterQuery,
        };
        const notifications = await Notification_1.default.find(finalQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await Notification_1.default.countDocuments(finalQuery);
        const totalPages = Math.ceil(total / limit);
        return {
            notifications,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                per_page: limit,
                total_records: total,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        };
    }
    // -------------------------
    // MARK ONE AS READ
    // -------------------------
    static async markAsRead(notificationId, userId) {
        return await Notification_1.default.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
    }
    // -------------------------
    // MARK ALL AS READ
    // -------------------------
    static async markAllAsRead(userId) {
        return await Notification_1.default.updateMany({ userId }, { isRead: true });
    }
    // -------------------------
    // DELETE (ADMIN OR USER)
    // -------------------------
    static async deleteNotification(notificationId, userId) {
        const filter = { _id: notificationId };
        // optional safety: user can only delete own
        if (userId)
            filter.userId = userId;
        return await Notification_1.default.findOneAndDelete(filter);
    }
    // -------------------------
    // RESOLVE AUDIENCE
    // -------------------------
    static async resolveUsers(segment) {
        if (segment === "allUsers") {
            const users = await Accounts_1.Account.find({}, { _id: 1 }).lean();
            return users.map(u => u._id);
        }
        const users = await Accounts_1.Account.find({ isVerified: true }, { _id: 1 }).lean();
        return users.map(u => u._id);
    }
}
exports.NotificationService = NotificationService;
